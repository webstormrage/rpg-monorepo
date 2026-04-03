# prompt-service

Node.js HTTP service that reads `.mdx` prompt templates from `static/prompts` and
returns a rendered prompt.

## Run

```powershell
cd prompt-service
npm install
npm run start
```

No external dependencies are required.

## Config

- `HTTP_ADDR` default: `:8082`

## Endpoints

- `GET /health`
- `POST /<path-to-template>.mdx`

Example:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8082/example/hello.mdx" `
  -ContentType "application/json" `
  -Body '{"name":"Алекс"}'
```

Response:

```md
# Приветствие

привет Алекс
```

## Template syntax

Supported placeholders:

- `{name}`
- `{user.name}`
- `{scene.slug}`

Missing values are rendered as an empty string.
