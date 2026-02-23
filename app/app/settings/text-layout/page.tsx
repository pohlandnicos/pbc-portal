'use client';

import RichTextEditor from "@/components/ui/RichTextEditor";
import { useEffect, useMemo, useRef, useState } from "react";

type SettingsRow = {
  logo_enabled: boolean;
  logo_position: "left" | "right";
  logo_size: "small" | "medium" | "large";
  sender_line_enabled: boolean;
  footer_enabled: boolean;
  logo_url?: string | null;

  retention_note_private?: boolean;
  footer_mode?: "standard" | "custom";
  footer_custom_html?: string | null;

  company_name?: string | null;
  street?: string | null;
  house_number?: string | null;
  address_extra?: string | null;
  postal_code?: string | null;
  city?: string | null;
  tax_number?: string | null;
  vat_id?: string | null;

  bank_account_holder?: string | null;
  iban?: string | null;
  bic?: string | null;
  bank_name?: string | null;

  website?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;

  legal_form?: string | null;
  owner_name?: string | null;
  register_court?: string | null;
  hbr_number?: string | null;
};

type Template = {
  id: string;
  doc_type: "offer" | "invoice";
  type: "intro" | "outro";
  name: string;
  salutation?: string | null;
  body_html: string;
  is_default: boolean;
};

