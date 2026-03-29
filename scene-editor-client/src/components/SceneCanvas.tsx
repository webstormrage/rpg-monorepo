import { useEffect, useMemo, useRef, useState } from "react";
import {
  Application,
  Assets,
  ColorMatrixFilter,
  Container,
  FederatedPointerEvent,
  Graphics,
  Sprite
} from "pixi.js";

import { resolveStaticUrl } from "../api";
import type { Grid, SceneSprite } from "../types";

type ContextMenuPayload =
  | { type: "canvas"; x: number; y: number; cell: null | { column: number; row: number } }
  | { type: "sprite"; x: number; y: number; sprite: SceneSprite };

type Props = {
  backgroundPath: string;
  backgroundWidth: number;
  backgroundHeight: number;
  displayScale: number;
  grid: Grid;
  sprites: SceneSprite[];
  movingSpriteSlug?: string | null;
  onCellClick?: (cell: { column: number; row: number }) => void;
  onContextMenu: (payload: ContextMenuPayload) => void;
};

function toScreenY(
  canvasHeight: number,
  grid: Grid,
  row: number,
  spriteHeight: number,
  scaledPivotY: number
): number {
  const cellBottom = canvasHeight - grid.origin.yPx - row * grid.cellSizePx;
  return cellBottom - spriteHeight - scaledPivotY;
}

function locateCell(
  x: number,
  y: number,
  canvasHeight: number,
  grid: Grid
): { column: number; row: number } | null {
  const localX = x - grid.origin.xPx;
  const localY = canvasHeight - y - grid.origin.yPx;
  if (localX < 0 || localY < 0) {
    return null;
  }

  const column = Math.floor(localX / grid.cellSizePx);
  const row = Math.floor(localY / grid.cellSizePx);
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) {
    return null;
  }

  return { column, row };
}

function findSpriteByCell(
  sprites: SceneSprite[],
  cell: { column: number; row: number } | null
): SceneSprite | null {
  if (!cell) {
    return null;
  }

  for (let index = sprites.length - 1; index >= 0; index -= 1) {
    const sprite = sprites[index];
    if (
      sprite.position.column === cell.column &&
      sprite.position.row === cell.row
    ) {
      return sprite;
    }
  }

  return null;
}

