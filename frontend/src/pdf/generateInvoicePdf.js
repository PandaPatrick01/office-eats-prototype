import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatCurrency = (value) => `€${Number(value ?? 0).toFixed(2)}`

function generateInvoicePdf(invoice) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.text('OfficeEats – Rechnung', 14, 20)

  doc.setFontSize(11)
  doc.text(`Rechnung: ${invoice.invoiceNumber ?? ''}`, 14, 30)
  doc.text(`Datum: ${invoice.createdAt?.slice(0, 10) ?? ''}`, 14, 36)

  const recipientLines = [
    'Empfänger:',
    invoice.userName ?? '',
    invoice.userEmail ?? '',
  ].filter(Boolean)
  doc.text(recipientLines, 14, 48)

  doc.text(
    `Restaurant: ${invoice.restaurantName ?? `#${invoice.restaurantId ?? ''}`}`,
    14,
    64,
  )

  const tableBody = (invoice.lines ?? []).map((line) => [
    line.name,
    String(line.qty),
    formatCurrency(line.unitPrice),
    formatCurrency(line.lineTotal),
  ])

  autoTable(doc, {
    startY: 72,
    head: [['Position', 'Menge', 'Einzelpreis', 'Summe']],
    body: tableBody,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  const summaryStart = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  let cursorY = summaryStart
  if (invoice.rawSubtotal != null) {
    doc.text(
      `Original Subtotal: ${formatCurrency(invoice.rawSubtotal)}`,
      14,
      cursorY,
    )
    cursorY += 6
    doc.text(
      `Zuschuss (${Number(invoice.subsidyPercent ?? 0).toFixed(0)}%): -${formatCurrency(
        invoice.subsidyAmount,
      )}`,
      14,
      cursorY,
    )
    cursorY += 6
  }
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 14, cursorY)
  cursorY += 6
  doc.text(
    `MwSt (${Math.round((invoice.taxRate ?? 0) * 100)}%): ${formatCurrency(
      invoice.taxAmount,
    )}`,
    14,
    cursorY,
  )
  cursorY += 6
  doc.text(`Total: ${formatCurrency(invoice.total)}`, 14, cursorY)

  doc.setFontSize(9)
  doc.text(
    'Dies ist eine automatisch generierte Rechnung (MVP).',
    14,
    cursorY + 12,
  )

  const filename = `invoice_${invoice.invoiceNumber ?? invoice.id}.pdf`
  doc.save(filename)

  const footer = 'OfficeEats MVP'
  doc.setFontSize(9)
  doc.text(footer, pageWidth - 14 - doc.getTextWidth(footer), 290)
}

export default generateInvoicePdf
