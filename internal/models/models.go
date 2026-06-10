package models

// import "golang.org/x/text"

type Axis struct {
    Name      string `json:"name"`
    LowLabel  string `json:"low_label"`
    HighLabel string `json:"high_label"`
}

type Question struct {
    Text   string  `json:"text"`
    Weight float32 `json:"weight"`
    Axis   string  `json:"axis"`
}

type Philosopher struct {
    Name           string             `json:"name"`
    Scores         map[string]float32 `json:"scores"`
    Justifications map[string]string  `json:"justifications"`
}

type Answer struct {
	QuestionID int     `json:"question_id"`
    Score      float64 `json:"score"`
}