import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {},
      },
    }
  );

  // Fetch offer data
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select(`
      *,
      customers(*),
      projects(*, project_locations(*)),
      groups:offer_groups(*, offer_items(*))
    `)
    .eq("id", id)
    .single();

  if (offerError || !offer) {
    return new NextResponse("Offer not found", { status: 404 });
  }

  // Fetch text layout settings
  const { data: layout } = await supabase
    .from("text_layout_settings")
    .select("*")
    .single();

  // Generate simple HTML for PDF preview
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    h1 { font-size: 24px; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${offer.title || offer.name || "Angebot"}</h1>
  
  <div class="section">
    <strong>Angebotsnummer:</strong> ${offer.offer_number || "—"}<br>
    <strong>Datum:</strong> ${new Date(offer.offer_date).toLocaleDateString("de-DE")}<br>
  </div>

  ${offer.intro_salutation ? `<div class="section">${offer.intro_salutation}</div>` : ""}
  ${offer.intro_body_html ? `<div class="section">${offer.intro_body_html}</div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Pos.</th>
        <th>Beschreibung</th>
        <th>Menge</th>
        <th>Einheit</th>
        <th>Einzelpreis</th>
        <th>Gesamt</th>
      </tr>
    </thead>
    <tbody>
      ${(offer.groups || [])
        .sort((a: any, b: any) => a.index - b.index)
        .map((group: any) => `
          <tr style="background-color: #f9f9f9;">
            <td colspan="6"><strong>${group.title}</strong></td>
          </tr>
          ${(group.offer_items || [])
            .map((item: any) => `
              <tr>
                <td>${item.position_index}</td>
                <td>${item.name}${item.description ? `<br><small>${item.description}</small>` : ""}</td>
                <td>${item.qty}</td>
                <td>${item.unit}</td>
                <td>${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(item.unit_price)}</td>
                <td>${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(item.line_total)}</td>
              </tr>
            `)
            .join("")}
        `)
        .join("")}
    </tbody>
  </table>

  <div class="section" style="margin-top: 30px; text-align: right;">
    <strong>Gesamtsumme netto:</strong> ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(offer.total_net || 0)}<br>
    <strong>MwSt. (${offer.tax_rate || 19}%):</strong> ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(offer.total_tax || 0)}<br>
    <strong>Gesamtsumme brutto:</strong> ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(offer.total_gross || 0)}
  </div>

  ${offer.outro_body_html ? `<div class="section">${offer.outro_body_html}</div>` : ""}
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
