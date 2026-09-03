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

type VehicleStatus = "Im Einsatz" | "Einsatzbereit" | "Werkstatt";

type Vehicle = {
  id: string;
  name: string;
  plate: string;
  driverId: string;
  status: VehicleStatus;
  maintenanceRate: number;
  fixedMonthlyCost: number;
  capacityTons: number;
};

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  active: boolean;
};

type WorkspaceRole = "Owner" | "Administrator" | "Member";

type WorkspaceMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: WorkspaceRole;
  status: "Aktiv" | "Eingeladen";
  addedAt: string;
};

type Notice = {
  id: string;
  text: string;
  read: boolean;
};

type SectionId = "cockpit" | "auftraege" | "touren" | "kalkulation" | "fuhrpark" | "team" | "einstellungen";
type OrderFilter = "Alle" | "Verfügbar" | "Eingeplant" | "Wirtschaftlich";

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

const INITIAL_VEHICLES: Vehicle[] = [
  { id: "V-01", name: "MAN TGX", plate: "HH–LB 204", driverId: "D-01", status: "Im Einsatz", maintenanceRate: 0.34, fixedMonthlyCost: 1680, capacityTons: 24 },
  { id: "V-02", name: "Mercedes Actros", plate: "HH–TP 118", driverId: "D-02", status: "Im Einsatz", maintenanceRate: 0.39, fixedMonthlyCost: 1790, capacityTons: 24 },
  { id: "V-03", name: "DAF XF", plate: "HH–KM 407", driverId: "D-03", status: "Im Einsatz", maintenanceRate: 0.31, fixedMonthlyCost: 1540, capacityTons: 22 },
  { id: "V-04", name: "Volvo FH", plate: "HH–TP 503", driverId: "", status: "Werkstatt", maintenanceRate: 0.42, fixedMonthlyCost: 1850, capacityTons: 24 },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: "D-01", firstName: "Michael", lastName: "Boateng", hourlyRate: 31, active: true },
  { id: "D-02", firstName: "Ama", lastName: "Mensah", hourlyRate: 29.5, active: true },
  { id: "D-03", firstName: "Kwame", lastName: "Owusu", hourlyRate: 30, active: true },
];

const INITIAL_MEMBERS: WorkspaceMember[] = [
  { id: "M-01", firstName: "Godsaid", lastName: "Malock", email: "godsaid.malock@tunnelsoft.com", role: "Owner", status: "Aktiv", addedAt: "03. Sep. 2026" },
  { id: "M-02", firstName: "Michael", lastName: "Boateng", email: "m.boateng@tourpilot.de", role: "Member", status: "Aktiv", addedAt: "03. Sep. 2026" },
  { id: "M-03", firstName: "Ama", lastName: "Mensah", email: "a.mensah@tourpilot.de", role: "Member", status: "Aktiv", addedAt: "03. Sep. 2026" },
];

const EMPTY_MEMBER = { firstName: "", lastName: "", email: "", role: "Member" as WorkspaceRole };
const EMPTY_VEHICLE = { name: "", plate: "", driverId: "", status: "Einsatzbereit" as VehicleStatus, maintenanceRate: 0.35, fixedMonthlyCost: 0, capacityTons: 24 };
const EMPTY_DRIVER = { firstName: "", lastName: "", hourlyRate: 29, active: true };

const INITIAL_NOTICES: Notice[] = [
  { id: "n-1", text: "AT-0826 liegt innerhalb des geplanten Zeitfensters.", read: false },
  { id: "n-2", text: "Für HH–TP 503 ist ein Werkstattstatus hinterlegt.", read: false },
];

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

const shortName = (driver?: Driver) => driver ? `${driver.firstName.charAt(0)}. ${driver.lastName}` : "Nicht zugewiesen";

