import { Card, Col, Modal, Row, Typography } from "antd";
import { useEffect, useState } from "react";

import { getBackgroundManifest, measureImage, resolveStaticUrl } from "../api";
import type { Background, BackgroundManifestItem } from "../types";

type Props = {
  open: boolean;
  onCancel: () => void;
  onSelect: (background: Background) => void;
};

export function BackgroundPickerModal({ open, onCancel, onSelect }: Props) {
  const [items, setItems] = useState<BackgroundManifestItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    getBackgroundManifest()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open]);

  async function handlePick(item: BackgroundManifestItem) {
    const size = await measureImage(item.path);
    onSelect({
      filePath: item.path,
      size: {
        widthPx: size.width,
        heightPx: size.height
      }
    });
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={980}
      title="Choose background"
    >
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.id} span={12}>
            <Card
              loading={loading}
              hoverable
              cover={
                <img
                  className="modal-preview-image"
                  src={resolveStaticUrl(item.path)}
                  alt={item.label}
                />
              }
              onClick={() => void handlePick(item)}
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
