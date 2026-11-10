# Glühschwein – Die gute Bude am Spielzeugmuseum

Homepage für **dasglühschwein.de**. Statisches HTML/CSS, gehostet über GitHub Pages, Reservierungsanfragen über Formspree.
Keine Cookies, kein Tracking, Schrift selbst gehostet → kein Cookie-Banner nötig.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Die ganze Seite: Home · Getränke · Speisen · Reservierung · Infos |
| `impressum.html`, `datenschutz.html` | Rechtstexte (gelb markierte Platzhalter ausfüllen!) |
| `css/style.css` | Design. Farben und Schriften ganz oben als Variablen |
| `js/main.js` | Saison & Öffnungszeiten, Status „Heute geöffnet“, Formular, Karte |
| `bilder/` | Logo, Skyline, Produktbilder, Slogan-Band (WebP) und Favicon |
| `fonts/` | Schrift Inter (SIL Open Font License, siehe `fonts/OFL.txt`) |

## Was muss ich wo ändern?

- **Preise / Karte** → `index.html`, Abschnitte `id="getraenke"` und `id="speisen"`
- **Öffnungszeiten** → an **zwei** Stellen:
  1. `js/main.js`, ganz oben `SAISON` (steuert Status-Leiste und die Uhrzeiten im Formular)
  2. `index.html`, Tabelle im Abschnitt `id="infos"`
- **Formspree-ID** → `index.html`, im `<form action="https://formspree.io/f/DEINE-ID">`
- **E-Mail, Telefon** → Fußzeile in `index.html`, `impressum.html`, `datenschutz.html`

Gelb hinterlegte Stellen (`class="platzhalter"`) sind noch offen.

## Online stellen (Schritt für Schritt)

1. **Formspree**: Auf formspree.io ein Formular anlegen, Empfänger = Reservierungs-E-Mail. Die ID (z. B. `xyzabcd`) statt `DEINE-ID` eintragen. Eine Test-Anfrage schicken und die Bestätigungs-Mail von Formspree anklicken.
2. **GitHub Pages**: Repository → *Settings* → *Pages* → Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → *Save*.
   Vorschau danach unter `https://eisimglueck.github.io/gluehschwein/`.
3. **DNS bei one.com** für `dasglühschwein.de` (technisch heißt die Domain `xn--dasglhschwein-0ob.de`):
   - A-Records für `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - CNAME für `www`: `eisimglueck.github.io`
4. In GitHub unter *Pages* → *Custom domain* `xn--dasglhschwein-0ob.de` eintragen → *Save* (legt automatisch eine Datei `CNAME` an).
5. Wenn das Zertifikat fertig ist (kann einige Stunden dauern): Haken bei **Enforce HTTPS**.
6. Später `dasgluehschwein.de` bei one.com als Weiterleitung auf `https://dasglühschwein.de` einrichten.
7. **Testen**: iPhone/Safari, Desktop, Formular, alle Links, Impressum, Datenschutz.

## Noch offen

- [ ] Impressumsdaten Horst Dornberger
- [ ] Reservierungs-E-Mail + Formspree-ID
- [ ] Telefonnummer bestätigen
- [x] Logo eingebaut (als Sonne über der Skyline, in Kopf- und Fußzeile)
- [ ] Fotos vom Hof
- [ ] Was die Seite außerhalb der Saison zeigt
- [ ] Datenschutz & Impressum rechtlich prüfen lassen
- [ ] Später: Pakete für Gruppen / Weihnachtsfeiern

## Übertragen an einen anderen Account

Repository → *Settings* → ganz unten *Transfer ownership*. Danach in *Pages* die Domain prüfen und bei one.com den `www`-CNAME auf `<neuer-account>.github.io` ändern.
