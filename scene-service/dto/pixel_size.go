package dto

type PixelSize struct {
	WidthPx  int `json:"widthPx" bson:"widthPx"`
	HeightPx int `json:"heightPx" bson:"heightPx"`
}
