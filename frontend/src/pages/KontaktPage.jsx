const content = [
  'Kontakt & Support (MVP)',
  'Support-E-Mail: support@office-eats.example',
  '',
  'Ansprechpartner: OfficeEats Support Team',
  '',
  'Supportzeiten (MVP):',
  'Mo–Fr 09:00–17:00 Uhr',
  '',
  'Für Supportanfragen bitte angeben:',
  'Benutzername / E-Mail',
  'Bestellnummer (falls vorhanden)',
  'Fehlerbeschreibung und Screenshot',
  '',
  'Hinweis:',
  '„In diesem MVP werden Anfragen nicht automatisch verarbeitet. Der Kontaktbereich dient zur Demonstration der Support-Funktion.“',
]

function KontaktPage() {
  return (
    <div className="legal-page">
      <h1>Kontakt – Mustertext</h1>
      <div className="legal-content">
        {content.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default KontaktPage
