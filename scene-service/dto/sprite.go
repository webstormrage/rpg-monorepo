package dto

type Sprite struct {
	Slug     string       `json:"slug" bson:"slug"`
	FilePath string       `json:"filePath" bson:"filePath"`
	Size     PixelSize    `json:"size" bson:"size"`
	Position GridPosition `json:"position" bson:"position"`
}
