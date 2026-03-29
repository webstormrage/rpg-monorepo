import type {
  BackgroundManifestItem,
  Scene,
  SpriteManifestResponse
} from "./types";

const sceneServiceBase =
  import.meta.env.VITE_SCENE_SERVICE_URL ?? "http://localhost:8080";
const staticServiceBase =
  import.meta.env.VITE_STATIC_SERVICE_URL ?? "http://localhost:8081";

function trimSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const sceneBase = trimSlash(sceneServiceBase);
const staticBase = trimSlash(staticServiceBase);

export function resolveStaticUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${staticBase}${path.startsWith("/") ? path : `/${path}`}`;
}

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listScenes(): Promise<Scene[]> {
  return handleJson<Scene[]>(await fetch(`${sceneBase}/scenes`));
}

export async function getScene(slug: string): Promise<Scene> {
  return handleJson<Scene>(await fetch(`${sceneBase}/scenes/${slug}`));
}

export async function createScene(scene: Scene): Promise<Scene> {
  return handleJson<Scene>(
    await fetch(`${sceneBase}/scenes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scene)
    })
  );
}

export async function updateScene(scene: Scene): Promise<Scene> {
  return handleJson<Scene>(
    await fetch(`${sceneBase}/scenes/${scene.slug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scene)
    })
  );
}

export async function getBackgroundManifest(): Promise<BackgroundManifestItem[]> {
  return handleJson<BackgroundManifestItem[]>(
    await fetch(resolveStaticUrl("/media/backgrounds/index.json"))
  );
}

export async function getSpriteManifest(): Promise<SpriteManifestResponse> {
  return handleJson<SpriteManifestResponse>(
    await fetch(resolveStaticUrl("/media/sprites/index.json"))
  );
}

export async function measureImage(
  path: string
): Promise<{ width: number; height: number }> {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () =>
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    image.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    image.src = resolveStaticUrl(path);
  });
}
