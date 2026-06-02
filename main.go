package main


type Philosopher struct {
	ID string `json: "id"`
	Score Division
}

type Division struct {
	ID string `json: "id"`
	Name string  `json: "name"`
	Score string `json: score`
}

func main() {
	
}