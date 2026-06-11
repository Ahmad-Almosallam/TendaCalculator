import { useEffect, useState } from 'react';
import { Alert, Button, InputNumber, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useOrderStore, effectiveRate } from '../store/useOrderStore';
import { fetchEurSar } from '../lib/rates';

const STALE_MS = 12 * 60 * 60 * 1000;

export default function RateControl() {
  const rateFetched = useOrderStore((s) => s.rateFetched);
  const rateFetchedAt = useOrderStore((s) => s.rateFetchedAt);
  const rateSource = useOrderStore((s) => s.rateSource);
  const rateManual = useOrderStore((s) => s.rateManual);
  const setManualRate = useOrderStore((s) => s.setManualRate);
  const applyFetchedRate = useOrderStore((s) => s.applyFetchedRate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      applyFetchedRate(await fetchEurSar());
    } catch {
      setError(
        rateFetched !== null
          ? `Could not fetch a fresh rate — still using the one from ${new Date(rateFetchedAt!).toLocaleString()}.`
          : 'Could not fetch the exchange rate. Enter it manually below.',
      );
    } finally {
      setLoading(false);
    }
  };

  // auto-fetch on first mount when missing or stale; never overwrites a manual value
  useEffect(() => {
    if (rateFetched !== null && Date.now() - (rateFetchedAt ?? 0) <= STALE_MS) return;
    let cancelled = false;
    fetchEurSar()
      .then((info) => {
        if (!cancelled) applyFetchedRate(info);
      })
      .catch(() => {
        if (!cancelled) setError('Could not fetch the exchange rate. Enter it manually below.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rate = effectiveRate({ rateManual, rateFetched });

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space wrap>
        <InputNumber
          addonBefore="1 € ="
          addonAfter="SAR"
          inputMode="decimal"
          min={0}
          step={0.0001}
          precision={4}
          style={{ maxWidth: 260 }}
          value={rate}
          onChange={(v) => setManualRate(v === null || v === rateFetched ? null : v)}
        />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          Refresh
        </Button>
        {rateManual !== null && rateFetched !== null && (
          <Button type="link" onClick={() => setManualRate(null)}>
            Use fetched rate ({rateFetched.toFixed(4)})
          </Button>
        )}
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {rateManual !== null
          ? 'Manual rate in use.'
          : rateFetchedAt
            ? `Fetched ${new Date(rateFetchedAt).toLocaleString()} from ${rateSource}.`
            : 'No rate yet.'}{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">
          Rates by Exchange Rate API
        </a>
      </Typography.Text>
      {error && <Alert type="warning" showIcon message={error} />}
    </Space>
  );
}
