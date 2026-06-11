import { Card, InputNumber, Space, Statistic, Typography } from 'antd';
import { useOrderStore, effectiveRate } from '../../store/useOrderStore';
import { formatEur, formatSar } from '../../lib/money';
import RateControl from '../RateControl';

export default function CustomsStep() {
  const items = useOrderStore((s) => s.items);
  const fees = useOrderStore((s) => s.fees);
  const customsHalalas = useOrderStore((s) => s.customsHalalas);
  const setCustoms = useOrderStore((s) => s.setCustoms);
  const rateManual = useOrderStore((s) => s.rateManual);
  const rateFetched = useOrderStore((s) => s.rateFetched);

  const rate = effectiveRate({ rateManual, rateFetched });
  const orderEur =
    items.reduce((a, i) => a + i.totalCents, 0) + fees.reduce((a, f) => a + f.amountCents, 0);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card size="small" title="Customs fee (SAR)">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Enter the customs amount charged in Saudi Arabia. It will be split proportionally by
            each person&apos;s items subtotal — enter 0 if there was no customs charge.
          </Typography.Text>
          <InputNumber
            addonAfter="SAR"
            inputMode="decimal"
            min={0}
            step={0.01}
            precision={2}
            size="large"
            style={{ maxWidth: 240 }}
            value={customsHalalas / 100}
            onChange={(v) => setCustoms(v === null ? 0 : Math.round(v * 100))}
          />
        </Space>
      </Card>

      <Card size="small" title="Exchange rate (EUR → SAR)">
        <RateControl />
      </Card>

      <Space size="large" wrap>
        <Statistic title="Order total" value={formatEur(orderEur)} />
        {rate !== null && (
          <Statistic title="Order total in SAR" value={formatSar(Math.round(orderEur * rate))} />
        )}
        <Statistic title="Customs" value={formatSar(customsHalalas)} />
      </Space>
    </Space>
  );
}
