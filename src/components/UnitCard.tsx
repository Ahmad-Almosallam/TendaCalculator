import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Typography } from 'antd';
import type { Unit } from '../types';
import { formatEur } from '../lib/money';

interface Props {
  unit: Unit;
  accentColor?: string;
  onTap: (unit: Unit) => void;
  /** render-only mode for the DragOverlay */
  overlay?: boolean;
}

export default function UnitCard({ unit, accentColor, onTap, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unit.unitId,
    disabled: overlay,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className="unit-card"
      {...(overlay ? {} : { ...listeners, ...attributes })}
      onClick={() => !overlay && onTap(unit)}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderLeft: `4px solid ${accentColor ?? '#d9d9d9'}`,
        borderRadius: 6,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: overlay ? '0 4px 12px rgba(0,0,0,0.25)' : undefined,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text style={{ fontSize: 13 }} ellipsis={{ tooltip: unit.item.name }}>
          {unit.item.name}
        </Typography.Text>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {unit.item.size && <Tag style={{ marginInlineEnd: 0 }}>{unit.item.size}</Tag>}
          {unit.item.qty > 1 && (
            <Tag color="blue" style={{ marginInlineEnd: 0 }}>
              {unit.index + 1}/{unit.item.qty}
            </Tag>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatEur(unit.valueCents)}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
