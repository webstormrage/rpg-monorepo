package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"scene-service/dto"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func (h *SceneHandler) sceneGet(w http.ResponseWriter, r *http.Request, slug string) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var scene dto.Scene
	err := h.collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&scene)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			writeError(w, http.StatusNotFound, "scene not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch scene")
		return
	}

	writeJSON(w, http.StatusOK, scene)
}
