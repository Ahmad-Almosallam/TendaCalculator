import { useMemo, type ReactNode } from 'react';
import { Alert, Badge, Card, Col, Collapse, Row, Space, Statistic, Table, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useOrderStore, effectiveRate } from '../../store/useOrderStore';
import { apportion, computeResults } from '../../lib/split';
import { formatEur, formatSar } from '../../lib/money';
import type { CalcResults, PersonResult } from '../../types';

export default function ResultsStep() {
  const items = useOrderStore((s) => s.items);
  const fees = useOrderStore((s) => s.fees);
  const people = useOrderStore((s) => s.people);
  const assignments = useOrderStore((s) => s.assignments);
  const customsHalalas = useOrderStore((s) => s.customsHalalas);
  const rateManual = useOrderStore((s) => s.rateManual);
  const rateFetched = useOrderStore((s) => s.rateFetched);

  const rate = effectiveRate({ rateManual, rateFetched });

  const results = useMemo(() => {
    if (rate === null) return null;
    return computeResults({ items, fees, people, assignments, customsHalalas, rate });
  }, [items, fees, people, assignments, customsHalalas, rate]);

  if (rate === null) {
    return <Alert type="error" showIcon message="No exchange rate set — go back one step and enter or fetch the EUR→SAR rate." />;
  }
  if (!results || people.length === 0) {
    return <Alert type="warning" showIcon message="No people to split between — go back and add people." />;
  }

  // Bases the proportional splits are taken against — used to spell out each equation.
  const feesTotalCents = fees.reduce((a, f) => a + f.amountCents, 0);
  const totalItemsEurCents = results.perPerson.reduce((a, r) => a + r.itemsEurCents, 0);

  const summaryColumns = [
    {
      title: 'Person',
      key: 'person',
      render: (_: unknown, r: PersonResult) => (
        <span>
          <Badge color={r.person.color} style={{ marginRight: 6 }} />
          {r.person.name}
        </span>
      ),
    },
    {
      title: 'Items €',
      key: 'items',
      align: 'right' as const,
      render: (_: unknown, r: PersonResult) => formatEur(r.itemsEurCents),
    },
    {
      title: 'Delivery €',
      key: 'delivery',
      align: 'right' as const,
      render: (_: unknown, r: PersonResult) => formatEur(r.deliveryEurCents),
    },
    {
      title: 'Customs',
      key: 'customs',
      align: 'right' as const,
      render: (_: unknown, r: PersonResult) => formatSar(r.customsHalalas),
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right' as const,
      render: (_: unknown, r: PersonResult) => <b>{formatSar(r.grandSarHalalas)}</b>,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {results.verified ? (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message={`Verified: the ${results.perPerson.length} shares sum exactly to ${formatSar(results.grandTotalHalalas)} (order ${formatSar(results.orderTotalHalalas)} + customs ${formatSar(results.customsHalalas)}) at 1 € = ${rate.toFixed(4)} SAR.`}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message="The shares do not cover the full order — some items are unassigned or no one has items."
        />
      )}

      {results.excludedEurCents > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${results.excludedUnits.length} unassigned item(s) worth ${formatEur(results.excludedEurCents)} were excluded from the split.`}
        />
      )}

      <Card size="small" title="How each share is calculated">
        <GeneralEquation feesTotalCents={feesTotalCents} results={results} rate={rate} />
      </Card>

      <Row gutter={[12, 12]}>
        {results.perPerson.map((r) => (
          <Col xs={24} sm={12} lg={8} key={r.person.id}>
            <Card
              size="small"
              className="person-total"
              title={
                <span>
                  <Badge color={r.person.color} style={{ marginRight: 6 }} />
                  {r.person.name}
                </span>
              }
            >
              <Statistic
                value={formatSar(r.grandSarHalalas)}
                valueStyle={{ color: r.person.color, fontWeight: 600 }}
              />
              <div style={{ fontSize: 13, marginTop: 8, display: 'grid', rowGap: 2 }}>
                <SplitRow label={`Items (${r.units.length})`} value={`${formatEur(r.itemsEurCents)}`} />
                <SplitRow label="Delivery share" value={formatEur(r.deliveryEurCents)} />
                <SplitRow label="In SAR" value={formatSar(r.orderSarHalalas)} />
                <SplitRow label="Customs share" value={formatSar(r.customsHalalas)} />
              </div>
              {r.units.length > 0 && (
                <Collapse
                  ghost
                  size="small"
                  style={{ marginTop: 8 }}
                  items={[
                    {
                      key: 'items',
                      label: 'Items',
                      children: (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                          {r.units.map((u) => (
                            <li key={u.unitId}>
                              {u.item.name}
                              {u.item.size ? ` (${u.item.size})` : ''}
                              {u.item.qty > 1 ? ` — ${u.index + 1}/${u.item.qty}` : ''}{' '}
                              <Typography.Text type="secondary">
                                {formatEur(u.valueCents)}
                              </Typography.Text>
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                    {
                      key: 'equation',
                      label: 'Equation',
                      children: (
                        <PersonEquation
                          r={r}
                          feesTotalCents={feesTotalCents}
                          totalItemsEurCents={totalItemsEurCents}
                          results={results}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" title="Summary">
        <Table<PersonResult>
          size="small"
          rowKey={(r) => r.person.id}
          columns={summaryColumns}
          dataSource={results.perPerson}
          pagination={false}
          scroll={{ x: 520 }}
          summary={(rows) => {
            const data = [...rows];
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <b>Total</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <b>{formatEur(data.reduce((a, r) => a + r.itemsEurCents, 0))}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <b>{formatEur(data.reduce((a, r) => a + r.deliveryEurCents, 0))}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <b>{formatSar(data.reduce((a, r) => a + r.customsHalalas, 0))}</b>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <b>{formatSar(data.reduce((a, r) => a + r.grandSarHalalas, 0))}</b>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </Space>
  );
}

function SplitRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <span>{value}</span>
    </div>
  );
}

/** The shared pipeline, with this order's real totals plugged in. */
function GeneralEquation({
  feesTotalCents,
  results,
  rate,
}: {
  feesTotalCents: number;
  results: CalcResults;
  rate: number;
}) {
  return (
    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, display: 'grid', rowGap: 4 }}>
      <li>
        <b>Items share</b> — each person's assigned items as a % of all the items. This % sets their
        delivery and customs share.
      </li>
      <li>
        <b>Delivery</b> — the {formatEur(feesTotalCents)} delivery is split by that items share.
      </li>
      <li>
        <b>Convert to SAR</b> — each person's items € and delivery € are converted at 1 € ={' '}
        {rate.toFixed(4)} SAR. (The whole order {formatEur(results.orderTotalEurCents)} ={' '}
        {formatSar(results.orderTotalHalalas)} is converted as one total, so the SAR shares add up
        exactly.)
      </li>
      <li>
        <b>Customs</b> — the {formatSar(results.customsHalalas)} customs fee is already in SAR; it's
        split by the same items share.
      </li>
      <li>
        <b>Total</b> = items SAR + delivery SAR + customs SAR.
      </li>
    </ol>
  );
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** One row of the per-person breakdown: a label, the euro amount converted to SAR. */
function EqRow({
  label,
  eur,
  sar,
  strong,
}: {
  label: string;
  /** euro amount, or null when the line has no euro side (customs / total) */
  eur: string | null;
  sar: string;
  strong?: boolean;
}) {
  const weight = strong ? 700 : 400;
  return (
    <>
      <span style={{ fontWeight: weight }}>{label}</span>
      <span style={{ textAlign: 'right', fontFamily: MONO, color: '#888' }}>{eur ?? ''}</span>
      <span style={{ textAlign: 'center', color: '#bbb' }}>{eur ? '→' : ''}</span>
      <span style={{ textAlign: 'right', fontFamily: MONO, fontWeight: weight }}>{sar}</span>
    </>
  );
}

/** Full-width caption under a row, spelling out how that share was derived. */
function EqNote({ children }: { children: ReactNode }) {
  return (
    <span style={{ gridColumn: '1 / -1', fontSize: 11, color: '#999', marginTop: -2 }}>
      {children}
    </span>
  );
}

/** The full calculation for one person — every euro amount converted to SAR, then summed. */
function PersonEquation({
  r,
  feesTotalCents,
  totalItemsEurCents,
  results,
}: {
  r: PersonResult;
  feesTotalCents: number;
  totalItemsEurCents: number;
  results: CalcResults;
}) {
  const sharePct = totalItemsEurCents > 0 ? (r.itemsEurCents / totalItemsEurCents) * 100 : 0;
  const share = `${sharePct.toFixed(1)}%`;
  // Split this person's order share back into items vs delivery in SAR for display. The two parts
  // always sum to their order share (largest-remainder), so the SAR column stays exact.
  const [itemsSar, deliverySar] = apportion(r.orderSarHalalas, [
    r.itemsEurCents,
    r.deliveryEurCents,
  ]);
  return (
    <div style={{ fontSize: 12.5 }}>
      <Typography.Paragraph type="secondary" style={{ fontSize: 11.5, marginBottom: 8 }}>
        Your items {formatEur(r.itemsEurCents)} are {share} of all items (
        {formatEur(totalItemsEurCents)}). That {share} sets your delivery and customs share, and each
        € is converted at 1 € = {results.rate.toFixed(4)} SAR.
      </Typography.Paragraph>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 16px auto',
          columnGap: 8,
          rowGap: 6,
          alignItems: 'baseline',
        }}
      >
        <EqRow label={`Items (${r.units.length})`} eur={formatEur(r.itemsEurCents)} sar={formatSar(itemsSar)} />

        <EqRow label="Delivery share" eur={formatEur(r.deliveryEurCents)} sar={formatSar(deliverySar)} />
        <EqNote>
          {formatEur(feesTotalCents)} delivery × {share} ≈ {formatEur(r.deliveryEurCents)}
        </EqNote>

        <EqRow label="Customs share" eur={null} sar={formatSar(r.customsHalalas)} />
        <EqNote>
          {formatSar(results.customsHalalas)} customs × {share} ≈ {formatSar(r.customsHalalas)}
        </EqNote>

        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', margin: '2px 0' }} />
        <EqRow label="Total" eur={null} sar={formatSar(r.grandSarHalalas)} strong />
      </div>
    </div>
  );
}
