const content = [
  'Allgemeine Geschäftsbedingungen (MVP)',
  '',
  'Geltungsbereich: Nutzung der OfficeEats-Anwendung zur Kantinenbestellung innerhalb eines Unternehmens.',
  'Bestellung: Bestellungen sind verbindlich, sobald sie bestätigt wurden.',
  'Stornierung: Stornierungen sind nur bis zur Annahme durch die Küche möglich (MVP-Simulation).',
  'Zahlung/Abrechnung: Die Abrechnung erfolgt über Rechnungen und Monatsabrechnungen (MVP).',
  'Verfügbarkeit: Restaurants und Gerichte können abhängig von Verfügbarkeit variieren.',
  'Haftung: Der MVP stellt keine produktive Leistung dar; Inhalte dienen der Demonstration.',
]

function AgbPage() {
  return (
    <div className="legal-page">
      <h1>AGB – Mustertext</h1>
      <div className="legal-content">
        {content.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default AgbPage
