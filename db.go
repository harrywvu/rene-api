package main

import (
	"context"
	"database/sql"

	// "fmt"
	"log"
	"os"
	"time"

	// Import the MySQL driver anonymously
	_ "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func connectDB() *pgxpool.Pool {
	dsn := os.Getenv("DSN")

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatalf("Error configuring connection pool: %v", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Error creating connection pool: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel()

	if err:= pool.Ping(ctx); err != nil {
	 	log.Fatalf("Error connecting to the database: %v", err)
	}

	return pool
}