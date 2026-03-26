package handlers

import (
	"net/http"
	"strings"
)

func (h *SceneHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.healthGet)
	mux.HandleFunc("/scenes", h.scenesRoute)
	mux.HandleFunc("/scenes/", h.sceneBySlugRoute)
}

func (h *SceneHandler) scenesRoute(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.scenesGet(w, r)
	case http.MethodPost:
		h.scenesPost(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (h *SceneHandler) sceneBySlugRoute(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/scenes/")
	if slug == "" || strings.Contains(slug, "/") {
		writeError(w, http.StatusNotFound, "scene not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.sceneGet(w, r, slug)
	case http.MethodPut:
		h.scenePut(w, r, slug)
	case http.MethodDelete:
		h.sceneDelete(w, r, slug)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
