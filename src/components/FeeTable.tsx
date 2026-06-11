import { Button, Input, InputNumber, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FeeLine } from '../types';
import { useOrderStore } from '../store/useOrderStore';

/** Editable delivery/surcharge fee lines — pooled and split proportionally at calculation time. */
export default function FeeTable() {
  const fees = useOrderStore((s) => s.fees);
  const updateFee = useOrderStore((s) => s.updateFee);
  const removeFee = useOrderStore((s) => s.removeFee);
  const addFee = useOrderStore((s) => s.addFee);

  const columns = [
    {
      title: 'Fee',
      dataIndex: 'label',
      render: (_: unknown, fee: FeeLine) => (
        <Input
          size="small"
          value={fee.label}
          onChange={(e) => updateFee(fee.id, { label: e.target.value })}
        />
      ),
    },
    {
      title: 'Amount €',
      dataIndex: 'amountCents',
      width: 110,
      render: (_: unknown, fee: FeeLine) => (
        <InputNumber
          size="small"
          inputMode="decimal"
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={fee.amountCents / 100}
          onChange={(v) => {
            if (v === null) return;
            updateFee(fee.id, { amountCents: Math.round(v * 100) });
          }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: unknown, fee: FeeLine) => (
        <Button
          size="small"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFee(fee.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Table<FeeLine>
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={fees}
        pagination={false}
        scroll={{ x: 400 }}
      />
      <Button icon={<PlusOutlined />} onClick={addFee} style={{ marginTop: 8 }}>
        Add fee
      </Button>
    </>
  );
}
