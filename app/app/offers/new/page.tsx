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
      router.push(`/app/offers/${json.data.id}`);
    }

    void createOffer();
  }, [router]);

  return (
    <div className="p-4">
      <div className="text-sm">Angebot wird erstellt...</div>
    </div>
  );
}
