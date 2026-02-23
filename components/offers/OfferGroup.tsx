'use client';

import React from 'react';
import type { OfferGroup, OfferItem } from '@/types/offer';

type Props = {
  group: OfferGroup;
  items: OfferItem[];
  onUpdateGroup: (group: OfferGroup) => void;
  onAddItem: () => void;
  onUpdateItem: (item: OfferItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onDuplicateItem: (itemId: string) => void;
};

function OfferGroupSection(props: Props) {
  return (
    <div>Test</div>
  );
}

export default OfferGroupSection;
