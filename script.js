// Halloween Schloss Alsbach – Event-Guide 2026

// Veranstaltungstage: "abend" = Abendveranstaltung (Fr/Sa), "familie" = Familien-Halloween (So).
// Die Zahl ist das Wochenende (1–3) für die Hervorhebung der Termin-Chips im Kopfbereich.
const EVENT_DAYS = {
    '2026-10-16': ['abend', 1], '2026-10-17': ['abend', 1], '2026-10-18': ['familie', 1],
    '2026-10-23': ['abend', 2], '2026-10-24': ['abend', 2], '2026-10-25': ['familie', 2],
    '2026-10-30': ['abend', 3], '2026-10-31': ['abend', 3], '2026-11-01': ['familie', 3],
};

const DAY_INFO = {
    abend: { title: 'Abendveranstaltung', meta: 'Empfohlen ab 16 Jahren' },
    familie: { title: 'Familien-Halloween', meta: 'Empfohlen ab 6 Jahren' },
};

// Position der Stationen auf img/lageplan-2026.jpg in Prozent: [links, oben, Breite, Höhe].
// Bei einem neuen Lageplan-Bild mit anderem Ausschnitt müssen diese Werte angepasst werden.
const ZONES = {
    1: [6.6, 75.4, 6.8, 6.2],
    2: [13.4, 64.9, 4.6, 7.0],
    3: [15.6, 57.3, 4.6, 7.1],
    4: [21.3, 45.2, 5.4, 11.7],
    5: [28.0, 48.2, 6.5, 12.6],
    6: [16.7, 36.3, 6.0, 8.1],
    7: [9.3, 9.1, 19.5, 25.9],
    8: [7.5, 0.2, 23.0, 12.1],
    9: [30.8, 35.8, 26.0, 6.5],
    10: [54.1, 21.7, 5.1, 12.0],
    11: [73.3, 6.6, 20.8, 10.8],
    12: [73.3, 18.5, 21.4, 11.7],
    13: [73.3, 33.7, 20.8, 13.1],
    14: [72.9, 47.9, 21.3, 16.2],
    15: [16.9, 78.6, 7.4, 8.1],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- Zeit ----------

// Zum Testen: ?zeit=2026-10-17T21:10 simuliert einen Zeitpunkt.
function getNow() {
    const test = new URLSearchParams(location.search).get('zeit');
    const d = test ? new Date(test) : new Date();
    return isNaN(d) ? new Date() : d;
}

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// Nach Mitternacht (bis 5 Uhr) zählt noch der Vorabend als "heute".
function eventDay(now) {
    const d = new Date(now);
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return d;
}

function minutesSinceDayStart(now) {
    const m = now.getHours() * 60 + now.getMinutes();
    return now.getHours() < 5 ? m + 24 * 60 : m;
}

function formatWait(min) {
    if (min < 1) return 'jetzt';
    if (min < 60) return `in ${min} Min.`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `in ${h} Std. ${m} Min.` : `in ${h} Std.`;
}

const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------- Showzeiten-Tabs ----------

function selectTab(name) {
    $$('.tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === name)));
    $$('.timeline').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
}

$$('.tab').forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));

// ---------- Live-Status ----------

let autoTabDone = false;

function updateToday() {
    const now = getNow();
    const day = eventDay(now);
    const iso = isoDate(day);
    const entry = EVENT_DAYS[iso];

    const label = $('#today-label');
    const title = $('#today-title');
    const meta = $('#today-meta');
    const next = $('#today-next');

    $$('.timeline li').forEach((li) => li.classList.remove('is-past', 'is-next'));
    $$('.dates li').forEach((li) => li.classList.toggle('is-current', !!entry && li.dataset.weekend === String(entry[1])));

    if (entry) {
        const [type] = entry;
        label.textContent = 'Heute';
        title.textContent = DAY_INFO[type].title;
        meta.textContent = DAY_INFO[type].meta;

        if (!autoTabDone) { selectTab(type); autoTabDone = true; }

        const nowMin = minutesSinceDayStart(now);
        const shows = $$(`.timeline[data-panel="${type}"] li`);
        const upcoming = shows.find((li) => toMinutes(li.dataset.time) > nowMin);
        shows.forEach((li) => { if (toMinutes(li.dataset.time) <= nowMin) li.classList.add('is-past'); });

        next.hidden = false;
        if (upcoming) {
            upcoming.classList.add('is-next');
            const name = upcoming.querySelector('span').textContent;
            next.classList.remove('is-done');
            next.href = '#shows';
            next.innerHTML = `<time>${upcoming.dataset.time}</time><span>${name}<small>Nächste Show · ${formatWait(toMinutes(upcoming.dataset.time) - nowMin)}</small></span>`;
        } else {
            next.classList.add('is-done');
            next.removeAttribute('href');
            next.textContent = 'Alle Shows für heute sind vorbei. Danke, dass ihr da wart!';
        }
        return;
    }

    const upcomingDay = Object.keys(EVENT_DAYS).sort().find((d) => d > iso);
    next.hidden = true;
    if (upcomingDay) {
        const [type] = EVENT_DAYS[upcomingDay];
        label.textContent = 'Nächster Termin';
        title.textContent = dateFmt.format(new Date(`${upcomingDay}T12:00:00`));
        meta.textContent = `${DAY_INFO[type].title} · ${DAY_INFO[type].meta}`;
    } else {
        label.textContent = 'Saison 2026';
        title.textContent = 'Das war Halloween 2026!';
        meta.textContent = 'Danke, dass ihr da wart. Wir sehen uns nächstes Jahr!';
    }
}

