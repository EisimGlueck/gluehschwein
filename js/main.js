/* =========================================================
   Glühschwein – Script
   1. Saison & Öffnungszeiten (hier pflegen!)
   2. Status-Leiste „Heute geöffnet …“
   3. Menü (mobil) & aktiver Menüpunkt
   4. Reservierungsformular (Formspree)
   5. Karte erst nach Klick laden
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. SAISON & ÖFFNUNGSZEITEN – jedes Jahr hier anpassen ---------- */
  var SAISON = {
    start: "2026-10-23",
    ende: "2027-01-09",
    taeglichAb: "2026-11-30",          // ab hier auch montags geöffnet
    zeiten: {                          // Wochentag: [von, bis] in Stunden; null = Ruhetag
      0: [14, 20],                     // Sonntag
      1: null,                         // Montag (bis „taeglichAb“ Ruhetag)
      2: [14, 22], 3: [14, 22], 4: [14, 22], 5: [14, 22], 6: [14, 22]
    },
    montagAb: [14, 22],                // Montag ab „taeglichAb“
    sonder: {                          // Sonderzeiten; null = geschlossen
      "2026-12-24": [14, 18],
      "2026-12-25": null,
      "2026-12-26": [14, 18],
      "2026-12-31": [14, 18],
      "2027-01-01": null
    },
    letzteReservierungVorEnde: 1       // Stunden vor Schluss keine Reservierung mehr
  };

  function iso(d) {
    var m = d.getMonth() + 1, t = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (t < 10 ? "0" : "") + t;
  }
  function ausIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function deutsch(s) { var p = s.split("-"); return p[2] + "." + p[1] + "." + p[0]; }

  /* Gibt [von, bis] zurück, oder null (geschlossen), oder "ausserhalb" */
  function zeitenAm(datumIso) {
    if (datumIso < SAISON.start || datumIso > SAISON.ende) return "ausserhalb";
    if (Object.prototype.hasOwnProperty.call(SAISON.sonder, datumIso)) return SAISON.sonder[datumIso];
    var tag = ausIso(datumIso).getDay();
    if (tag === 1) return datumIso >= SAISON.taeglichAb ? SAISON.montagAb : null;
    return SAISON.zeiten[tag];
  }

  /* ---------- 2. STATUS-LEISTE & FENSTERLICHT ----------
     Offen  → grüner Punkt, Fenster im Titelbild leuchten (Klasse „ist-offen“)
     Zu     → rosa Punkt, Fenster dunkel (Klasse „ist-zu“)
     Wird jede Minute neu geprüft, damit es um 14 bzw. 22 Uhr von selbst umschaltet. */
  var statusBox = document.getElementById("status");
  var statusText = document.getElementById("status-text");
  function statusAktualisieren() {
    var jetztDatum = new Date();
    var heute = iso(jetztDatum);
    var z = zeitenAm(heute);
    var offen = false, text;
    if (z === "ausserhalb") {
      text = heute < SAISON.start
        ? "Saisonstart am " + deutsch(SAISON.start) + " – mir freuen uns!"
        : "Die Saison ist vorbei – danke fürs Kommen!";
    } else if (z === null) {
      text = "Heute geschlossen · Saison bis " + deutsch(SAISON.ende);
    } else {
      var jetzt = jetztDatum.getHours() + jetztDatum.getMinutes() / 60;
      offen = jetzt >= z[0] && jetzt < z[1];
      text = (offen ? "Jetzt geöffnet" : "Heute geöffnet") + ": " + z[0] + " – " + z[1] + " Uhr";
    }
    document.documentElement.classList.toggle("ist-offen", offen);
    document.documentElement.classList.toggle("ist-zu", !offen);
    if (statusBox && statusText) {
      statusBox.classList.toggle("status--zu", !offen);
      statusText.textContent = text;
    }
  }
  statusAktualisieren();
  setInterval(statusAktualisieren, 60000);

  /* ---------- 3. MENÜ ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("hauptmenue");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var auf = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!auf));
      burger.setAttribute("aria-label", auf ? "Menü öffnen" : "Menü schließen");
      nav.classList.toggle("offen", !auf);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Menü öffnen");
        nav.classList.remove("offen");
      }
    });
  }
  var links = document.querySelectorAll(".nav a[href^='#']");
  if ("IntersectionObserver" in window && links.length) {
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("aktiv", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) {
      var ziel = document.querySelector(a.getAttribute("href"));
      if (ziel) beobachter.observe(ziel);
    });
  }
  var jahr = document.getElementById("jahr");
  if (jahr) jahr.textContent = new Date().getFullYear();

  /* ---------- 4. RESERVIERUNGSFORMULAR ---------- */
  var form = document.getElementById("reservierungs-formular");
  if (form) {
    var datum = form.querySelector("#f-datum");
    var uhrzeit = form.querySelector("#f-uhrzeit");
    var datumInfo = form.querySelector("#f-datum-info");
    var meldung = document.getElementById("formular-meldung");

    // Frühestes Datum: heute (oder Saisonstart)
    var heuteIso = iso(new Date());
    datum.min = heuteIso > SAISON.start ? heuteIso : SAISON.start;
    datum.max = SAISON.ende;

    function uhrzeitenFuellen() {
      var wert = datum.value;
      uhrzeit.innerHTML = "";
      var z = wert ? zeitenAm(wert) : undefined;
      if (!wert) { uhrzeit.add(new Option("Erst Datum wählen", "")); uhrzeit.disabled = true; datumInfo.textContent = "Saison: " + deutsch(SAISON.start) + " – " + deutsch(SAISON.ende); return; }
      if (z === "ausserhalb") { uhrzeit.add(new Option("–", "")); uhrzeit.disabled = true; datumInfo.textContent = "Das Datum liegt außerhalb der Saison."; return; }
      if (z === null) { uhrzeit.add(new Option("An dem Tag geschlossen", "")); uhrzeit.disabled = true; datumInfo.textContent = "An dem Tag ist das Glühschwein geschlossen."; return; }
      uhrzeit.disabled = false;
      uhrzeit.add(new Option("Bitte wählen", ""));
      for (var h = z[0]; h <= z[1] - SAISON.letzteReservierungVorEnde; h += 0.5) {
        var t = Math.floor(h) + ":" + (h % 1 ? "30" : "00") + " Uhr";
        uhrzeit.add(new Option(t, t));
      }
      datumInfo.textContent = "Geöffnet: " + z[0] + " – " + z[1] + " Uhr";
    }
    datum.addEventListener("change", uhrzeitenFuellen);
    uhrzeitenFuellen();

    // Firmenadresse ein-/ausblenden
    var firmaAn = form.querySelector("#f-firma-an");
    var firmaBox = form.querySelector("#firmen-felder");
    var zahlung = form.querySelector("#f-zahlung");
    function firmaUmschalten() {
      var an = firmaAn.checked;
      firmaBox.hidden = !an;
      firmaAn.setAttribute("aria-expanded", String(an));
      firmaBox.querySelectorAll("input").forEach(function (i) { i.disabled = !an; });
      if (an && zahlung) zahlung.value = "Rechnung / Überweisung (nach Rücksprache)";
    }
    firmaAn.addEventListener("change", firmaUmschalten);
    firmaUmschalten();

    function fehler(feld, text) {
      var box = feld.closest(".feld");
      box.classList.add("feld--fehler");
      var alt = box.querySelector(".fehlertext");
      if (!alt) { alt = document.createElement("div"); alt.className = "fehlertext"; box.appendChild(alt); }
      alt.textContent = text;
    }
    function fehlerWeg() {
      form.querySelectorAll(".feld--fehler").forEach(function (b) { b.classList.remove("feld--fehler"); });
      form.querySelectorAll(".fehlertext").forEach(function (t) { t.remove(); });
    }
    function fehlerWegRes(e) {
      var box = e.target.closest(".feld--fehler");
      if (!box) return;
      box.classList.remove("feld--fehler");
      var t = box.querySelector(".fehlertext"); if (t) t.remove();
    }
    form.addEventListener("change", fehlerWegRes);
    form.addEventListener("input", fehlerWegRes);
    function zeigen(art, text) { meldung.className = "meldung meldung--" + art; meldung.textContent = text; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      fehlerWeg();
      meldung.className = ""; meldung.textContent = "";
      var erstes = null;
      function f(feld, text) { fehler(feld, text); if (!erstes) erstes = feld; }

      var z = datum.value ? zeitenAm(datum.value) : undefined;
      if (!datum.value) f(datum, "Bitte ein Datum wählen.");
      else if (datum.value < datum.min) f(datum, "Das Datum liegt in der Vergangenheit.");
      else if (z === "ausserhalb") f(datum, "Bitte ein Datum in der Saison wählen.");
      else if (z === null) f(datum, "An dem Tag haben mir zu.");
      if (!uhrzeit.disabled && !uhrzeit.value) f(uhrzeit, "Bitte eine Uhrzeit wählen.");
      var pers = form.querySelector("#f-personen");
      var n = parseInt(pers.value, 10);
      if (!n || n < 6) f(pers, "Reservieren geht ab 6 Personen.");
      var name = form.querySelector("#f-name");
      if (!name.value.trim()) f(name, "Bitte deinen Namen angeben.");
      var mail = form.querySelector("#f-email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) f(mail, "Bitte eine gültige E-Mail-Adresse angeben.");
      var tel = form.querySelector("#f-telefon");
      if (tel.value.replace(/[^0-9]/g, "").length < 6) f(tel, "Bitte eine Telefonnummer angeben.");
      if (firmaAn.checked) {
        [["#f-firma", "Bitte den Firmennamen angeben."],
         ["#f-firma-strasse", "Bitte Straße und Hausnummer angeben."],
         ["#f-firma-plz", "Bitte die PLZ angeben."],
         ["#f-firma-ort", "Bitte den Ort angeben."]].forEach(function (x) {
          var el = form.querySelector(x[0]);
          if (!el.value.trim()) f(el, x[1]);
        });
        var rm = form.querySelector("#f-firma-mail");
        if (rm.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rm.value.trim())) f(rm, "Bitte eine gültige E-Mail-Adresse angeben.");
      }
      var ds = form.querySelector("#f-datenschutz");
      if (!ds.checked) f(ds, "Bitte der Datenschutzerklärung zustimmen.");

      if (erstes) { erstes.focus(); return; }

      if (form.action.indexOf("DEINE-ID") !== -1) {
        zeigen("info", "Das Formular ist noch nicht verbunden – die Formspree-ID fehlt noch. Bis dahin bitte telefonisch reservieren.");
        return;
      }

      var knopf = form.querySelector("button[type=submit]");
      knopf.disabled = true;
      zeigen("info", "Wird gesendet …");
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("Fehler " + r.status);
          form.reset();
          uhrzeitenFuellen();
          firmaUmschalten();
          zeigen("ok", "Danke! Deine Anfrage ist bei uns. Mir melden uns per E-Mail – erst dann ist der Tisch fest.");
        })
        .catch(function () {
          zeigen("fehler", "Hoppla, das hat nicht geklappt. Bitte probier's nochmal oder ruf uns an.");
        })
        .then(function () { knopf.disabled = false; });
    });
  }

  /* ---------- 4b. BEWERBUNGSFORMULAR (jobs/) ---------- */
  var bform = document.getElementById("bewerbungs-formular");
  if (bform) {
    var bMeldung = document.getElementById("bewerbung-meldung");
    var details = document.getElementById("erfahrung-details");
    var detailsFeld = document.getElementById("b-erfahrung");
    function erfahrungUmschalten() {
      var gewaehlt = bform.querySelector("input[name=gastro_erfahrung]:checked");
      var zeigen = !!gewaehlt && gewaehlt.value !== "Nein, aber ich lerne schnell";
      details.hidden = !zeigen;
      detailsFeld.disabled = !zeigen;
    }
    bform.querySelectorAll("input[name=gastro_erfahrung]").forEach(function (r) { r.addEventListener("change", erfahrungUmschalten); });
    erfahrungUmschalten();

    // Fehlermarkierung verschwindet, sobald man das Feld korrigiert
    function fehlerWegBei(e) {
      var box = e.target.closest(".feld--fehler, .auswahl--fehler");
      if (!box) return;
      box.classList.remove("feld--fehler", "auswahl--fehler");
      var t = box.querySelector(".fehlertext"); if (t) t.remove();
    }
    bform.addEventListener("change", fehlerWegBei);
    bform.addEventListener("input", fehlerWegBei);

    function bZeigen(art, text) { bMeldung.className = "meldung meldung--" + art; bMeldung.textContent = text; }
    function bFehler(el, text) {
      var box = el.closest(".feld") || el.closest(".auswahl");
      box.classList.add(box.classList.contains("auswahl") ? "auswahl--fehler" : "feld--fehler");
      var t = document.createElement("div"); t.className = "fehlertext"; t.textContent = text; box.appendChild(t);
    }

    bform.addEventListener("submit", function (e) {
      e.preventDefault();
      bform.querySelectorAll(".feld--fehler,.auswahl--fehler").forEach(function (b) { b.classList.remove("feld--fehler", "auswahl--fehler"); });
      bform.querySelectorAll(".fehlertext").forEach(function (t) { t.remove(); });
      bMeldung.className = ""; bMeldung.textContent = "";
      var erstes = null;
      function f(el, text) { bFehler(el, text); if (!erstes) erstes = el; }
      var q = function (sel) { return bform.querySelector(sel); };
      if (!q("#b-vorname").value.trim()) f(q("#b-vorname"), "Bitte deinen Vornamen angeben.");
      if (!q("#b-nachname").value.trim()) f(q("#b-nachname"), "Bitte deinen Nachnamen angeben.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q("#b-email").value.trim())) f(q("#b-email"), "Bitte eine gültige E-Mail-Adresse angeben.");
      if (q("#b-telefon").value.replace(/[^0-9]/g, "").length < 6) f(q("#b-telefon"), "Bitte eine Telefonnummer angeben.");
      if (!q("#b-wohnort").value.trim()) f(q("#b-wohnort"), "Bitte deinen Wohnort angeben.");
      if (!q("#b-18").checked) f(q("#b-18"), "Bei uns kannst du erst ab 18 Jahren arbeiten.");
      if (!q("input[name=gastro_erfahrung]:checked")) f(q("input[name=gastro_erfahrung]"), "Bitte eine Antwort wählen.");
      if (!q("#b-art").value) f(q("#b-art"), "Bitte auswählen.");
      if (!q("input[name=tage]:checked")) f(q("input[name=tage]"), "Bitte mindestens einen Tag wählen.");
      if (!q("#b-datenschutz").checked) f(q("#b-datenschutz"), "Bitte der Datenschutzerklärung zustimmen.");
      if (erstes) { erstes.focus(); return; }

      if (bform.action.indexOf("DEINE-JOBS-ID") !== -1) {
        bZeigen("info", "Das Bewerbungsformular ist noch nicht verbunden – die Formspree-ID fehlt noch. Ruf uns bis dahin gern an.");
        return;
      }
      // Mehrfachauswahl (Tage, Bereiche, Extras) zu einer Zeile zusammenfassen
      var daten = new FormData(bform);
      ["tage", "bereich", "extras"].forEach(function (name) {
        var werte = daten.getAll(name);
        daten.delete(name);
        if (werte.length) daten.append(name, werte.join(", "));
      });
      var knopf = bform.querySelector("button[type=submit]");
      knopf.disabled = true;
      bZeigen("info", "Wird gesendet …");
      fetch(bform.action, { method: "POST", body: daten, headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("Fehler " + r.status);
          bform.reset(); erfahrungUmschalten();
          bZeigen("ok", "Danke für deine Bewerbung! Mir melden uns bald bei dir.");
        })
        .catch(function () { bZeigen("fehler", "Hoppla, das hat nicht geklappt. Bitte probier's nochmal oder ruf uns an."); })
        .then(function () { knopf.disabled = false; });
    });
  }

  /* ---------- 4c. TEILEN (Jobs-Seite) ----------
     Teilt immer die Adresse, unter der die Seite gerade aufgerufen wird
     (Vorschau auf github.io oder später dasglühschwein.de). */
  var teilen = document.getElementById("teilen");
  if (teilen) {
    var url = location.origin + location.pathname.replace(/index\.html$/, "");
    var titel = "Saisonjob im Glühschwein Nürnberg";
    var text = "Das Glühschwein am Spielzeugmuseum sucht Leute für die Saison – hier bewerben:";
    var wa = document.getElementById("teilen-wa");
    var mail = document.getElementById("teilen-mail");
    wa.href = "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
    mail.href = "mailto:?subject=" + encodeURIComponent(titel) + "&body=" + encodeURIComponent(text + " " + url);
    var nativ = document.getElementById("teilen-nativ");
    if (navigator.share) {
      nativ.hidden = false;
      nativ.addEventListener("click", function () {
        navigator.share({ title: titel, text: text, url: url }).catch(function () {});
      });
    }
    var kopieren = document.getElementById("teilen-kopieren");
    kopieren.addEventListener("click", function () {
      var label = kopieren.querySelector("span");
      function fertig() { label.textContent = "Link kopiert ✓"; setTimeout(function () { label.textContent = "Link kopieren"; }, 2500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(fertig, function () { window.prompt("Link zum Kopieren:", url); });
      } else { window.prompt("Link zum Kopieren:", url); }
    });
  }

  /* ---------- 5. KARTE (2-Klick-Lösung) ---------- */
  var karteKnopf = document.getElementById("karte-laden");
  if (karteKnopf) {
    karteKnopf.addEventListener("click", function () {
      var platz = document.getElementById("karten-platz");
      var f = document.createElement("iframe");
      f.title = "Karte: Glühschwein im Innenhof des Spielzeugmuseums";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer";
      f.src = "https://www.openstreetmap.org/export/embed.html?bbox=11.0700%2C49.4530%2C11.0782%2C49.4565&layer=mapnik&marker=49.45474%2C11.07409";
      platz.innerHTML = "";
      platz.appendChild(f);
    });
  }
})();
