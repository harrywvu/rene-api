package assess

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

const requestTimeout = 5 * time.Second

var allowedScores = map[float64]struct{}{
	0:    {},
	0.25: {},
	0.5:  {},
	0.75: {},
	1:    {},
}

func decodeAnswers(c *gin.Context) ([]models.Answer, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 32<<10)

	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()

	var answers []models.Answer
	if err := decoder.Decode(&answers); err != nil {
		return nil, err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return nil, errors.New("request body must contain a single JSON array")
	}

	return answers, nil
}

func loadQuestionAxisMap(ctx context.Context, pool *pgxpool.Pool) (map[int]string, error) {
	rows, err := pool.Query(ctx, "SELECT questions.id, axes.name FROM questions JOIN axes ON questions.axis_id = axes.id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	questionAxisMap := make(map[int]string)
	for rows.Next() {
		var questionID int
		var axisName string
		if err := rows.Scan(&questionID, &axisName); err != nil {
			return nil, err
		}
		questionAxisMap[questionID] = axisName
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return questionAxisMap, nil
}

func validateAnswers(answers []models.Answer, questionAxisMap map[int]string) error {
	if len(answers) == 0 {
		return errors.New("at least one answer is required")
	}

	if len(answers) != len(questionAxisMap) {
		return fmt.Errorf("expected %d answers, got %d", len(questionAxisMap), len(answers))
	}

	seen := make(map[int]struct{}, len(answers))
	questionIDs := make([]int, 0, len(questionAxisMap))
	for id := range questionAxisMap {
		questionIDs = append(questionIDs, id)
	}
	sort.Ints(questionIDs)

	for _, answer := range answers {
		if _, ok := questionAxisMap[answer.QuestionID]; !ok {
			return fmt.Errorf("unknown question_id: %d", answer.QuestionID)
		}
		if _, ok := allowedScores[answer.Score]; !ok {
			return fmt.Errorf("invalid score for question_id %d: %v", answer.QuestionID, answer.Score)
		}
		if _, ok := seen[answer.QuestionID]; ok {
			return fmt.Errorf("duplicate answer for question_id: %d", answer.QuestionID)
		}
		seen[answer.QuestionID] = struct{}{}
	}

	for _, questionID := range questionIDs {
		if _, ok := seen[questionID]; !ok {
			return fmt.Errorf("missing answer for question_id: %d", questionID)
		}
	}

	return nil
}
