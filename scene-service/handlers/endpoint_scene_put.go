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

func (h *SceneHandler) scenePut(w http.ResponseWriter, r *http.Request, slug string) {
	var scene dto.Scene
	if err := decodeJSON(r, &scene); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	scene.Slug = slug
	applySceneDefaults(&scene)
	if err := validateScene(scene); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var existing dto.Scene
	err := h.collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&existing)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			writeError(w, http.StatusNotFound, "scene not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch scene")
		return
	}

	scene.CreatedAt = existing.CreatedAt
	scene.UpdatedAt = time.Now().UTC()

	_, err = h.collection.ReplaceOne(ctx, bson.M{"slug": slug}, scene)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update scene")
		return
	}

	applySceneDefaults(&scene)
	writeJSON(w, http.StatusOK, scene)
}
