import type { OfferItem } from "@/types/offer";

export function handleAddItem(items: OfferItem[], groupId: string): OfferItem {
  const newItem: OfferItem = {
    id: Math.random().toString(),
    type: "material",
    position_index: `${(items?.length ?? 0) + 1}`,
    name: "Material hinzufügen",
    description: null,
    qty: 1,
    unit: "Stück",
    purchase_price: 0,
    markup_percent: 0,
    margin_amount: 0,
    unit_price: 0,
    line_total: 0,
  };

  return newItem;
}

export function handleMoveItem(
  items: OfferItem[],
  itemId: string,
  direction: "up" | "down"
): OfferItem[] {
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return items;

  const newItems = [...items];
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) return items;

  // Tausche Positionen
  [newItems[index], newItems[targetIndex]] = [
    newItems[targetIndex],
    newItems[index],
  ];

  // Aktualisiere Indizes
  return newItems.map((item, i) => ({
    ...item,
    position_index: `${i + 1}`,
  }));
}

export function handleDuplicateItem(
  items: OfferItem[],
  itemId: string
): OfferItem[] {
  const item = items.find((i) => i.id === itemId);
  if (!item) return items;

  const newItem: OfferItem = {
    ...item,
    id: Math.random().toString(),
    position_index: `${items.length + 1}`,
  };

  return [...items, newItem];
}

export function handleUpdateItem(
  item: OfferItem,
  updates: Partial<OfferItem>
): OfferItem {
  const newItem = { ...item, ...updates };

  // Berechne Marge
  newItem.margin_amount = newItem.purchase_price * (newItem.markup_percent / 100);

  // Berechne Einzelpreis
  newItem.unit_price = newItem.purchase_price + newItem.margin_amount;

  // Berechne Gesamtpreis
  newItem.line_total = newItem.unit_price * newItem.qty;

  return newItem;
}
