'use client';

import dynamic from 'next/dynamic';

const NewOfferForm = dynamic(() => import('./new-offer-form'), {
  loading: () => <div className="p-4">Lädt...</div>
});

export default function NewOfferClient() {
  return <NewOfferForm />;
}
