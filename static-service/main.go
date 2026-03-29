package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

func main() {
	addr := getenv("HTTP_ADDR", ":8081")
	mediaDir := getenv("MEDIA_DIR", "media")

	absoluteMediaDir, err := filepath.Abs(mediaDir)
	if err != nil {
		log.Fatalf("resolve media dir failed: %v", err)
	}

	info, err := os.Stat(absoluteMediaDir)
	if err != nil {
		log.Fatalf("media dir check failed: %v", err)
	}
	if !info.IsDir() {
		log.Fatalf("media dir is not a directory: %s", absoluteMediaDir)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.Handle("/media/", http.StripPrefix("/media/", noListFileServer(http.Dir(absoluteMediaDir))))

	log.Printf("static-service listening on %s", addr)
	log.Printf("serving media from %s", absoluteMediaDir)

	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatalf("http server failed: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("write json failed: %v", err)
	}
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func noListFileServer(fs http.FileSystem) http.Handler {
	fileServer := http.FileServer(fs)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if cleanPath == "." {
			http.NotFound(w, r)
			return
		}

		file, err := fs.Open(cleanPath)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer file.Close()

		info, err := file.Stat()
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		fileServer.ServeHTTP(w, r)
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
