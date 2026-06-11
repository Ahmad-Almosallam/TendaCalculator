import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Badge, Button, Dropdown, Space, Typography, Empty } from 'antd';
import { ThunderboltOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons';
import { useOrderStore } from '../../store/useOrderStore';
import { buildUnits } from '../../lib/split';
import type { Unit } from '../../types';
import PeopleManager from '../PeopleManager';
import PersonBucket from '../PersonBucket';
import UnitCard from '../UnitCard';
import AssignSheet from '../AssignSheet';

const UNASSIGNED = 'unassigned';

export default function AssignStep() {
  const items = useOrderStore((s) => s.items);
  const people = useOrderStore((s) => s.people);
  const assignments = useOrderStore((s) => s.assignments);
  const assign = useOrderStore((s) => s.assign);
  const assignMany = useOrderStore((s) => s.assignMany);
  const assignAllRemaining = useOrderStore((s) => s.assignAllRemaining);

  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [sheetUnit, setSheetUnit] = useState<Unit | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const units = useMemo(() => buildUnits(items), [items]);
  const unitsById = useMemo(() => new Map(units.map((u) => [u.unitId, u])), [units]);
  const colorByPerson = useMemo(() => new Map(people.map((p) => [p.id, p.color])), [people]);

  const unassigned = units.filter((u) => !assignments[u.unitId]);
  const byPerson = (personId: string) => units.filter((u) => assignments[u.unitId] === personId);

  // Tap opens the sheet; drag starts only after 8px (pointer) or a 200ms long-press (touch),
  // so the two interactions never conflict.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveUnit(unitsById.get(String(e.active.id)) ?? null);
    setSheetUnit(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveUnit(null);
    if (!e.over) return; // dropped outside any bucket: keep current assignment
    const target = String(e.over.id);
    assign(String(e.active.id), target === UNASSIGNED ? null : target);
  };

  const toggleSelect = (unit: Unit) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(unit.unitId)) next.delete(unit.unitId);
      else next.add(unit.unitId);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const bulkAssign = (personId: string | null) => {
    assignMany([...selected], personId);
    clearSelection();
  };

  const toggleCollapsed = (personId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });

  const renderUnits = (list: Unit[]) =>
    list.map((u) => (
      <UnitCard
        key={u.unitId}
        unit={u}
        accentColor={colorByPerson.get(assignments[u.unitId] ?? '')}
        onTap={setSheetUnit}
        selected={selected.has(u.unitId)}
        onToggleSelect={toggleSelect}
      />
    ));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        Add the people splitting this order, then <b>tap an item</b> to assign it one at a time, or
        <b> tick several</b> and assign them together. You can also drag an item onto a person
        (long-press on touch screens).
      </Typography.Paragraph>

      <PeopleManager />

      {people.length > 0 && unassigned.length > 0 && selected.size === 0 && (
        <Dropdown
          menu={{
            items: people.map((p) => ({ key: p.id, label: p.name })),
            onClick: ({ key }) => assignAllRemaining(key),
          }}
        >
          <Button icon={<ThunderboltOutlined />}>
            Assign all remaining ({unassigned.length}) to… <DownOutlined />
          </Button>
        </Dropdown>
      )}

      {selected.size > 0 && (
        <div className="selection-bar">
          <b>{selected.size} selected</b>
          <Typography.Text type="secondary">→ assign to:</Typography.Text>
          {people.map((p) => (
            <Button key={p.id} size="small" onClick={() => bulkAssign(p.id)}>
              <Badge color={p.color} style={{ marginRight: 6 }} />
              {p.name}
            </Button>
          ))}
          {people.length === 0 && (
            <Typography.Text type="secondary">Add people first.</Typography.Text>
          )}
          <Button size="small" onClick={() => bulkAssign(null)}>
            Unassign
          </Button>
          <Button size="small" type="text" icon={<CloseOutlined />} onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="assign-board">
          <div className="unassigned-lane">
            <PersonBucket
              id={UNASSIGNED}
              title="Unassigned"
              subtotalCents={unassigned.reduce((a, u) => a + u.valueCents, 0)}
              count={unassigned.length}
            >
              {unassigned.length > 0 ? (
                renderUnits(unassigned)
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="All items assigned" />
              )}
            </PersonBucket>
          </div>
          {people.length > 0 && (
            <div className="people-lane">
              {people.map((p) => {
                const list = byPerson(p.id);
                return (
                  <div className="bucket-cell" key={p.id}>
                    <PersonBucket
                      id={p.id}
                      title={p.name}
                      color={p.color}
                      subtotalCents={list.reduce((a, u) => a + u.valueCents, 0)}
                      count={list.length}
                      collapsible
                      collapsed={collapsed.has(p.id)}
                      onToggleCollapsed={() => toggleCollapsed(p.id)}
                    >
                      {renderUnits(list)}
                    </PersonBucket>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DragOverlay>
          {activeUnit && <UnitCard unit={activeUnit} onTap={() => {}} overlay />}
        </DragOverlay>
      </DndContext>

      <AssignSheet unit={sheetUnit} onClose={() => setSheetUnit(null)} />
    </Space>
  );
}
