package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	windowStart time.Time
	count       int
	lastSeen    time.Time
}

type RateLimiter struct {
	limit   int
	window  time.Duration
	mu      sync.Mutex
	entries map[string]*rateLimitEntry
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		limit:   limit,
		window:  window,
		entries: make(map[string]*rateLimitEntry),
	}
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		now := time.Now()
		clientIP := c.ClientIP()
		if clientIP == "" {
			clientIP = c.Request.RemoteAddr
		}

		rl.mu.Lock()
		entry, exists := rl.entries[clientIP]
		if !exists || now.Sub(entry.windowStart) >= rl.window {
			entry = &rateLimitEntry{
				windowStart: now,
				count:       0,
				lastSeen:    now,
			}
			rl.entries[clientIP] = entry
		}

		entry.lastSeen = now
		entry.count++
		allowed := entry.count <= rl.limit
		rl.cleanupLocked(now)
		rl.mu.Unlock()

		if !allowed {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
			})
			return
		}

		c.Next()
	}
}

func (rl *RateLimiter) cleanupLocked(now time.Time) {
	expiry := rl.window * 2
	for key, entry := range rl.entries {
		if now.Sub(entry.lastSeen) > expiry {
			delete(rl.entries, key)
		}
	}
}
