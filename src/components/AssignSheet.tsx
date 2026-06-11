import { Badge, Button, Drawer, Space, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import type { Unit } from '../types';
import { useOrderStore } from '../store/useOrderStore';
import { formatEur } from '../lib/money';

interface Props {
  unit: Unit | null;
  onClose: () => void;
}

/** Tap-to-assign bottom sheet — the primary interaction on touch screens. */
export default function AssignSheet({ unit, onClose }: Props) {
  const people = useOrderStore((s) => s.people);
  const assignments = useOrderStore((s) => s.assignments);
  const assign = useOrderStore((s) => s.assign);

  const currentPersonId = unit ? assignments[unit.unitId] : undefined;

  return (
    <Drawer
      open={unit !== null}
      onClose={onClose}
      placement="bottom"
      height="auto"
      title={
        unit && (
          <span>
            {unit.item.name}
            {unit.item.qty > 1 && ` (${unit.index + 1}/${unit.item.qty})`}
            <Typography.Text type="secondary" style={{ marginLeft: 8, fontWeight: 'normal' }}>
              {formatEur(unit.valueCents)}
            </Typography.Text>
          </span>
        )
      }
    >
      {unit && (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {people.map((p) => (
            <Button
              key={p.id}
              block
              size="large"
              type={currentPersonId === p.id ? 'primary' : 'default'}
              onClick={() => {
                assign(unit.unitId, p.id);
                onClose();
              }}
            >
              <Badge color={p.color} style={{ marginRight: 8 }} />
              {p.name}
            </Button>
          ))}
          {currentPersonId && (
            <Button
              block
              size="large"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                assign(unit.unitId, null);
                onClose();
              }}
            >
              Unassign
            </Button>
          )}
          {people.length === 0 && (
            <Typography.Text type="secondary">Add people first.</Typography.Text>
          )}
        </Space>
      )}
    </Drawer>
  );
}
