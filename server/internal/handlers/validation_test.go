package assess

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/harrywvu/rene-api/internal/models"
)

func TestDecodeAnswersRejectsUnknownFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(
		http.MethodPost,
		"/assess",
		strings.NewReader(`[{"question_id":1,"score":1,"extra":"nope"}]`),
	)

	if _, err := decodeAnswers(c); err == nil {
		t.Fatalf("expected decodeAnswers to reject unknown fields")
	}
}

func TestValidateAnswers(t *testing.T) {
	questionAxisMap := map[int]string{
		1: "epistemology",
		2: "metaphysics",
	}

	t.Run("accepts valid answers", func(t *testing.T) {
		answers := []models.Answer{
			{QuestionID: 1, Score: 1},
			{QuestionID: 2, Score: 0.5},
		}

		if err := validateAnswers(answers, questionAxisMap); err != nil {
			t.Fatalf("validateAnswers returned error: %v", err)
		}
	})

	t.Run("rejects invalid score", func(t *testing.T) {
		answers := []models.Answer{
			{QuestionID: 1, Score: 0.33},
			{QuestionID: 2, Score: 0.5},
		}

		if err := validateAnswers(answers, questionAxisMap); err == nil {
			t.Fatalf("expected invalid score to be rejected")
		}
	})

	t.Run("rejects duplicate question ids", func(t *testing.T) {
		answers := []models.Answer{
			{QuestionID: 1, Score: 1},
			{QuestionID: 1, Score: 0.5},
		}

		if err := validateAnswers(answers, map[int]string{1: "epistemology"}); err == nil {
			t.Fatalf("expected duplicate question ids to be rejected")
		}
	})
}
