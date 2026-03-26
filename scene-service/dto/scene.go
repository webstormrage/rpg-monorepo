package dto

import "time"

type Scene struct {
	Slug       string     `json:"slug" bson:"slug"`
	Background Background `json:"background" bson:"background"`
	Grid       Grid       `json:"grid" bson:"grid"`
	Sprites    []Sprite   `json:"sprites" bson:"sprites"`
	CreatedAt  time.Time  `json:"createdAt" bson:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt" bson:"updatedAt"`
}
