package handlers

import (
	"context"
	"net/http"
	"time"

	"scene-service/dto"

	"go.mongodb.org/mongo-driver/mongo"
)

func (h *SceneHandler) scenesPost(w http.ResponseWriter, r *http.Request) {
	var scene dto.Scene
	if err := decodeJSON(r, &scene); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	applySceneDefaults(&scene)
	if err := validateScene(scene); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	now := time.Now().UTC()
	scene.CreatedAt = now
	scene.UpdatedAt = now

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err := h.collection.InsertOne(ctx, scene)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			writeError(w, http.StatusConflict, "scene with this slug already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create scene")
		return
	}

	applySceneDefaults(&scene)
	writeJSON(w, http.StatusCreated, scene)
}
