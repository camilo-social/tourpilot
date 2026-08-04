"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Job = {
  id: string;
  pickup: string;
  delivery: string;
  pallets: number;
  weight: number;
  revenue: number;
  extraKm: number;
  extraHours: number;
  toll: number;
  material: number;
  other: number;
};

type Assumptions = {
  consumption: number;
  fuelPrice: number;
  staffRate: number;
  vehicleRate: number;
  bufferHours: number;
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  consumption: 32,
  fuelPrice: 1.78,
  staffRate: 29,
  vehicleRate: 0.85,
  bufferHours: 7.58,
};

const INITIAL_JOBS: Job[] = [
  {
    id: "ZA-1842",
    pickup: "Linz",
    delivery: "Wien",
    pallets: 8,
    weight: 4.2,
    revenue: 1290,
    extraKm: 148,
    extraHours: 4.17,
    toll: 110,
    material: 35,
    other: 133,
  },
  {
    id: "ZA-1838",
    pickup: "München",
    delivery: "Rosenheim",
    pallets: 3,
    weight: 1.4,
    revenue: 620,
    extraKm: 74,
    extraHours: 2.33,
    toll: 25,
    material: 10,
    other: 126,
  },
  {
    id: "ZA-1846",
    pickup: "Regensburg",
    delivery: "Passau",
    pallets: 12,
    weight: 7.8,
    revenue: 890,
    extraKm: 231,
    extraHours: 5.75,
    toll: 155,
    material: 45,
    other: 279,
  },
];

const BASE_METRICS = {
  revenue: 8740,
  cost: 5486,
  contribution: 3254,
  orders: 6,
  tourRevenue: 3480,
  tourCost: 2187,
};

const NEW_JOB_TEMPLATE: Job = {
  id: "ZA-NEU",
  pickup: "München",
  delivery: "Innsbruck",
  pallets: 6,
  weight: 3.2,
  revenue: 980,
  extraKm: 122,
  extraHours: 3.5,
  toll: 65,
  material: 25,
  other: 60,
};

const formatCurrency = (value: number) =>
  `${Math.round(Math.abs(value)).toLocaleString("de-DE")} €`;

const formatSignedCurrency = (value: number) =>
  `${value >= 0 ? "+" : "−"}${formatCurrency(value)}`;