updateToday();
setInterval(updateToday, 30 * 1000);

// ---------- Lageplan: Stationen markieren ----------

function placeHighlight(canvas, zone) {
    const hl = $('.map-hl', canvas);
    const box = ZONES[zone];
    if (!hl || !box) return;
    const [l, t, w, h] = box;
    const padX = 1.2, padY = 1.8;
    hl.style.left = `${l - padX}%`;
    hl.style.top = `${t - padY}%`;
    hl.style.width = `${w + padX * 2}%`;
    hl.style.height = `${h + padY * 2}%`;
    hl.classList.remove('is-on');
    void hl.offsetWidth; // Animation neu starten
    hl.classList.add('is-on');
}

let activeZone = null;

$$('.zone').forEach((btn) => {
    btn.addEventListener('click', () => {
        activeZone = btn.dataset.zone;
        $$('.zone').forEach((b) => b.classList.toggle('is-active', b === btn));
        $$('.map-canvas').forEach((canvas) => placeHighlight(canvas, activeZone));
        $('.map').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ---------- Lageplan: Vollansicht mit Zoom ----------

const viewer = $('#viewer');
const viewerScroll = $('#viewer-scroll');
const viewerCanvas = $('#viewer-canvas');
const ZOOM_STEPS = [1, 1.6, 2.4, 3.4];
let zoomIndex = 0;

function setZoom(index, focusX = 0.5, focusY = 0.5) {
    zoomIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, index));
    const viewW = viewerScroll.clientWidth;
    const viewH = viewerScroll.clientHeight;
    // Punkt, der vorher im Fokus war, als Anteil der Gesamtfläche
    const fx = (viewerScroll.scrollLeft + viewW * focusX) / viewerScroll.scrollWidth;
    const fy = (viewerScroll.scrollTop + viewH * focusY) / viewerScroll.scrollHeight;

    viewerCanvas.style.width = `${viewW * ZOOM_STEPS[zoomIndex]}px`;

    viewerScroll.scrollLeft = fx * viewerScroll.scrollWidth - viewW * focusX;
    viewerScroll.scrollTop = fy * viewerScroll.scrollHeight - viewH * focusY;
    $('#zoom-out').disabled = zoomIndex === 0;
    $('#zoom-in').disabled = zoomIndex === ZOOM_STEPS.length - 1;
}

// Gewählte Station in die Mitte der Vollansicht scrollen
function centerOnZone(zone) {
    const [l, t, w, h] = ZONES[zone];
    const canvasRect = viewerCanvas.getBoundingClientRect();
    const scrollRect = viewerScroll.getBoundingClientRect();
    const x = canvasRect.left - scrollRect.left + viewerScroll.scrollLeft + ((l + w / 2) / 100) * canvasRect.width;
    const y = canvasRect.top - scrollRect.top + viewerScroll.scrollTop + ((t + h / 2) / 100) * canvasRect.height;
    viewerScroll.scrollLeft = x - viewerScroll.clientWidth / 2;
    viewerScroll.scrollTop = y - viewerScroll.clientHeight / 2;
}

function openViewer() {
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    setZoom(window.innerWidth < 700 ? 1 : 0);
    if (activeZone) {
        placeHighlight(viewerCanvas, activeZone);
        centerOnZone(activeZone);
    }
    $('#viewer-close').focus();
}

function closeViewer() {
    viewer.hidden = true;
    document.body.style.overflow = '';
    $('#map-open').focus();
}

$('#map-open').addEventListener('click', openViewer);
$('#viewer-close').addEventListener('click', closeViewer);
$('#zoom-in').addEventListener('click', () => setZoom(zoomIndex + 1));
$('#zoom-out').addEventListener('click', () => setZoom(zoomIndex - 1));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !viewer.hidden) closeViewer(); });
window.addEventListener('resize', () => { if (!viewer.hidden) setZoom(zoomIndex); });

// Doppeltippen zoomt an der getippten Stelle hinein bzw. wieder heraus
let lastTap = 0;
viewerScroll.addEventListener('pointerup', (e) => {
    const t = Date.now();
    if (t - lastTap < 300) {
        const rect = viewerScroll.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        setZoom(zoomIndex === ZOOM_STEPS.length - 1 ? 0 : zoomIndex + 1, fx, fy);
        lastTap = 0;
    } else {
        lastTap = t;
    }
});

// ---------- Scare-Zone-Regeln: Sprache ----------

$$('[data-set-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.scare');
        card.dataset.lang = btn.dataset.setLang;
        $$('[data-set-lang]', card).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });
});

// ---------- Tabbar: aktiven Bereich markieren ----------

const navLinks = $$('.tabbar a');
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === entry.target.id)));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main .section').forEach((section) => observer.observe(section));

// ---------- Offline-Fähigkeit ----------

// Nur auf der echten Seite (https), damit lokale Vorschauen nicht aus dem Cache kommen.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}
