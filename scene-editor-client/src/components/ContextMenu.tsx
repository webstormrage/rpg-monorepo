import { Button } from "antd";
import { useLayoutEffect, useRef, useState } from "react";

export type ContextMenuAction = {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
};

type Props = {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
};

export function ContextMenu({ x, y, actions, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      setPosition({ left: x, top: y });
      return;
    }

    const margin = 12;
    const { innerWidth, innerHeight } = window;
    const rect = menu.getBoundingClientRect();

    let nextLeft = x;
    let nextTop = y;

    if (nextLeft + rect.width + margin > innerWidth) {
      nextLeft = Math.max(margin, innerWidth - rect.width - margin);
    }

    if (nextTop + rect.height + margin > innerHeight) {
      nextTop = Math.max(margin, y - rect.height);
    }

    setPosition({
      left: nextLeft,
      top: nextTop
    });
  }, [actions, x, y]);

  return (
    <>
      <div
        className="context-menu-backdrop"
        onClick={onClose}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div
        ref={menuRef}
        className="context-menu"
        style={{ left: position.left, top: position.top }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {actions.map((action) => (
          <Button
            key={action.key}
            danger={action.danger}
            type="text"
            className="context-menu__item"
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </>
  );
}
