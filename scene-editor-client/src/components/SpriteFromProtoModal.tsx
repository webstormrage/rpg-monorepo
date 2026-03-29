import { Card, Form, Input, Modal, Select, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { getScene, listScenes, resolveStaticUrl } from "../api";
import type { GridPosition, Scene, SceneSprite } from "../types";

type Props = {
  open: boolean;
  targetCell: GridPosition | null;
  onCancel: () => void;
  onSubmit: (sprite: SceneSprite) => void;
};

type FormValues = {
  sourceSceneSlug: string;
  sourceSpriteSlug: string;
  slug: string;
};

export function SpriteFromProtoModal({
  open,
  targetCell,
  onCancel,
  onSubmit
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [selectedSceneSlug, setSelectedSceneSlug] = useState("");
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedSpriteSlug, setSelectedSpriteSlug] = useState("");
  const [spriteLoading, setSpriteLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSceneLoading(true);
    listScenes()
      .then((items) => {
        setScenes(items);
        const firstSceneSlug = items[0]?.slug;
        if (!firstSceneSlug) {
          setSelectedSceneSlug("");
          setSelectedScene(null);
          setSelectedSpriteSlug("");
          form.resetFields();
          return;
        }

        setSelectedSceneSlug(firstSceneSlug);
        form.setFieldsValue({
          sourceSceneSlug: firstSceneSlug,
          slug: ""
        });
      })
      .finally(() => setSceneLoading(false));
  }, [form, open]);

  useEffect(() => {
    if (!open || !selectedSceneSlug) {
      setSelectedScene(null);
      setSelectedSpriteSlug("");
      return;
    }

    setSpriteLoading(true);
    getScene(selectedSceneSlug)
      .then((scene) => {
        setSelectedScene(scene);
        const nextSprite = scene.sprites[0];
        setSelectedSpriteSlug(nextSprite?.slug ?? "");
        form.setFieldsValue({
          slug: nextSprite ? `${nextSprite.slug}-copy` : ""
        });
      })
      .finally(() => setSpriteLoading(false));
  }, [form, open, selectedSceneSlug]);

  const selectedSprite = useMemo(
    () =>
      selectedScene?.sprites.find((item) => item.slug === selectedSpriteSlug) ??
      selectedScene?.sprites[0] ??
      null,
    [selectedScene, selectedSpriteSlug]
  );

  async function submitForm() {
    if (!selectedSprite || !targetCell) {
      return;
    }

    const values = await form.validateFields();

    onSubmit({
      ...selectedSprite,
      slug: values.slug,
      position: targetCell
    });
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => void submitForm()}
      forceRender
      width={920}
      title="Sprite from proto"
      className="proto-sprite-modal"
    >
      <Form form={form} layout="vertical">
        <div className="proto-sprite-modal__header">
          <Form.Item
            className="proto-sprite-modal__field"
            label="Source scene"
            name="sourceSceneSlug"
            rules={[{ required: true, message: "Source scene is required" }]}
          >
            <Select
              loading={sceneLoading}
              placeholder="Choose scene"
              options={scenes.map((scene) => ({
                label: scene.slug,
                value: scene.slug
              }))}
              onChange={(value) => setSelectedSceneSlug(value)}
            />
          </Form.Item>

          <Form.Item
            className="proto-sprite-modal__field"
            label="New sprite slug"
            name="slug"
            rules={[{ required: true, message: "New sprite slug is required" }]}
          >
            <Input placeholder="new-sprite-slug" />
          </Form.Item>
        </div>

        {targetCell ? (
          <Typography.Text type="secondary">
            Target cell: {targetCell.column}:{targetCell.row}
          </Typography.Text>
        ) : null}

        <Typography.Title level={5}>Source sprites</Typography.Title>
        <div className="proto-sprite-grid">
          {selectedScene?.sprites.length ? (
            selectedScene.sprites.map((sprite) => (
              <Card
                key={`${selectedScene.slug}:${sprite.slug}`}
                hoverable
                className={
                  sprite.slug === selectedSprite?.slug
                    ? "picker-card picker-card--active"
                    : "picker-card"
                }
                cover={
                  <div className="sprite-picker-card__media">
                    <img
                      className="sprite-picker-card__image"
                      src={resolveStaticUrl(sprite.filePath)}
                      alt={sprite.slug}
                    />
                  </div>
                }
                loading={spriteLoading}
                onClick={() => {
                  setSelectedSpriteSlug(sprite.slug);
                  if (!form.getFieldValue("slug")) {
                    form.setFieldValue("slug", `${sprite.slug}-copy`);
                  }
                }}
              >
                <Typography.Text strong>{sprite.slug}</Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  {sprite.position.column}:{sprite.position.row}
                </Typography.Text>
              </Card>
            ))
          ) : (
            <Typography.Text type="secondary">
              This scene has no sprites.
            </Typography.Text>
          )}
        </div>
      </Form>
    </Modal>
  );
}
