import {
  Breadcrumb,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Typography
} from "antd";
import { useEffect, useMemo, useState } from "react";

import { getSpriteManifest, measureImage, resolveStaticUrl } from "../api";
import type {
  GridPosition,
  SceneSprite,
  SpriteManifestItem,
  SpritePoseManifest,
  SpritePresetManifest
} from "../types";

type Props = {
  open: boolean;
  initialSprite: SceneSprite | null;
  initialPosition: GridPosition | null;
  onCancel: () => void;
  onSubmit: (sprite: SceneSprite) => void;
};

type SelectionState = {
  spriteName: string;
  presetName: string;
  poseName: string;
};

function inferSelection(
  manifest: SpriteManifestItem[],
  current: SceneSprite | null
): SelectionState | null {
  if (!manifest.length) {
    return null;
  }

  if (!current) {
    const sprite = manifest[0];
    const preset = sprite.presets.find(
      (item) => item.name === sprite.defaultPreset
    ) ?? sprite.presets[0];
    const pose = preset.poses[0];
    return {
      spriteName: sprite.name,
      presetName: preset.name,
      poseName: pose.name
    };
  }

  const matchedSprite = manifest.find((sprite) =>
    sprite.presets.some((preset) =>
      preset.poses.some((pose) => pose.path === current.filePath)
    )
  );

  const sprite = matchedSprite ?? manifest[0];
  const preset =
    sprite.presets.find((item) =>
      item.poses.some((pose) => pose.path === current.filePath)
    ) ?? sprite.presets[0];
  const pose =
    preset.poses.find((item) => item.path === current.filePath) ?? preset.poses[0];

  return {
    spriteName: sprite.name,
    presetName: preset.name,
    poseName: pose.name
  };
}

