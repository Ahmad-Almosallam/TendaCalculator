import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge, Button, Card, Typography } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import { formatEur } from '../lib/money';

interface Props {
  /** droppable id: person id, or 'unassigned' for the pool */
  id: string;
  title: string;
  color?: string;
  subtotalCents: number;
  count: number;
  children: ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function PersonBucket({
  id,
  title,
  color,
  subtotalCents,
  count,
  children,
  collapsible,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card
      ref={setNodeRef}
      size="small"
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {color && <Badge color={color} />}
          {title}
          <Typography.Text type="secondary" style={{ fontWeight: 'normal', fontSize: 12 }}>
            {count} item{count === 1 ? '' : 's'} · {formatEur(subtotalCents)}
          </Typography.Text>
        </span>
      }
      extra={
        collapsible &&
        (collapsed ? (
          <Button size="small" type="text" icon={<EditOutlined />} onClick={onToggleCollapsed}>
            Edit
          </Button>
        ) : (
          <Button size="small" type="text" icon={<CheckOutlined />} onClick={onToggleCollapsed}>
            Done
          </Button>
        ))
      }
      style={{
        borderColor: isOver ? (color ?? '#1677ff') : undefined,
        boxShadow: isOver ? `0 0 0 2px ${color ?? '#1677ff'}33` : undefined,
      }}
      styles={{ body: collapsed ? { display: 'none' } : { display: 'flex', flexDirection: 'column', gap: 6, minHeight: 48 } }}
    >
      {children}
    </Card>
  );
}
