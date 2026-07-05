// ---- Part 2: live clock in the top bar + welcome window ----
function updateTime() {
  var now = new Date();
  document.querySelector("#timeElement").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("date").textContent =
    now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
updateTime();
setInterval(updateTime, 1000);

// ---- Part 3: dragging ----
function dragElement(element) {
  var initialX = 0, initialY = 0, currentX = 0, currentY = 0;
  var header = document.getElementById(element.id + "header");

  if (header) {
    header.onmousedown = startDragging;
  } else {
    element.onmousedown = startDragging;
  }

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = whileDragging;
  }

  function whileDragging(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = (element.offsetTop - currentY) + "px";
    element.style.left = (element.offsetLeft - currentX) + "px";
  }

  function stopDragging() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// ---- Part 4: window management + z-index layering ----
var biggestIndex = 1;
var topBar = document.querySelector("#top");

function openWindow(element) {
  element.style.display = "flex";
  biggestIndex++;
  element.style.zIndex = biggestIndex;
  topBar.style.zIndex = biggestIndex + 1;
}

function closeWindow(element) {
  element.style.display = "none";
}

function handleWindowTap(element) {
  biggestIndex++;
  element.style.zIndex = biggestIndex;
  topBar.style.zIndex = biggestIndex + 1;
  deselectIcon(selectedIcon);
}

function initializeWindow(windowId) {
  var element = document.querySelector("#" + windowId);
  var closeButton = document.querySelector("#" + windowId + "close");
  var openButton = document.querySelector("#" + windowId + "open");

  closeButton.addEventListener("click", function () { closeWindow(element); });
  if (openButton) {
    openButton.addEventListener("click", function () { openWindow(element); });
  }
  element.addEventListener("mousedown", function () { handleWindowTap(element); });
  dragElement(element);
}

// ---- Part 4: desktop icon selection ----
var selectedIcon = undefined;

function selectIcon(element) {
  element.classList.add("selected");
  selectedIcon = element;
}

function deselectIcon(element) {
  if (element != undefined) {
    element.classList.remove("selected");
  }
}

function handleIconTap(element) {
  if (element.classList.contains("selected")) {
    deselectIcon(element);
    selectedIcon = undefined;
  } else {
    deselectIcon(selectedIcon);
    selectIcon(element);
  }
}

// Part 5 refactor: one reusable function wires any desktop icon to its window
// (single click selects, double click opens, and the icon can be dragged around)
function initializeIcon(iconId, windowId) {
  var icon = document.querySelector("#" + iconId);
  var win = document.querySelector("#" + windowId);
  icon.addEventListener("click", function () {
    if (icon._justDragged) return;
    handleIconTap(icon);
  });
  icon.addEventListener("dblclick", function () {
    if (icon._justDragged) return;
    openWindow(win);
  });
  makeIconDraggable(icon);
}

// ---- desktop icon drag & drop (positions persist in localStorage) ----
var ICON_KEY = "blackbird-icons";

function loadIconPositions() {
  try {
    var s = localStorage.getItem(ICON_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return {};
}

var iconPositions = loadIconPositions();

// desktop grid the icons snap to
var GRID = 100;
var GRID_ORIGIN_X = 16;
var GRID_ORIGIN_Y = 72;

function snapToGrid(v, origin) {
  return origin + Math.round((v - origin) / GRID) * GRID;
}

function saveIconPositions() {
  try { localStorage.setItem(ICON_KEY, JSON.stringify(iconPositions)); } catch (e) {}
}

function layoutIcons() {
  var apps = document.querySelectorAll(".appicon");
  apps.forEach(function (icon, i) {
    var saved = iconPositions[icon.id];
    // default column, or snap any saved position onto the grid
    var x = saved ? snapToGrid(saved.x, GRID_ORIGIN_X) : GRID_ORIGIN_X;
    var y = saved ? snapToGrid(saved.y, GRID_ORIGIN_Y) : GRID_ORIGIN_Y + i * GRID;
    icon.style.left = x + "px";
    icon.style.top = y + "px";
  });
}

function makeIconDraggable(icon) {
  var startX, startY, originLeft, originTop, moved = false;

  icon.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    originLeft = icon.offsetLeft;
    originTop = icon.offsetTop;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    e.preventDefault();
  });

  function onMove(e) {
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 4) {
      moved = true;
      icon.classList.add("dragging");
    }
    if (moved) {
      // snap the icon to the nearest grid cell as it moves
      var nx = snapToGrid(originLeft + dx, GRID_ORIGIN_X);
      var ny = snapToGrid(originTop + dy, GRID_ORIGIN_Y);
      nx = Math.max(0, Math.min(nx, window.innerWidth - icon.offsetWidth));
      ny = Math.max(GRID_ORIGIN_Y, Math.min(ny, window.innerHeight - icon.offsetHeight));
      icon.style.left = nx + "px";
      icon.style.top = ny + "px";
    }
  }

  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (moved) {
      icon.classList.remove("dragging");
      iconPositions[icon.id] = { x: icon.offsetLeft, y: icon.offsetTop };
      saveIconPositions();
      // suppress the click that fires right after a drag so it doesn't toggle selection
      icon._justDragged = true;
      setTimeout(function () { icon._justDragged = false; }, 0);
    }
  }
}

