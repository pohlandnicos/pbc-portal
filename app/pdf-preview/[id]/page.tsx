"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

// Copy all types from original pdf-preview page
type OfferCustomer = {
  type: "private" | "company";
  company_name: string | null;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_street: string;
  billing_house_number: string;
  billing_address_extra: string | null;
  billing_postal_code: string;
  billing_city: string;
};

type OfferProjectLocation = {
  street: string;
  house_number: string;
  address_extra: string | null;
  postal_code: string;
  city: string;
  is_billing_address: boolean;
};

type OfferProject = {
  title: string;
  project_locations: OfferProjectLocation[] | null;
};

type OfferItem = {
  id: string;
  position_index: string;
  name: string;
  description: string | null;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
};

type OfferGroup = {
  id: string;
  index: number;
  title: string;
  offer_items: OfferItem[];
};

type OfferData = {
  id: string;
  title: string;
  offer_number?: string | null;
  offer_date: string;
  project_number?: string | null;
  intro_salutation: string | null;
  intro_body_html: string | null;
  outro_body_html?: string | null;
  total_net?: number | null;
  total_tax?: number | null;
  total_gross?: number | null;
  tax_rate?: number | null;
  customers: OfferCustomer | null;
  projects: OfferProject | null;
  groups: OfferGroup[];
};

export default function PdfPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError("Ungültige Angebots-ID");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/offers/${id}`, { cache: "no-store" });
        const json = await res.json();
        
        if (!res.ok) {
          setError(json?.message ?? json?.error ?? `Laden fehlgeschlagen`);
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 p-6 text-sm text-zinc-700">Lädt...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-zinc-50 p-6 text-sm text-red-700">{error}</div>;
  }

  // Redirect to actual PDF preview page
  return (
    <iframe 
      src={`/app/offers/${id}/pdf-preview`}
      className="w-full h-screen border-0"
      title="PDF Vorschau"
    />
  );
}
