const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="nav-icon" aria-hidden="true">{children}</span>
);

const jobs = [
  {
    id: "ZA-1842",
    route: "Linz → Wien",
    meta: "8 Paletten · 4,2 t",
    revenue: "1.290 €",
    distance: "+148 km",
    time: "+4:10 h",
    contribution: "+680 €",
    verdict: "Lohnt sich",
    tone: "positive",
  },
  {
    id: "ZA-1838",
    route: "München → Rosenheim",
    meta: "3 Paletten · 1,4 t",
    revenue: "620 €",
    distance: "+74 km",
    time: "+2:20 h",
    contribution: "+286 €",
    verdict: "Lohnt sich",
    tone: "positive",
  },
  {
    id: "ZA-1846",
    route: "Regensburg → Passau",
    meta: "12 Paletten · 7,8 t",
    revenue: "890 €",
    distance: "+231 km",
    time: "+5:45 h",
    contribution: "−84 €",
    verdict: "Ablehnen",
    tone: "negative",
  },
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <a className="brand" href="#" aria-label="TourPilot Startseite">
            <span className="brand-mark" aria-hidden="true">
              <span>TP</span>
            </span>
            <span className="brand-copy">
              <strong>TourPilot</strong>
              <small>Disposition & Kalkulation</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="Hauptnavigation">
            <p className="nav-label">Arbeitsbereich</p>
            <a className="nav-link active" href="#cockpit">
              <Icon>⌂</Icon>
              Cockpit
            </a>
            <a className="nav-link" href="#auftraege">
              <Icon>□</Icon>
              Aufträge
              <span className="nav-count">6</span>
            </a>
            <a className="nav-link" href="#touren">
              <Icon>↗</Icon>
              Touren
            </a>
            <a className="nav-link" href="#kalkulation">
              <Icon>∑</Icon>
              Kalkulation
            </a>

            <p className="nav-label second">Verwaltung</p>
            <a className="nav-link" href="#fuhrpark">
              <Icon>▣</Icon>
              Fuhrpark
            </a>
            <a className="nav-link" href="#einstellungen">
              <Icon>⚙</Icon>
              Einstellungen
            </a>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="fleet-status">
            <div className="fleet-status-head">
              <span>Fuhrpark heute</span>
              <strong>3 / 4</strong>
            </div>
            <div className="fleet-track"><span /></div>
            <p>3 Fahrzeuge im Einsatz</p>
          </div>
          <button className="profile-button" type="button">
            <span className="avatar">GM</span>
            <span>
              <strong>Disposition</strong>
              <small>Administrator</small>
            </span>
            <span className="profile-more" aria-hidden="true">•••</span>
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark"><span>TP</span></span>
            <strong>TourPilot</strong>
          </div>
          <div className="topbar-date">
            <span className="eyebrow">Dienstag</span>
            <span>04. August 2026</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Benachrichtigungen">
              <span aria-hidden="true">◌</span>
              <i />
            </button>
            <button className="primary-button" type="button">
              <span aria-hidden="true">＋</span>
              Neuer Auftrag
            </button>
          </div>
        </header>

        <div className="content" id="cockpit">
          <section className="page-intro">
            <div>
              <p className="section-kicker">Live-Disposition</p>
              <h1>Touren-Cockpit</h1>
              <p>Aufträge vergleichen, Zusatzkosten erkennen und profitabel entscheiden.</p>
            </div>
            <div className="sync-pill"><span /> Kalkulation aktuell</div>
          </section>

          <section className="metric-grid" aria-label="Kennzahlen heute">
            <article className="metric-card">
              <div className="metric-top"><span className="metric-symbol blue">↗</span><span className="trend up">+8,4 %</span></div>
              <p>Geplanter Umsatz</p>
              <strong>8.740 €</strong>
              <small>aus 6 Aufträgen</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-symbol amber">∑</span><span className="trend neutral">Heute</span></div>
              <p>Gesamtkosten</p>
              <strong>5.486 €</strong>
              <small>inkl. Personal & Maut</small>
            </article>
            <article className="metric-card emphasized">
              <div className="metric-top"><span className="metric-symbol green">€</span><span className="trend up">+12,1 %</span></div>
              <p>Deckungsbeitrag</p>
              <strong>3.254 €</strong>
              <small>37,2 % Marge</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-symbol violet">◷</span><span className="trend neutral">Puffer</span></div>
              <p>Freie Tourzeit</p>
              <strong>7:35 h</strong>
              <small>auf 2 aktiven Touren</small>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="tour-card" id="touren">
              <div className="card-header">
                <div>
                  <div className="header-line">
                    <span className="status-badge"><i /> Unterwegs</span>
                    <span className="tour-id">AT-0826</span>
                  </div>
                  <h2>Hamburg → Salzburg</h2>
                  <p>MAN TGX · HH–LB 204 · Fahrer: M. Boateng</p>
                </div>
                <button className="text-button" type="button">Tour öffnen <span>→</span></button>
              </div>

              <div className="route-map" aria-label="Geplanter Tourverlauf">
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="route-stop start">
                  <span className="map-pin dark">A</span>
                  <div><strong>Hamburg</strong><small>Start · 18:30</small></div>
                </div>
                <div className="route-stop middle">
                  <span className="map-pin light">1</span>
                  <div><strong>Nürnberg</strong><small>Zwischenstopp · 05:40</small></div>
                </div>
                <div className="route-stop end">
                  <span className="map-pin green">B</span>
                  <div><strong>Salzburg</strong><small>Ziel · 13:45</small></div>
                </div>
                <span className="truck-marker" aria-hidden="true">▰</span>
                <div className="map-caption"><span>▱</span> 934 km <i /> ca. 12:55 h</div>
              </div>

              <div className="tour-financials">
                <div><span>Auftragswert</span><strong>3.480 €</strong></div>
                <div><span>Tourkosten</span><strong>2.187 €</strong></div>
                <div className="positive-number"><span>Deckungsbeitrag</span><strong>1.293 €</strong></div>
                <div><span>Marge</span><strong>37,2 %</strong></div>
              </div>
            </article>

            <aside className="opportunity-card" id="kalkulation">
              <div className="opportunity-icon">＋</div>
              <p className="section-kicker light">Beste Gelegenheit</p>
              <h2>Ein Zusatzauftrag passt in deine Tour.</h2>
              <p className="opportunity-copy">Der Auftrag Linz → Wien nutzt deinen Zeitpuffer und erhöht den Tourgewinn deutlich.</p>

              <div className="opportunity-route">
                <div><span className="mini-pin">A</span><p><small>Abholung</small><strong>Linz</strong></p></div>
                <span className="dotted-line" />
                <div><span className="mini-pin accent">B</span><p><small>Zustellung</small><strong>Wien</strong></p></div>
              </div>

              <dl className="opportunity-numbers">
                <div><dt>Mehrumsatz</dt><dd>+1.290 €</dd></div>
                <div><dt>Zusatzkosten</dt><dd>−610 €</dd></div>
                <div className="result-row"><dt>Mehrgewinn</dt><dd>+680 €</dd></div>
              </dl>
              <button className="light-button" type="button">Auftrag prüfen <span>→</span></button>
              <p className="confidence"><span>✓</span> Empfehlung mit hoher Wirtschaftlichkeit</p>
            </aside>
          </section>

          <section className="lower-grid" id="auftraege">
            <article className="orders-card">
              <div className="card-header compact">
                <div>
                  <p className="section-kicker">Marktangebote</p>
                  <h2>Aufträge im Tourkorridor</h2>
                </div>
                <button className="filter-button" type="button">Alle anzeigen <span>⌄</span></button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Auftrag</th><th>Umsatz</th><th>Umweg</th><th>Zeit</th><th>Mehrgewinn</th><th>Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td><div className="route-cell"><span>{job.id}</span><strong>{job.route}</strong><small>{job.meta}</small></div></td>
                        <td className="strong-cell">{job.revenue}</td>
                        <td>{job.distance}</td>
                        <td>{job.time}</td>
                        <td className={job.tone === "positive" ? "gain" : "loss"}>{job.contribution}</td>
                        <td><span className={`verdict ${job.tone}`}>{job.verdict}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="cost-card">
              <div className="card-header compact">
                <div>
                  <p className="section-kicker">Kostenmix</p>
                  <h2>Tourkosten AT-0826</h2>
                </div>
                <span className="total-cost">2.187 €</span>
              </div>
              <div className="cost-bars">
                <div className="cost-row"><div><span><i className="dot fuel" />Diesel</span><strong>948 €</strong></div><div className="bar"><span className="fuel-bar" /></div><small>43,3 %</small></div>
                <div className="cost-row"><div><span><i className="dot staff" />Personal</span><strong>742 €</strong></div><div className="bar"><span className="staff-bar" /></div><small>33,9 %</small></div>
                <div className="cost-row"><div><span><i className="dot toll" />Maut & Strecke</span><strong>381 €</strong></div><div className="bar"><span className="toll-bar" /></div><small>17,4 %</small></div>
                <div className="cost-row"><div><span><i className="dot material" />Material</span><strong>116 €</strong></div><div className="bar"><span className="material-bar" /></div><small>5,4 %</small></div>
              </div>
              <div className="cost-note"><span>i</span><p><strong>Kalkulationsbasis</strong><br />32 l / 100 km · Diesel 1,78 €/l · Personalkostensatz 29 €/h</p></div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
