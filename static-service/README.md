# static-service

Go static file server for RPG monorepo media assets.

## Run
```powershell
cd static-service
go run .
```

## Configuration
- `HTTP_ADDR` default: `:8081`
- `MEDIA_DIR` default: `media`

## Endpoints
- `GET /health`
- `GET /media/...`

Examples:
- `http://localhost:8081/health`
- `http://localhost:8081/media/backgrounds/tavern-portal.png`