function NumericInput({ value, onValue, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: number; onValue: (value: number) => void }) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return <input {...props} type="number" value={text} onFocus={() => { focused.current = true; if (Number(text) === 0) setText(""); }} onChange={(event) => { const next = event.target.value; setText(next); if (next !== "") onValue(Number(next)); }} onBlur={() => { focused.current = false; if (text === "") { setText("0"); onValue(0); } }} />;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [draft, setDraft] = useState<Job>(INITIAL_JOBS[0]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("cockpit");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("Alle");
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [members, setMembers] = useState<WorkspaceMember[]>(INITIAL_MEMBERS);
  const [selectedVehicleId, setSelectedVehicleId] = useState("V-01");
  const [selectedDriverId, setSelectedDriverId] = useState("D-01");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [driverFormOpen, setDriverFormOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState(EMPTY_MEMBER);
  const [vehicleDraft, setVehicleDraft] = useState(EMPTY_VEHICLE);
  const [driverDraft, setDriverDraft] = useState(EMPTY_DRIVER);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [tourStatus, setTourStatus] = useState<"Unterwegs" | "Pausiert" | "Abgeschlossen">("Unterwegs");
  const [toast, setToast] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("tourpilot-state-v3") ?? window.localStorage.getItem("tourpilot-state-v2") ?? window.localStorage.getItem("tourpilot-state-v1");
        if (stored) {
          const parsed = JSON.parse(stored) as {
            jobs?: Job[];
            acceptedIds?: string[];
            assumptions?: Assumptions;
            vehicles?: Vehicle[];
            drivers?: Driver[];
            members?: WorkspaceMember[];
            selectedVehicleId?: string;
            selectedDriverId?: string;
            notices?: Notice[];
            tourStatus?: "Unterwegs" | "Pausiert" | "Abgeschlossen";
          };
          if (parsed.jobs?.length) setJobs(parsed.jobs);
          if (parsed.acceptedIds) setAcceptedIds(parsed.acceptedIds);
          if (parsed.assumptions) setAssumptions(parsed.assumptions);
          if (parsed.vehicles?.length && parsed.vehicles.every((vehicle) => "maintenanceRate" in vehicle)) setVehicles(parsed.vehicles);
          if (parsed.drivers?.length) setDrivers(parsed.drivers);
          if (parsed.members?.length) setMembers(parsed.members);
          if (parsed.selectedVehicleId) setSelectedVehicleId(parsed.selectedVehicleId);
          if (parsed.selectedDriverId) setSelectedDriverId(parsed.selectedDriverId);
          if (parsed.notices) setNotices(parsed.notices);
          if (parsed.tourStatus) setTourStatus(parsed.tourStatus);
        }
      } catch {
        // A blocked or invalid local cache should never block the calculator.
      }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateDate = () => setCurrentDate(new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()));
    updateDate();
    const timer = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(
      "tourpilot-state-v3",
      JSON.stringify({ jobs, acceptedIds, assumptions, vehicles, drivers, members, selectedVehicleId, selectedDriverId, notices, tourStatus }),
    );
  }, [jobs, acceptedIds, assumptions, vehicles, drivers, members, selectedVehicleId, selectedDriverId, notices, tourStatus]);

  useEffect(() => {
    if (!calculatorOpen && !tourOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCalculatorOpen(false);
        setTourOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("drawer-open");
    };
  }, [calculatorOpen, tourOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId) ?? drivers[0];
  const activeAssumptions = useMemo(() => ({ ...assumptions, staffRate: selectedDriver?.hourlyRate ?? assumptions.staffRate, vehicleRate: selectedVehicle?.maintenanceRate ?? assumptions.vehicleRate }), [assumptions, selectedDriver, selectedVehicle]);
  const evaluatedJobs = useMemo(
    () => jobs.map((job) => ({ ...job, evaluation: calculateJob(job, activeAssumptions) })),
    [jobs, activeAssumptions],
  );
  const acceptedJobs = evaluatedJobs.filter((job) => acceptedIds.includes(job.id));
  const acceptedRevenue = acceptedJobs.reduce((sum, job) => sum + job.revenue, 0);
  const acceptedCost = acceptedJobs.reduce((sum, job) => sum + job.evaluation.total, 0);
  const acceptedContribution = acceptedJobs.reduce((sum, job) => sum + job.evaluation.contribution, 0);
  const usedBuffer = acceptedJobs.reduce((sum, job) => sum + job.extraHours, 0);
  const bestJob = evaluatedJobs
    .filter((job) => !acceptedIds.includes(job.id) && job.evaluation.verdict === "Lohnt sich")
    .sort((a, b) => b.evaluation.contribution - a.evaluation.contribution)[0];
  const draftResult = useMemo(() => calculateJob(draft, activeAssumptions), [draft, activeAssumptions]);
  const totalRevenue = BASE_METRICS.revenue + acceptedRevenue;
  const totalCost = BASE_METRICS.cost + acceptedCost;
  const totalContribution = BASE_METRICS.contribution + acceptedContribution;
  const totalMargin = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;
  const tourRevenue = BASE_METRICS.tourRevenue + acceptedRevenue;
  const tourCost = BASE_METRICS.tourCost + acceptedCost;
  const tourContribution = tourRevenue - tourCost;
  const tourMargin = tourRevenue > 0 ? (tourContribution / tourRevenue) * 100 : 0;
  const displayedJobs = evaluatedJobs.filter((job) => {
    if (orderFilter === "Verfügbar") return !acceptedIds.includes(job.id);
    if (orderFilter === "Eingeplant") return acceptedIds.includes(job.id);
    if (orderFilter === "Wirtschaftlich") return job.evaluation.verdict === "Lohnt sich";
    return true;
  });
  const fleetInService = vehicles.filter((vehicle) => vehicle.status === "Im Einsatz").length;
  const systemWarnings = [
    ...(selectedVehicle?.status === "Werkstatt" ? [`${selectedVehicle.plate} ist als Werkstatt gemeldet und kann nicht eingeplant werden.`] : []),
    ...(!selectedDriver?.active ? [`${shortName(selectedDriver)} ist derzeit nicht aktiv.`] : []),
    ...(assumptions.bufferHours - usedBuffer < 1 ? ["Der freie Tourpuffer liegt unter einer Stunde."] : []),
  ];
  const unreadNotices = notices.filter((notice) => !notice.read).length + systemWarnings.length;
  const filteredMembers = members.filter((member) => `${member.firstName} ${member.lastName} ${member.email} ${member.role}`.toLowerCase().includes(memberSearch.toLowerCase()));
  const costBreakdown = [
    { key: "fuel", label: "Diesel", value: 948 + acceptedJobs.reduce((sum, job) => sum + job.evaluation.fuel, 0) },
    { key: "staff", label: "Personal", value: 742 + acceptedJobs.reduce((sum, job) => sum + job.evaluation.staff, 0) },
    { key: "toll", label: "Maut & Strecke", value: 381 + acceptedJobs.reduce((sum, job) => sum + job.toll + job.evaluation.vehicle, 0) },
    { key: "material", label: "Material & Sonstiges", value: 116 + acceptedJobs.reduce((sum, job) => sum + job.material + job.other, 0) },
  ];
  const costBreakdownTotal = costBreakdown.reduce((sum, item) => sum + item.value, 0);
  const notify = (message: string) => {
    setToast(message);
    setNotices((current) => [{ id: `${Date.now()}-${current.length}`, text: message, read: false }, ...current].slice(0, 12));
  };

  const navigateTo = (section: SectionId) => {
    setActiveSection(section);
    setNotificationsOpen(false);
    setProfileOpen(false);
    if (section === "kalkulation") {
      openNewJob();
      return;
    }
    window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

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

  const addMember = () => {
    if (!memberDraft.firstName.trim() || !memberDraft.lastName.trim() || !memberDraft.email.includes("@")) { notify("Bitte Vorname, Nachname und eine gültige E-Mail eintragen."); return; }
    const member: WorkspaceMember = { ...memberDraft, id: `M-${Date.now()}`, status: "Eingeladen", addedAt: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()) };
    setMembers((current) => [...current, member]);
    setMemberDraft(EMPTY_MEMBER);
    setMemberFormOpen(false);
    notify(`${member.firstName} ${member.lastName} wurde als ${member.role} angelegt.`);
  };

  const addVehicle = () => {
    if (!vehicleDraft.name.trim() || !vehicleDraft.plate.trim()) { notify("Bitte Fahrzeug und Kennzeichen eintragen."); return; }
    const vehicle: Vehicle = { ...vehicleDraft, id: `V-${Date.now()}` };
    setVehicles((current) => [...current, vehicle]);
    setVehicleDraft(EMPTY_VEHICLE);
    setVehicleFormOpen(false);
    notify(`${vehicle.name} · ${vehicle.plate} wurde angelegt.`);
  };

  const addDriver = () => {
    if (!driverDraft.firstName.trim() || !driverDraft.lastName.trim()) { notify("Bitte Vor- und Nachname des Fahrers eintragen."); return; }
    const driver: Driver = { ...driverDraft, id: `D-${Date.now()}` };
    setDrivers((current) => [...current, driver]);
    setDriverDraft(EMPTY_DRIVER);
    setDriverFormOpen(false);
    notify(`${shortName(driver)} wurde als Fahrer angelegt.`);
  };

  const updateMemberRole = (memberId: string, role: WorkspaceRole) => {
    setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role } : member));
    notify(`Rolle wurde auf ${role} geändert.`);
  };

  const removeMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member || member.role === "Owner" || !window.confirm(`${member.firstName} ${member.lastName} wirklich entfernen?`)) return;
    setMembers((current) => current.filter((item) => item.id !== memberId));
    notify(`${member.firstName} ${member.lastName} wurde entfernt.`);
  };

  const persistDraft = (announce = true) => {
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
    if (announce) notify(`${savedId} wurde zur Vergleichsliste hinzugefügt.`);
    return savedId;
  };

  const acceptDraft = () => {
    const savedId = persistDraft(false);
    if (!acceptedIds.includes(savedId)) {
      setAcceptedIds((current) => [...current, savedId]);
      notify(`${savedId} wurde in die Tour AT-0826 übernommen.`);
    }
    setCalculatorOpen(false);
  };

  const removeFromTour = (jobId: string) => {
    setAcceptedIds((current) => current.filter((id) => id !== jobId));
    notify(`${jobId} wurde aus AT-0826 entfernt.`);
  };

  const deleteJob = (jobId: string) => {
    if (!window.confirm(`Auftrag ${jobId} wirklich löschen?`)) return;
    setJobs((current) => current.filter((job) => job.id !== jobId));
    setAcceptedIds((current) => current.filter((id) => id !== jobId));
    notify(`${jobId} wurde gelöscht.`);
  };

  const cycleVehicleStatus = (vehicleId: string) => {
    const order: VehicleStatus[] = ["Einsatzbereit", "Im Einsatz", "Werkstatt"];
    const selected = vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!selected) return;
    const next = order[(order.indexOf(selected.status) + 1) % order.length];
    setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, status: next } : vehicle));
    notify(`${selected.plate}: Status auf „${next}“ geändert.`);
  };

  const toggleTourStatus = () => {
    const order = ["Unterwegs", "Pausiert", "Abgeschlossen"] as const;
    const next = order[(order.indexOf(tourStatus) + 1) % order.length];
    setTourStatus(next);
    notify(`AT-0826: Status auf „${next}“ geändert.`);
  };

  const resetWorkspace = () => {
    if (!window.confirm("Alle lokal gespeicherten TourPilot-Daten zurücksetzen?")) return;
    setJobs(INITIAL_JOBS);
    setAcceptedIds([]);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setVehicles(INITIAL_VEHICLES);
    setDrivers(INITIAL_DRIVERS);
    setMembers(INITIAL_MEMBERS);
    setSelectedVehicleId("V-01");
    setSelectedDriverId("D-01");
    setTourStatus("Unterwegs");
    setNotices(INITIAL_NOTICES);
    window.localStorage.removeItem("tourpilot-state-v1");
    window.localStorage.removeItem("tourpilot-state-v2");
    window.localStorage.removeItem("tourpilot-state-v3");
    notify("TourPilot wurde auf die Ausgangsdaten zurückgesetzt.");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <button className="brand brand-button" type="button" aria-label="TourPilot Startseite" onClick={() => navigateTo("cockpit")}>
            <span className="brand-mark" aria-hidden="true">
              <span>TP</span>
            </span>
            <span className="brand-copy">
              <strong>TourPilot</strong>
              <small>Disposition & Kalkulation</small>
            </span>
          </button>

          <nav className="main-nav" aria-label="Hauptnavigation">
            <p className="nav-label">Arbeitsbereich</p>
            <button className={`nav-link ${activeSection === "cockpit" ? "active" : ""}`} type="button" onClick={() => navigateTo("cockpit")}>
              <Icon>⌂</Icon>
              Cockpit
            </button>
            <button className={`nav-link ${activeSection === "auftraege" ? "active" : ""}`} type="button" onClick={() => navigateTo("auftraege")}>
              <Icon>□</Icon>
              Aufträge
              <span className="nav-count">{BASE_METRICS.orders + acceptedIds.length}</span>
            </button>
            <button className={`nav-link ${activeSection === "touren" ? "active" : ""}`} type="button" onClick={() => { setActiveSection("touren"); setTourOpen(true); }}>
              <Icon>↗</Icon>
              Touren
            </button>
            <button className={`nav-link ${activeSection === "kalkulation" ? "active" : ""}`} type="button" onClick={() => navigateTo("kalkulation")}>
              <Icon>∑</Icon>
              Kalkulation
            </button>

            <p className="nav-label second">Verwaltung</p>
            <button className={`nav-link ${activeSection === "fuhrpark" ? "active" : ""}`} type="button" onClick={() => navigateTo("fuhrpark")}>
              <Icon>▣</Icon>
              Fuhrpark
            </button>
            <button className={`nav-link ${activeSection === "team" ? "active" : ""}`} type="button" onClick={() => navigateTo("team")}>
              <Icon>◎</Icon>
              Benutzer & Rollen
              <span className="nav-count">{members.length}</span>
            </button>
            <button className={`nav-link ${activeSection === "einstellungen" ? "active" : ""}`} type="button" onClick={() => navigateTo("einstellungen")}>
              <Icon>⚙</Icon>
              Einstellungen
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="fleet-status">
            <div className="fleet-status-head">
              <span>Fuhrpark heute</span>
              <strong>{fleetInService} / {vehicles.length}</strong>
            </div>
            <div className="fleet-track"><span style={{ width: `${vehicles.length ? (fleetInService / vehicles.length) * 100 : 0}%` }} /></div>
            <p>{fleetInService} Fahrzeuge im Einsatz</p>
          </div>
          <button className="profile-button" type="button" aria-expanded={profileOpen} onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}>
            <span className="avatar">GM</span>
            <span>
              <strong>Godsaid Malock</strong>
              <small>Owner</small>
            </span>
            <span className="profile-more" aria-hidden="true">•••</span>
          </button>
          {profileOpen && (
            <div className="profile-popover">
              <strong>Godsaid Malock</strong>
              <span>Owner · Angemeldet</span>
              <button type="button" onClick={() => navigateTo("team")}>Workspace & Benutzer</button>
              <button type="button" onClick={() => navigateTo("einstellungen")}>Einstellungen öffnen</button>
            </div>
          )}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark"><span>TP</span></span>
            <strong>TourPilot</strong>
          </div>
          <div className="topbar-date"><span className="eyebrow">Heute</span><span>{currentDate}</span></div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Benachrichtigungen" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}>
              <span aria-hidden="true">◌</span>
              {unreadNotices > 0 && <i />}
            </button>
            <button className="primary-button" type="button" onClick={openNewJob}>
              <span aria-hidden="true">＋</span>
              Neuer Auftrag
            </button>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-head"><strong>Benachrichtigungen</strong><button type="button" onClick={() => setNotices((current) => current.map((notice) => ({ ...notice, read: true })))}>Alle gelesen</button></div>
              {systemWarnings.map((warning) => <div className="notice system-warning" key={warning}><span />{warning}</div>)}
              {notices.length ? notices.map((notice) => (
                <button key={notice.id} className={notice.read ? "notice read" : "notice"} type="button" onClick={() => setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item))}>
                  <span />{notice.text}
                </button>
              )) : <p className="empty-note">Keine Benachrichtigungen.</p>}
            </div>
          )}
        </header>

        <div className={`content ${activeSection === "team" ? "team-content" : ""}`} id="cockpit">
          {activeSection === "team" ? (
            <section className="team-page" id="team">
              <div className="team-heading">
                <div><button className="back-link" type="button" onClick={() => navigateTo("cockpit")}>← Zurück zum Cockpit</button><p className="section-kicker">Workspace-Verwaltung</p><h1>Benutzer & Rollen</h1><p>Mitglieder verwalten und Zugriffe klar zuweisen.</p></div>
                <button className="primary-button member-add-button" type="button" onClick={() => setMemberFormOpen((open) => !open)}>＋ Benutzer anlegen</button>
              </div>

              <div className="seat-grid">
                <article><span>Mitglieder</span><strong>{members.length}</strong><small>{members.filter((member) => member.status === "Aktiv").length} aktiv</small></article>
                <article><span>Administratoren</span><strong>{members.filter((member) => member.role === "Owner" || member.role === "Administrator").length}</strong><small>inklusive Owner</small></article>
                <article><span>Offene Einladungen</span><strong>{members.filter((member) => member.status === "Eingeladen").length}</strong><small>noch nicht bestätigt</small></article>
              </div>

              {memberFormOpen && <section className="admin-form-panel">
                <div className="admin-form-head"><div><strong>Neuen Benutzer anlegen</strong><span>Standardmäßig als Member mit eingeschränkten Verwaltungsrechten.</span></div><button type="button" onClick={() => setMemberFormOpen(false)}>×</button></div>
                <div className="admin-form-grid four">
                  <label><span>Vorname</span><input value={memberDraft.firstName} onChange={(event) => setMemberDraft((current) => ({ ...current, firstName: event.target.value }))} placeholder="Vorname" /></label>
                  <label><span>Nachname</span><input value={memberDraft.lastName} onChange={(event) => setMemberDraft((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nachname" /></label>
                  <label><span>E-Mail</span><input type="email" value={memberDraft.email} onChange={(event) => setMemberDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@firma.de" /></label>
                  <label><span>Rolle</span><select value={memberDraft.role} onChange={(event) => setMemberDraft((current) => ({ ...current, role: event.target.value as WorkspaceRole }))}><option>Member</option><option>Administrator</option></select></label>
                </div>
                <div className="admin-form-actions"><button className="secondary-action" type="button" onClick={() => setMemberFormOpen(false)}>Abbrechen</button><button className="accept-action" type="button" onClick={addMember}>Benutzer speichern</button></div>
              </section>}

              <section className="members-card">
                <div className="member-toolbar"><label><span aria-hidden="true">⌕</span><input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Nach Name oder E-Mail filtern" /></label><span>{filteredMembers.length} Einträge</span></div>
                <div className="member-table-wrap"><table className="member-table"><thead><tr><th>Name</th><th>Rolle</th><th>Status</th><th>Hinzugefügt</th><th>Aktion</th></tr></thead><tbody>
                  {filteredMembers.map((member) => <tr key={member.id}>
                    <td><div className="member-name"><span className="member-avatar">{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span><span><strong>{member.firstName} {member.lastName}{member.role === "Owner" ? " (Du)" : ""}</strong><small>{member.email}</small></span></div></td>
                    <td><select className="role-select" value={member.role} disabled={member.role === "Owner"} onChange={(event) => updateMemberRole(member.id, event.target.value as WorkspaceRole)}><option>Member</option><option>Administrator</option>{member.role === "Owner" && <option>Owner</option>}</select></td>
                    <td><span className={`member-status ${member.status === "Eingeladen" ? "pending" : ""}`}>{member.status}</span></td>
                    <td>{member.addedAt}</td>
                    <td><button className="member-remove" type="button" disabled={member.role === "Owner"} onClick={() => removeMember(member.id)}>{member.role === "Owner" ? "Geschützt" : "Entfernen"}</button></td>
                  </tr>)}
                </tbody></table></div>
                {!filteredMembers.length && <p className="empty-members">Keine passenden Benutzer gefunden.</p>}
              </section>

              <section className="role-explainer"><article><span>O</span><div><strong>Owner</strong><p>Vollzugriff, Rollenverwaltung und geschützte Grundeinstellungen.</p></div></article><article><span>A</span><div><strong>Administrator</strong><p>Kann Benutzer, Fuhrpark, Fahrer und Kalkulationswerte verwalten.</p></div></article><article><span>M</span><div><strong>Member</strong><p>Kann Touren und Aufträge bearbeiten, aber keine Benutzerrechte ändern.</p></div></article></section>
              <div className="auth-roadmap"><span>🔐</span><div><strong>Kontenstruktur vorbereitet</strong><p>Die Verwaltung ist vollständig bedienbar. Sichere externe Anmeldung und serverweite Synchronisierung werden im nächsten Backend-Schritt verbunden.</p></div></div>
            </section>
          ) : <>
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
                    <button className="status-badge status-action" type="button" onClick={toggleTourStatus}><i /> {tourStatus}</button>
                    <span className="tour-id">AT-0826</span>
                  </div>
                  <h2>Hamburg → Salzburg</h2>
                  <p>{selectedVehicle?.name} · {selectedVehicle?.plate} · Fahrer: {shortName(selectedDriver)}</p>
                </div>
                <button className="text-button" type="button" onClick={() => { setActiveSection("touren"); setTourOpen(true); }}>Tour öffnen <span>→</span></button>
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
                <select className="filter-button" aria-label="Aufträge filtern" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value as OrderFilter)}>
                  <option>Alle</option><option>Verfügbar</option><option>Eingeplant</option><option>Wirtschaftlich</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Auftrag</th><th>Umsatz</th><th>Umweg</th><th>Zeit</th><th>Mehrgewinn</th><th>Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedJobs.map((job) => (
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
                          <button className="row-delete" type="button" onClick={() => deleteJob(job.id)} aria-label={`${job.id} löschen`}>×</button>
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
                <span className="total-cost">{formatCurrency(costBreakdownTotal)}</span>
              </div>
              <div className="cost-bars">
                {costBreakdown.map((item) => {
                  const percentage = costBreakdownTotal ? (item.value / costBreakdownTotal) * 100 : 0;
                  return <div className="cost-row" key={item.key}><div><span><i className={`dot ${item.key}`} />{item.label}</span><strong>{formatCurrency(item.value)}</strong></div><div className="bar"><span className={`${item.key}-bar`} style={{ width: `${percentage}%` }} /></div><small>{percentage.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</small></div>;
                })}
              </div>
              <div className="cost-note"><span>i</span><p><strong>Kalkulationsbasis · automatisch aus Fahrer & Fahrzeug</strong><br />{assumptions.consumption.toLocaleString("de-DE")} l / 100 km · Diesel {assumptions.fuelPrice.toLocaleString("de-DE")} €/l · {shortName(selectedDriver)} {activeAssumptions.staffRate.toLocaleString("de-DE")} €/h · {selectedVehicle?.plate} {activeAssumptions.vehicleRate.toLocaleString("de-DE")} €/km</p></div>
            </article>
          </section>

          <section className="management-grid" id="fuhrpark">
            <article className="management-card fleet-card">
              <div className="card-header compact">
                <div><p className="section-kicker">Verwaltung</p><h2>Fuhrpark</h2></div>
                <div className="header-actions"><span className="total-cost">{fleetInService} im Einsatz</span><button className="text-button" type="button" onClick={() => setVehicleFormOpen((open) => !open)}>＋ Fahrzeug</button></div>
              </div>
              {vehicleFormOpen && <div className="compact-admin-form">
                <label><span>Fahrzeug / Modell</span><input value={vehicleDraft.name} onChange={(event) => setVehicleDraft((current) => ({ ...current, name: event.target.value }))} placeholder="z. B. MAN TGX" /></label>
                <label><span>Kennzeichen</span><input value={vehicleDraft.plate} onChange={(event) => setVehicleDraft((current) => ({ ...current, plate: event.target.value }))} placeholder="HH–TP 100" /></label>
                <label><span>Fahrer</span><select value={vehicleDraft.driverId} onChange={(event) => setVehicleDraft((current) => ({ ...current, driverId: event.target.value }))}><option value="">Nicht zugewiesen</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{shortName(driver)}</option>)}</select></label>
                <label><span>Wartung / Verschleiß</span><div className="input-unit"><NumericInput min="0" step="0.01" value={vehicleDraft.maintenanceRate} onValue={(value) => setVehicleDraft((current) => ({ ...current, maintenanceRate: value }))} /><b>€/km</b></div></label>
                <label><span>Fixkosten monatlich</span><div className="input-unit"><NumericInput min="0" step="10" value={vehicleDraft.fixedMonthlyCost} onValue={(value) => setVehicleDraft((current) => ({ ...current, fixedMonthlyCost: value }))} /><b>€</b></div></label>
                <label><span>Nutzlast</span><div className="input-unit"><NumericInput min="0" step="0.5" value={vehicleDraft.capacityTons} onValue={(value) => setVehicleDraft((current) => ({ ...current, capacityTons: value }))} /><b>t</b></div></label>
                <button className="accept-action compact-save" type="button" onClick={addVehicle}>Fahrzeug speichern</button>
              </div>}
              <div className="vehicle-grid">
                {vehicles.map((vehicle) => (
                  <div className={`vehicle-item ${selectedVehicleId === vehicle.id ? "selected" : ""}`} key={vehicle.id}>
                    <span className="vehicle-symbol">▰</span>
                    <button className="vehicle-copy vehicle-select" type="button" onClick={() => { setSelectedVehicleId(vehicle.id); if (vehicle.driverId) setSelectedDriverId(vehicle.driverId); notify(`${vehicle.plate} wurde für AT-0826 ausgewählt.`); }}><strong>{vehicle.name}</strong><small>{vehicle.plate} · {shortName(drivers.find((driver) => driver.id === vehicle.driverId))}</small><em>{vehicle.maintenanceRate.toLocaleString("de-DE")} €/km Wartung · {vehicle.capacityTons.toLocaleString("de-DE")} t</em></button>
                    <button className={`vehicle-status ${vehicle.status === "Werkstatt" ? "repair" : vehicle.status === "Einsatzbereit" ? "ready" : "active"}`} type="button" onClick={() => cycleVehicleStatus(vehicle.id)}>{vehicle.status}</button>
                  </div>
                ))}
              </div>
              <div className="driver-management">
                <div className="subsection-head"><div><strong>Fahrer</strong><span>{drivers.length} angelegt</span></div><button className="text-button" type="button" onClick={() => setDriverFormOpen((open) => !open)}>＋ Fahrer</button></div>
                {driverFormOpen && <div className="driver-form"><input value={driverDraft.firstName} onChange={(event) => setDriverDraft((current) => ({ ...current, firstName: event.target.value }))} placeholder="Vorname" /><input value={driverDraft.lastName} onChange={(event) => setDriverDraft((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nachname" /><div className="input-unit"><NumericInput min="0" step="0.5" value={driverDraft.hourlyRate} onValue={(value) => setDriverDraft((current) => ({ ...current, hourlyRate: value }))} /><b>€/h</b></div><button type="button" onClick={addDriver}>Speichern</button></div>}
                <div className="driver-chips">{drivers.map((driver) => <button className={selectedDriverId === driver.id ? "selected" : ""} type="button" key={driver.id} onClick={() => { setSelectedDriverId(driver.id); notify(`${shortName(driver)} wurde für AT-0826 ausgewählt.`); }}><span>{driver.firstName.charAt(0)}{driver.lastName.charAt(0)}</span><strong>{shortName(driver)}</strong><small>{driver.hourlyRate.toLocaleString("de-DE")} €/h</small></button>)}</div>
              </div>
              <p className="interaction-hint">Fahrzeug und Fahrer auswählen; TourPilot übernimmt deren Kostensätze automatisch in die Kalkulation.</p>
            </article>

            <article className="management-card settings-card" id="einstellungen">
              <div className="card-header compact">
                <div><p className="section-kicker">Kalkulationsbasis</p><h2>Einstellungen</h2></div>
                <button className="text-button" type="button" onClick={resetWorkspace}>Zurücksetzen</button>
              </div>
              <div className="settings-grid">
                <label><span>Verbrauch</span><div className="input-unit"><NumericInput min="0" step="0.1" value={assumptions.consumption} onValue={(value) => setAssumptions((current) => ({ ...current, consumption: value }))} /><b>l/100</b></div></label>
                <label><span>Dieselpreis</span><div className="input-unit"><NumericInput min="0" step="0.01" value={assumptions.fuelPrice} onValue={(value) => setAssumptions((current) => ({ ...current, fuelPrice: value }))} /><b>€/l</b></div></label>
                <label><span>Personal (Standard)</span><div className="input-unit"><NumericInput min="0" step="0.5" value={assumptions.staffRate} onValue={(value) => setAssumptions((current) => ({ ...current, staffRate: value }))} /><b>€/h</b></div></label>
                <label><span>Fahrzeug (Standard)</span><div className="input-unit"><NumericInput min="0" step="0.05" value={assumptions.vehicleRate} onValue={(value) => setAssumptions((current) => ({ ...current, vehicleRate: value }))} /><b>€/km</b></div></label>
                <label><span>Tourpuffer</span><div className="input-unit"><NumericInput min="0" step="0.25" value={assumptions.bufferHours} onValue={(value) => setAssumptions((current) => ({ ...current, bufferHours: value }))} /><b>h</b></div></label>
              </div>
              <button className="access-note access-button" type="button" onClick={() => navigateTo("team")}><span>◎</span><div><strong>Zugänge & Rollen</strong><p>{members.length} Benutzer · Owner, Administrator und Member verwalten</p></div><b>Öffnen →</b></button>
            </article>
          </section>
          </>}
        </div>
      </section>
      {tourOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTourOpen(false); }}>
          <aside className="calculator-drawer tour-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="tour-title">
            <header className="drawer-header">
              <div><p className="section-kicker">Tourdetails · AT-0826</p><h2 id="tour-title">Hamburg → Salzburg</h2><p>{selectedVehicle?.name} · {selectedVehicle?.plate} · Fahrer: {shortName(selectedDriver)}</p></div>
              <button className="drawer-close" type="button" aria-label="Tourdetails schließen" onClick={() => setTourOpen(false)}>×</button>
            </header>
            <div className="drawer-content">
              <section className="tour-summary-panel">
                <button className={`status-badge detail-status ${tourStatus === "Pausiert" ? "paused" : tourStatus === "Abgeschlossen" ? "done" : ""}`} type="button" onClick={toggleTourStatus}><i /> {tourStatus}</button>
                <div className="detail-metrics"><div><span>Umsatz</span><strong>{formatCurrency(tourRevenue)}</strong></div><div><span>Kosten</span><strong>{formatCurrency(tourCost)}</strong></div><div><span>Deckungsbeitrag</span><strong>{formatCurrency(tourContribution)}</strong></div><div><span>Marge</span><strong>{tourMargin.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</strong></div></div>
              </section>
              <section className="detail-section assignment-section"><div className="form-section-title"><span>00</span><div><strong>Ressourcen & Vorkalkulation</strong><small>Kostensätze werden automatisch übernommen</small></div></div><div className="assignment-grid"><label><span>Fahrzeug</span><select value={selectedVehicleId} onChange={(event) => { const vehicle = vehicles.find((item) => item.id === event.target.value); setSelectedVehicleId(event.target.value); if (vehicle?.driverId) setSelectedDriverId(vehicle.driverId); }}><option value="" disabled>Fahrzeug auswählen</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate}</option>)}</select></label><label><span>Fahrer</span><select value={selectedDriverId} onChange={(event) => setSelectedDriverId(event.target.value)}><option value="" disabled>Fahrer auswählen</option>{drivers.filter((driver) => driver.active).map((driver) => <option key={driver.id} value={driver.id}>{shortName(driver)}</option>)}</select></label></div><div className="auto-calculation"><div><span>Personal</span><strong>{activeAssumptions.staffRate.toLocaleString("de-DE")} €/h</strong></div><div><span>Wartung / Verschleiß</span><strong>{activeAssumptions.vehicleRate.toLocaleString("de-DE")} €/km</strong></div><div><span>Fixkosten Fahrzeug</span><strong>{formatCurrency(selectedVehicle?.fixedMonthlyCost ?? 0)}/Monat</strong></div></div></section>
              <section className="detail-section"><div className="form-section-title"><span>01</span><div><strong>Tourverlauf</strong><small>Aktueller Plan</small></div></div><ol className="stop-list"><li><span>A</span><div><strong>Hamburg</strong><small>Start · 18:30</small></div></li><li><span>1</span><div><strong>Nürnberg</strong><small>Zwischenstopp · 05:40</small></div></li><li><span>B</span><div><strong>Salzburg</strong><small>Ziel · 13:45</small></div></li></ol></section>
              <section className="detail-section"><div className="form-section-title"><span>02</span><div><strong>Eingeplante Zusatzaufträge</strong><small>{acceptedJobs.length} übernommen</small></div></div>{acceptedJobs.length ? <div className="accepted-list">{acceptedJobs.map((job) => <div key={job.id}><span><strong>{job.id}</strong><small>{job.pickup} → {job.delivery}</small></span><b>{formatSignedCurrency(job.evaluation.contribution)}</b><button type="button" onClick={() => removeFromTour(job.id)}>Entfernen</button></div>)}</div> : <div className="empty-detail"><p>Noch kein Zusatzauftrag eingeplant.</p><button type="button" className="secondary-action" onClick={() => { setTourOpen(false); openNewJob(); }}>Auftrag kalkulieren</button></div>}</section>
            </div>
            <footer className="drawer-footer single"><button className="accept-action" type="button" onClick={toggleTourStatus}>Tourstatus ändern</button></footer>
          </aside>
        </div>
      )}
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
                  <label><span>Angebotspreis</span><div className="input-unit"><NumericInput min="0" value={draft.revenue} onValue={(value) => setDraft((current) => ({ ...current, revenue: value }))} /><b>€</b></div></label>
                  <label><span>Gewicht</span><div className="input-unit"><NumericInput min="0" step="0.1" value={draft.weight} onValue={(value) => setDraft((current) => ({ ...current, weight: value }))} /><b>t</b></div></label>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-title"><span>02</span><div><strong>Umweg & Zeit</strong><small>Zusatzaufwand zur bestehenden Tour</small></div></div>
                <div className="field-grid two">
                  <label><span>Zusatzstrecke</span><div className="input-unit"><NumericInput min="0" value={draft.extraKm} onValue={(value) => setDraft((current) => ({ ...current, extraKm: value }))} /><b>km</b></div></label>
                  <label><span>Zusatzzeit</span><div className="input-unit"><NumericInput min="0" step="0.25" value={draft.extraHours} onValue={(value) => setDraft((current) => ({ ...current, extraHours: value }))} /><b>h</b></div></label>
                  <label><span>Tourpuffer</span><div className="input-unit"><NumericInput min="0" step="0.25" value={assumptions.bufferHours} onValue={(value) => setAssumptions((current) => ({ ...current, bufferHours: value }))} /><b>h</b></div></label>
                  <label><span>Paletten</span><NumericInput min="0" value={draft.pallets} onValue={(value) => setDraft((current) => ({ ...current, pallets: value }))} /></label>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-title"><span>03</span><div><strong>Kostensätze</strong><small>Deine betriebliche Kalkulationsbasis</small></div></div>
                <div className="field-grid two compact-fields">
                  <label><span>Verbrauch</span><div className="input-unit"><NumericInput min="0" step="0.1" value={assumptions.consumption} onValue={(value) => setAssumptions((current) => ({ ...current, consumption: value }))} /><b>l/100</b></div></label>
                  <label><span>Dieselpreis</span><div className="input-unit"><NumericInput min="0" step="0.01" value={assumptions.fuelPrice} onValue={(value) => setAssumptions((current) => ({ ...current, fuelPrice: value }))} /><b>€/l</b></div></label>
                  <label><span>Personal · {shortName(selectedDriver)}</span><div className="input-unit"><NumericInput min="0" step="0.5" value={activeAssumptions.staffRate} onValue={(value) => setDrivers((current) => current.map((driver) => driver.id === selectedDriverId ? { ...driver, hourlyRate: value } : driver))} /><b>€/h</b></div></label>
                  <label><span>Fahrzeug · {selectedVehicle?.plate}</span><div className="input-unit"><NumericInput min="0" step="0.01" value={activeAssumptions.vehicleRate} onValue={(value) => setVehicles((current) => current.map((vehicle) => vehicle.id === selectedVehicleId ? { ...vehicle, maintenanceRate: value } : vehicle))} /><b>€/km</b></div></label>
                  <label><span>Maut</span><div className="input-unit"><NumericInput min="0" value={draft.toll} onValue={(value) => setDraft((current) => ({ ...current, toll: value }))} /><b>€</b></div></label>
                  <label><span>Material</span><div className="input-unit"><NumericInput min="0" value={draft.material} onValue={(value) => setDraft((current) => ({ ...current, material: value }))} /><b>€</b></div></label>
                  <label className="wide-field"><span>Weitere Kosten / Risikopuffer</span><div className="input-unit"><NumericInput min="0" value={draft.other} onValue={(value) => setDraft((current) => ({ ...current, other: value }))} /><b>€</b></div></label>
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
              <button className="secondary-action" type="button" onClick={() => persistDraft()}>Zum Vergleich speichern</button>
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
