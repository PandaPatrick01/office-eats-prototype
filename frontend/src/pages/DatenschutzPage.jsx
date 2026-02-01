const content = [
  'Datenschutzerklärung (MVP)',
  'Zweck der Verarbeitung:',
  '',
  'Registrierung und Freischaltung von Nutzerkonten',
  'Durchführung von Bestellungen und Sammelbestellungen',
  'Erstellung von Rechnungen und Monatsabrechnungen',
  '',
  'Verarbeitete Daten (MVP):',
  '',
  'Name, E-Mail, Rolle (Mitarbeiter/Führungskraft), Nutzerstatus',
  'Bestelldaten (Restaurant, Gerichte, Zeitfenster, Status)',
  'Rechnungsdaten (Rechnungsnummer, Positionen, Beträge)',
  '',
  'Rechtsgrundlage (MVP-Hinweis):',
  '„Im MVP erfolgt keine produktive Datenverarbeitung. Die Inhalte dienen als Platzhalter und orientieren sich an typischen Anforderungen.“',
  '',
  'Speicherdauer:',
  '„Daten werden im MVP in einer Mock-Datenquelle gespeichert (JSON-Server) und können jederzeit zurückgesetzt werden.“',
  '',
  'Betroffenenrechte (Kurzüberblick):',
  'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch',
  'Kontakt: support@office-eats.example',
]

function DatenschutzPage() {
  return (
    <div className="legal-page">
      <h1>Datenschutzerklärung – Mustertext</h1>
      <div className="legal-content">
        {content.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default DatenschutzPage
