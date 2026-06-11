export interface OrderItem {
  id: string;
  name: string;
  size?: string;
  model: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface FeeLine {
  id: string;
  label: string;
  amountCents: number;
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

/** unitId (`${itemId}#${index}`) -> personId. Absent key = unassigned. */
export type Assignments = Record<string, string>;

export interface ParseResult {
  items: OrderItem[];
  fees: FeeLine[];
  subtotalCents: number | null;
  totalCents: number | null;
  warnings: string[];
}

export interface Unit {
  unitId: string;
  item: OrderItem;
  /** 0-based index within the item's quantity */
  index: number;
  /** exact value in EUR cents; per-item unit values always sum to the item total */
  valueCents: number;
}

export interface PersonResult {
  person: Person;
  units: Unit[];
  itemsEurCents: number;
  deliveryEurCents: number;
  eurTotalCents: number;
  orderSarHalalas: number;
  customsHalalas: number;
  grandSarHalalas: number;
}

export interface CalcResults {
  perPerson: PersonResult[];
  orderTotalEurCents: number;
  orderTotalHalalas: number;
  customsHalalas: number;
  grandTotalHalalas: number;
  /** EUR cents of units not assigned to anyone (excluded from the split) */
  excludedEurCents: number;
  excludedUnits: Unit[];
  rate: number;
  /** sum of per-person grand totals === orderTotalHalalas + customsHalalas */
  verified: boolean;
}
