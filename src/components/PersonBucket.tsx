import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge, Card, Typography } from 'antd';
import { formatEur } from '../lib/money';

interface Props {
  /** droppable id: person id, or 'unassigned' for the pool */
  id: string;
  title: string;
  color?: string;
  subtotalCents: number;
  count: number;
  children: ReactNode;
}

export default function PersonBucket({ id, title, color, subtotalCents, count, children }: Props) {
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
      style={{
        borderColor: isOver ? (color ?? '#1677ff') : undefined,
        boxShadow: isOver ? `0 0 0 2px ${color ?? '#1677ff'}33` : undefined,
      }}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 6, minHeight: 48 } }}
    >
      {children}
    </Card>
  );
}
