export type OfferGroup = {
  id: string;
  index: number;
  title: string;
  material_cost: number;
  labor_cost: number;
  other_cost: number;
  material_margin: number;
  labor_margin: number;
  other_margin: number;
  total_net: number;
  expanded?: boolean;
};

export type OfferItem = {
  id: string;
  type: "material" | "labor" | "other";
  position_index: string;
  name: string;
  description: string | null;
  qty: number;
  unit: string;
  purchase_price: number;
  markup_percent: number;
  margin_amount: number;
  unit_price: number;
  line_total: number;
};
