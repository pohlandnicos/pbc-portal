import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const NewOfferForm = dynamic(() => import('./components/new-offer-form'), {
  ssr: false,
  loading: () => <div className="p-4">Lädt...</div>
});

export const runtime = 'edge';

export function generateMetadata(): Metadata {
  return {
    title: 'Neues Angebot erstellen',
  };
}

function Page() {
  return (
    <Suspense fallback={<div className="p-4">Lädt...</div>}>
      <NewOfferForm />
    </Suspense>
  );
}

export default Page;