package handlers

import "go.mongodb.org/mongo-driver/mongo"

type SceneHandler struct {
	collection *mongo.Collection
}

func NewSceneHandler(collection *mongo.Collection) *SceneHandler {
	return &SceneHandler{collection: collection}
}
