# scene-editor-client

React + Pixi + Ant Design client for editing scenes from `scene-service`.

## Run
```powershell
cd scene-editor-client
npm install
copy .env.example .env
npm run dev
```

## Environment
- `VITE_SCENE_SERVICE_URL` - default `http://localhost:8080`
- `VITE_STATIC_SERVICE_URL` - default `http://localhost:8081`

## Features
- scene list with background preview
- scene editor with Pixi canvas
- background replacement from `static-service`
- sprite add/edit/delete
- grid editing
- black `1200x900` fallback canvas when background is missing
