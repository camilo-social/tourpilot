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
  depreciationRate: number;
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
  pinHash?: string;
};

type TourStatus = "Geplant" | "Unterwegs" | "Pausiert" | "Abgeschlossen";

type Tour = {
  id: string;
  name: string;
  start: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  status: TourStatus;
  jobIds: string[];
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
  { id: "V-01", name: "MAN TGX", plate: "HH–LB 204", driverId: "D-01", status: "Im Einsatz", maintenanceRate: 0.18, depreciationRate: 0.27, fixedMonthlyCost: 1680, capacityTons: 24 },
  { id: "V-02", name: "Mercedes Actros", plate: "HH–TP 118", driverId: "D-02", status: "Im Einsatz", maintenanceRate: 0.21, depreciationRate: 0.29, fixedMonthlyCost: 1790, capacityTons: 24 },
  { id: "V-03", name: "DAF XF", plate: "HH–KM 407", driverId: "D-03", status: "Im Einsatz", maintenanceRate: 0.17, depreciationRate: 0.25, fixedMonthlyCost: 1540, capacityTons: 22 },
  { id: "V-04", name: "Volvo FH", plate: "HH–TP 503", driverId: "", status: "Werkstatt", maintenanceRate: 0.24, depreciationRate: 0.32, fixedMonthlyCost: 1850, capacityTons: 24 },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: "D-01", firstName: "Michael", lastName: "Boateng", hourlyRate: 31, active: true },
  { id: "D-02", firstName: "Ama", lastName: "Mensah", hourlyRate: 29.5, active: true },
  { id: "D-03", firstName: "Kwame", lastName: "Owusu", hourlyRate: 30, active: true },
];

const INITIAL_MEMBERS: WorkspaceMember[] = [
  { id: "M-01", firstName: "Godsaid", lastName: "Malock", email: "godsaid.malock@tunnelsoft.com", role: "Owner", status: "Aktiv", addedAt: "03. Sep. 2026", pinHash: "84bc54f15b12e7d6fc3d7c096861e9da862f5391de3dd2546a4c2beb1af48f22" },
  { id: "M-02", firstName: "Michael", lastName: "Boateng", email: "m.boateng@tourpilot.de", role: "Member", status: "Aktiv", addedAt: "03. Sep. 2026" },
  { id: "M-03", firstName: "Ama", lastName: "Mensah", email: "a.mensah@tourpilot.de", role: "Member", status: "Aktiv", addedAt: "03. Sep. 2026" },
];

const INITIAL_TOURS: Tour[] = [
  { id: "AT-0826", name: "Tour A · Salzburg-Linie", start: "Hamburg", destination: "Salzburg", vehicleId: "V-01", driverId: "D-01", status: "Unterwegs", jobIds: ["ZA-1846"] },
  { id: "AT-0827", name: "Tour B · Bayern Express", start: "Hamburg", destination: "München", vehicleId: "V-02", driverId: "D-02", status: "Geplant", jobIds: ["ZA-1838"] },
  { id: "AT-0828", name: "Tour C · Donau-Korridor", start: "Linz", destination: "Wien", vehicleId: "V-03", driverId: "D-03", status: "Geplant", jobIds: ["ZA-1842"] },
];

const CITY_COORDS: Record<string, [number, number]> = {
  Hamburg: [53.5511, 9.9937], Bremen: [53.0793, 8.8017], Hannover: [52.3759, 9.732],
  Nürnberg: [49.4521, 11.0767], München: [48.1351, 11.582], Rosenheim: [47.8564, 12.128],
  Regensburg: [49.0134, 12.1016], Passau: [48.5667, 13.4319], Linz: [48.3069, 14.2858],
  Wien: [48.2082, 16.3738], Salzburg: [47.8095, 13.055], Innsbruck: [47.2692, 11.4041],
};

const EMPTY_MEMBER = { firstName: "", lastName: "", email: "", role: "Member" as WorkspaceRole, pin: "" };
const EMPTY_VEHICLE = { name: "", plate: "", driverId: "", status: "Einsatzbereit" as VehicleStatus, maintenanceRate: 0.18, depreciationRate: 0.27, fixedMonthlyCost: 0, capacityTons: 24 };
const EMPTY_DRIVER = { firstName: "", lastName: "", hourlyRate: 29, active: true };
const EMPTY_TOUR = { name: "", start: "Hamburg", destination: "Salzburg", vehicleId: "V-01", driverId: "D-01" };

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

const memberName = (member?: WorkspaceMember) => member ? `${member.firstName} ${member.lastName}` : "Nicht angemeldet";

const hashPin = async (pin: string) => {
  const bytes = new TextEncoder().encode(`tourpilot:${pin}`);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join("");
};

