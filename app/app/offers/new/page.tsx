"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewOfferPage() {
  const router = useRouter();

  useEffect(() => {
    async function createOffer() {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Angebot",
          offer_date: new Date().toISOString().split("T")[0]
        })
      });

      if (!res.ok) {
        // Bei Fehler zurück zur Übersicht
        router.push("/app/offers");
        return;
      }

      const json = await res.json();
      router.replace(`/app/app/offers/${json.data.id}`);
    }

    void createOffer();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-sm">Angebot wird erstellt...</div>
      </div>
    </div>
  );
}
