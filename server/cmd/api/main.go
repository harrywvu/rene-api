package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/db"
	assess "github.com/harrywvu/rene-api/internal/handlers"
)

func main() {
	r := gin.Default()
	pool := db.ConnectDB()
	r.POST("/assess", assess.Assess(pool))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
