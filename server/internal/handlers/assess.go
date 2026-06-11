package assess

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/db"
	"github.com/harrywvu/rene-api/internal/models"
	"github.com/harrywvu/rene-api/internal/scoring"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Assess(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse request body → []models.Answer
		var answers []models.Answer
		if err := c.ShouldBindJSON(&answers); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Query DB → build map[int]string (question_id → axis name)
		pool := db.ConnectDB()
		defer pool.Close()

		questionAxisMap := make(map[int]string)
		rows, err := pool.Query(context.Background(), "SELECT questions.id, axes.name FROM questions JOIN axes ON questions.axis_id = axes.id")
		if err != nil {
			log.Fatal(err)
		}
		defer rows.Close()

		// fill up questionLookupMap
		for rows.Next() {
			var question_id int
			var axis_name string

			err := rows.Scan(&question_id, &axis_name)
			if err != nil {
				log.Fatal(err)
			}

			questionAxisMap[question_id] = axis_name
		}

		if err := rows.Err(); err != nil {
			log.Fatal(err)
		}

		// Call ComputeUserProfile → get user's axis profile
		userProfile := scoring.ComputeUserProfile(answers, questionAxisMap)

		// Query DB → get all philosophers with their scores
		philosopherRows, err := pool.Query(
			context.Background(),
			`
		    SELECT philosophers.id, philosophers.name, axes.name, philosopher_scores.score, philosopher_scores.justification
		    FROM philosopher_scores
		    JOIN philosophers ON philosopher_scores.philosopher_id = philosophers.id
		    JOIN axes ON philosopher_scores.axis_id = axes.id
		    `,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer philosopherRows.Close()

		philosopherMap := make(map[int]*models.Philosopher)
		for philosopherRows.Next() {
			var philID int
			var philName, axisName, justification string
			var score float64
			if err := philosopherRows.Scan(&philID, &philName, &axisName, &score, &justification); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if _, exists := philosopherMap[philID]; !exists {
				philosopherMap[philID] = &models.Philosopher{
					Name:           philName,
					Scores:         make(map[string]float64),
					Justifications: make(map[string]string),
				}
			}
			philosopherMap[philID].Scores[axisName] = score
			philosopherMap[philID].Justifications[axisName] = justification
		}

		var philosophers []models.Philosopher
		for _, p := range philosopherMap {
			philosophers = append(philosophers, *p)
		}
		// Call RankPhilosophers → get sorted matches
		matches := scoring.RankPhilosophers(userProfile, philosophers)

		// Return top result + runners up as JSON
		c.JSON(http.StatusOK, matches)
	}

}
