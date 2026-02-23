import type { OfferGroup, OfferItem } from "@/types/offer";

export function calculateItemTotals(item: OfferItem): OfferItem {
  const { type, qty, purchase_price, markup_percent } = item;

  // Berechne Marge und Verkaufspreis basierend auf Typ und Aufschlag
  const margin_amount = (purchase_price * markup_percent) / 100;
  const unit_price = purchase_price + margin_amount;
  const line_total = qty * unit_price;

  return {
    ...item,
    margin_amount,
    unit_price,
    line_total,
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
  let total_material_cost = 0;
  let total_labor_cost = 0;
  let total_other_cost = 0;
  let total_material_margin = 0;
  let total_labor_margin = 0;
  let total_other_margin = 0;

  const updatedGroups = groups.map((group) => {
    const groupItems = items[group.id] ?? [];
    let material_cost = 0;
    let labor_cost = 0;
    let other_cost = 0;
    let material_margin = 0;
    let labor_margin = 0;
    let other_margin = 0;

    // Erst alle Items berechnen
    const calculatedItems = groupItems.map(item => calculateItemTotals(item));

    calculatedItems.forEach((item) => {
      const { type, qty, purchase_price, margin_amount } = item;

      switch (type) {
        case "material":
          material_cost += qty * purchase_price;
          material_margin += qty * margin_amount;
          break;
        case "labor":
          labor_cost += qty * purchase_price;
          labor_margin += qty * margin_amount;
          break;
        case "mixed":
        case "other":
          other_cost += qty * purchase_price;
          other_margin += qty * margin_amount;
          break;
      }
    });

    total_material_cost += material_cost;
    total_labor_cost += labor_cost;
    total_other_cost += other_cost;
    total_material_margin += material_margin;
    total_labor_margin += labor_margin;
    total_other_margin += other_margin;

    const group_total_net = 
      material_cost +
      labor_cost +
      other_cost +
      material_margin +
      labor_margin +
      other_margin;

    return {
      ...group,
      material_cost,
      labor_cost,
      other_cost,
      material_margin,
      labor_margin,
      other_margin,
      total_net: group_total_net,
    };
  });

  const total_net = 
    total_material_cost +
    total_labor_cost +
    total_other_cost +
    total_material_margin +
    total_labor_margin +
    total_other_margin;

  return {
    groups: updatedGroups,
    material_cost: total_material_cost,
    labor_cost: total_labor_cost,
    other_cost: total_other_cost,
    material_margin: total_material_margin,
    labor_margin: total_labor_margin,
    other_margin: total_other_margin,
    total_net,
  };
}
