import { App, Button, Descriptions, Flex, Modal, Spin, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getScene, updateScene } from "../api";
import { BackgroundPickerModal } from "../components/BackgroundPickerModal";
import { ContextMenu, type ContextMenuAction } from "../components/ContextMenu";
import { GridEditModal } from "../components/GridEditModal";
import { SceneCanvas } from "../components/SceneCanvas";
import { SpritePickerModal } from "../components/SpritePickerModal";
import type { Grid, GridPosition, Scene, SceneSprite } from "../types";

type MenuState =
  | null
  | { kind: "canvas"; x: number; y: number; cell: GridPosition | null }
  | { kind: "sprite"; x: number; y: number; sprite: SceneSprite };

export function SceneEditorPage() {
  const { slug = "" } = useParams();
  const { message } = App.useApp();
  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<MenuState>(null);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [spriteOpen, setSpriteOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [spriteDraft, setSpriteDraft] = useState<SceneSprite | null>(null);
  const [spritePosition, setSpritePosition] = useState<GridPosition | null>(null);
  const [movingSprite, setMovingSprite] = useState<SceneSprite | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [topbarHeight, setTopbarHeight] = useState(96);
  const topbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    getScene(slug)
      .then(setScene)
      .catch((error: Error) => message.error(error.message))
      .finally(() => setLoading(false));
  }, [message, slug]);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const element = topbarRef.current;
    if (!element) {
      return;
    }

    const updateTopbarHeight = () => {
      setTopbarHeight(element.offsetHeight || 96);
    };

    updateTopbarHeight();

    const observer = new ResizeObserver(updateTopbarHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const saveScene = useCallback(
    async (nextScene: Scene) => {
      setSaving(true);
      try {
        const updated = await updateScene(nextScene);
        setScene(updated);
        message.success("Scene updated");
      } catch (error) {
        const typed = error as Error;
        message.error(typed.message);
      } finally {
        setSaving(false);
      }
    },
    [message]
  );

  const menuActions = useMemo<ContextMenuAction[]>(() => {
    if (!scene || !menu) {
      return [];
    }

    if (menu.kind === "sprite") {
      return [
        {
          key: "edit-sprite",
          label: "Edit sprite",
          onClick: () => {
            setSpriteDraft(menu.sprite);
            setSpritePosition(menu.sprite.position);
            setSpriteOpen(true);
          }
        },
        {
          key: "move-sprite",
          label: "Move",
          onClick: () => {
            setMovingSprite(menu.sprite);
          }
        },
        {
          key: "delete-sprite",
          label: "Delete sprite",
          danger: true,
          onClick: () =>
            void saveScene({
              ...scene,
              sprites: scene.sprites.filter((item) => item.slug !== menu.sprite.slug)
            })
        },
        {
          key: "scene-info",
          label: "Info",
          onClick: () => setInfoOpen(true)
        },
        {
          key: "edit-grid",
          label: "Edit grid",
          onClick: () => setGridOpen(true)
        },
        {
          key: "replace-background",
          label: "Replace background",
          onClick: () => setBackgroundOpen(true)
        }
      ];
    }

    return [
      {
        key: "scene-info",
        label: "Info",
        onClick: () => setInfoOpen(true)
      },
      {
        key: "replace-background",
        label: "Replace background",
        onClick: () => setBackgroundOpen(true)
      },
      {
        key: "edit-grid",
        label: "Edit grid",
        onClick: () => setGridOpen(true)
      },
      ...(menu.cell
        ? [
            {
              key: "add-sprite",
              label: `Add sprite to ${menu.cell.column}:${menu.cell.row}`,
              onClick: () => {
                setSpriteDraft(null);
                setSpritePosition(menu.cell);
                setSpriteOpen(true);
              }
            }
          ]
        : [])
    ];
  }, [menu, saveScene, scene]);

  function upsertSprite(nextSprite: SceneSprite) {
    if (!scene) {
      return;
    }

    const existing = scene.sprites.some((item) => item.slug === nextSprite.slug);
    const sprites = existing
      ? scene.sprites.map((item) => (item.slug === nextSprite.slug ? nextSprite : item))
      : [...scene.sprites, nextSprite];

    void saveScene({
      ...scene,
      sprites
    });
  }

  if (loading || !scene) {
    return (
      <div className="page-shell page-shell--centered">
        <Spin size="large" />
      </div>
    );
  }

  const canvasWidth = scene.background.size.widthPx || 1200;
  const canvasHeight = scene.background.size.heightPx || 900;
  const targetViewportHeight = Math.min(viewportSize.height, 944);
  const panelChromeHeight = 24;
  const panelChromeWidth = 24;
  const availableHeight = Math.max(
    320,
    targetViewportHeight - topbarHeight - 92 - panelChromeHeight
  );
  const availableWidth = Math.max(320, viewportSize.width - 84 - panelChromeWidth);
  const displayScale = Math.min(
    1,
    availableHeight / canvasHeight,
    availableWidth / canvasWidth
  );

  return (
    <div className="editor-shell">
      <div ref={topbarRef}>
        <Flex justify="space-between" align="center" className="editor-topbar">
          <div>
            <Typography.Title className="page-title">{scene.slug}</Typography.Title>
            <Typography.Paragraph className="page-subtitle">
              Scene editor wired to <code>scene-service</code> and <code>static-service</code>.
            </Typography.Paragraph>
          </div>
          <Flex gap={12}>
            {movingSprite ? (
              <Tag color="lime-inverse" className="editor-status-tag">
                Move: {movingSprite.slug}
              </Tag>
            ) : null}
            <Tag color="gold-inverse" className="editor-status-tag">
              {saving ? "Saving..." : "Ready"}
            </Tag>
            {movingSprite ? (
              <Button onClick={() => setMovingSprite(null)}>Cancel move</Button>
            ) : null}
            <Link to="/">
              <Button>Back to list</Button>
            </Link>
          </Flex>
        </Flex>
      </div>

      <div className="editor-layout">
        <div className="editor-canvas-panel">
          <SceneCanvas
            key={`${scene.background.filePath}:${canvasWidth}:${canvasHeight}`}
            backgroundHeight={canvasHeight}
            backgroundPath={scene.background.filePath}
            backgroundWidth={canvasWidth}
            displayScale={displayScale}
            grid={scene.grid}
            movingSpriteSlug={movingSprite?.slug ?? null}
            sprites={scene.sprites}
            onCellClick={(cell) => {
              if (!movingSprite) {
                return;
              }

              setMovingSprite(null);
              void saveScene({
                ...scene,
                sprites: scene.sprites.map((item) =>
                  item.slug === movingSprite.slug
                    ? {
                        ...item,
                        position: cell
                      }
                    : item
                )
              });
            }}
            onContextMenu={(payload) => {
              if (payload.type === "sprite") {
                setMenu({
                  kind: "sprite",
                  x: payload.x,
                  y: payload.y,
                  sprite: payload.sprite
                });
                return;
              }

              setMenu({
                kind: "canvas",
                x: payload.x,
                y: payload.y,
                cell: payload.cell
              });
            }}
          />
        </div>
      </div>

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          actions={menuActions}
          onClose={() => setMenu(null)}
        />
      ) : null}

      <BackgroundPickerModal
        open={backgroundOpen}
        onCancel={() => setBackgroundOpen(false)}
        onSelect={(background) => {
          setBackgroundOpen(false);
          void saveScene({
            ...scene,
            background
          });
        }}
      />

      <GridEditModal
        open={gridOpen}
        grid={scene.grid}
        onCancel={() => setGridOpen(false)}
        onSubmit={(grid: Grid) => {
          setGridOpen(false);
          void saveScene({
            ...scene,
            grid
          });
        }}
      />

      <SpritePickerModal
        open={spriteOpen}
        initialSprite={spriteDraft}
        initialPosition={spritePosition}
        onCancel={() => setSpriteOpen(false)}
        onSubmit={(nextSprite) => {
          setSpriteOpen(false);
          upsertSprite(nextSprite);
        }}
      />

      <Modal
        open={infoOpen}
        onCancel={() => setInfoOpen(false)}
        footer={null}
        title="Scene info"
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Slug">{scene.slug}</Descriptions.Item>
          <Descriptions.Item label="Background">
            {scene.background.filePath || "none"}
          </Descriptions.Item>
          <Descriptions.Item label="Canvas">
            {canvasWidth} x {canvasHeight}
          </Descriptions.Item>
          <Descriptions.Item label="Grid">
            {scene.grid.columns} x {scene.grid.rows}, cell {scene.grid.cellSizePx}px
          </Descriptions.Item>
          <Descriptions.Item label="Origin">
            {scene.grid.origin.xPx}, {scene.grid.origin.yPx}
          </Descriptions.Item>
          <Descriptions.Item label="Sprites">{scene.sprites.length}</Descriptions.Item>
          <Descriptions.Item label="Created at">{scene.createdAt ?? "n/a"}</Descriptions.Item>
          <Descriptions.Item label="Updated at">{scene.updatedAt ?? "n/a"}</Descriptions.Item>
        </Descriptions>

        <Typography.Title level={5}>Sprite slugs</Typography.Title>
        <div className="sidebar-chip-list">
          {scene.sprites.length ? (
            scene.sprites.map((item) => <Tag key={item.slug}>{item.slug}</Tag>)
          ) : (
            <Typography.Text type="secondary">No sprites</Typography.Text>
          )}
        </div>
      </Modal>
    </div>
  );
}
