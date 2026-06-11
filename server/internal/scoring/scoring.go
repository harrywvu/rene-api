package scoring

import (
	"cmp"
	"math"
	"slices"

	"github.com/harrywvu/rene-api/internal/models"
)

var QUESTIONS_PER_AXIS = 3
// 								question_id → score		question_id → axis_name 
func ComputeUserProfile(answers []models.Answer, questionAxisMap map[int]string) map[string]float64{
	userProfile := make(map[string]float64) // axis -> score

	// add up all the FREAKING scores by axis
	for _, answer := range answers{
		answerAxis := questionAxisMap[answer.QuestionID]
		userProfile[answerAxis] += answer.Score
	}

	for _, axis := range questionAxisMap {userProfile[axis] /= float64(QUESTIONS_PER_AXIS)}

	return userProfile
}

func CalculateDistance(userProfile map[string]float64, philosopherScores map[string]float64) float64{
	// loop through all axes and su	btract philosopherScores from userProfile
	var sum float64
	for axis := range userProfile{
		diff := philosopherScores[axis] - userProfile[axis]
		// Square the result
		sum += diff * diff
	}	
	return math.Sqrt(sum)
}

func RankPhilosophers(userProfile map[string]float64, philosophers []models.Philosopher) []models.PhilosopherMatch{
	var matches []models.PhilosopherMatch
	for _, philosopher := range philosophers{
		res := CalculateDistance(userProfile, philosopher.Scores)
		phlsphr := models.PhilosopherMatch{
			Philosopher: philosopher,
			Distance: res,
		}
		matches = append(matches, phlsphr)
	}

	slices.SortFunc(matches, func(a, b models.PhilosopherMatch) int {
		return cmp.Compare(a.Distance, b.Distance)
	})

	return matches
}