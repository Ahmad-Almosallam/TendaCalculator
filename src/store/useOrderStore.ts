import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderItem, FeeLine, Person, Assignments } from '../types';
import { parseOrder } from '../lib/parser';
import { buildUnits } from '../lib/split';
import { uid } from '../lib/uid';
import type { RateInfo } from '../lib/rates';

const PERSON_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#f5222d', '#a0d911',
];

interface OrderState {
  rawText: string;
  items: OrderItem[];
  fees: FeeLine[];
  subtotalCents: number | null;
  totalCents: number | null;
  parseWarnings: string[];
  people: Person[];
  assignments: Assignments;
  customsHalalas: number;
  rateFetched: number | null;
  rateFetchedAt: number | null;
  rateSource: string | null;
  rateManual: number | null;
  currentStep: number;

  setRawText: (text: string) => void;
  parse: () => void;
  updateItem: (id: string, patch: Partial<OrderItem>) => void;
  removeItem: (id: string) => void;
  addItem: () => void;
  updateFee: (id: string, patch: Partial<FeeLine>) => void;
  removeFee: (id: string) => void;
  addFee: () => void;
  addPerson: (name: string) => void;
  renamePerson: (id: string, name: string) => void;
  removePerson: (id: string) => void;
  assign: (unitId: string, personId: string | null) => void;
  assignMany: (unitIds: string[], personId: string | null) => void;
  assignAllRemaining: (personId: string) => void;
  setCustoms: (halalas: number) => void;
  setManualRate: (rate: number | null) => void;
  applyFetchedRate: (info: RateInfo) => void;
  setStep: (step: number) => void;
  resetAll: () => void;
}

const initialData = {
  rawText: '',
  items: [] as OrderItem[],
  fees: [] as FeeLine[],
  subtotalCents: null as number | null,
  totalCents: null as number | null,
  parseWarnings: [] as string[],
  people: [] as Person[],
  assignments: {} as Assignments,
  customsHalalas: 0,
  rateFetched: null as number | null,
  rateFetchedAt: null as number | null,
  rateSource: null as string | null,
  rateManual: null as number | null,
  currentStep: 0,
};

/** Drop assignments whose unit no longer exists (item removed / qty reduced) or whose person is gone. */
function pruneAssignments(
  assignments: Assignments,
  items: OrderItem[],
  people: Person[],
): Assignments {
  const validUnits = new Set(buildUnits(items).map((u) => u.unitId));
  const validPeople = new Set(people.map((p) => p.id));
  const next: Assignments = {};
  for (const [unitId, personId] of Object.entries(assignments)) {
    if (validUnits.has(unitId) && validPeople.has(personId)) next[unitId] = personId;
  }
  return next;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      ...initialData,

      setRawText: (rawText) => set({ rawText }),

      parse: () => {
        const result = parseOrder(get().rawText);
        set((s) => ({
          items: result.items,
          fees: result.fees,
          subtotalCents: result.subtotalCents,
          totalCents: result.totalCents,
          parseWarnings: result.warnings,
          assignments: pruneAssignments({}, result.items, s.people),
        }));
      },

      updateItem: (id, patch) =>
        set((s) => {
          const items = s.items.map((it) => (it.id === id ? { ...it, ...patch } : it));
          return { items, assignments: pruneAssignments(s.assignments, items, s.people) };
        }),

      removeItem: (id) =>
        set((s) => {
          const items = s.items.filter((it) => it.id !== id);
          return { items, assignments: pruneAssignments(s.assignments, items, s.people) };
        }),

      addItem: () =>
        set((s) => ({
          items: [
            ...s.items,
            { id: uid('item'), name: 'New item', model: '', qty: 1, unitPriceCents: 0, totalCents: 0 },
          ],
        })),

      updateFee: (id, patch) =>
        set((s) => ({ fees: s.fees.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),

      removeFee: (id) => set((s) => ({ fees: s.fees.filter((f) => f.id !== id) })),

      addFee: () =>
        set((s) => ({ fees: [...s.fees, { id: uid('fee'), label: 'New fee', amountCents: 0 }] })),

      addPerson: (name) =>
        set((s) => ({
          people: [
            ...s.people,
            { id: uid('person'), name, color: PERSON_COLORS[s.people.length % PERSON_COLORS.length] },
          ],
        })),

      renamePerson: (id, name) =>
        set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, name } : p)) })),

      removePerson: (id) =>
        set((s) => {
          const people = s.people.filter((p) => p.id !== id);
          return { people, assignments: pruneAssignments(s.assignments, s.items, people) };
        }),

      assign: (unitId, personId) =>
        set((s) => {
          const assignments = { ...s.assignments };
          if (personId === null) delete assignments[unitId];
          else assignments[unitId] = personId;
          return { assignments };
        }),

      assignMany: (unitIds, personId) =>
        set((s) => {
          const assignments = { ...s.assignments };
          for (const unitId of unitIds) {
            if (personId === null) delete assignments[unitId];
            else assignments[unitId] = personId;
          }
          return { assignments };
        }),

      assignAllRemaining: (personId) =>
        set((s) => {
          const assignments = { ...s.assignments };
          for (const unit of buildUnits(s.items)) {
            if (!assignments[unit.unitId]) assignments[unit.unitId] = personId;
          }
          return { assignments };
        }),

      setCustoms: (customsHalalas) => set({ customsHalalas }),

      setManualRate: (rateManual) => set({ rateManual }),

      applyFetchedRate: (info) =>
        set({ rateFetched: info.rate, rateFetchedAt: info.at, rateSource: info.source }),

      setStep: (currentStep) => set({ currentStep }),

      resetAll: () => set({ ...initialData }),
    }),
    { name: 'tenda-calculator-v1', version: 1 },
  ),
);

/** Effective EUR→SAR rate: manual override wins over the fetched rate. */
export function effectiveRate(s: Pick<OrderState, 'rateManual' | 'rateFetched'>): number | null {
  return s.rateManual ?? s.rateFetched;
}
