const content = [
  'OfficeEats – Digitale Kantine (MVP-Prototyp)',
  '',
  'Verantwortlich für den Inhalt:',
  'OfficeEats Projektgruppe (MVP)',
  'Musterstraße 1',
  '12345 Musterstadt',
  'Deutschland',
  '',
  'Kontakt:',
  'E-Mail: support@office-eats.example',
  '',
  'Telefon: +49 000 000000',
  '',
  'Hinweis (MVP):',
  '„Diese Anwendung ist ein Minimal Viable Prototype (MVP) im Rahmen einer Prüfungsleistung. Es handelt sich nicht um ein produktives System. Angaben dienen als Platzhalter.“',
]

function ImpressumPage() {
  return (
    <div className="legal-page">
      <h1>Impressum – Mustertext</h1>
      <div className="legal-content">
        {content.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default ImpressumPage
