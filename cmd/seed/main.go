package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"fmt"

	"github.com/harrywvu/rene-api/internal/db"
	"github.com/harrywvu/rene-api/internal/models"
)

func loadJSON[T any](path string) ([]T, error) {
	jsonData, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}

	var data []T

	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, fmt.Errorf("unmarshal %s: %w", path, err)
	}

	return data, nil
}

func main() {
	pool := db.ConnectDB()
	defer pool.Close()

	// seed Axes data (name, low & high label)
	axes, err := loadJSON[models.Axis]("axes.json")
	
	if err != nil {log.Fatalf("failed to load : %v", err)}

	for _, axis := range axes {
		if axis.Name == "" {log.Fatalf("axis name cannot be empty")}
	}

	for _, axis := range axes {
		_, err := pool.Exec(
			context.Background(),
			`
			INSERT INTO axes (
				name,
				low_label,
				high_label
			)
			VALUES ($1, $2, $3)
			ON CONFLICT (name) DO NOTHING
			`,
			axis.Name,
			axis.LowLabel,
			axis.HighLabel,
		)
		if err != nil {log.Fatal(err)}
	}

	axisLookupMap := make(map[string]int)

	rows, err := pool.Query(context.Background(), "SELECT name, id FROM axes")
	if err != nil {log.Fatal(err)}
	defer rows.Close()

	for rows.Next(){
		var name string; // key
		var id int; 	// value

		err := rows.Scan(&name, &id)
		if err != nil {log.Fatal(err)}

		axisLookupMap[name] = id;
	}

	if err := rows.Err(); err != nil {log.Fatal(err)}

	

}