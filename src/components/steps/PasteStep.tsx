import { Alert, Button, Input, Space, Statistic, Typography } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import { useOrderStore } from '../../store/useOrderStore';
import { formatEur } from '../../lib/money';
import EditableItemsTable from '../EditableItemsTable';
import FeeTable from '../FeeTable';

export default function PasteStep() {
  const rawText = useOrderStore((s) => s.rawText);
  const setRawText = useOrderStore((s) => s.setRawText);
  const parse = useOrderStore((s) => s.parse);
  const items = useOrderStore((s) => s.items);
  const fees = useOrderStore((s) => s.fees);
  const subtotalCents = useOrderStore((s) => s.subtotalCents);
  const totalCents = useOrderStore((s) => s.totalCents);
  const warnings = useOrderStore((s) => s.parseWarnings);

  const itemsSum = items.reduce((a, i) => a + i.totalCents, 0);
  const feesSum = fees.reduce((a, f) => a + f.amountCents, 0);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        Paste the order exactly as copied from the shop (product list, Sub-Total, shipping fees and
        Total), then press <b>Parse</b>. You can fix anything in the tables below afterwards.
      </Typography.Paragraph>

      <Input.TextArea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={'Product Name\tModel\tQuantity\tPrice\tTotal\n…'}
        autoSize={{ minRows: 6, maxRows: 14 }}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      <Button
        type="primary"
        icon={<FileSearchOutlined />}
        onClick={parse}
        disabled={!rawText.trim()}
        block
      >
        Parse order
      </Button>

      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Check these before continuing"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
        />
      )}

      {items.length > 0 && (
        <>
          <Space size="large" wrap>
            <Statistic title="Items" value={items.length} />
            <Statistic title="Items sum" value={formatEur(itemsSum)} />
            {subtotalCents !== null && (
              <Statistic title="Order Sub-Total" value={formatEur(subtotalCents)} />
            )}
            <Statistic title="Fees" value={formatEur(feesSum)} />
            {totalCents !== null && (
              <Statistic title="Order Total" value={formatEur(totalCents)} />
            )}
          </Space>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Items
          </Typography.Title>
          <EditableItemsTable />

          <Typography.Title level={5} style={{ margin: 0 }}>
            Delivery fees &amp; surcharges
          </Typography.Title>
          <FeeTable />
        </>
      )}
    </Space>
  );
}
