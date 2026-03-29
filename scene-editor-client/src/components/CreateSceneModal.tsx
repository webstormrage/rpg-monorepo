import { App, Button, Card, Col, Form, Input, Modal, Row, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import {
  createScene,
  getBackgroundManifest,
  measureImage,
  resolveStaticUrl
} from "../api";
import type { BackgroundManifestItem, Scene } from "../types";

type Props = {
  open: boolean;
  onCancel: () => void;
  onCreated: (scene: Scene) => void;
};

const defaultGrid = {
  columns: 24,
  rows: 18,
  cellSizePx: 50,
  origin: {
    xPx: 0,
    yPx: 0
  }
};

export function CreateSceneModal({ open, onCancel, onCreated }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ slug: string }>();
  const [items, setItems] = useState<BackgroundManifestItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedId(undefined);
      return;
    }

    setLoadingManifest(true);
    getBackgroundManifest()
      .then((response) => {
        setItems(response);
        setSelectedId((current) => current ?? response[0]?.id);
      })
      .catch((error: Error) => message.error(error.message))
      .finally(() => setLoadingManifest(false));
  }, [form, message, open]);

  const selectedBackground = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId]
  );

  async function handleSubmit() {
    const values = await form.validateFields();
    if (!selectedBackground) {
      message.error("Choose a background");
      return;
    }

    setSubmitting(true);
    try {
      const size = await measureImage(selectedBackground.path);
      const scene = await createScene({
        slug: values.slug.trim(),
        background: {
          filePath: selectedBackground.path,
          size: {
            widthPx: size.width,
            heightPx: size.height
          }
        },
        grid: defaultGrid,
        sprites: []
      });

      onCreated(scene);
      form.resetFields();
      setSelectedId(undefined);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to create scene");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
      okText="Create scene"
      confirmLoading={submitting}
      forceRender
      width={980}
      title="Create scene"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Scene slug"
          name="slug"
          rules={[
            { required: true, message: "Slug is required" },
            {
              pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "Use lowercase letters, digits and dashes"
            }
          ]}
        >
          <Input placeholder="yawning-portal-brawl" autoComplete="off" />
        </Form.Item>
      </Form>

      <Typography.Title level={5}>Background</Typography.Title>
      <Typography.Paragraph type="secondary">
        New scenes start with a default 24 x 18 grid, cell size 50 px, origin at 0 x 0.
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.id} xs={24} md={12}>
            <Card
              className={item.id === selectedId ? "picker-card picker-card--active" : "picker-card"}
              hoverable
              loading={loadingManifest}
              cover={
                <img
                  className="modal-preview-image"
                  src={resolveStaticUrl(item.path)}
                  alt={item.label}
                />
              }
              onClick={() => setSelectedId(item.id)}
              actions={[
                <Button key="select" type={item.id === selectedId ? "primary" : "default"}>
                  {item.id === selectedId ? "Selected" : "Select"}
                </Button>
              ]}
            >
              <Typography.Title level={5}>{item.label}</Typography.Title>
              <Typography.Text type="secondary">{item.path}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
}
