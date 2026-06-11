import { Button, Input, InputNumber, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { OrderItem } from '../types';
import { useOrderStore } from '../store/useOrderStore';

/** Always-editable items table — every cell is an input, no edit-mode dance (better on mobile). */
export default function EditableItemsTable() {
  const items = useOrderStore((s) => s.items);
  const updateItem = useOrderStore((s) => s.updateItem);
  const removeItem = useOrderStore((s) => s.removeItem);
  const addItem = useOrderStore((s) => s.addItem);

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      width: 260,
      render: (_: unknown, item: OrderItem) => (
        <Input
          size="small"
          value={item.name}
          onChange={(e) => updateItem(item.id, { name: e.target.value })}
        />
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 90,
      render: (_: unknown, item: OrderItem) => (
        <Input
          size="small"
          value={item.size ?? ''}
          onChange={(e) => updateItem(item.id, { size: e.target.value || undefined })}
        />
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      width: 90,
      render: (_: unknown, item: OrderItem) => (
        <Input
          size="small"
          value={item.model}
          onChange={(e) => updateItem(item.id, { model: e.target.value })}
        />
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      width: 70,
      render: (_: unknown, item: OrderItem) => (
        <InputNumber
          size="small"
          inputMode="numeric"
          min={1}
          style={{ width: '100%' }}
          value={item.qty}
          onChange={(qty) => {
            if (qty === null) return;
            updateItem(item.id, { qty, totalCents: qty * item.unitPriceCents });
          }}
        />
      ),
    },
    {
      title: 'Unit €',
      dataIndex: 'unitPriceCents',
      width: 100,
      render: (_: unknown, item: OrderItem) => (
        <InputNumber
          size="small"
          inputMode="decimal"
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={item.unitPriceCents / 100}
          onChange={(v) => {
            if (v === null) return;
            const unitPriceCents = Math.round(v * 100);
            updateItem(item.id, { unitPriceCents, totalCents: item.qty * unitPriceCents });
          }}
        />
      ),
    },
    {
      title: 'Total €',
      dataIndex: 'totalCents',
      width: 100,
      render: (_: unknown, item: OrderItem) => (
        <InputNumber
          size="small"
          inputMode="decimal"
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={item.totalCents / 100}
          onChange={(v) => {
            if (v === null) return;
            updateItem(item.id, { totalCents: Math.round(v * 100) });
          }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: unknown, item: OrderItem) => (
        <Button
          size="small"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(item.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Table<OrderItem>
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        scroll={{ x: 760 }}
      />
      <Button icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 8 }}>
        Add item
      </Button>
    </>
  );
}