// clicking empty desktop clears the selection
document.body.addEventListener("mousedown", function (e) {
  if (!e.target.closest(".appicon")) {
    deselectIcon(selectedIcon);
    selectedIcon = undefined;
  }
});

// ---- Part 4: Notes content ----
var STORAGE_KEY = "blackbird-notes";

var defaultNotes = [
  {
    title: "About",
    date: "Blackbird",
    body: "Hey, I'm Blackbird.\n\nI like building things, playing and making games, learning new stuff, and drinking too much coffee.\n\nThis whole site is a little web-based operating system: draggable windows, a top bar with a clock, and apps like this one."
  },
  {
    title: "How notes work",
    date: "Read me",
    body: "These notes are saved in your own browser, not on a server.\n\nThat means the notes you add are private to you. I can see mine, you can see yours, and we can't see each other's. If you open this site on another device or clear your browser data, your notes won't follow you.\n\nUse the \"+ New note\" button to add your own. Edit any note by clicking it and typing."
  }
];

function loadNotes() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultNotes.slice();
}

function saveNotes() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(content)); } catch (e) {}
}

function today() {
  return new Date().toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

var content = loadNotes();
var currentIndex = 0;

function renderSidebar() {
  var sidebar = document.querySelector("#sidebar");
  sidebar.innerHTML = "";

  var addBtn = document.createElement("div");
  addBtn.className = "addnote";
  addBtn.textContent = "+ New note";
  addBtn.addEventListener("click", addNote);
  sidebar.appendChild(addBtn);

  for (let i = 0; i < content.length; i++) {
    var note = content[i];
    var div = document.createElement("div");
    div.className = "entry" + (i === currentIndex ? " active" : "");

    var t = document.createElement("p");
    t.className = "entrytitle";
    t.textContent = note.title || "Untitled";
    var d = document.createElement("p");
    d.className = "entrydate";
    d.textContent = note.date || "";
    div.appendChild(t);
    div.appendChild(d);

    div.addEventListener("click", function () { openNote(i); });
    sidebar.appendChild(div);
  }
}

function openNote(index) {
  currentIndex = index;
  var note = content[index];
  var pane = document.querySelector("#notecontent");
  pane.innerHTML = "";

  var titleInput = document.createElement("input");
  titleInput.className = "note-title";
  titleInput.type = "text";
  titleInput.placeholder = "Title";
  titleInput.value = note.title;

  var bodyInput = document.createElement("textarea");
  bodyInput.className = "note-body";
  bodyInput.placeholder = "Write your note...";
  bodyInput.value = note.body;

  var del = document.createElement("button");
  del.className = "note-delete";
  del.textContent = "Delete note";
  del.addEventListener("click", function () { deleteNote(index); });

  titleInput.addEventListener("input", function () {
    content[currentIndex].title = titleInput.value;
    saveNotes();
    renderSidebar();
  });
  bodyInput.addEventListener("input", function () {
    content[currentIndex].body = bodyInput.value;
    saveNotes();
  });

  pane.appendChild(titleInput);
  pane.appendChild(bodyInput);
  pane.appendChild(del);

  renderSidebar();
}

function addNote() {
  content.push({ title: "Untitled", date: today(), body: "" });
  currentIndex = content.length - 1;
  saveNotes();
  openNote(currentIndex);
}

function deleteNote(index) {
  content.splice(index, 1);
  if (content.length === 0) {
    currentIndex = 0;
    saveNotes();
    renderSidebar();
    document.querySelector("#notecontent").innerHTML = "";
    return;
  }
  currentIndex = Math.max(0, index - 1);
  saveNotes();
  openNote(currentIndex);
}

renderSidebar();
if (content.length > 0) openNote(0);

// ---- Part 5: advanced app — Projects ----
var projects = [
  { name: "Crossfire Vault", type: "Game", tag: "Real-time 3D multiplayer stealth heist.",
    body: "Two crews rob each other's vaults deep in a cover-dense, vertical facility. You score only by stealing the enemy's loot and hauling it to your extraction — you win by extracted value, not kills. Sneak in, crack the vault, then carry the loot back slow and exposed." },
  { name: "RECOIL", type: "Game", tag: "Your gun is your engine.",
    body: "You can't walk, thrust, or steer — the only force you control is the kick of your weapon. Every shot shoves you the opposite way. To fly right you aim left and fire; to brake you shoot the way you're drifting. Movement and combat are the same act." },
  { name: "STASIS", type: "Game", tag: "Time moves only when you do.",
    body: "A top-down arena where every bullet and enemy freezes the instant you stand still, and snaps to full speed the moment you move. Weave through frozen bullet-storms, line up your shot, then dart. One hit ends it." },
  { name: "Signal Drift", type: "Game", tag: "Decode transmissions on a hex grid.",
    body: "A browser puzzle-strategy game. You're a deep-space relay operator intercepting fragmented transmissions and decoding them by routing energy across a hexagonal grid. Your decoding choices branch the narrative and gate which levels you see next." },
  { name: "Sunstone", type: "Game", tag: "A pixel RPG built from nothing but code.",
    body: "A self-contained 2D pixel-art RPG on the HTML5 Canvas with vanilla ES modules. No external assets — every sprite, tile, portrait, sound effect, and music track is generated procedurally at runtime." },
  { name: "Chroma Rift", type: "Game", tag: "Match the color. Break the rift.",
    body: "Online and local versus. Grab XP orbs to power up; first to 8 KOs wins." },
  { name: "Catacombs of Yendor", type: "Game", tag: "A roguelike dungeon crawler.",
    body: "Descend into the catacombs, fight what's waiting down there, and try not to meet the YOU DIED screen. Reach the bottom for victory." },
  { name: "Gravity Wells", type: "Game", tag: "A gravity sandbox.",
    body: "Click anywhere to bend space, drag to fling particles, and scroll over a well to grow it." },
  { name: "Midnight Garden", type: "Game", tag: "A calm planting toy.",
    body: "Click the ground to plant something, let it grow, and watch the sky turn." },
  { name: "Preflight", type: "Study", tag: "FAA Private Pilot study app.",
    body: "A dark, mobile-first study app for the FAA Private Pilot written test and the checkride oral exam, built with Expo / React Native for Android." },
  { name: "Trial Run", type: "Tool", tag: "Human-like auto-typer.",
    body: "Types text into the active editor one character at a time with randomized, human-like timing and periodic breaks." },
  { name: "Stardance", type: "Web", tag: "The web OS you're looking at.",
    body: "This site — a little web-based operating system with draggable windows, a top bar and clock, and apps like this one. Built for Hack Club's Stardance." }
];

var FILTERS = ["All", "Games", "Tools", "Study"];
var projectFilter = "All";
var selectedProject = 0;

function typeColor(type) {
  if (type === "Study") return "#9ece6a";
  if (type === "Tool" || type === "Web") return "#f6c177";
  return "#6dd5ed"; // Game
}

function matchesFilter(type) {
  if (projectFilter === "Games") return type === "Game";
  if (projectFilter === "Tools") return type === "Tool" || type === "Web";
  if (projectFilter === "Study") return type === "Study";
  return true;
}

function renderFilters() {
  var bar = document.querySelector("#projectFilters");
  bar.innerHTML = "";
  FILTERS.forEach(function (f) {
    var pill = document.createElement("span");
    pill.className = "filter-pill" + (f === projectFilter ? " active" : "");
    pill.textContent = f;
    pill.addEventListener("click", function () {
      projectFilter = f;
      var visible = visibleIndexes();
      if (visible.indexOf(selectedProject) === -1 && visible.length) selectedProject = visible[0];
      renderProjects();
    });
    bar.appendChild(pill);
  });
}

function visibleIndexes() {
  var out = [];
  for (var i = 0; i < projects.length; i++) {
    if (matchesFilter(projects[i].type)) out.push(i);
  }
  return out;
}

function renderGrid() {
  var grid = document.querySelector("#projectGrid");
  grid.innerHTML = "";
  visibleIndexes().forEach(function (i) {
    var p = projects[i];
    var card = document.createElement("div");
    card.className = "project-card" + (i === selectedProject ? " active" : "");
    card.style.borderLeftColor = typeColor(p.type);

    var name = document.createElement("p");
    name.className = "project-name";
    name.textContent = p.name;
    var tag = document.createElement("p");
    tag.className = "project-tag";
    tag.textContent = p.tag;

    card.appendChild(name);
    card.appendChild(tag);
    card.addEventListener("click", function () {
      selectedProject = i;
      renderProjects();
    });
    grid.appendChild(card);
  });
}

function showProjectDetail() {
  var detail = document.querySelector("#projectDetail");
  var p = projects[selectedProject];
  detail.innerHTML = "";

  var badge = document.createElement("span");
  badge.className = "project-badge";
  badge.textContent = p.type;
  badge.style.background = typeColor(p.type);

  var name = document.createElement("h2");
  name.textContent = p.name;
  var tag = document.createElement("p");
  tag.className = "detail-tag";
  tag.textContent = p.tag;
  var body = document.createElement("p");
  body.className = "detail-body";
  body.textContent = p.body;

  detail.appendChild(badge);
  detail.appendChild(name);
  detail.appendChild(tag);
  detail.appendChild(body);
}

function renderProjects() {
  renderFilters();
  renderGrid();
  showProjectDetail();
}

renderProjects();

// ---- Extra app: Calculator ----
(function () {
  var display = document.querySelector("#calcDisplay");
  var keys = document.querySelector(".calc-keys");

  var current = "0";
  var previous = null;
  var operator = null;
  var waitingForOperand = false;

  function fmt(n) {
    if (!isFinite(n)) return "Error";
    return String(parseFloat(n.toPrecision(12)));
  }

  function compute(a, b, op) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    if (op === "/") return a / b;
    return b;
  }

  function refresh() {
    display.textContent = current;
    document.querySelectorAll(".ckey.op").forEach(function (b) {
      b.classList.toggle("armed", waitingForOperand && b.dataset.op === operator);
    });
  }

  function inputDigit(d) {
    if (waitingForOperand) { current = d; waitingForOperand = false; }
    else { current = current === "0" ? d : current + d; }
  }

  function inputDot() {
    if (waitingForOperand) { current = "0."; waitingForOperand = false; }
    else if (current.indexOf(".") === -1) { current += "."; }
  }

  function clearAll() { current = "0"; previous = null; operator = null; waitingForOperand = false; }
  function negate() { if (current !== "0") current = current.charAt(0) === "-" ? current.slice(1) : "-" + current; }
  function percent() { current = fmt(parseFloat(current) / 100); }

  function setOperator(next) {
    var input = parseFloat(current);
    if (operator !== null && waitingForOperand) { operator = next; return; }
    if (previous === null) { previous = input; }
    else if (operator) { previous = compute(previous, input, operator); current = fmt(previous); }
    operator = next;
    waitingForOperand = true;
  }

  function equals() {
    if (operator === null) return;
    var input = parseFloat(current);
    current = fmt(compute(previous, input, operator));
    previous = null;
    operator = null;
    waitingForOperand = true;
  }

  keys.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.num !== undefined) inputDigit(b.dataset.num);
    else if (b.dataset.op) setOperator(b.dataset.op);
    else if (b.dataset.action === "clear") clearAll();
    else if (b.dataset.action === "negate") negate();
    else if (b.dataset.action === "percent") percent();
    else if (b.dataset.action === "dot") inputDot();
    else if (b.dataset.action === "equals") equals();
    refresh();
  });

  refresh();
})();

