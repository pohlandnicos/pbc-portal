import type { OfferGroup, OfferItem } from "@/types/offer";

export function calculateItemTotals(item: OfferItem): OfferItem {
  // Berechne Marge
  const marginAmount = item.purchase_price * (item.markup_percent / 100);

  // Berechne Einzelpreis
  const unitPrice = item.purchase_price + marginAmount;

  // Berechne Gesamtpreis
  const lineTotal = unitPrice * item.qty;

  return {
    ...item,
    margin_amount: marginAmount,
    unit_price: unitPrice,
    line_total: lineTotal,
  };
}

export function calculateGroupTotals(
  group: OfferGroup,
  items: OfferItem[]
): OfferGroup {
  const totals = items.reduce(
    (acc, item) => {
      const itemCost = item.purchase_price * item.qty;
      const itemMargin = item.margin_amount * item.qty;

      switch (item.type) {
        case "material":
          acc.material_cost += itemCost;
          acc.material_margin += itemMargin;
          break;
        case "labor":
          acc.labor_cost += itemCost;
          acc.labor_margin += itemMargin;
          break;
        case "other":
          acc.other_cost += itemCost;
          acc.other_margin += itemMargin;
          break;
      }

      return acc;
    },
    {
      material_cost: 0,
      labor_cost: 0,
      other_cost: 0,
      material_margin: 0,
      labor_margin: 0,
      other_margin: 0,
    }
  );

  const total_net =
    totals.material_cost +
    totals.labor_cost +
    totals.other_cost +
    totals.material_margin +
    totals.labor_margin +
    totals.other_margin;

  return {
    ...group,
    ...totals,
    total_net,
  };
}

export function calculateOfferTotals(
  groups: OfferGroup[],
  items: Record<string, OfferItem[]>
): {
  groups: OfferGroup[];
  material_cost: number;
  labor_cost: number;
  other_cost: number;
  material_margin: number;
  labor_margin: number;
  other_margin: number;
  total_net: number;
} {
  const updatedGroups = groups.map((group) =>
    calculateGroupTotals(group, items[group.id] ?? [])
  );

  const totals = updatedGroups.reduce(
    (acc, group) => {
      acc.material_cost += group.material_cost;
      acc.labor_cost += group.labor_cost;
      acc.other_cost += group.other_cost;
      acc.material_margin += group.material_margin;
      acc.labor_margin += group.labor_margin;
      acc.other_margin += group.other_margin;
      acc.total_net += group.total_net;
      return acc;
    },
    {
      material_cost: 0,
      labor_cost: 0,
      other_cost: 0,
      material_margin: 0,
      labor_margin: 0,
      other_margin: 0,
      total_net: 0,
    }
  );

  return {
    groups: updatedGroups,
    ...totals,
  };
}
