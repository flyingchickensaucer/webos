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
// (single click selects the icon, double click opens the window)
function initializeIcon(iconId, windowId) {
  var icon = document.querySelector("#" + iconId);
  var win = document.querySelector("#" + windowId);
  icon.addEventListener("click", function () { handleIconTap(icon); });
  icon.addEventListener("dblclick", function () { openWindow(win); });
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

// ---- wire up the icons + windows ----
initializeIcon("welcomeicon", "welcome");
initializeIcon("notesicon", "notes");
initializeIcon("projectsicon", "projects");

initializeWindow("welcome");
initializeWindow("notes");
initializeWindow("projects");