const distanceKm = (from: string, to: string) => {
  const a = CITY_COORDS[from];
  const b = CITY_COORDS[to];
  if (!a || !b) return 120;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const optimizeStops = (tour: Tour, allJobs: Job[]) => {
  const assigned = allJobs.filter((job) => tour.jobIds.includes(job.id));
  const remaining = assigned.map((job) => ({ ...job, picked: false, delivered: false }));
  const stops: { city: string; label: string; jobId?: string }[] = [{ city: tour.start, label: "Start" }];
  let current = tour.start;
  while (remaining.some((job) => !job.delivered)) {
    const candidates = remaining.flatMap((job) => job.picked
      ? (job.delivered ? [] : [{ city: job.delivery, jobId: job.id, type: "Zustellung" as const }])
      : [{ city: job.pickup, jobId: job.id, type: "Abholung" as const }]);
    candidates.sort((a, b) => distanceKm(current, a.city) - distanceKm(current, b.city));
    const next = candidates[0];
    if (!next) break;
    const record = remaining.find((job) => job.id === next.jobId);
    if (record) {
      if (next.type === "Abholung") record.picked = true;
      else record.delivered = true;
    }
    if (next.city !== current) stops.push({ city: next.city, label: next.type, jobId: next.jobId });
    current = next.city;
  }
  if (current !== tour.destination) stops.push({ city: tour.destination, label: "Ziel" });
  return stops.map((stop, index) => ({ ...stop, segmentKm: index ? Math.round(distanceKm(stops[index - 1].city, stop.city)) : 0 }));
};

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
  const [sessionMemberId, setSessionMemberId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", email: "", pin: "" });
  const [loginError, setLoginError] = useState("");
  const [tours, setTours] = useState<Tour[]>(INITIAL_TOURS);
  const [selectedTourId, setSelectedTourId] = useState("AT-0826");
  const [tourFormOpen, setTourFormOpen] = useState(false);
  const [tourDraft, setTourDraft] = useState(EMPTY_TOUR);
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
        const stored = window.localStorage.getItem("tourpilot-state-v4") ?? window.localStorage.getItem("tourpilot-state-v3") ?? window.localStorage.getItem("tourpilot-state-v2") ?? window.localStorage.getItem("tourpilot-state-v1");
        if (stored) {
          const parsed = JSON.parse(stored) as {
            jobs?: Job[];
            acceptedIds?: string[];
            assumptions?: Assumptions;
            vehicles?: Vehicle[];
            drivers?: Driver[];
            members?: WorkspaceMember[];
            tours?: Tour[];
            selectedTourId?: string;
            selectedVehicleId?: string;
            selectedDriverId?: string;
            notices?: Notice[];
            tourStatus?: "Unterwegs" | "Pausiert" | "Abgeschlossen";
          };
          if (parsed.jobs?.length) setJobs(parsed.jobs);
          if (parsed.acceptedIds) setAcceptedIds(parsed.acceptedIds);
          if (parsed.assumptions) setAssumptions(parsed.assumptions);
          if (parsed.vehicles?.length && parsed.vehicles.every((vehicle) => "maintenanceRate" in vehicle)) setVehicles(parsed.vehicles.map((vehicle) => ({ ...vehicle, depreciationRate: vehicle.depreciationRate ?? 0.27 })));
          if (parsed.drivers?.length) setDrivers(parsed.drivers);
          if (parsed.members?.length) setMembers(parsed.members.map((member) => member.id === "M-01" && !member.pinHash ? { ...member, pinHash: INITIAL_MEMBERS[0].pinHash } : member));
          if (parsed.tours?.length) setTours(parsed.tours);
          if (parsed.selectedTourId) setSelectedTourId(parsed.selectedTourId);
          if (parsed.selectedVehicleId) setSelectedVehicleId(parsed.selectedVehicleId);
          if (parsed.selectedDriverId) setSelectedDriverId(parsed.selectedDriverId);
          if (parsed.notices) setNotices(parsed.notices);
          if (parsed.tourStatus) setTourStatus(parsed.tourStatus);
        }
      } catch {
        // A blocked or invalid local cache should never block the calculator.
      }
      try {
        const storedSession = window.sessionStorage.getItem("tourpilot-session-member");
        if (storedSession) setSessionMemberId(storedSession);
      } catch {
        // Der Vorschaumodus startet auf diesem Gerät mit dem geschützten Owner-Profil.
      }
      setSessionChecked(true);
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
      "tourpilot-state-v4",
      JSON.stringify({ jobs, acceptedIds, assumptions, vehicles, drivers, members, tours, selectedTourId, selectedVehicleId, selectedDriverId, notices, tourStatus }),
    );
  }, [jobs, acceptedIds, assumptions, vehicles, drivers, members, tours, selectedTourId, selectedVehicleId, selectedDriverId, notices, tourStatus]);

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

  const currentMember = members.find((member) => member.id === sessionMemberId);
  const canManage = currentMember?.role === "Owner" || currentMember?.role === "Administrator";
  const selectedTour = tours.find((tour) => tour.id === selectedTourId) ?? tours[0];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedTour?.vehicleId) ?? vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const selectedDriver = drivers.find((driver) => driver.id === selectedTour?.driverId) ?? drivers.find((driver) => driver.id === selectedDriverId) ?? drivers[0];
  const vehicleVariableRate = (selectedVehicle?.maintenanceRate ?? 0) + (selectedVehicle?.depreciationRate ?? 0);
  const activeAssumptions = useMemo(() => ({ ...assumptions, staffRate: selectedDriver?.hourlyRate ?? assumptions.staffRate, vehicleRate: vehicleVariableRate || assumptions.vehicleRate }), [assumptions, selectedDriver, vehicleVariableRate]);
  const evaluatedJobs = useMemo(
    () => jobs.map((job) => ({ ...job, evaluation: calculateJob(job, activeAssumptions) })),
    [jobs, activeAssumptions],
  );
  const assignedJobIds = useMemo(() => Array.from(new Set(tours.flatMap((tour) => tour.jobIds))), [tours]);
  const acceptedJobs = evaluatedJobs.filter((job) => selectedTour?.jobIds.includes(job.id));
  const acceptedRevenue = acceptedJobs.reduce((sum, job) => sum + job.revenue, 0);
  const acceptedCost = acceptedJobs.reduce((sum, job) => sum + job.evaluation.total, 0);
  const acceptedContribution = acceptedJobs.reduce((sum, job) => sum + job.evaluation.contribution, 0);
  const usedBuffer = acceptedJobs.reduce((sum, job) => sum + job.extraHours, 0);
  const bestJob = evaluatedJobs
    .filter((job) => !assignedJobIds.includes(job.id) && job.evaluation.verdict === "Lohnt sich")
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
    if (orderFilter === "Verfügbar") return !assignedJobIds.includes(job.id);
    if (orderFilter === "Eingeplant") return assignedJobIds.includes(job.id);
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
  const optimizedStops = useMemo(() => selectedTour ? optimizeStops(selectedTour, jobs) : [], [selectedTour, jobs]);
  const optimizedDistance = optimizedStops.reduce((sum, stop) => sum + stop.segmentKm, 0);
  const optimizedHours = optimizedDistance / 72 + Math.max(0, optimizedStops.length - 2) * 0.35;
  const notify = (message: string) => {
    setToast(message);
    setNotices((current) => [{ id: `${Date.now()}-${current.length}`, text: message, read: false }, ...current].slice(0, 12));
  };

  const navigateTo = (section: SectionId) => {
    if (!canManage && (section === "team" || section === "fuhrpark" || section === "einstellungen")) {
      notify("Dieser Bereich ist nur für Owner und Administratoren freigegeben.");
      setActiveSection("cockpit");
      return;
    }
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

  const addMember = async () => {
    if (!memberDraft.firstName.trim() || !memberDraft.lastName.trim() || !memberDraft.email.includes("@")) { notify("Bitte Vorname, Nachname und eine gültige E-Mail eintragen."); return; }
    if (!/^\d{4,6}$/.test(memberDraft.pin)) { notify("Die Start-PIN muss aus 4 bis 6 Ziffern bestehen."); return; }
    if (members.some((member) => member.email.toLowerCase() === memberDraft.email.trim().toLowerCase())) { notify("Diese E-Mail ist bereits freigegeben."); return; }
    const pinHash = await hashPin(memberDraft.pin);
    const member: WorkspaceMember = { firstName: memberDraft.firstName.trim(), lastName: memberDraft.lastName.trim(), email: memberDraft.email.trim(), role: memberDraft.role, pinHash, id: `M-${Date.now()}`, status: "Eingeladen", addedAt: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()) };
    setMembers((current) => [...current, member]);
    setMemberDraft(EMPTY_MEMBER);
    setMemberFormOpen(false);
    notify(`${member.firstName} ${member.lastName} wurde als ${member.role} angelegt.`);
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    const normalizedName = loginForm.name.trim().toLowerCase();
    const normalizedEmail = loginForm.email.trim().toLowerCase();
    const match = members.find((member) => `${member.firstName} ${member.lastName}`.toLowerCase() === normalizedName && member.email.toLowerCase() === normalizedEmail);
    if (!match) { setLoginError("Kein freigegebener Benutzer mit diesem Namen und dieser E-Mail gefunden."); return; }
    if (!/^\d{4,6}$/.test(loginForm.pin) || !match.pinHash || await hashPin(loginForm.pin) !== match.pinHash) { setLoginError("Die PIN ist nicht korrekt oder wurde noch nicht vom Administrator vergeben."); return; }
    setSessionMemberId(match.id);
    setMembers((current) => current.map((member) => member.id === match.id ? { ...member, status: "Aktiv" } : member));
    window.sessionStorage.setItem("tourpilot-session-member", match.id);
    if (match.role === "Member" && (activeSection === "team" || activeSection === "fuhrpark" || activeSection === "einstellungen")) setActiveSection("cockpit");
    setLoginForm({ name: "", email: "", pin: "" });
  };

  const signOut = () => {
    window.sessionStorage.removeItem("tourpilot-session-member");
    setSessionMemberId(null);
    setProfileOpen(false);
  };

  const resetMemberPin = async (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;
    const pin = window.prompt(`Neue PIN für ${memberName(member)} (4–6 Ziffern):`);
    if (pin === null) return;
    if (!/^\d{4,6}$/.test(pin)) { notify("Die PIN muss aus 4 bis 6 Ziffern bestehen."); return; }
    const pinHash = await hashPin(pin);
    setMembers((current) => current.map((item) => item.id === memberId ? { ...item, pinHash } : item));
    notify(`Neue PIN für ${memberName(member)} wurde gespeichert.`);
  };

  const addTour = () => {
    if (!tourDraft.name.trim() || !tourDraft.start.trim() || !tourDraft.destination.trim()) { notify("Bitte Tourname, Start und Ziel eintragen."); return; }
    const tour: Tour = { ...tourDraft, id: `AT-${String(826 + tours.length).padStart(4, "0")}`, status: "Geplant", jobIds: [] };
    setTours((current) => [...current, tour]);
    setSelectedTourId(tour.id);
    setTourDraft(EMPTY_TOUR);
    setTourFormOpen(false);
    notify(`${tour.name} wurde angelegt.`);
  };

  const updateSelectedTour = (changes: Partial<Tour>) => {
    if (!selectedTour) return;
    setTours((current) => current.map((tour) => tour.id === selectedTour.id ? { ...tour, ...changes } : tour));
  };

  const assignJobToTour = (jobId: string, tourId: string) => {
    setTours((current) => current.map((tour) => ({ ...tour, jobIds: tour.id === tourId ? Array.from(new Set([...tour.jobIds, jobId])) : tour.jobIds.filter((id) => id !== jobId) })));
    setAcceptedIds((current) => Array.from(new Set([...current, jobId])));
    const target = tours.find((tour) => tour.id === tourId);
    notify(`${jobId} wurde ${target?.name ?? "der Tour"} zugeordnet.`);
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
    if (selectedTour) assignJobToTour(savedId, selectedTour.id);
    setCalculatorOpen(false);
  };

  const removeFromTour = (jobId: string) => {
    if (!selectedTour) return;
    setTours((current) => current.map((tour) => tour.id === selectedTour.id ? { ...tour, jobIds: tour.jobIds.filter((id) => id !== jobId) } : tour));
    setAcceptedIds((current) => tours.some((tour) => tour.id !== selectedTour.id && tour.jobIds.includes(jobId)) ? current : current.filter((id) => id !== jobId));
    notify(`${jobId} wurde aus ${selectedTour.name} entfernt.`);
  };

  const deleteJob = (jobId: string) => {
    if (!window.confirm(`Auftrag ${jobId} wirklich löschen?`)) return;
    setJobs((current) => current.filter((job) => job.id !== jobId));
    setAcceptedIds((current) => current.filter((id) => id !== jobId));
    setTours((current) => current.map((tour) => ({ ...tour, jobIds: tour.jobIds.filter((id) => id !== jobId) })));
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
    if (!selectedTour) return;
    const order: TourStatus[] = ["Geplant", "Unterwegs", "Pausiert", "Abgeschlossen"];
    const next = order[(order.indexOf(selectedTour.status) + 1) % order.length];
    updateSelectedTour({ status: next });
    if (next !== "Geplant") setTourStatus(next);
    notify(`${selectedTour.id}: Status auf „${next}“ geändert.`);
  };

  const resetWorkspace = () => {
    if (!window.confirm("Alle lokal gespeicherten TourPilot-Daten zurücksetzen?")) return;
    setJobs(INITIAL_JOBS);
    setAcceptedIds([]);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setVehicles(INITIAL_VEHICLES);
    setDrivers(INITIAL_DRIVERS);
    setMembers(INITIAL_MEMBERS);
    setTours(INITIAL_TOURS);
    setSelectedTourId("AT-0826");
    setSelectedVehicleId("V-01");
    setSelectedDriverId("D-01");
    setTourStatus("Unterwegs");
    setNotices(INITIAL_NOTICES);
    window.localStorage.removeItem("tourpilot-state-v1");
    window.localStorage.removeItem("tourpilot-state-v2");
    window.localStorage.removeItem("tourpilot-state-v3");
    window.localStorage.removeItem("tourpilot-state-v4");
    notify("TourPilot wurde auf die Ausgangsdaten zurückgesetzt.");
  };

  if (!sessionChecked || !currentMember) {
    return <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark"><span>TP</span></span><span className="brand-copy dark"><strong>TourPilot</strong><small>Disposition & Kalkulation</small></span></div>
        <div className="auth-heading"><span className="auth-kicker">Geschützter Arbeitsbereich</span><h1>Anmelden</h1><p>Nur vom Administrator freigegebene Benutzer erhalten Zugriff. Deine Rolle wird automatisch aus dem Benutzerkonto übernommen.</p></div>
        <form className="auth-form" onSubmit={login}>
          <label><span>Name</span><input value={loginForm.name} onChange={(event) => setLoginForm((current) => ({ ...current, name: event.target.value }))} placeholder="Vor- und Nachname" autoComplete="name" /></label>
          <label><span>E-Mail</span><input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@firma.de" autoComplete="email" /></label>
          <label><span>PIN</span><input type="password" inputMode="numeric" maxLength={6} value={loginForm.pin} onChange={(event) => setLoginForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "") }))} placeholder="4–6 Ziffern" autoComplete="current-password" /></label>
          {loginError && <p className="auth-error" role="alert">{loginError}</p>}
          <button className="accept-action auth-submit" type="submit">Anmelden</button>
        </form>
        <div className="preview-access"><strong>Owner-Zugang für diese Vorschau</strong><span>Godsaid Malock · godsaid.malock@tunnelsoft.com · PIN 2580</span></div>
        <p className="auth-footnote">Die Freigabe funktioniert in dieser Vorschau gerätebezogen. E-Mail-Codes und ein echtes serverseitiges Kontosystem werden erst mit dem Authentifizierungs-Backend aktiviert.</p>
      </section>
    </main>;
  }

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
              <span className="nav-count">{BASE_METRICS.orders + assignedJobIds.length}</span>
            </button>
            <button className={`nav-link ${activeSection === "touren" ? "active" : ""}`} type="button" onClick={() => navigateTo("touren")}>
              <Icon>↗</Icon>
              Touren
            </button>
            <button className={`nav-link ${activeSection === "kalkulation" ? "active" : ""}`} type="button" onClick={() => navigateTo("kalkulation")}>
              <Icon>∑</Icon>
              Kalkulation
            </button>

            {canManage && <p className="nav-label second">Verwaltung</p>}
            {canManage && <>
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
            </>}
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
            <span className="avatar">{currentMember.firstName.charAt(0)}{currentMember.lastName.charAt(0)}</span>
            <span>
              <strong>{memberName(currentMember)}</strong>
              <small>{currentMember.role}</small>
            </span>
            <span className="profile-more" aria-hidden="true">•••</span>
          </button>
          {profileOpen && (
            <div className="profile-popover">
              <strong>{memberName(currentMember)}</strong>
              <span>{currentMember.role} · {currentMember.email}</span>
              {canManage && <button type="button" onClick={() => navigateTo("team")}>Workspace & Benutzer</button>}
              {canManage && <button type="button" onClick={() => navigateTo("einstellungen")}>Einstellungen öffnen</button>}
              <button type="button" onClick={signOut}>Abmelden</button>
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
          {activeSection === "team" && canManage ? (
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
                <div className="admin-form-grid five">
                  <label><span>Vorname</span><input value={memberDraft.firstName} onChange={(event) => setMemberDraft((current) => ({ ...current, firstName: event.target.value }))} placeholder="Vorname" /></label>
                  <label><span>Nachname</span><input value={memberDraft.lastName} onChange={(event) => setMemberDraft((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nachname" /></label>
                  <label><span>E-Mail</span><input type="email" value={memberDraft.email} onChange={(event) => setMemberDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@firma.de" /></label>
                  <label><span>Start-PIN</span><input type="password" inputMode="numeric" maxLength={6} value={memberDraft.pin} onChange={(event) => setMemberDraft((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "") }))} placeholder="4–6 Ziffern" /></label>
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
                    <td><div className="member-actions"><button className="member-pin" type="button" onClick={() => resetMemberPin(member.id)}>PIN setzen</button><button className="member-remove" type="button" disabled={member.role === "Owner"} onClick={() => removeMember(member.id)}>{member.role === "Owner" ? "Geschützt" : "Entfernen"}</button></div></td>
                  </tr>)}
                </tbody></table></div>
                {!filteredMembers.length && <p className="empty-members">Keine passenden Benutzer gefunden.</p>}
              </section>

              <section className="role-explainer"><article><span>O</span><div><strong>Owner</strong><p>Vollzugriff, Rollenverwaltung und geschützte Grundeinstellungen.</p></div></article><article><span>A</span><div><strong>Administrator</strong><p>Kann Benutzer, Fuhrpark, Fahrer und Kalkulationswerte verwalten.</p></div></article><article><span>M</span><div><strong>Member</strong><p>Kann Touren und Aufträge bearbeiten, aber keine Benutzerrechte ändern.</p></div></article></section>
              <div className="auth-roadmap"><span>🔐</span><div><strong>Freigabe aktiv</strong><p>Name, E-Mail und PIN müssen exakt zu einem angelegten Benutzer passen. Rollen können ausschließlich Owner und Administratoren vergeben; E-Mail-Codes folgen mit dem Backend.</p></div></div>
            </section>
          ) : activeSection === "touren" && selectedTour ? (
            <section className="tours-page" id="touren">
              <div className="team-heading">
                <div><button className="back-link" type="button" onClick={() => navigateTo("cockpit")}>← Zurück zum Cockpit</button><p className="section-kicker">Tourenplanung</p><h1>Touren & Stopps</h1><p>Touren benennen, Aufträge zuordnen und die Reihenfolge automatisch optimieren.</p></div>
                <button className="primary-button" type="button" onClick={() => setTourFormOpen((open) => !open)}>＋ Neue Tour</button>
              </div>

              {tourFormOpen && <section className="admin-form-panel">
                <div className="admin-form-head"><div><strong>Neue Tour anlegen</strong><span>Die Bezeichnung bleibt frei – zum Beispiel Tour A, Nordroute oder Salzburg-Linie.</span></div><button type="button" onClick={() => setTourFormOpen(false)}>×</button></div>
                <div className="admin-form-grid five">
                  <label><span>Tourname</span><input value={tourDraft.name} onChange={(event) => setTourDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Tour D · Südroute" /></label>
                  <label><span>Start</span><input value={tourDraft.start} onChange={(event) => setTourDraft((current) => ({ ...current, start: event.target.value }))} placeholder="Hamburg" /></label>
                  <label><span>Ziel</span><input value={tourDraft.destination} onChange={(event) => setTourDraft((current) => ({ ...current, destination: event.target.value }))} placeholder="Salzburg" /></label>
                  <label><span>Fahrzeug</span><select value={tourDraft.vehicleId} onChange={(event) => setTourDraft((current) => ({ ...current, vehicleId: event.target.value }))}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate}</option>)}</select></label>
                  <label><span>Fahrer</span><select value={tourDraft.driverId} onChange={(event) => setTourDraft((current) => ({ ...current, driverId: event.target.value }))}>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{shortName(driver)}</option>)}</select></label>
                </div>
                <div className="admin-form-actions"><button className="secondary-action" type="button" onClick={() => setTourFormOpen(false)}>Abbrechen</button><button className="accept-action" type="button" onClick={addTour}>Tour anlegen</button></div>
              </section>}

              <div className="tour-selector" aria-label="Tour auswählen">
                {tours.map((tour) => <button key={tour.id} className={tour.id === selectedTour.id ? "selected" : ""} type="button" onClick={() => setSelectedTourId(tour.id)}><span>{tour.id}</span><strong>{tour.name}</strong><small>{tour.start} → {tour.destination} · {tour.jobIds.length} Aufträge</small><em>{tour.status}</em></button>)}
              </div>

              <div className="tour-planning-grid">
                <article className="route-planner-card">
                  <div className="card-header compact"><div><p className="section-kicker">Optimierte Reihenfolge</p><h2>{selectedTour.name}</h2><p>{selectedTour.start} → {selectedTour.destination}</p></div><button className="status-badge status-action" type="button" onClick={toggleTourStatus}><i /> {selectedTour.status}</button></div>
                  <div className="route-insights"><span><strong>{optimizedDistance.toLocaleString("de-DE")} km</strong><small>berechnete Strecke</small></span><span><strong>{formatDuration(optimizedHours)}</strong><small>Fahrzeit ohne Live-Stau</small></span><span><strong>{optimizedStops.length}</strong><small>Stopps</small></span></div>
                  <ol className="route-timeline">{optimizedStops.map((stop, index) => <li key={`${stop.city}-${stop.jobId ?? index}`}><span className={index === 0 ? "start" : index === optimizedStops.length - 1 ? "end" : "middle"}>{index === 0 ? "A" : index === optimizedStops.length - 1 ? "B" : index}</span><div><strong>{stop.city}</strong><small>{stop.label}{stop.jobId ? ` · ${stop.jobId}` : ""}</small></div>{index > 0 && <em>+{stop.segmentKm} km</em>}</li>)}</ol>
                  <div className="traffic-note"><span>◎</span><div><strong>Verkehrsdaten vorbereitet</strong><p>Die Reihenfolge basiert aktuell auf Luftlinien-Distanzen und Abholung-vor-Zustellung. Live-Stau und exakte Fahrzeiten werden nach Verbindung einer Karten-API ergänzt.</p></div></div>
                </article>

                <aside className="tour-config-card">
                  <div><p className="section-kicker">Tour konfigurieren</p><h2>Ressourcen</h2></div>
                  <label><span>Name</span><input value={selectedTour.name} onChange={(event) => updateSelectedTour({ name: event.target.value })} /></label>
                  <div className="two-fields"><label><span>Start</span><input value={selectedTour.start} onChange={(event) => updateSelectedTour({ start: event.target.value })} /></label><label><span>Ziel</span><input value={selectedTour.destination} onChange={(event) => updateSelectedTour({ destination: event.target.value })} /></label></div>
                  <label><span>Fahrzeug</span><select value={selectedTour.vehicleId} onChange={(event) => updateSelectedTour({ vehicleId: event.target.value })}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate}</option>)}</select></label>
                  <label><span>Fahrer</span><select value={selectedTour.driverId} onChange={(event) => updateSelectedTour({ driverId: event.target.value })}>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{shortName(driver)}</option>)}</select></label>
                  <div className="vehicle-cost-preview"><span>Wartung<strong>{(selectedVehicle?.maintenanceRate ?? 0).toLocaleString("de-DE")} €/km</strong></span><span>Wertverlust<strong>{(selectedVehicle?.depreciationRate ?? 0).toLocaleString("de-DE")} €/km</strong></span><span>Fahrer<strong>{(selectedDriver?.hourlyRate ?? 0).toLocaleString("de-DE")} €/h</strong></span></div>
                </aside>
              </div>

              <section className="tour-orders-card"><div className="card-header compact"><div><p className="section-kicker">Auftragszuordnung</p><h2>Aufträge einer Tour zuweisen</h2></div><span className="total-cost">{selectedTour.jobIds.length} eingeplant</span></div><div className="tour-order-list">{evaluatedJobs.map((job) => { const assignedTour = tours.find((tour) => tour.jobIds.includes(job.id)); return <article key={job.id}><div><span>{job.id}</span><strong>{job.pickup} → {job.delivery}</strong><small>{job.pallets} Paletten · {job.weight.toLocaleString("de-DE")} t · {formatCurrency(job.revenue)}</small></div><select aria-label={`${job.id} Tour zuordnen`} value={assignedTour?.id ?? ""} onChange={(event) => event.target.value ? assignJobToTour(job.id, event.target.value) : setTours((current) => current.map((tour) => ({ ...tour, jobIds: tour.jobIds.filter((id) => id !== job.id) })))}><option value="">Nicht eingeplant</option>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}</select><span className={`verdict ${job.evaluation.tone}`}>{job.evaluation.verdict}</span></article>; })}</div></section>
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
              <small>aus {BASE_METRICS.orders + assignedJobIds.length} Aufträgen</small>
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
                    <button className="status-badge status-action" type="button" onClick={toggleTourStatus}><i /> {selectedTour?.status}</button>
                    <span className="tour-id">{selectedTour?.id}</span>
                  </div>
                  <h2>{selectedTour?.start} → {selectedTour?.destination}</h2>
                  <p>{selectedVehicle?.name} · {selectedVehicle?.plate} · Fahrer: {shortName(selectedDriver)}</p>
                </div>
                <button className="text-button" type="button" onClick={() => navigateTo("touren")}>Tour planen <span>→</span></button>
              </div>

              <div className="route-map route-map-meaningful" aria-label="Optimierter Tourverlauf">
                <div className="map-grid" />
                <div className="route-path" />
                {optimizedStops.slice(0, 4).map((stop, index) => <div className={`route-stop stop-${index}`} key={`${stop.city}-${index}`}><span className={`map-pin ${index === 0 ? "dark" : index === optimizedStops.length - 1 ? "green" : "light"}`}>{index === 0 ? "A" : index === optimizedStops.length - 1 ? "B" : index}</span><div><strong>{stop.city}</strong><small>{stop.label}{stop.jobId ? ` · ${stop.jobId}` : ""}</small></div></div>)}
                <div className="map-caption"><span>▱</span> {optimizedDistance.toLocaleString("de-DE")} km <i /> ca. {formatDuration(optimizedHours)}</div>
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
                      <th>Auftrag</th><th>Umsatz</th><th>Umweg</th><th>Zeit</th><th>Mehrgewinn</th><th>Tour</th><th>Bewertung</th>
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
                        <td><select className="inline-tour-select" value={tours.find((tour) => tour.jobIds.includes(job.id))?.id ?? ""} onChange={(event) => event.target.value && assignJobToTour(job.id, event.target.value)}><option value="">Auswählen</option>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}</select></td>
                        <td>
                          <button
                            className={`verdict ${assignedJobIds.includes(job.id) ? "accepted" : job.evaluation.tone}`}
                            type="button"
                            onClick={() => openCalculator(job)}
                          >
                            {assignedJobIds.includes(job.id) ? "Eingeplant" : job.evaluation.verdict}
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

          {canManage && <section className="management-grid" id="fuhrpark">
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
                <label><span>Wertverlust</span><div className="input-unit"><NumericInput min="0" step="0.01" value={vehicleDraft.depreciationRate} onValue={(value) => setVehicleDraft((current) => ({ ...current, depreciationRate: value }))} /><b>€/km</b></div></label>
                <label><span>Fixkosten monatlich</span><div className="input-unit"><NumericInput min="0" step="10" value={vehicleDraft.fixedMonthlyCost} onValue={(value) => setVehicleDraft((current) => ({ ...current, fixedMonthlyCost: value }))} /><b>€</b></div></label>
                <label><span>Nutzlast</span><div className="input-unit"><NumericInput min="0" step="0.5" value={vehicleDraft.capacityTons} onValue={(value) => setVehicleDraft((current) => ({ ...current, capacityTons: value }))} /><b>t</b></div></label>
                <button className="accept-action compact-save" type="button" onClick={addVehicle}>Fahrzeug speichern</button>
              </div>}
              <div className="vehicle-grid">
                {vehicles.map((vehicle) => (
                  <div className={`vehicle-item ${selectedVehicleId === vehicle.id ? "selected" : ""}`} key={vehicle.id}>
                    <span className="vehicle-symbol">▰</span>
                    <button className="vehicle-copy vehicle-select" type="button" onClick={() => { setSelectedVehicleId(vehicle.id); if (selectedTour) updateSelectedTour({ vehicleId: vehicle.id, driverId: vehicle.driverId || selectedTour.driverId }); if (vehicle.driverId) setSelectedDriverId(vehicle.driverId); notify(`${vehicle.plate} wurde für ${selectedTour?.name ?? "die Tour"} ausgewählt.`); }}><strong>{vehicle.name}</strong><small>{vehicle.plate} · {shortName(drivers.find((driver) => driver.id === vehicle.driverId))}</small><em>{vehicle.maintenanceRate.toLocaleString("de-DE")} € Wartung + {vehicle.depreciationRate.toLocaleString("de-DE")} € Wertverlust /km · {vehicle.capacityTons.toLocaleString("de-DE")} t</em></button>
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
          </section>}
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
              <section className="detail-section assignment-section"><div className="form-section-title"><span>00</span><div><strong>Ressourcen & Vorkalkulation</strong><small>Kostensätze werden automatisch übernommen</small></div></div><div className="assignment-grid"><label><span>Fahrzeug</span><select value={selectedTour?.vehicleId ?? selectedVehicleId} onChange={(event) => updateSelectedTour({ vehicleId: event.target.value })}><option value="" disabled>Fahrzeug auswählen</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate}</option>)}</select></label><label><span>Fahrer</span><select value={selectedTour?.driverId ?? selectedDriverId} onChange={(event) => updateSelectedTour({ driverId: event.target.value })}><option value="" disabled>Fahrer auswählen</option>{drivers.filter((driver) => driver.active).map((driver) => <option key={driver.id} value={driver.id}>{shortName(driver)}</option>)}</select></label></div><div className="auto-calculation"><div><span>Personal</span><strong>{activeAssumptions.staffRate.toLocaleString("de-DE")} €/h</strong></div><div><span>Wartung</span><strong>{(selectedVehicle?.maintenanceRate ?? 0).toLocaleString("de-DE")} €/km</strong></div><div><span>Wertverlust</span><strong>{(selectedVehicle?.depreciationRate ?? 0).toLocaleString("de-DE")} €/km</strong></div></div></section>
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
                  <label><span>Wartung · {selectedVehicle?.plate}</span><div className="input-unit"><NumericInput min="0" step="0.01" value={selectedVehicle?.maintenanceRate ?? 0} onValue={(value) => setVehicles((current) => current.map((vehicle) => vehicle.id === selectedVehicle?.id ? { ...vehicle, maintenanceRate: value } : vehicle))} /><b>€/km</b></div></label>
                  <label><span>Wertverlust · {selectedVehicle?.plate}</span><div className="input-unit"><NumericInput min="0" step="0.01" value={selectedVehicle?.depreciationRate ?? 0} onValue={(value) => setVehicles((current) => current.map((vehicle) => vehicle.id === selectedVehicle?.id ? { ...vehicle, depreciationRate: value } : vehicle))} /><b>€/km</b></div></label>
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
                  <div><span>Fahrzeug / Wartung & Wertverlust</span><strong>{formatCurrency(draftResult.vehicle)}</strong></div>
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
