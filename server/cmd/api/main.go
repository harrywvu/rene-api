package main

import (
	"context"
	"bufio"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/db"
	assess "github.com/harrywvu/rene-api/internal/handlers"
	"github.com/harrywvu/rene-api/internal/middleware"
)

func defaultAllowedOrigins() []string {
	return []string{
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"https://*.vercel.app",
	}
}

func parseAllowedOrigins(value string) []string {
	origins := make([]string, 0)
	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return defaultAllowedOrigins()
	}

	merged := make([]string, 0, len(origins)+len(defaultAllowedOrigins()))
	seen := make(map[string]struct{}, len(origins)+len(defaultAllowedOrigins()))
	for _, origin := range append(defaultAllowedOrigins(), origins...) {
		if _, exists := seen[origin]; exists {
			continue
		}
		seen[origin] = struct{}{}
		merged = append(merged, origin)
	}

	return merged
}

func loadDotEnv(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)
		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); !exists {
			if err := os.Setenv(key, value); err != nil {
				return err
			}
		}
	}

	return scanner.Err()
}

func main() {
	if err := loadDotEnv(".env"); err != nil && !os.IsNotExist(err) {
		log.Fatalf("Error loading .env file: %v", err)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     parseAllowedOrigins(os.Getenv("CORS_ALLOWED_ORIGINS")),
		AllowWildcard:    true,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))
	pool := db.ConnectDB()

	r.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	assessLimiter := middleware.NewRateLimiter(60, time.Minute)
	r.POST("/assess", assessLimiter.Middleware(), assess.Assess(pool))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		err := server.ListenAndServe()
		if !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
			return
		}
		serverErr <- nil
	}()

	stopCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	select {
	case <-stopCtx.Done():
	case err := <-serverErr:
		if err != nil {
			log.Fatalf("server failed: %v", err)
		}
		return
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
		if closeErr := server.Close(); closeErr != nil {
			log.Printf("forced shutdown failed: %v", closeErr)
		}
	}

	if err := <-serverErr; err != nil {
		log.Fatalf("server exited with error: %v", err)
	}
}
