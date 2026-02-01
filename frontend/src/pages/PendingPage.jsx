function PendingPage() {
  return (
    <div className="page">
      <h1>Warte auf Freischaltung</h1>
      <p>
        Dein Konto muss noch durch eine Führungskraft freigeschaltet werden.
      </p>
      <div className="card">
        <div className="muted">
          Sobald dein Status auf "ACTIVE" gesetzt wurde, kannst du Bestellungen
          auslösen.
        </div>
      </div>
    </div>
  )
}

export default PendingPage
