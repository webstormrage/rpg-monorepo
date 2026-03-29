package dto

type Sprite struct {
	Slug     string       `json:"slug" bson:"slug"`
	FilePath string       `json:"filePath" bson:"filePath"`
	Size     PixelSize    `json:"size" bson:"size"`
	PivotX   *int         `json:"pivotX" bson:"pivotX"`
	PivotY   *int         `json:"pivotY" bson:"pivotY"`
	Mirror   bool         `json:"mirror" bson:"mirror"`
	Position GridPosition `json:"position" bson:"position"`
}
