package dto

type Grid struct {
	Columns    int        `json:"columns" bson:"columns"`
	Rows       int        `json:"rows" bson:"rows"`
	CellSizePx int        `json:"cellSizePx" bson:"cellSizePx"`
	Origin     GridOrigin `json:"origin" bson:"origin"`
}
