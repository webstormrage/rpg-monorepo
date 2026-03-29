import { Form, InputNumber, Modal } from "antd";
import { useEffect } from "react";

import type { Grid } from "../types";

type Props = {
  open: boolean;
  grid: Grid | null;
  onCancel: () => void;
  onSubmit: (grid: Grid) => void;
};

export function GridEditModal({ open, grid, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<Grid>();

  useEffect(() => {
    if (grid) {
      form.setFieldsValue(grid);
    }
  }, [form, grid]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => {
        form.validateFields().then(onSubmit).catch(() => undefined);
      }}
      forceRender
      title="Edit grid"
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Columns" name="columns" rules={[{ required: true }]}>
          <InputNumber min={1} className="w-full" />
        </Form.Item>
        <Form.Item label="Rows" name="rows" rules={[{ required: true }]}>
          <InputNumber min={1} className="w-full" />
        </Form.Item>
        <Form.Item
          label="Cell size (px)"
          name="cellSizePx"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} className="w-full" />
        </Form.Item>
        <Form.Item label="Origin X (px)" name={["origin", "xPx"]} rules={[{ required: true }]}>
          <InputNumber min={0} className="w-full" />
        </Form.Item>
        <Form.Item label="Origin Y (px)" name={["origin", "yPx"]} rules={[{ required: true }]}>
          <InputNumber min={0} className="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
