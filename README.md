# TourPilot

TourPilot ist ein deutschsprachiges Dispositions- und Kalkulations-Cockpit für Speditionen. Der MVP vergleicht Zusatzaufträge mit einer bestehenden Tour und zeigt transparent, ob sich ein Umweg unter Berücksichtigung von Zeitpuffer und Vollkosten lohnt.

## Was der MVP kann

- bestehende Tour mit Umsatz, Kosten, Deckungsbeitrag und Marge darstellen
- mehrere Angebote im Tourkorridor direkt vergleichen
- Zusatzstrecke und Zusatzzeit gegen den freien Tourpuffer prüfen
- Diesel-, Personal-, Fahrzeug-, Maut-, Material- und sonstige Kosten kalkulieren
- Entscheidung als **Lohnt sich**, **Manuell prüfen** oder **Ablehnen** ausgeben
- rentable Aufträge in die aktive Tour übernehmen und Kennzahlen live aktualisieren
- eigene Angebote anlegen und zur Vergleichsliste hinzufügen
- Eingaben und übernommene Aufträge lokal im Browser speichern
- responsiv auf Desktop, Tablet und Smartphone arbeiten

## Kalkulationsmodell

```text
Dieselkosten      = Zusatzkilometer / 100 × Verbrauch × Dieselpreis
Personalkosten    = Zusatzstunden × Personalkostensatz
Fahrzeugkosten    = Zusatzkilometer × Fahrzeugkostensatz
Zusatzkosten      = Diesel + Personal + Fahrzeug + Maut + Material + Sonstiges
Mehrgewinn        = Angebotspreis − Zusatzkosten
Marge             = Mehrgewinn / Angebotspreis × 100
```

Die aktuelle Entscheidungslogik:

- **Lohnt sich:** Zeitpuffer reicht, Mehrgewinn ist positiv und Marge liegt bei mindestens 20 %.
- **Manuell prüfen:** Zeitpuffer reicht und der Auftrag ist positiv, aber die Marge liegt unter 20 %.
- **Ablehnen:** Zeitpuffer wird überschritten oder der Mehrgewinn ist nicht positiv.

Alle betrieblichen Annahmen lassen sich direkt im Kalkulationsfenster verändern.

## Technischer Aufbau

- React 19 und TypeScript
- Next.js-kompatible App-Struktur über Vinext/Vite
- Cloudflare-Worker-kompatibler Produktions-Build
- keine externen Karten- oder Routing-Schlüssel im MVP
- lokale Speicherung über `localStorage`

## Lokal starten

Voraussetzung: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Produktionsprüfung:

```bash
npm run build
npm run lint
```

## Nächste Ausbaustufe

1. echte Straßenkilometer und Fahrzeiten über eine Routing-API
2. Dieselpreis-, Maut- und Verkehrsdaten je Land
3. Fahrzeug-, Fahrer- und Ladekapazitäten
4. gemeinsame Datenbank statt rein lokaler Speicherung
5. Benutzerrollen für Disposition, Fahrer und Geschäftsführung
6. Angebotsimport aus Frachtenbörsen, E-Mail oder ERP/TMS
7. Tourvarianten und automatische Reihenfolgeoptimierung

## Wichtiger Hinweis

Die angezeigten Beispielstrecken und Kosten sind Demonstrationsdaten. Vor einem produktiven Einsatz müssen Unternehmenswerte, Lenk- und Ruhezeiten, Mautlogik, Vertragskosten und reale Routingdaten fachlich hinterlegt werden.