export function SpritePickerModal({
  open,
  initialSprite,
  initialPosition,
  onCancel,
  onSubmit
}: Props) {
  const [form] = Form.useForm<{
    slug: string;
    widthPx: number;
    heightPx: number;
    pivotX: number;
    pivotY: number;
    mirror: boolean;
  }>();
  const [manifest, setManifest] = useState<SpriteManifestItem[]>([]);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    getSpriteManifest().then((response) => {
      setManifest(response.sprites);
      setSelection(inferSelection(response.sprites, initialSprite));
    });
  }, [open, initialSprite]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      slug: initialSprite?.slug ?? "",
      widthPx: initialSprite?.size.widthPx,
      heightPx: initialSprite?.size.heightPx,
      pivotX: initialSprite?.pivotX ?? 600,
      pivotY: initialSprite?.pivotY ?? 200,
      mirror: initialSprite?.mirror ?? false
    });
  }, [form, initialSprite, open]);

  const currentSprite = useMemo(
    () => manifest.find((item) => item.name === selection?.spriteName) ?? null,
    [manifest, selection]
  );
  const currentPreset = useMemo(
    () =>
      currentSprite?.presets.find((item) => item.name === selection?.presetName) ??
      null,
    [currentSprite, selection]
  );
  const currentPose = useMemo(
    () => currentPreset?.poses.find((item) => item.name === selection?.poseName) ?? null,
    [currentPreset, selection]
  );

  useEffect(() => {
    if (!open || !currentPose) {
      return;
    }

    if (initialSprite && currentPose.path === initialSprite.filePath) {
      form.setFieldsValue({
        widthPx: initialSprite.size.widthPx,
        heightPx: initialSprite.size.heightPx
      });
      return;
    }

    void measureImage(currentPose.path).then((dimensions) => {
      form.setFieldsValue({
        widthPx: dimensions.width,
        heightPx: dimensions.height
      });
    });
  }, [currentPose, form, initialSprite, open]);

  async function submitSelection() {
    if (!currentPose || !initialPosition) {
      return;
    }

    const values = await form.validateFields();

    onSubmit({
      slug:
        values.slug ||
        initialSprite?.slug ||
        `${currentSprite?.name ?? "sprite"}-${Date.now()}`,
      filePath: currentPose.path,
      size: {
        widthPx: values.widthPx,
        heightPx: values.heightPx
      },
      pivotX: values.pivotX,
      pivotY: values.pivotY,
      mirror: values.mirror ?? false,
      position: initialPosition
    });
  }

  function renderCard(
    key: string,
    title: string,
    image: string,
    selected: boolean,
    onClick: () => void
  ) {
    return (
      <Card
        key={key}
        hoverable
        className={selected ? "picker-card picker-card--active" : "picker-card"}
        cover={
          <div className="sprite-picker-card__media">
            <img
              className="sprite-picker-card__image"
              src={resolveStaticUrl(image)}
              alt={title}
            />
          </div>
        }
        onClick={onClick}
      >
        <Typography.Text strong>{title}</Typography.Text>
      </Card>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => void submitSelection()}
      forceRender
      className="sprite-picker-modal"
      width={1080}
      title="Choose sprite"
    >
      <div className="sprite-picker-header">
        <div className="sprite-picker-header__meta">
          <Form form={form} layout="vertical">
            <Form.Item className="sprite-picker-header__slug" label="Sprite slug" name="slug">
              <Input placeholder="scene-sprite-slug" />
            </Form.Item>

            <div className="sprite-picker-header__size-row">
              <Form.Item
                className="sprite-picker-header__size"
                label="Width"
                name="widthPx"
                rules={[{ required: true, message: "Width is required" }]}
              >
                <InputNumber min={1} className="w-full" addonAfter="px" />
              </Form.Item>
              <Form.Item
                className="sprite-picker-header__size"
                label="Height"
                name="heightPx"
                rules={[{ required: true, message: "Height is required" }]}
              >
                <InputNumber min={1} className="w-full" addonAfter="px" />
              </Form.Item>
            </div>

            <div className="sprite-picker-header__size-row">
              <Form.Item
                className="sprite-picker-header__size"
                label="Pivot X"
                name="pivotX"
                rules={[{ required: true, message: "Pivot X is required" }]}
              >
                <InputNumber className="w-full" addonAfter="px" />
              </Form.Item>
              <Form.Item
                className="sprite-picker-header__size"
                label="Pivot Y"
                name="pivotY"
                rules={[{ required: true, message: "Pivot Y is required" }]}
              >
                <InputNumber className="w-full" addonAfter="px" />
              </Form.Item>
            </div>

            <Form.Item
              className="sprite-picker-header__mirror"
              label={null}
              name="mirror"
              valuePropName="checked"
            >
              <Checkbox>Mirror horizontally</Checkbox>
            </Form.Item>
          </Form>

          <Breadcrumb
            className="sprite-breadcrumbs"
            items={[
              { title: currentSprite?.label ?? "sprite" },
              { title: currentPreset?.label ?? "preset" },
              { title: currentPose?.label ?? "pose" }
            ]}
          />

          {initialPosition ? (
            <Typography.Text type="secondary">
              Cell: {initialPosition.column}:{initialPosition.row}
            </Typography.Text>
          ) : null}
        </div>

        {currentPose ? (
          <div className="sprite-preview-panel sprite-preview-panel--inline">
            <Typography.Title level={5}>Current preview</Typography.Title>
            <img
              className="sprite-preview-panel__image"
              src={resolveStaticUrl(currentPose.path)}
              alt={currentPose.label}
            />
          </div>
        ) : null}
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Typography.Title level={5}>Sprite</Typography.Title>
          <div className="picker-column picker-column--compact">
            {manifest.map((item) =>
              renderCard(
                item.name,
                item.label,
                item.presets.find((preset) => preset.name === item.defaultPreset)?.thumbnail ??
                  item.presets[0].thumbnail,
                selection?.spriteName === item.name,
                () =>
                  setSelection({
                    spriteName: item.name,
                    presetName: item.defaultPreset,
                    poseName:
                      item.presets.find((preset) => preset.name === item.defaultPreset)?.poses[0]
                        ?.name ?? item.presets[0].poses[0].name
                  })
              )
            )}
          </div>
        </Col>
        <Col span={8}>
          <Typography.Title level={5}>Preset</Typography.Title>
          <div className="picker-column picker-column--compact">
            {currentSprite?.presets.map((item: SpritePresetManifest) =>
              renderCard(
                item.name,
                item.label,
                item.thumbnail,
                selection?.presetName === item.name,
                () =>
                  setSelection((prev) =>
                    prev
                      ? {
                          ...prev,
                          presetName: item.name,
                          poseName: item.poses[0].name
                        }
                      : prev
                  )
              )
            )}
          </div>
        </Col>
        <Col span={8}>
          <Typography.Title level={5}>Pose</Typography.Title>
          <div className="picker-column picker-column--compact">
            {currentPreset?.poses.map((item: SpritePoseManifest) =>
              renderCard(
                item.name,
                item.label,
                item.path,
                selection?.poseName === item.name,
                () =>
                  setSelection((prev) =>
                    prev
                      ? {
                          ...prev,
                          poseName: item.name
                        }
                      : prev
                  )
              )
            )}
          </div>
        </Col>
      </Row>
    </Modal>
  );
}
