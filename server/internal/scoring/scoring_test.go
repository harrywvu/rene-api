package scoring

import (
	"math"
	"testing"

	"github.com/harrywvu/rene-api/internal/models"
)

func TestComputeUserProfileAveragesByAxis(t *testing.T) {
	questionAxisMap := map[int]string{
		1: "epistemology",
		2: "epistemology",
		3: "epistemology",
	}
	answers := []models.Answer{
		{QuestionID: 1, Score: 1.0},
		{QuestionID: 2, Score: 0.5},
		{QuestionID: 3, Score: 0.2},
	}

	profile := ComputeUserProfile(answers, questionAxisMap)

	const want = 0.5666666666666667
	got, ok := profile["epistemology"]
	if !ok {
		t.Fatalf("expected epistemology axis in profile")
	}
	if math.Abs(got-want) > 1e-9 {
		t.Fatalf("epistemology = %v, want %v", got, want)
	}
}

func TestComputeUserProfileIgnoresUnknownQuestionIDs(t *testing.T) {
	questionAxisMap := map[int]string{
		1: "epistemology",
		2: "epistemology",
		3: "epistemology",
		4: "metaphysics",
		5: "metaphysics",
		6: "metaphysics",
	}
	answers := []models.Answer{
		{QuestionID: 1, Score: 1.0},
		{QuestionID: 999, Score: 0.9},
		{QuestionID: 4, Score: 0.25},
	}

	profile := ComputeUserProfile(answers, questionAxisMap)

	if _, ok := profile[""]; ok {
		t.Fatalf("did not expect empty axis key in profile")
	}

	if got := profile["epistemology"]; math.Abs(got-1.0) > 1e-9 {
		t.Fatalf("epistemology = %v, want %v", got, 1.0)
	}

	if got := profile["metaphysics"]; math.Abs(got-0.25) > 1e-9 {
		t.Fatalf("metaphysics = %v, want %v", got, 0.25)
	}
}
