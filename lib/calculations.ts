import type { OfferGroup, OfferItem } from "@/types/offer";

export type OfferSummary = {
  // Nettosummen
  totalNet: number;
  costs: {
    total: number;
    material: number;
    labor: number;
    other: number;
  };
  
  // Margen
  margins: {
    total: number;
    material: number;
    labor: number;
    other: number;
  };
  
  // Rabatt
  discount: {
    percent: number | null;
    amount: number;
  };
  
  // Steuer
  tax: {
    rate: number;
    total: number;
    laborOnly: {
      net: number;
      tax: number;
    };
  };
  
  // Brutto
  totalGross: number;
};

export function calculateOfferSummary(
  groups: OfferGroup[],
  items: Record<string, OfferItem[]>,
  taxRate: number,
  discountPercent: number | null = null,
  showVatForLabor: boolean = false
): OfferSummary {
  // Nettosummen pro Kategorie
  const costs = {
    material: groups.reduce((sum, g) => sum + g.material_cost, 0),
    labor: groups.reduce((sum, g) => sum + g.labor_cost, 0),
    other: groups.reduce((sum, g) => sum + g.other_cost, 0),
    total: 0
  };
  costs.total = costs.material + costs.labor + costs.other;

  // Margen pro Kategorie
  const margins = {
    material: groups.reduce((sum, g) => sum + g.material_margin, 0),
    labor: groups.reduce((sum, g) => sum + g.labor_margin, 0),
    other: groups.reduce((sum, g) => sum + g.other_margin, 0),
    total: 0
  };
  margins.total = margins.material + margins.labor + margins.other;

  // Nettosumme
  const totalNet = costs.total + margins.total;

  // Rabatt
  const discountAmount = discountPercent ? totalNet * (discountPercent / 100) : 0;
  const netAfterDiscount = totalNet - discountAmount;

  // Steuer
  const taxTotal = netAfterDiscount * (taxRate / 100);
  
  // Lohnkosten MwSt
  const laborTax = showVatForLabor ? {
    net: costs.labor + margins.labor,
    tax: (costs.labor + margins.labor) * (taxRate / 100)
  } : {
    net: 0,
    tax: 0
  };

  // Bruttosumme
  const totalGross = netAfterDiscount + taxTotal;

  return {
    totalNet,
    costs,
    margins,
    discount: {
      percent: discountPercent,
      amount: discountAmount
    },
    tax: {
      rate: taxRate,
      total: taxTotal,
      laborOnly: laborTax
    },
    totalGross
  };
}
