package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"github.com/harrywvu/rene-api/internal/db"
	"github.com/harrywvu/rene-api/internal/models"
)

// returns a slice of the structs with the JSON data
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

	// seed Questions data
	questions, err := loadJSON[models.Question]("questions.json")
	if err != nil {log.Fatalf("failed to load : %v", err)}
	
	for _, question := range questions {
		if question.Text == "" {log.Fatalf("question cannot be empty")}
	}

	// gives a reference to the correct axis id for foreign key
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

	for _, question := range questions {
		axisID, ok := axisLookupMap[question.Axis]
		if !ok {
		    log.Fatalf("unknown axis: %s", question.Axis)
		}
		_, err := pool.Exec(
			context.Background(),
			`INSERT into questions (
				axis_id, text, weight
				) VALUES ($1,$2,$3)
				ON CONFLICT (text) DO NOTHING`,
			axisID,
			question.Text,
			question.Weight,
		)
		if err != nil {log.Fatal(err)}
	}

}