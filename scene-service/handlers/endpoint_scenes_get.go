package handlers

import (
	"context"
	"net/http"
	"time"

	"scene-service/dto"

	"go.mongodb.org/mongo-driver/bson"
)

func (h *SceneHandler) scenesGet(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := h.collection.Find(ctx, bson.M{})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list scenes")
		return
	}
	defer cursor.Close(ctx)

	scenes := make([]dto.Scene, 0)
	for cursor.Next(ctx) {
		var scene dto.Scene
		if err := cursor.Decode(&scene); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to decode scene")
			return
		}
		scenes = append(scenes, scene)
	}
	if err := cursor.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to iterate scenes")
		return
	}

	writeJSON(w, http.StatusOK, scenes)
}
