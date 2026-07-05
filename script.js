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

// ---- wire up the windows ----
initializeWindow("welcome");
initializeWindow("notes");
