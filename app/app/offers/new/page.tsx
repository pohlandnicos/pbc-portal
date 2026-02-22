'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function Page() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function createOffer() {
      try {
        // 1. Angebot erstellen
        const { data: offer, error: offerError } = await supabase
          .from('offers')
          .insert({
            title: 'Angebot',
            offer_date: new Date().toISOString().split('T')[0],
            status: 'draft',
            total_net: 0,
            total_tax: 0,
            total_gross: 0,
            tax_rate: 19,
            payment_due_days: 7
          })
          .select()
          .single();

        if (offerError) {
          console.error('Fehler beim Erstellen:', offerError);
          router.push('/app/offers');
          return;
        }

        // 2. Erste Gruppe erstellen
        const { error: groupError } = await supabase
          .from('offer_groups')
          .insert({
            offer_id: offer.id,
            index: 1,
            title: 'Leistungen'
          });

        if (groupError) {
          console.error('Fehler beim Erstellen der Gruppe:', groupError);
          router.push('/app/offers');
          return;
        }

        // 3. Zum Editor
        router.push('/app/offers/' + offer.id);
      } catch (err) {
        console.error('Fehler:', err);
        router.push('/app/offers');
      }
    }

    void createOffer();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h1 className="text-lg font-medium mb-4">Angebot wird erstellt...</h1>
          <p className="text-sm text-zinc-600">
            Einen Moment bitte, das neue Angebot wird vorbereitet.
          </p>
        </div>
      </div>
    </div>
  );
}
