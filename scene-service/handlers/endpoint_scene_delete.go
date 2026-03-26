package handlers

import (
	"context"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

func (h *SceneHandler) sceneDelete(w http.ResponseWriter, r *http.Request, slug string) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	result, err := h.collection.DeleteOne(ctx, bson.M{"slug": slug})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete scene")
		return
	}
	if result.DeletedCount == 0 {
		writeError(w, http.StatusNotFound, "scene not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
