import type { ProductionOrder } from "@/types";

export function printProductionOrder(order: ProductionOrder, locale: string = "pt-BR") {
  const isPT = locale === "pt-BR";

  const labels = {
    title: isPT ? "ORDEM DE PRODUÇÃO" : "PRODUCTION ORDER",
    orderNumber: isPT ? "Número da Ordem" : "Order Number",
    status: isPT ? "Status" : "Status",
    priority: isPT ? "Prioridade" : "Priority",
    product: isPT ? "Produto" : "Product",
    customer: isPT ? "Cliente" : "Customer",
    quantity: isPT ? "Quantidade" : "Quantity",
    device: isPT ? "Dispositivo" : "Device",
    createdAt: isPT ? "Data de Criação" : "Created At",
    startedAt: isPT ? "Data de Início" : "Started At",
    completedAt: isPT ? "Data de Conclusão" : "Completed At",
    plannedDelivery: isPT ? "Previsão de Entrega" : "Planned Delivery",
    workInstructions: isPT ? "Instruções de Trabalho" : "Work Instructions",
    qualityNotes: isPT ? "Notas de Qualidade" : "Quality Notes",
    signature: isPT ? "Assinatura / Responsável" : "Signature / Responsible",
    receivedBy: isPT ? "Recebido por" : "Received by",
    date: isPT ? "Data" : "Date",
    observations: isPT ? "Observações" : "Observations",
    generatedAt: isPT ? "Gerado em" : "Generated at",
  };

  const statusMap: Record<string, string> = {
    planned: isPT ? "Planejada" : "Planned",
    in_progress: isPT ? "Em Andamento" : "In Progress",
    completed: isPT ? "Concluída" : "Completed",
    cancelled: isPT ? "Cancelada" : "Cancelled",
  };

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const field = (label: string, value?: string | number | null) => `
    <div class="field">
      <div class="field-label">${label}</div>
      <div class="field-value">${value ?? ""}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8"/>
  <title>${labels.title} #${order.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #111;
      padding: 20mm 20mm 15mm 20mm;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 20pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .header-subtitle {
      font-size: 9pt;
      color: #555;
      margin-top: 2px;
    }
    .order-number {
      text-align: right;
      font-size: 14pt;
      font-weight: bold;
    }
    .order-number span {
      display: block;
      font-size: 9pt;
      font-weight: normal;
      color: #555;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }

    /* ── Fields grid ── */
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
    }
    .fields-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 7.5pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #777;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 10.5pt;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3px;
      min-height: 20px;
    }

    /* ── Text areas (instructions, notes) ── */
    .text-area {
      border: 1px solid #bbb;
      border-radius: 3px;
      padding: 8px;
      min-height: 52px;
      font-size: 10pt;
      white-space: pre-wrap;
    }
    .text-area-empty {
      color: #ccc;
      font-style: italic;
    }

    /* ── Signature row ── */
    .signature-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 32px;
    }
    .signature-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .signature-line {
      width: 100%;
      border-top: 1.5px solid #333;
      margin-bottom: 4px;
    }
    .signature-label {
      font-size: 8pt;
      color: #555;
      text-align: center;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
      font-size: 7.5pt;
      color: #888;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { padding: 12mm 14mm 10mm 14mm; }
      @page { margin: 0; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="header-title">${labels.title}</div>
    </div>
    <div class="order-number">
      <span>${labels.orderNumber}</span>
      #${order.id}
    </div>
  </div>

  <!-- Identificação -->
  <div class="section">
    <div class="section-title">${isPT ? "Identificação" : "Identification"}</div>
    <div class="fields-grid">
      ${field(labels.product, order.product?.name ?? order.product_id)}
      ${field(labels.customer, order.customer?.name ?? "")}
      ${field(labels.quantity, order.quantity)}
    </div>
  </div>

  <!-- Datas -->
  <div class="section">
    <div class="section-title">${isPT ? "Datas" : "Dates"}</div>
    <div class="fields-grid">
      ${field(labels.createdAt, fmt(order.created_at))}
      ${field(labels.plannedDelivery, fmt(order.planned_delivery_date))}
      ${field(labels.startedAt, fmt(order.started_at))}
      ${field(labels.completedAt, fmt(order.completed_at))}
    </div>
  </div>

  <!-- Instruções -->
  <div class="section">
    <div class="section-title">${labels.workInstructions}</div>
    <div class="text-area ${!order.work_instructions ? "text-area-empty" : ""}">
      ${order.work_instructions ?? (isPT ? "(em branco)" : "(blank)")}
    </div>
  </div>

  <!-- Qualidade -->
  <div class="section">
    <div class="section-title">${labels.qualityNotes}</div>
    <div class="text-area ${!order.quality_notes ? "text-area-empty" : ""}">
      ${order.quality_notes ?? (isPT ? "(em branco)" : "(blank)")}
    </div>
  </div>

  <!-- Observações (para preenchimento manual) -->
  <div class="section">
    <div class="section-title">${labels.observations}</div>
    <div class="text-area" style="min-height: 64px;"></div>
  </div>

  <!-- Assinaturas -->
  <div class="signature-row">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">${labels.signature}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">${labels.receivedBy}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">${labels.date}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>${labels.title} #${order.id}</span>
  </div>

  <script>
    window.onload = () => { window.print(); }
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
