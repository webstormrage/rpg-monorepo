import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_ADDR = process.env.HTTP_ADDR ?? ":8082";
const BODY_LIMIT_BYTES = 1024 * 1024;
const promptsDir = path.join(__dirname, "static", "prompts");

function parseAddress(value) {
  if (value.startsWith(":")) {
    return { host: "0.0.0.0", port: Number.parseInt(value.slice(1), 10) || 8082 };
  }

  const [host, portText] = value.split(":");
  return {
    host: host || "0.0.0.0",
    port: Number.parseInt(portText, 10) || 8082
  };
}

function applyCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Origin");
}

function sendJson(response, statusCode, payload) {
  applyCors(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  applyCors(response);
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(text);
}

function resolvePromptPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const normalized = path.posix.normalize(decoded);
  const withoutLeadingSlash = normalized.replace(/^\/+/, "");

  if (!withoutLeadingSlash || !withoutLeadingSlash.endsWith(".mdx")) {
    throw new Error("prompt path must point to a .mdx file");
  }

  const fullPath = path.resolve(promptsDir, withoutLeadingSlash);
  const promptsRoot = path.resolve(promptsDir);
  if (!fullPath.startsWith(`${promptsRoot}${path.sep}`) && fullPath !== promptsRoot) {
    throw new Error("prompt path escapes prompts directory");
  }

  return fullPath;
}

async function readJsonBody(request) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of request) {
    totalLength += chunk.length;
    if (totalLength > BODY_LIMIT_BYTES) {
      throw new Error("request body is too large");
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  if (!rawBody.trim()) {
    return {};
  }

  const parsed = JSON.parse(rawBody);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("request body must be a JSON object");
  }

  return parsed;
}

function resolveTemplateValue(data, expression) {
  return expression
    .split(".")
    .reduce((current, key) => {
      if (current == null || typeof current !== "object") {
        return undefined;
      }

      return current[key];
    }, data);
}

function renderPlaceholders(template, data) {
  return template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, expression) => {
    const value = resolveTemplateValue(data, expression);
    if (value == null) {
      return "";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

function resolveIncludePath(baseFilePath, includePath) {
  const candidate = includePath.startsWith("/")
    ? path.resolve(promptsDir, includePath.replace(/^\/+/, ""))
    : path.resolve(path.dirname(baseFilePath), includePath);
  const promptsRoot = path.resolve(promptsDir);

  if (!candidate.startsWith(`${promptsRoot}${path.sep}`) && candidate !== promptsRoot) {
    throw new Error("include path escapes prompts directory");
  }

  return candidate;
}

async function renderTemplate(template, data, baseFilePath) {
  let rendered = template;

  rendered = rendered.replace(
    /\{\{ifEq\s+([a-zA-Z0-9_.]+)\s+"([^"]*)"\}\}([\s\S]*?)\{\{\/ifEq\}\}/g,
    (_, expression, expectedValue, content) => {
      const value = resolveTemplateValue(data, expression);
      return String(value ?? "") === expectedValue ? content : "";
    }
  );

  const includePattern = /\{\{include\s+"([^"]+)"\}\}/g;
  let match = includePattern.exec(rendered);
  while (match) {
    const [fullMatch, includePath] = match;
    const includeFilePath = resolveIncludePath(baseFilePath, includePath);
    const includeTemplate = await readFile(includeFilePath, "utf-8");
    const includeRendered = await renderTemplate(includeTemplate, data, includeFilePath);
    rendered = rendered.replace(fullMatch, includeRendered);
    includePattern.lastIndex = 0;
    match = includePattern.exec(rendered);
  }

  return renderPlaceholders(rendered, data);
}

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, { error: "request url is required" });
      return;
    }

    const url = new URL(request.url, "http://localhost");

    if (request.method === "OPTIONS") {
      applyCors(response);
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method not allowed" });
      return;
    }

    const promptPath = resolvePromptPath(url.pathname);
    const [template, data] = await Promise.all([
      readFile(promptPath, "utf-8"),
      readJsonBody(request)
    ]);
    const renderedPrompt = await renderTemplate(template, data, promptPath);
    sendText(response, 200, renderedPrompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    const statusCode =
      message.includes("ENOENT")
        ? 404
        : message.includes("JSON")
          ? 400
          : message.includes("prompt path") ||
              message.includes("request body") ||
              message.includes("too large") ||
              message.includes("escapes")
            ? 400
            : 500;

    sendJson(response, statusCode, { error: message });
  }
});

const { host, port } = parseAddress(HTTP_ADDR);
server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`prompt-service listening on http://${host}:${port}`);
});
