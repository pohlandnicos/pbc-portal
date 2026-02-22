import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createServerComponentClient({ cookies });

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
    console.error('Error:', offerError);
    return NextResponse.redirect(new URL('/app/offers', 'https://pbc-portal.vercel.app'));
  }

  const { error: groupError } = await supabase
    .from('offer_groups')
    .insert({
      offer_id: offer.id,
      index: 1,
      title: 'Leistungen'
    });

  if (groupError) {
    console.error('Error:', groupError);
    return NextResponse.redirect(new URL('/app/offers', 'https://pbc-portal.vercel.app'));
  }

  return NextResponse.redirect(new URL(`/app/offers/${offer.id}`, 'https://pbc-portal.vercel.app'));
}
