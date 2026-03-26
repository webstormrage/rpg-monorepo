package dto

type Background struct {
	FilePath string    `json:"filePath" bson:"filePath"`
	Size     PixelSize `json:"size" bson:"size"`
}
