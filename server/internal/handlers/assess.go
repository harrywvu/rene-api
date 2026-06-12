package assess

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/models"
	"github.com/harrywvu/rene-api/internal/scoring"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Assess(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		answers, err := decodeAnswers(c)
		if err != nil {
			status := http.StatusBadRequest
			var maxBytesError *http.MaxBytesError
			if errors.As(err, &maxBytesError) {
				status = http.StatusRequestEntityTooLarge
			}
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), requestTimeout)
		defer cancel()

		questionAxisMap, err := loadQuestionAxisMap(ctx, pool)
		if err != nil {
			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				c.JSON(http.StatusGatewayTimeout, gin.H{"error": "request timed out"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := validateAnswers(answers, questionAxisMap); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userProfile := scoring.ComputeUserProfile(answers, questionAxisMap)

		philosopherRows, err := pool.Query(
			ctx,
			`
		    SELECT philosophers.id, philosophers.name, axes.name, philosopher_scores.score, philosopher_scores.justification
		    FROM philosopher_scores
		    JOIN philosophers ON philosopher_scores.philosopher_id = philosophers.id
		    JOIN axes ON philosopher_scores.axis_id = axes.id
		    `,
		)
		if err != nil {
			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				c.JSON(http.StatusGatewayTimeout, gin.H{"error": "request timed out"})
				return
			}
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

		matches := scoring.RankPhilosophers(userProfile, philosophers)

		c.JSON(http.StatusOK, matches)
	}
}