const formatDuration = (hours: number) => {
  const totalMinutes = Math.round(Math.max(0, hours) * 60);
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${whole}:${String(minutes).padStart(2, "0")} h`;
};

const calculateJob = (job: Job, assumptions: Assumptions) => {
  const fuel = (job.extraKm / 100) * assumptions.consumption * assumptions.fuelPrice;
  const staff = job.extraHours * assumptions.staffRate;
  const vehicle = job.extraKm * assumptions.vehicleRate;
  const total = fuel + staff + vehicle + job.toll + job.material + job.other;
  const contribution = job.revenue - total;
  const margin = job.revenue > 0 ? (contribution / job.revenue) * 100 : 0;
  const timeRemaining = assumptions.bufferHours - job.extraHours;
  const verdict =
    timeRemaining < 0 || contribution <= 0
      ? "Ablehnen"
      : margin >= 20
        ? "Lohnt sich"
        : "Manuell prüfen";
  const tone = verdict === "Lohnt sich" ? "positive" : verdict === "Ablehnen" ? "negative" : "warning";

  return { fuel, staff, vehicle, total, contribution, margin, timeRemaining, verdict, tone };
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="nav-icon" aria-hidden="true">{children}</span>
);

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [draft, setDraft] = useState<Job>(INITIAL_JOBS[0]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("tourpilot-state-v1");
        if (stored) {
          const parsed = JSON.parse(stored) as {
            jobs?: Job[];
            acceptedIds?: string[];
            assumptions?: Assumptions;
          };
          if (parsed.jobs?.length) setJobs(parsed.jobs);
          if (parsed.acceptedIds) setAcceptedIds(parsed.acceptedIds);
          if (parsed.assumptions) setAssumptions(parsed.assumptions);
        }
      } catch {
        // A blocked or invalid local cache should never block the calculator.
      }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(
      "tourpilot-state-v1",
      JSON.stringify({ jobs, acceptedIds, assumptions }),
    );
  }, [jobs, acceptedIds, assumptions]);

  useEffect(() => {
    if (!calculatorOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCalculatorOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("drawer-open");
    };
  }, [calculatorOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const evaluatedJobs = useMemo(
    () => jobs.map((job) => ({ ...job, evaluation: calculateJob(job, assumptions) })),
    [jobs, assumptions],
  );
  const acceptedJobs = evaluatedJobs.filter((job) => acceptedIds.includes(job.id));
  const acceptedRevenue = acceptedJobs.reduce((sum, job) => sum + job.revenue, 0);
  const acceptedCost = acceptedJobs.reduce((sum, job) => sum + job.evaluation.total, 0);
  const acceptedContribution = acceptedJobs.reduce((sum, job) => sum + job.evaluation.contribution, 0);
  const usedBuffer = acceptedJobs.reduce((sum, job) => sum + job.extraHours, 0);
  const bestJob = evaluatedJobs
    .filter((job) => !acceptedIds.includes(job.id) && job.evaluation.verdict === "Lohnt sich")
    .sort((a, b) => b.evaluation.contribution - a.evaluation.contribution)[0];
  const draftResult = useMemo(() => calculateJob(draft, assumptions), [draft, assumptions]);
  const totalRevenue = BASE_METRICS.revenue + acceptedRevenue;
  const totalCost = BASE_METRICS.cost + acceptedCost;
  const totalContribution = BASE_METRICS.contribution + acceptedContribution;
  const totalMargin = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;
  const tourRevenue = BASE_METRICS.tourRevenue + acceptedRevenue;
  const tourCost = BASE_METRICS.tourCost + acceptedCost;
  const tourContribution = tourRevenue - tourCost;
  const tourMargin = tourRevenue > 0 ? (tourContribution / tourRevenue) * 100 : 0;

  const openCalculator = (job: Job) => {
    setDraft({ ...job });
    setCalculatorOpen(true);
  };

  const openNewJob = () => {
    setDraft({ ...NEW_JOB_TEMPLATE });
    setCalculatorOpen(true);
  };

  const updateJobText = (key: "pickup" | "delivery", value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const updateJobNumber = (key: Exclude<keyof Job, "id" | "pickup" | "delivery">, value: string) =>
    setDraft((current) => ({ ...current, [key]: Number(value) || 0 }));

  const updateAssumption = (key: keyof Assumptions, value: string) =>
    setAssumptions((current) => ({ ...current, [key]: Number(value) || 0 }));

  const persistDraft = () => {
    let savedId = draft.id;
    if (savedId === "ZA-NEU") savedId = `ZA-${1847 + jobs.length}`;
    const savedDraft = { ...draft, id: savedId };
    setJobs((current) => {
      const exists = current.some((job) => job.id === savedId);
      return exists
        ? current.map((job) => (job.id === savedId ? savedDraft : job))
        : [...current, savedDraft];
    });
    setDraft(savedDraft);
    setToast(`${savedId} wurde zur Vergleichsliste hinzugefügt.`);
    return savedId;
  };

  const acceptDraft = () => {
    const savedId = persistDraft();
    if (!acceptedIds.includes(savedId)) {
      setAcceptedIds((current) => [...current, savedId]);
      setToast(`${savedId} wurde in die Tour AT-0826 übernommen.`);
    }
    setCalculatorOpen(false);
  };

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
              <span className="nav-count">{BASE_METRICS.orders + acceptedIds.length}</span>
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
            <button className="primary-button" type="button" onClick={openNewJob}>
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
              <strong>{formatCurrency(totalRevenue)}</strong>
              <small>aus {BASE_METRICS.orders + acceptedIds.length} Aufträgen</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-symbol amber">∑</span><span className="trend neutral">Heute</span></div>
              <p>Gesamtkosten</p>
              <strong>{formatCurrency(totalCost)}</strong>
              <small>inkl. Personal & Maut</small>
            </article>
            <article className="metric-card emphasized">
              <div className="metric-top"><span className="metric-symbol green">€</span><span className="trend up">+12,1 %</span></div>
              <p>Deckungsbeitrag</p>
              <strong>{formatCurrency(totalContribution)}</strong>
              <small>{totalMargin.toLocaleString("de-DE", { maximumFractionDigits: 1 })} % Marge</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-symbol violet">◷</span><span className="trend neutral">Puffer</span></div>
              <p>Freie Tourzeit</p>
              <strong>{formatDuration(assumptions.bufferHours - usedBuffer)}</strong>
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
                <div><span>Auftragswert</span><strong>{formatCurrency(tourRevenue)}</strong></div>
                <div><span>Tourkosten</span><strong>{formatCurrency(tourCost)}</strong></div>
                <div className="positive-number"><span>Deckungsbeitrag</span><strong>{formatCurrency(tourContribution)}</strong></div>
                <div><span>Marge</span><strong>{tourMargin.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</strong></div>
              </div>
            </article>

            <aside className="opportunity-card" id="kalkulation">
              <div className="opportunity-icon">＋</div>
              {bestJob ? (
                <>
                  <p className="section-kicker light">Beste Gelegenheit</p>
                  <h2>Ein Zusatzauftrag passt in deine Tour.</h2>
                  <p className="opportunity-copy">Der Auftrag {bestJob.pickup} → {bestJob.delivery} nutzt deinen Zeitpuffer und erhöht den Tourgewinn deutlich.</p>

                  <div className="opportunity-route">
                    <div><span className="mini-pin">A</span><p><small>Abholung</small><strong>{bestJob.pickup}</strong></p></div>
                    <span className="dotted-line" />
                    <div><span className="mini-pin accent">B</span><p><small>Zustellung</small><strong>{bestJob.delivery}</strong></p></div>
                  </div>

                  <dl className="opportunity-numbers">
                    <div><dt>Mehrumsatz</dt><dd>+{formatCurrency(bestJob.revenue)}</dd></div>
                    <div><dt>Zusatzkosten</dt><dd>−{formatCurrency(bestJob.evaluation.total)}</dd></div>
                    <div className="result-row"><dt>Mehrgewinn</dt><dd>{formatSignedCurrency(bestJob.evaluation.contribution)}</dd></div>
                  </dl>
                  <button className="light-button" type="button" onClick={() => openCalculator(bestJob)}>Auftrag prüfen <span>→</span></button>
                  <p className="confidence"><span>✓</span> Empfehlung mit hoher Wirtschaftlichkeit</p>
                </>
              ) : (
                <div className="empty-opportunity">
                  <p className="section-kicker light">Tour optimiert</p>
                  <h2>Alle wirtschaftlichen Angebote sind eingeplant.</h2>
                  <p className="opportunity-copy">Prüfe ein neues Angebot oder erhöhe den verfügbaren Zeitpuffer für weitere Optionen.</p>
                  <button className="light-button" type="button" onClick={openNewJob}>Neues Angebot rechnen <span>→</span></button>
                </div>
              )}
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
                    {evaluatedJobs.map((job) => (
                      <tr key={job.id}>
                        <td><div className="route-cell"><span>{job.id}</span><strong>{job.pickup} → {job.delivery}</strong><small>{job.pallets} Paletten · {job.weight.toLocaleString("de-DE")} t</small></div></td>
                        <td className="strong-cell">{formatCurrency(job.revenue)}</td>
                        <td>+{job.extraKm.toLocaleString("de-DE")} km</td>
                        <td>+{formatDuration(job.extraHours)}</td>
                        <td className={job.evaluation.contribution >= 0 ? "gain" : "loss"}>{formatSignedCurrency(job.evaluation.contribution)}</td>
                        <td>
                          <button
                            className={`verdict ${acceptedIds.includes(job.id) ? "accepted" : job.evaluation.tone}`}
                            type="button"
                            onClick={() => openCalculator(job)}
                          >
                            {acceptedIds.includes(job.id) ? "Eingeplant" : job.evaluation.verdict}
                          </button>
                        </td>
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
              <div className="cost-note"><span>i</span><p><strong>Kalkulationsbasis</strong><br />{assumptions.consumption.toLocaleString("de-DE")} l / 100 km · Diesel {assumptions.fuelPrice.toLocaleString("de-DE")} €/l · Personal {formatCurrency(assumptions.staffRate)}/h</p></div>
            </article>
          </section>
        </div>
      </section>
      {calculatorOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCalculatorOpen(false); }}>
          <aside className="calculator-drawer" role="dialog" aria-modal="true" aria-labelledby="calculator-title">
            <header className="drawer-header">
              <div>
                <p className="section-kicker">Live-Kalkulation</p>
                <h2 id="calculator-title">Zusatzauftrag prüfen</h2>
                <p>Alle Werte wirken sich sofort auf die Empfehlung aus.</p>
              </div>
              <button className="drawer-close" type="button" aria-label="Kalkulation schließen" onClick={() => setCalculatorOpen(false)}>×</button>
            </header>

            <div className="drawer-content">
              <section className={`decision-card ${draftResult.tone}`}>
                <div className="decision-copy">
                  <span className="decision-label">Empfehlung</span>
                  <strong>{draftResult.verdict}</strong>
                  <small>{draftResult.timeRemaining >= 0 ? `${formatDuration(draftResult.timeRemaining)} Restpuffer` : `${formatDuration(Math.abs(draftResult.timeRemaining))} über dem Zeitpuffer`}</small>
                </div>
                <div className="decision-value">
                  <span>Mehrgewinn</span>
                  <strong>{formatSignedCurrency(draftResult.contribution)}</strong>
                  <small>{draftResult.margin.toLocaleString("de-DE", { maximumFractionDigits: 1 })} % Marge</small>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-title"><span>01</span><div><strong>Auftragsdaten</strong><small>Route und Erlös</small></div></div>
                <div className="field-grid two">
                  <label><span>Abholung</span><input value={draft.pickup} onChange={(event) => updateJobText("pickup", event.target.value)} /></label>
                  <label><span>Zustellung</span><input value={draft.delivery} onChange={(event) => updateJobText("delivery", event.target.value)} /></label>
                  <label><span>Angebotspreis</span><div className="input-unit"><input type="number" min="0" value={draft.revenue} onChange={(event) => updateJobNumber("revenue", event.target.value)} /><b>€</b></div></label>
                  <label><span>Gewicht</span><div className="input-unit"><input type="number" min="0" step="0.1" value={draft.weight} onChange={(event) => updateJobNumber("weight", event.target.value)} /><b>t</b></div></label>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-title"><span>02</span><div><strong>Umweg & Zeit</strong><small>Zusatzaufwand zur bestehenden Tour</small></div></div>
                <div className="field-grid two">
                  <label><span>Zusatzstrecke</span><div className="input-unit"><input type="number" min="0" value={draft.extraKm} onChange={(event) => updateJobNumber("extraKm", event.target.value)} /><b>km</b></div></label>
                  <label><span>Zusatzzeit</span><div className="input-unit"><input type="number" min="0" step="0.25" value={draft.extraHours} onChange={(event) => updateJobNumber("extraHours", event.target.value)} /><b>h</b></div></label>
                  <label><span>Tourpuffer</span><div className="input-unit"><input type="number" min="0" step="0.25" value={assumptions.bufferHours} onChange={(event) => updateAssumption("bufferHours", event.target.value)} /><b>h</b></div></label>
                  <label><span>Paletten</span><input type="number" min="0" value={draft.pallets} onChange={(event) => updateJobNumber("pallets", event.target.value)} /></label>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-title"><span>03</span><div><strong>Kostensätze</strong><small>Deine betriebliche Kalkulationsbasis</small></div></div>
                <div className="field-grid two compact-fields">
                  <label><span>Verbrauch</span><div className="input-unit"><input type="number" min="0" step="0.1" value={assumptions.consumption} onChange={(event) => updateAssumption("consumption", event.target.value)} /><b>l/100</b></div></label>
                  <label><span>Dieselpreis</span><div className="input-unit"><input type="number" min="0" step="0.01" value={assumptions.fuelPrice} onChange={(event) => updateAssumption("fuelPrice", event.target.value)} /><b>€/l</b></div></label>
                  <label><span>Personal</span><div className="input-unit"><input type="number" min="0" step="0.5" value={assumptions.staffRate} onChange={(event) => updateAssumption("staffRate", event.target.value)} /><b>€/h</b></div></label>
                  <label><span>Fahrzeug</span><div className="input-unit"><input type="number" min="0" step="0.05" value={assumptions.vehicleRate} onChange={(event) => updateAssumption("vehicleRate", event.target.value)} /><b>€/km</b></div></label>
                  <label><span>Maut</span><div className="input-unit"><input type="number" min="0" value={draft.toll} onChange={(event) => updateJobNumber("toll", event.target.value)} /><b>€</b></div></label>
                  <label><span>Material</span><div className="input-unit"><input type="number" min="0" value={draft.material} onChange={(event) => updateJobNumber("material", event.target.value)} /><b>€</b></div></label>
                  <label className="wide-field"><span>Weitere Kosten / Risikopuffer</span><div className="input-unit"><input type="number" min="0" value={draft.other} onChange={(event) => updateJobNumber("other", event.target.value)} /><b>€</b></div></label>
                </div>
              </section>

              <section className="breakdown-section">
                <div className="breakdown-head"><strong>Zusatzkosten</strong><strong>{formatCurrency(draftResult.total)}</strong></div>
                <div className="breakdown-list">
                  <div><span>Diesel</span><strong>{formatCurrency(draftResult.fuel)}</strong></div>
                  <div><span>Personal</span><strong>{formatCurrency(draftResult.staff)}</strong></div>
                  <div><span>Fahrzeug / Verschleiß</span><strong>{formatCurrency(draftResult.vehicle)}</strong></div>
                  <div><span>Maut, Material & Sonstiges</span><strong>{formatCurrency(draft.toll + draft.material + draft.other)}</strong></div>
                </div>
                <p className="formula-note">Mehrgewinn = Angebotspreis − Diesel − Personal − Fahrzeug − Maut − Material − Sonstiges</p>
              </section>
            </div>

            <footer className="drawer-footer">
              <button className="secondary-action" type="button" onClick={persistDraft}>Zum Vergleich speichern</button>
              <button className="accept-action" type="button" onClick={acceptDraft} disabled={draftResult.verdict === "Ablehnen"}>
                {draftResult.verdict === "Ablehnen" ? "Nicht wirtschaftlich" : "In Tour übernehmen"}
              </button>
            </footer>
          </aside>
        </div>
      )}
      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
