export type PixelSize = {
  widthPx: number;
  heightPx: number;
};

export type Background = {
  filePath: string;
  size: PixelSize;
};

export type GridOrigin = {
  xPx: number;
  yPx: number;
};

export type Grid = {
  columns: number;
  rows: number;
  cellSizePx: number;
  origin: GridOrigin;
};

export type GridPosition = {
  column: number;
  row: number;
};

export type SceneSprite = {
  slug: string;
  filePath: string;
  size: PixelSize;
  pivotX: number;
  pivotY: number;
  mirror: boolean;
  position: GridPosition;
};

export type Scene = {
  slug: string;
  background: Background;
  grid: Grid;
  sprites: SceneSprite[];
  createdAt?: string;
  updatedAt?: string;
};

export type BackgroundManifestItem = {
  id: string;
  label: string;
  path: string;
};

export type SpritePoseManifest = {
  name: string;
  label: string;
  path: string;
};

export type SpritePresetManifest = {
  name: string;
  label: string;
  thumbnail: string;
  poses: SpritePoseManifest[];
};

export type SpriteManifestItem = {
  name: string;
  label: string;
  defaultPreset: string;
  presets: SpritePresetManifest[];
};

export type SpriteManifestResponse = {
  sprites: SpriteManifestItem[];
};
