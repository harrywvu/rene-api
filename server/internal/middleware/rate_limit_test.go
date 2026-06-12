package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimiterBlocksAfterLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := NewRateLimiter(2, time.Minute)
	router := gin.New()
	router.Use(limiter.Middleware())
	router.GET("/assess", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	doRequest := func() *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, "/assess", nil)
		req.RemoteAddr = "203.0.113.10:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		return w
	}

	if got := doRequest().Code; got != http.StatusOK {
		t.Fatalf("first request status = %d, want %d", got, http.StatusOK)
	}
	if got := doRequest().Code; got != http.StatusOK {
		t.Fatalf("second request status = %d, want %d", got, http.StatusOK)
	}
	if got := doRequest().Code; got != http.StatusTooManyRequests {
		t.Fatalf("third request status = %d, want %d", got, http.StatusTooManyRequests)
	}
}
