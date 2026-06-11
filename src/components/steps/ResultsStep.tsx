import { useMemo } from 'react';
import { Alert, Badge, Card, Col, Collapse, Row, Space, Statistic, Table, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useOrderStore, effectiveRate } from '../../store/useOrderStore';
import { computeResults } from '../../lib/split';
import { formatEur, formatSar } from '../../lib/money';
import type { PersonResult } from '../../types';

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
