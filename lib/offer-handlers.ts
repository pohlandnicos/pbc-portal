import type { OfferGroup, OfferItem } from "@/types/offer";

export function handleAddGroup(groups: OfferGroup[]): OfferGroup[] {
  const newGroup: OfferGroup = {
    id: Math.random().toString(),
    index: groups.length + 1,
    title: "Titel der Leistungsgruppe",
    material_cost: 0,
    labor_cost: 0,
    other_cost: 0,
    material_margin: 0,
    labor_margin: 0,
    other_margin: 0,
    total_net: 0,
  };

  return [...groups, newGroup];
}

export function handleMoveGroup(
  groups: OfferGroup[],
  groupId: string,
  direction: "up" | "down"
): OfferGroup[] {
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return groups;

  const newGroups = [...groups];
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= groups.length) return groups;

  // Tausche Positionen
  [newGroups[index], newGroups[targetIndex]] = [
    newGroups[targetIndex],
    newGroups[index],
  ];

  // Aktualisiere Indizes
  return newGroups.map((g, i) => ({ ...g, index: i + 1 }));
}

export function handleDeleteGroup(
  groups: OfferGroup[],
  items: Record<string, OfferItem[]>,
  groupId: string
): { groups: OfferGroup[]; items: Record<string, OfferItem[]> } {
  const newGroups = groups.filter((g) => g.id !== groupId);
  const { [groupId]: _, ...newItems } = items;

  // Aktualisiere Indizes
  return {
    groups: newGroups.map((g, i) => ({ ...g, index: i + 1 })),
    items: newItems,
  };
}

export function handleDuplicateGroup(
  groups: OfferGroup[],
  items: Record<string, OfferItem[]>,
  groupId: string
): { groups: OfferGroup[]; items: Record<string, OfferItem[]> } {
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return { groups, items };

  const sourceGroup = groups[index];
  const newGroupId = Math.random().toString();
  const newGroup: OfferGroup = {
    ...sourceGroup,
    id: newGroupId,
    title: sourceGroup.title,
    material_cost: 0,
    labor_cost: 0,
    other_cost: 0,
    material_margin: 0,
    labor_margin: 0,
    other_margin: 0,
    total_net: 0,
  };

  const newGroups = [...groups];
  newGroups.splice(index + 1, 0, newGroup);

  const sourceItems = items[groupId] ?? [];
  const duplicatedItems: OfferItem[] = sourceItems.map((it, i) => ({
    ...it,
    id: Math.random().toString(),
    position_index: String(i + 1),
  }));

  const newItems: Record<string, OfferItem[]> = {
    ...items,
    [newGroupId]: duplicatedItems,
  };

  return {
    groups: newGroups.map((g, i) => ({ ...g, index: i + 1 })),
    items: newItems,
  };
}