export default function TextLayoutSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoEnabled, setLogoEnabled] = useState(true);
  const [logoPosition, setLogoPosition] = useState<"left" | "right">("right");
  const [logoSize, setLogoSize] = useState<"small" | "medium" | "large">("small");
  const [senderLineEnabled, setSenderLineEnabled] = useState(true);
  const [footerEnabled, setFooterEnabled] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [retentionNotePrivate, setRetentionNotePrivate] = useState(true);
  const [footerMode, setFooterMode] = useState<"standard" | "custom">("standard");
  const [footerCustomHtml, setFooterCustomHtml] = useState<string>("");

  const [companyName, setCompanyName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [addressExtra, setAddressExtra] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [vatId, setVatId] = useState("");

  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");

  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");

  const [legalForm, setLegalForm] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [registerCourt, setRegisterCourt] = useState("");
  const [hbrNumber, setHbrNumber] = useState("");

  const [templateDocType, setTemplateDocType] = useState<"offer" | "invoice">("offer");
  const [introTemplates, setIntroTemplates] = useState<Template[]>([]);
  const [outroTemplates, setOutroTemplates] = useState<Template[]>([]);
  const [activeIntroId, setActiveIntroId] = useState<string | null>(null);
  const [activeOutroId, setActiveOutroId] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const activeIntro = useMemo(
    () => introTemplates.find((t) => t.id === activeIntroId) ?? null,
    [introTemplates, activeIntroId]
  );
  const activeOutro = useMemo(
    () => outroTemplates.find((t) => t.id === activeOutroId) ?? null,
    [outroTemplates, activeOutroId]
  );

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const logoSizeLabel = useMemo(() => {
    if (logoSize === "small") return "klein";
    if (logoSize === "medium") return "mittel";
    return "groß";
  }, [logoSize]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings/text-layout", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: SettingsRow; error?: string }
          | null;

        if (!res.ok) {
          setError(json?.error ?? "Laden fehlgeschlagen");
          return;
        }

        const d = json?.data;
        if (!d) return;

        setLogoEnabled(Boolean(d.logo_enabled));
        setLogoPosition((d.logo_position ?? "right") as "left" | "right");
        setLogoSize((d.logo_size ?? "small") as "small" | "medium" | "large");
        setSenderLineEnabled(Boolean(d.sender_line_enabled));
        setFooterEnabled(Boolean(d.footer_enabled));
        setLogoUrl(d.logo_url ?? null);

        setRetentionNotePrivate(Boolean(d.retention_note_private));
        setFooterMode((d.footer_mode ?? "standard") as "standard" | "custom");
        setFooterCustomHtml(d.footer_custom_html ?? "");

        setCompanyName(d.company_name ?? "");
        setStreet(d.street ?? "");
        setHouseNumber(d.house_number ?? "");
        setAddressExtra(d.address_extra ?? "");
        setPostalCode(d.postal_code ?? "");
        setCity(d.city ?? "");
        setTaxNumber(d.tax_number ?? "");
        setVatId(d.vat_id ?? "");

        setBankAccountHolder(d.bank_account_holder ?? "");
        setIban(d.iban ?? "");
        setBic(d.bic ?? "");
        setBankName(d.bank_name ?? "");

        setWebsite(d.website ?? "");
        setEmail(d.email ?? "");
        setMobile(d.mobile ?? "");
        setPhone(d.phone ?? "");

        setLegalForm(d.legal_form ?? "");
        setOwnerName(d.owner_name ?? "");
        setRegisterCourt(d.register_court ?? "");
        setHbrNumber(d.hbr_number ?? "");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/text-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_enabled: logoEnabled,
          logo_position: logoPosition,
          logo_size: logoSize,
          sender_line_enabled: senderLineEnabled,
          footer_enabled: footerEnabled,

          retention_note_private: retentionNotePrivate,
          footer_mode: footerMode,
          footer_custom_html: footerMode === "custom" ? footerCustomHtml : null,

          company_name: companyName || null,
          street: street || null,
          house_number: houseNumber || null,
          address_extra: addressExtra || null,
          postal_code: postalCode || null,
          city: city || null,
          tax_number: taxNumber || null,
          vat_id: vatId || null,

          bank_account_holder: bankAccountHolder || null,
          iban: iban || null,
          bic: bic || null,
          bank_name: bankName || null,

          website: website || null,
          email: email || null,
          mobile: mobile || null,
          phone: phone || null,

          legal_form: legalForm || null,
          owner_name: ownerName || null,
          register_court: registerCourt || null,
          hbr_number: hbrNumber || null,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: unknown; error?: string }
        | null;

      if (!res.ok) {
        setError(json?.error ?? "Speichern fehlgeschlagen");
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  async function loadTemplates(docType: "offer" | "invoice") {
    setTemplatesLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/offer-templates?doc_type=${docType}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: Template[]; error?: string }
        | null;
      if (!res.ok) {
        setError(json?.error ?? "Laden fehlgeschlagen");
        return;
      }
      const all = (json?.data ?? []) as Template[];
      const intros = all.filter((t) => t.type === "intro");
      const outros = all.filter((t) => t.type === "outro");
      setIntroTemplates(intros);
      setOutroTemplates(outros);

      const introDefault = intros.find((t) => t.is_default) ?? intros[0] ?? null;
      const outroDefault = outros.find((t) => t.is_default) ?? outros[0] ?? null;
      setActiveIntroId(introDefault?.id ?? null);
      setActiveOutroId(outroDefault?.id ?? null);
    } finally {
      setTemplatesLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates(templateDocType);
  }, [templateDocType]);

  async function createTemplate(type: "intro" | "outro") {
    setError(null);
    const res = await fetch("/api/settings/offer-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: templateDocType,
        type,
        name: "Neue Vorlage",
        salutation: type === "intro" ? "Sehr geehrte Damen und Herren," : undefined,
        body_html: "",
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: Template; error?: string }
      | null;
    if (!res.ok) {
      setError(json?.error ?? "Speichern fehlgeschlagen");
      return;
    }
    const t = json?.data;
    if (!t) return;
    if (type === "intro") {
      setIntroTemplates((prev) => [t, ...prev]);
      setActiveIntroId(t.id);
    } else {
      setOutroTemplates((prev) => [t, ...prev]);
      setActiveOutroId(t.id);
    }
  }

  async function patchTemplate(id: string, patch: Partial<Template>) {
    setError(null);
    const res = await fetch(`/api/settings/offer-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: Template; error?: string }
      | null;
    if (!res.ok) {
      setError(json?.error ?? "Speichern fehlgeschlagen");
      return;
    }
    const t = json?.data;
    if (!t) return;

    if (t.type === "intro") {
      setIntroTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      if (t.is_default) {
        setIntroTemplates((prev) => prev.map((x) => ({ ...x, is_default: x.id === t.id })));
      }
    } else {
      setOutroTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      if (t.is_default) {
        setOutroTemplates((prev) => prev.map((x) => ({ ...x, is_default: x.id === t.id })));
      }
    }
  }

  async function deleteTemplate(id: string, type: "intro" | "outro") {
    setError(null);
    const res = await fetch(`/api/settings/offer-templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "Löschen fehlgeschlagen");
      return;
    }
    if (type === "intro") {
      setIntroTemplates((prev) => prev.filter((t) => t.id !== id));
      setActiveIntroId((prev) => (prev === id ? null : prev));
    } else {
      setOutroTemplates((prev) => prev.filter((t) => t.id !== id));
      setActiveOutroId((prev) => (prev === id ? null : prev));
    }
  }

  async function uploadLogo(file: File) {
    setError(null);
    const form = new FormData();
    form.set("kind", "logo");
    form.set("file", file);

    const res = await fetch("/api/settings/org-docs/upload", {
      method: "POST",
      body: form,
    });

    const json = (await res.json().catch(() => null)) as
      | { data?: { path?: string }; error?: string }
      | null;

    if (!res.ok) {
      setError(json?.error ?? "Upload fehlgeschlagen");
      return;
    }

    // Refresh signed URL
    const refresh = await fetch("/api/settings/text-layout", { cache: "no-store" });
    const refreshJson = (await refresh.json().catch(() => null)) as
      | { data?: SettingsRow; error?: string }
      | null;

    if (refresh.ok) {
      setLogoUrl(refreshJson?.data?.logo_url ?? null);
    }
  }

  if (loading) {
    return <div className="p-4">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Texte & Layout</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Vorschau
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Textvorlagen</div>
          <div className="mt-1 text-sm text-zinc-600">
            Hier kannst Du verschiedene Textvorlagen für Angebote und Rechnungen anlegen und
            verwalten.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setTemplateDocType("offer")}
              className={`px-3 py-1.5 text-sm ${
                templateDocType === "offer" ? "bg-blue-600 text-white" : "text-zinc-700"
              }`}
            >
              Angebote
            </button>
            <button
              type="button"
              onClick={() => setTemplateDocType("invoice")}
              className={`px-3 py-1.5 text-sm ${
                templateDocType === "invoice" ? "bg-blue-600 text-white" : "text-zinc-700"
              }`}
            >
              Rechnungen
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {/* Einleitung */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-900">Einleitungstext</div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-[320px_1fr]">
              <div>
                <div className="text-xs text-zinc-600 mb-2">Titel der Vorlage</div>
                <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                  <div className="max-h-56 overflow-auto">
                    {templatesLoading ? (
                      <div className="px-3 py-3 text-sm text-zinc-600">Laden...</div>
                    ) : introTemplates.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-zinc-600">Keine Vorlagen</div>
                    ) : (
                      introTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveIntroId(t.id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                            activeIntroId === t.id ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-900">{t.name}</span>
                            <span className="text-xs text-zinc-500">
                              {t.is_default ? "Standard" : ""}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void createTemplate("intro")}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  + Vorlage hinzufügen
                </button>
              </div>

              <div>
                <div className="space-y-3">
                  <input
                    value={activeIntro?.salutation ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!activeIntro) return;
                      setIntroTemplates((prev) =>
                        prev.map((t) => (t.id === activeIntro.id ? { ...t, salutation: v } : t))
                      );
                    }}
                    onBlur={() => {
                      if (!activeIntro) return;
                      void patchTemplate(activeIntro.id, { salutation: activeIntro.salutation ?? "" });
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="Sehr geehrte Damen und Herren,"
                  />

                  <RichTextEditor
                    value={activeIntro?.body_html ?? ""}
                    onChange={(html) => {
                      if (!activeIntro) return;
                      setIntroTemplates((prev) =>
                        prev.map((t) => (t.id === activeIntro.id ? { ...t, body_html: html } : t))
                      );
                    }}
                    rows={7}
                  />

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={Boolean(activeIntro?.is_default)}
                        onChange={(e) => {
                          if (!activeIntro) return;
                          void patchTemplate(activeIntro.id, { is_default: e.target.checked });
                        }}
                      />
                      Als Standard verwenden
                    </label>

                    {activeIntro ? (
                      <button
                        type="button"
                        onClick={() => void deleteTemplate(activeIntro.id, "intro")}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Löschen
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schluss */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-900">Schlusstext</div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-[320px_1fr]">
              <div>
                <div className="text-xs text-zinc-600 mb-2">Titel der Vorlage</div>
                <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                  <div className="max-h-56 overflow-auto">
                    {templatesLoading ? (
                      <div className="px-3 py-3 text-sm text-zinc-600">Laden...</div>
                    ) : outroTemplates.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-zinc-600">Keine Vorlagen</div>
                    ) : (
                      outroTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveOutroId(t.id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                            activeOutroId === t.id ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-900">{t.name}</span>
                            <span className="text-xs text-zinc-500">
                              {t.is_default ? "Standard" : ""}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void createTemplate("outro")}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  + Vorlage hinzufügen
                </button>
              </div>

              <div>
                <div className="space-y-3">
                  <RichTextEditor
                    value={activeOutro?.body_html ?? ""}
                    onChange={(html) => {
                      if (!activeOutro) return;
                      setOutroTemplates((prev) =>
                        prev.map((t) => (t.id === activeOutro.id ? { ...t, body_html: html } : t))
                      );
                    }}
                    rows={7}
                  />

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={Boolean(activeOutro?.is_default)}
                        onChange={(e) => {
                          if (!activeOutro) return;
                          void patchTemplate(activeOutro.id, { is_default: e.target.checked });
                        }}
                      />
                      Als Standard verwenden
                    </label>

                    {activeOutro ? (
                      <button
                        type="button"
                        onClick={() => void deleteTemplate(activeOutro.id, "outro")}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Löschen
                      </button>
                    ) : null}
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-zinc-700 pt-2">
                    <input
                      type="checkbox"
                      checked={retentionNotePrivate}
                      onChange={(e) => setRetentionNotePrivate(e.target.checked)}
                    />
                    Hinweis zur Aufbewahrungspflicht für Privatkunden anzeigen
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Unternehmensdetails</div>
          <div className="mt-1 text-sm text-zinc-600">
            Die eingegebenen Informationen werden zur Erstellung verschiedener Dokumente verwendet.
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">Anschrift</div>
            <div className="mt-3 grid gap-3">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Firmenname</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Straße</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Hausnummer</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Adresszusatz</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={addressExtra} onChange={(e) => setAddressExtra(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-zinc-600 mb-1">PLZ</div>
                  <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-zinc-600 mb-1">Stadt</div>
                  <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Steuernummer</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Umsatzsteuer-ID</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={vatId} onChange={(e) => setVatId(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">Bankverbindung</div>
            <div className="mt-3 grid gap-3">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Kontoinhaber</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">IBAN</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={iban} onChange={(e) => setIban(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">BIC</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={bic} onChange={(e) => setBic(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Name der Bank</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-zinc-900">Kontakt</div>
            <div className="mt-3 grid gap-3">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Webseite</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">E-Mail-Adresse</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Mobile Nummer</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Festnetznummer</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Rechtsform</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={legalForm} onChange={(e) => setLegalForm(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Inhaber/-in der Firma</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Registergericht</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={registerCourt} onChange={(e) => setRegisterCourt(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">HRB Nummer</div>
                <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={hbrNumber} onChange={(e) => setHbrNumber(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Logo</div>
            <div className="mt-1 text-sm text-zinc-600">
              Lade hier Dein Logo hoch. Es wird auf Deinen Dokumenten angezeigt (Rechnungen,
              Angebote, Arbeitsscheine).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Logo einblenden</div>
            <button
              type="button"
              onClick={() => setLogoEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                logoEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  logoEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Position</div>
                <div className="relative">
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as "left" | "right")}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="left">links</option>
                    <option value="right">rechts</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Größe</div>
                <div className="relative">
                  <select
                    value={logoSize}
                    onChange={(e) => setLogoSize(e.target.value as "small" | "medium" | "large")}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="small">klein</option>
                    <option value="medium">mittel</option>
                    <option value="large">groß</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Erneut hochladen
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadLogo(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="text-xs text-zinc-500">Aktuell: {logoSizeLabel}</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="h-64 rounded-lg bg-white relative overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className={`absolute top-6 ${
                    logoPosition === "right" ? "right-6" : "left-6"
                  } ${
                    logoSize === "small"
                      ? "h-10"
                      : logoSize === "medium"
                        ? "h-14"
                        : "h-20"
                  } object-contain`}
                />
              ) : (
                <div className="absolute top-6 right-6 text-xs text-zinc-400">(kein Logo)</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Absenderzeile</div>
            <div className="mt-1 text-sm text-zinc-600">
              Dein Firmenname und deine Adresse erscheinen in der Absenderzeile.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Absenderzeile anzeigen</div>
            <button
              type="button"
              onClick={() => setSenderLineEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                senderLineEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  senderLineEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Fußzeile</div>
            <div className="mt-1 text-sm text-zinc-600">
              Die Fußzeile wird am Ende deiner Dokumente angezeigt.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Fußzeile einblenden</div>
            <button
              type="button"
              onClick={() => setFooterEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                footerEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  footerEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setFooterMode("standard")}
              className={`px-3 py-1.5 text-sm ${
                footerMode === "standard" ? "bg-blue-600 text-white" : "text-zinc-700"
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setFooterMode("custom")}
              className={`px-3 py-1.5 text-sm ${
                footerMode === "custom" ? "bg-blue-600 text-white" : "text-zinc-700"
              }`}
            >
              Individuell
            </button>
          </div>

          {footerMode === "custom" ? (
            <div className="mt-4">
              <RichTextEditor value={footerCustomHtml} onChange={setFooterCustomHtml} rows={4} />
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-600">
              Verwende unsere Vorlage. Sie wird automatisch mit den Daten ausgefüllt, die Du oben
              eingegeben hast.
            </div>
          )}

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="h-28 rounded-lg bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
