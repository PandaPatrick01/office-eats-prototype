import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatCurrency = (value) => `€${Number(value ?? 0).toFixed(2)}`

function generateMonthlyStatementPdf(statement) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('OfficeEats – Monatsabrechnung', 14, 20)

  doc.setFontSize(11)
  doc.text(`Abrechnung: ${statement.statementNumber ?? ''}`, 14, 30)
  doc.text(`Monat: ${statement.month ?? ''}`, 14, 36)

  const recipientLines = [
    'Empfänger:',
    statement.userName ?? '',
    statement.userEmail ?? '',
  ].filter(Boolean)
  doc.text(recipientLines, 14, 48)

  const tableBody = (statement.orders ?? []).map((order) => [
    order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-',
    order.restaurantName ?? '',
    String(order.orderId ?? ''),
    formatCurrency(order.total ?? 0),
  ])

  autoTable(doc, {
    startY: 70,
    head: [['Datum', 'Restaurant', 'Order', 'Betrag']],
    body: tableBody,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  const summaryStart = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.text(`Subtotal: ${formatCurrency(statement.subtotal)}`, 14, summaryStart)
  doc.text(
    `MwSt (${Math.round((statement.taxRate ?? 0) * 100)}%): ${formatCurrency(
      statement.taxAmount,
    )}`,
    14,
    summaryStart + 6,
  )
  doc.text(`Total: ${formatCurrency(statement.total)}`, 14, summaryStart + 12)

  doc.setFontSize(9)
  doc.text(
    'Dies ist eine automatisch generierte Monatsabrechnung (MVP).',
    14,
    summaryStart + 24,
  )

  const filename = `monthly_${statement.statementNumber ?? statement.id}.pdf`
  doc.save(filename)
}

export default generateMonthlyStatementPdf