// ---- Extra app: Weather (live data, Open-Meteo, no API key) ----
(function () {
  var form = document.querySelector("#weatherForm");
  var input = document.querySelector("#weatherInput");
  var unitBtn = document.querySelector("#weatherUnit");
  var currentEl = document.querySelector("#weatherCurrent");
  var forecastEl = document.querySelector("#weatherForecast");

  var useFahrenheit = true;
  var lastQuery = null;

  function setLoading() {
    currentEl.innerHTML = '<div class="weather-loading">Loading&hellip;</div>';
    forecastEl.innerHTML = "";
  }
  function setError(msg) {
    var box = document.createElement("div");
    box.className = "weather-error";
    box.textContent = msg;
    currentEl.innerHTML = "";
    currentEl.appendChild(box);
    forecastEl.innerHTML = "";
  }

  function codeInfo(code) {
    if (code === 0) return { kind: "sun", text: "Clear sky" };
    if (code === 1) return { kind: "sun", text: "Mainly clear" };
    if (code === 2) return { kind: "partly", text: "Partly cloudy" };
    if (code === 3) return { kind: "cloud", text: "Overcast" };
    if (code === 45 || code === 48) return { kind: "fog", text: "Fog" };
    if (code >= 51 && code <= 57) return { kind: "rain", text: "Drizzle" };
    if (code >= 61 && code <= 67) return { kind: "rain", text: "Rain" };
    if (code >= 71 && code <= 77) return { kind: "snow", text: "Snow" };
    if (code >= 80 && code <= 82) return { kind: "rain", text: "Rain showers" };
    if (code === 85 || code === 86) return { kind: "snow", text: "Snow showers" };
    if (code >= 95) return { kind: "thunder", text: "Thunderstorm" };
    return { kind: "cloud", text: "Cloudy" };
  }

  var cloud = '<g fill="#fff"><circle cx="16" cy="18" r="8"/><circle cx="26" cy="16" r="10"/><circle cx="12" cy="21" r="6"/><rect x="12" y="18" width="20" height="9" rx="4.5"/></g>';

  function weatherIcon(kind, s) {
    var open = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">';
    if (kind === "sun") {
      return open + '<g stroke="#ffd257" stroke-width="2.5" stroke-linecap="round">' +
        '<line x1="20" y1="3" x2="20" y2="8"/><line x1="20" y1="32" x2="20" y2="37"/>' +
        '<line x1="3" y1="20" x2="8" y2="20"/><line x1="32" y1="20" x2="37" y2="20"/>' +
        '<line x1="8" y1="8" x2="11" y2="11"/><line x1="29" y1="29" x2="32" y2="32"/>' +
        '<line x1="32" y1="8" x2="29" y2="11"/><line x1="11" y1="29" x2="8" y2="32"/></g>' +
        '<circle cx="20" cy="20" r="8" fill="#ffd257"/></svg>';
    }
    if (kind === "partly") {
      return open + '<circle cx="14" cy="14" r="7" fill="#ffd257"/>' +
        '<g fill="#fff"><circle cx="20" cy="24" r="8"/><circle cx="29" cy="22" r="9"/><circle cx="15" cy="27" r="6"/><rect x="15" y="24" width="18" height="9" rx="4.5"/></g></svg>';
    }
    if (kind === "rain") {
      return open + cloud + '<g stroke="#9fd3ff" stroke-width="2.5" stroke-linecap="round">' +
        '<line x1="16" y1="30" x2="14" y2="36"/><line x1="23" y1="30" x2="21" y2="36"/><line x1="30" y1="30" x2="28" y2="36"/></g></svg>';
    }
    if (kind === "snow") {
      return open + cloud + '<g fill="#eaf6ff"><circle cx="16" cy="33" r="2"/><circle cx="23" cy="33" r="2"/><circle cx="30" cy="33" r="2"/></g></svg>';
    }
    if (kind === "thunder") {
      return open + cloud + '<polygon points="23,25 16,35 21,35 18,40 28,29 22,29 25,25" fill="#ffd257"/></svg>';
    }
    if (kind === "fog") {
      return open + cloud + '<g stroke="#dfe8f5" stroke-width="2.5" stroke-linecap="round"><line x1="10" y1="31" x2="30" y2="31"/><line x1="13" y1="36" x2="27" y2="36"/></g></svg>';
    }
    return open + cloud + '</svg>'; // cloud
  }

  function render(data, place) {
    var deg = useFahrenheit ? "°F" : "°C";
    var cur = data.current;
    var info = codeInfo(cur.weather_code);

    currentEl.innerHTML = "";
    var icon = document.createElement("div");
    icon.innerHTML = weatherIcon(info.kind, 64);
    var text = document.createElement("div");

    var place2 = document.createElement("div"); place2.className = "wplace"; place2.textContent = place;
    var temp = document.createElement("div"); temp.className = "wtemp"; temp.textContent = Math.round(cur.temperature_2m) + "°";
    var cond = document.createElement("div"); cond.className = "wcond"; cond.textContent = info.text;
    var feels = document.createElement("div"); feels.className = "wfeels"; feels.textContent = "Feels like " + Math.round(cur.apparent_temperature) + deg;
    text.appendChild(place2); text.appendChild(temp); text.appendChild(cond); text.appendChild(feels);
    currentEl.appendChild(icon); currentEl.appendChild(text);

    forecastEl.innerHTML = "";
    var days = data.daily.time;
    for (var i = 0; i < Math.min(5, days.length); i++) {
      var d = document.createElement("div"); d.className = "wday";
      var name = document.createElement("div"); name.className = "wdname";
      name.textContent = i === 0 ? "Today" : new Date(days[i] + "T12:00:00").toLocaleDateString([], { weekday: "short" });
      var ic = document.createElement("div"); ic.innerHTML = weatherIcon(codeInfo(data.daily.weather_code[i]).kind, 30);
      var hi = document.createElement("div"); hi.className = "whi"; hi.textContent = Math.round(data.daily.temperature_2m_max[i]) + "°";
      var lo = document.createElement("div"); lo.className = "wlo"; lo.textContent = Math.round(data.daily.temperature_2m_min[i]) + "°";
      d.appendChild(name); d.appendChild(ic); d.appendChild(hi); d.appendChild(lo);
      forecastEl.appendChild(d);
    }
  }

  function loadByCoords(lat, lon, place) {
    setLoading();
    lastQuery = { lat: lat, lon: lon, place: place };
    var unit = useFahrenheit ? "fahrenheit" : "celsius";
    var url = "https://api.open-meteo.com/v1/forecast?timezone=auto" +
      "&current=temperature_2m,weather_code,apparent_temperature" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&temperature_unit=" + unit + "&latitude=" + lat + "&longitude=" + lon;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { render(j, place); })
      .catch(function () { setError("Couldn't load the forecast."); });
  }

  function searchCity(name) {
    setLoading();
    fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(name))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.results || !j.results.length) { setError('Couldn\'t find "' + name + '".'); return; }
        var g = j.results[0];
        var place = g.name + (g.country_code ? ", " + g.country_code : "");
        loadByCoords(g.latitude, g.longitude, place);
      })
      .catch(function () { setError("Couldn't reach the weather service."); });
  }

  // turn coordinates into a readable "City, CC" label, then load the forecast
  function reverseAndLoad(lat, lon) {
    fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en&latitude=" + lat + "&longitude=" + lon)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var place = j.city || j.locality || j.principalSubdivision || "My location";
        if (j.countryCode) place += ", " + j.countryCode;
        loadByCoords(lat, lon, place);
      })
      .catch(function () { loadByCoords(lat, lon, "My location"); });
  }

  // no-permission fallback: locate by IP address
  function ipLocate() {
    fetch("https://ipwho.is/")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.latitude != null) {
          var place = (j.city || "My location") + (j.country_code ? ", " + j.country_code : "");
          loadByCoords(j.latitude, j.longitude, place);
        } else {
          searchCity("San Francisco");
        }
      })
      .catch(function () { searchCity("San Francisco"); });
  }

  function useMyLocation() {
    setLoading();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { reverseAndLoad(pos.coords.latitude, pos.coords.longitude); },
        function () { ipLocate(); },
        { timeout: 6000, maximumAge: 600000 }
      );
    } else {
      ipLocate();
    }
  }

  unitBtn.addEventListener("click", function () {
    useFahrenheit = !useFahrenheit;
    unitBtn.textContent = useFahrenheit ? "°F" : "°C";
    if (lastQuery) loadByCoords(lastQuery.lat, lastQuery.lon, lastQuery.place);
  });

  document.querySelector("#weatherLocate").addEventListener("click", useMyLocation);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q) searchCity(q);
  });

  // don't detect location automatically — show a default city, and only use
  // the visitor's location if they choose to tap the locate button
  searchCity("San Francisco");
})();

// ---- wire up the icons + windows ----
initializeIcon("welcomeicon", "welcome");
initializeIcon("notesicon", "notes");
initializeIcon("projectsicon", "projects");
initializeIcon("calcicon", "calc");
initializeIcon("weathericon", "weather");

initializeWindow("welcome");
initializeWindow("notes");
initializeWindow("projects");
initializeWindow("calc");
initializeWindow("weather");

layoutIcons();
