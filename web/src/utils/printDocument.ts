export interface PrintItem {
  name: string;
  quantity: number | string;
  unit?: string;
  estimatedCost?: number | string;
  notes?: string | null;
}

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  projectName?: string;
  requestedBy?: string;
  date?: string;
  status?: string;
  purpose?: string;
  notes?: string | null;
  items?: PrintItem[];
  total?: number | string;
  extraFields?: { label: string; value: string }[];
}

export function printDocument(opts: PrintDocumentOptions) {
  const itemRows = (opts.items ?? [])
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity} ${item.unit ?? ''}</td>
        <td>${item.estimatedCost != null ? '$' + Number(item.estimatedCost).toLocaleString() : '-'}</td>
        <td>${item.notes ?? ''}</td>
      </tr>`,
    )
    .join('');

  const extraRows = (opts.extraFields ?? [])
    .map((f) => `<tr><td><strong>${f.label}</strong></td><td colspan="3">${f.value}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${opts.title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #111; font-size: 13px; }
  .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { margin: 0 0 4px; font-size: 20px; color: #1d4ed8; }
  .header p { margin: 2px 0; color: #555; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
    background: #dcfce7; color: #166534; text-transform: capitalize; }
  .badge.pending { background: #fef9c3; color: #854d0e; }
  .badge.rejected { background: #fee2e2; color: #991b1b; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .meta div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; }
  .meta label { display: block; font-size: 10px; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: .5px; }
  .meta span { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #1d4ed8; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .total { text-align: right; font-size: 15px; font-weight: 700; margin-top: 12px; color: #1d4ed8; }
  .footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } button { display: none; } }
</style>
</head>
<body>
<div class="header">
  <h1>${opts.title}</h1>
  ${opts.subtitle ? `<p>${opts.subtitle}</p>` : ''}
  ${opts.status ? `<span class="badge ${opts.status}">${opts.status}</span>` : ''}
</div>
<div class="meta">
  ${opts.projectName ? `<div><label>Project</label><span>${opts.projectName}</span></div>` : ''}
  ${opts.requestedBy ? `<div><label>Requested By</label><span>${opts.requestedBy}</span></div>` : ''}
  ${opts.date ? `<div><label>Date</label><span>${opts.date}</span></div>` : ''}
  ${opts.purpose ? `<div><label>Purpose</label><span>${opts.purpose}</span></div>` : ''}
</div>
${opts.notes ? `<p style="font-size:12px;color:#555;margin-bottom:12px;"><strong>Notes:</strong> ${opts.notes}</p>` : ''}
${itemRows || extraRows ? `
<table>
  <thead><tr><th>Item / Field</th><th>Qty / Value</th><th>Est. Cost</th><th>Notes</th></tr></thead>
  <tbody>${itemRows}${extraRows}</tbody>
</table>` : ''}
${opts.total != null ? `<p class="total">Total: $${Number(opts.total).toLocaleString()}</p>` : ''}
<div class="footer">Project Milestone Management · Printed ${new Date().toLocaleString()}</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export async function shareDocument(opts: PrintDocumentOptions) {
  const lines: string[] = [
    opts.title,
    opts.subtitle ? opts.subtitle : '',
    opts.status ? `Status: ${opts.status}` : '',
    opts.projectName ? `Project: ${opts.projectName}` : '',
    opts.requestedBy ? `Requested by: ${opts.requestedBy}` : '',
    opts.date ? `Date: ${opts.date}` : '',
    opts.purpose ? `Purpose: ${opts.purpose}` : '',
    '',
    ...(opts.items ?? []).map(
      (i) => `• ${i.name} — ${i.quantity}${i.unit ? ' ' + i.unit : ''}${i.estimatedCost != null ? ' @ $' + Number(i.estimatedCost).toLocaleString() : ''}`,
    ),
    opts.total != null ? `\nTotal: $${Number(opts.total).toLocaleString()}` : '',
    opts.notes ? `\nNotes: ${opts.notes}` : '',
  ].filter(Boolean);

  const text = lines.join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text });
      return;
    } catch {
      /* fall through to copy */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch {
    printDocument(opts);
  }
}
