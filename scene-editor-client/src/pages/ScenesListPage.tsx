import { App, Button, Card, Col, Empty, Row, Skeleton, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { resolveStaticUrl } from "../api";
import { CreateSceneModal } from "../components/CreateSceneModal";
import { listScenes } from "../api";
import type { Scene } from "../types";

export function ScenesListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    listScenes()
      .then(setScenes)
      .catch((error: Error) => message.error(error.message))
      .finally(() => setLoading(false));
  }, [message]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <Typography.Title className="page-title">Scene Ledger</Typography.Title>
        <Typography.Paragraph className="page-subtitle">
          Browse scenes from <code>scene-service</code> and open them in the editor.
        </Typography.Paragraph>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create scene
        </Button>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : scenes.length === 0 ? (
        <Empty
          className="scene-list-empty"
          description="No scenes yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Row gutter={[20, 20]}>
          {scenes.map((scene) => (
            <Col key={scene.slug} xs={24} md={12} xl={8}>
              <Card
                hoverable
                className="scene-card"
                cover={
                  scene.background.filePath ? (
                    <img
                      className="scene-card__cover"
                      src={resolveStaticUrl(scene.background.filePath)}
                      alt={scene.slug}
                    />
                  ) : (
                    <div className="scene-card__empty-cover">No background</div>
                  )
                }
              >
                <Typography.Title level={4}>{scene.slug}</Typography.Title>
                <Typography.Paragraph type="secondary">
                  Grid: {scene.grid.columns} x {scene.grid.rows} · Cell {scene.grid.cellSizePx}px
                </Typography.Paragraph>
                <Typography.Paragraph type="secondary">
                  Sprites: {scene.sprites.length}
                </Typography.Paragraph>
                <Button type="primary" onClick={() => navigate(`/scenes/${scene.slug}`)}>
                  Open scene
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <CreateSceneModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onCreated={(scene) => {
          setScenes((current) => [scene, ...current]);
          setCreateOpen(false);
          void message.success(`Scene ${scene.slug} created`);
          navigate(`/scenes/${scene.slug}`);
        }}
      />
    </div>
  );
}
