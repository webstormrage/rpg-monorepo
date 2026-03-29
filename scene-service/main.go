package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"scene-service/handlers"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	mongoURI := getenv("MONGODB_URI", "mongodb://localhost:27017")
	dbName := getenv("MONGODB_DB", "dnd")
	collectionName := getenv("MONGODB_COLLECTION", "scenes")
	addr := getenv("HTTP_ADDR", ":8080")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("mongodb connect failed: %v", err)
	}
	defer func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()
		if disconnectErr := client.Disconnect(shutdownCtx); disconnectErr != nil {
			log.Printf("mongodb disconnect failed: %v", disconnectErr)
		}
	}()

	collection := client.Database(dbName).Collection(collectionName)
	if err := ensureIndexes(ctx, collection); err != nil {
		log.Fatalf("create indexes failed: %v", err)
	}

	sceneHandler := handlers.NewSceneHandler(collection)

	mux := http.NewServeMux()
	sceneHandler.Register(mux)

	log.Printf("scene-service listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatalf("http server failed: %v", err)
	}
}

func ensureIndexes(ctx context.Context, collection *mongo.Collection) error {
	model := mongo.IndexModel{
		Keys:    bson.D{{Key: "slug", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("slug_unique"),
	}
	_, err := collection.Indexes().CreateOne(ctx, model)
	return err
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
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
