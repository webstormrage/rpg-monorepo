package dto

type GridPosition struct {
	Column int `json:"column" bson:"column"`
	Row    int `json:"row" bson:"row"`
}