export function SceneCanvas({
  backgroundPath,
  backgroundWidth,
  backgroundHeight,
  displayScale,
  grid,
  sprites,
  movingSpriteSlug,
  onCellClick,
  onContextMenu
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [appReady, setAppReady] = useState(false);

  const canvasSize = useMemo(
    () => ({
      width: backgroundWidth || 1200,
      height: backgroundHeight || 900
    }),
    [backgroundHeight, backgroundWidth]
  );

  useEffect(() => {
    if (!mountRef.current || appRef.current) {
      return;
    }

    let cancelled = false;
    let app: Application | null = new Application();

    void app
      .init({
        width: canvasSize.width,
        height: canvasSize.height,
        background: "#000000",
        antialias: true
      })
      .then(() => {
        if (cancelled || !mountRef.current || !app) {
          app?.destroy();
          return;
        }

        appRef.current = app;
        setAppReady(true);
        mountRef.current.appendChild(app.canvas);
      });

    return () => {
      cancelled = true;
      setAppReady(false);
      app?.destroy();
      app = null;
      appRef.current = null;
    };
  }, [canvasSize.height, canvasSize.width]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !appReady) {
      return;
    }

    app.canvas.style.width = `${canvasSize.width * displayScale}px`;
    app.canvas.style.height = `${canvasSize.height * displayScale}px`;
  }, [appReady, canvasSize.height, canvasSize.width, displayScale]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !appReady) {
      return;
    }

    app.renderer.resize(canvasSize.width, canvasSize.height);
    app.stage.removeChildren();

    const layer = new Container();
    app.stage.addChild(layer);
    const spriteViews = new Map<string, Sprite>();
    const baseBrightnessFilter = new ColorMatrixFilter();
    baseBrightnessFilter.brightness(1.15, true);
    const hoverBrightnessFilter = new ColorMatrixFilter();
    hoverBrightnessFilter.brightness(1.45, true);

    let active = true;

    const backgroundGraphic = new Graphics()
      .rect(0, 0, canvasSize.width, canvasSize.height)
      .fill("#000000");
    layer.addChild(backgroundGraphic);

    if (backgroundPath) {
      void Assets.load(resolveStaticUrl(backgroundPath)).then((texture) => {
        if (!active) {
          return;
        }

        const backgroundSprite = new Sprite(texture);
        backgroundSprite.width = canvasSize.width;
        backgroundSprite.height = canvasSize.height;
        layer.addChildAt(backgroundSprite, 1);
      });
    }

    const gridGraphic = new Graphics();
    for (let col = 0; col <= grid.columns; col += 1) {
      const x = grid.origin.xPx + col * grid.cellSizePx;
      const yTop = canvasSize.height - grid.origin.yPx - grid.rows * grid.cellSizePx;
      const yBottom = canvasSize.height - grid.origin.yPx;
      gridGraphic.moveTo(x, yTop);
      gridGraphic.lineTo(x, yBottom);
    }
    for (let row = 0; row <= grid.rows; row += 1) {
      const y = canvasSize.height - grid.origin.yPx - row * grid.cellSizePx;
      const xLeft = grid.origin.xPx;
      const xRight = grid.origin.xPx + grid.columns * grid.cellSizePx;
      gridGraphic.moveTo(xLeft, y);
      gridGraphic.lineTo(xRight, y);
    }
    gridGraphic.stroke({ color: 0xe1af4f, alpha: 0.7, width: 1 });
    layer.addChild(gridGraphic);

    const hoverGraphic = new Graphics();
    layer.addChild(hoverGraphic);

    const stageHit = new Graphics()
      .rect(0, 0, canvasSize.width, canvasSize.height)
      .fill({ color: 0x000000, alpha: 0 });
    stageHit.eventMode = "static";
    stageHit.on("pointermove", (event: FederatedPointerEvent) => {
      const cell = locateCell(
        event.global.x,
        event.global.y,
        canvasSize.height,
        grid
      );
      const spriteAtCell = findSpriteByCell(sprites, cell);

      spriteViews.forEach((spriteView, slug) => {
        if (spriteAtCell?.slug === slug) {
          spriteView.alpha = 1;
          spriteView.filters = [hoverBrightnessFilter];
        } else {
          spriteView.alpha = 1;
          spriteView.filters = [baseBrightnessFilter];
        }
      });

      hoverGraphic.clear();
      if (cell) {
        const x = grid.origin.xPx + cell.column * grid.cellSizePx;
        const y = canvasSize.height - grid.origin.yPx - (cell.row + 1) * grid.cellSizePx;
        const isMovingTarget = movingSpriteSlug != null;
        hoverGraphic
          .rect(x, y, grid.cellSizePx, grid.cellSizePx)
          .fill({
            color: isMovingTarget ? 0x9ee37d : spriteAtCell ? 0xe1af4f : 0xffffff,
            alpha: isMovingTarget ? 0.18 : spriteAtCell ? 0.14 : 0.05
          })
          .stroke({
            color: isMovingTarget ? 0xcaf7a3 : spriteAtCell ? 0xf2c36b : 0xffffff,
            alpha: 0.8,
            width: 1
          });
      }

      app.canvas.style.cursor = movingSpriteSlug
        ? cell
          ? "copy"
          : "default"
        : spriteAtCell
          ? "pointer"
          : cell
            ? "crosshair"
            : "default";
    });
    stageHit.on("pointerleave", () => {
      hoverGraphic.clear();
      spriteViews.forEach((spriteView) => {
        spriteView.alpha = 1;
        spriteView.filters = [baseBrightnessFilter];
      });
      app.canvas.style.cursor = "default";
    });
    stageHit.on("rightdown", (event: FederatedPointerEvent) => {
      event.preventDefault();
      const cell = locateCell(
        event.global.x,
        event.global.y,
        canvasSize.height,
        grid
      );
      const spriteAtCell = findSpriteByCell(sprites, cell);

      if (spriteAtCell) {
        onContextMenu({
          type: "sprite",
          x: event.clientX,
          y: event.clientY,
          sprite: spriteAtCell
        });
        return;
      }

      onContextMenu({
        type: "canvas",
        x: event.clientX,
        y: event.clientY,
        cell
      });
    });
    stageHit.on("pointertap", (event: FederatedPointerEvent) => {
      if (!onCellClick || event.button !== 0) {
        return;
      }

      const cell = locateCell(
        event.global.x,
        event.global.y,
        canvasSize.height,
        grid
      );
      if (!cell) {
        return;
      }

      onCellClick(cell);
    });
    layer.addChild(stageHit);

    sprites.forEach((sceneSprite) => {
      void Assets.load(resolveStaticUrl(sceneSprite.filePath)).then((texture) => {
        if (!active) {
          return;
        }

        const sprite = new Sprite(texture);
        const textureWidth = texture.orig.width || sceneSprite.size.widthPx;
        const textureHeight = texture.orig.height || sceneSprite.size.heightPx;
        const scaledPivotX =
          (sceneSprite.pivotX / textureWidth) * sceneSprite.size.widthPx;
        const scaledPivotY =
          (sceneSprite.pivotY / textureHeight) * sceneSprite.size.heightPx;
        const cellLeft =
          grid.origin.xPx + sceneSprite.position.column * grid.cellSizePx;

        if (sceneSprite.mirror) {
          sprite.x = cellLeft + (sceneSprite.size.widthPx - scaledPivotX);
          sprite.scale.x = -sceneSprite.size.widthPx / textureWidth;
        } else {
          sprite.x = cellLeft - scaledPivotX;
          sprite.scale.x = sceneSprite.size.widthPx / textureWidth;
        }
        sprite.y = toScreenY(
          canvasSize.height,
          grid,
          sceneSprite.position.row,
          sceneSprite.size.heightPx,
          scaledPivotY
        );
        sprite.scale.y = sceneSprite.size.heightPx / textureHeight;
        sprite.alpha = 1;
        sprite.filters = [baseBrightnessFilter];
        spriteViews.set(sceneSprite.slug, sprite);
        layer.addChild(sprite);
      });
    });

    return () => {
      active = false;
    };
  }, [
    appReady,
    backgroundPath,
    canvasSize.height,
    canvasSize.width,
    grid,
    movingSpriteSlug,
    onCellClick,
    onContextMenu,
    sprites
  ]);

  return (
    <div
      className="scene-canvas"
      ref={mountRef}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    />
  );
}
