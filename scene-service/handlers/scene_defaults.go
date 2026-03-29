package handlers

import "scene-service/dto"

const (
	defaultSpritePivotX = 600
	defaultSpritePivotY = 200
)

func applySceneDefaults(scene *dto.Scene) {
	for i := range scene.Sprites {
		if scene.Sprites[i].PivotX == nil {
			pivotX := defaultSpritePivotX
			scene.Sprites[i].PivotX = &pivotX
		}
		if scene.Sprites[i].PivotY == nil {
			pivotY := defaultSpritePivotY
			scene.Sprites[i].PivotY = &pivotY
		}
	}
}
