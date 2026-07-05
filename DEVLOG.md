# Blackbird OS - Devlog

A little web-based operating system I'm building for the Hack Club WebOS jam.
It runs in the browser: a wallpaper, a top bar with a live clock, draggable
windows, desktop icons, and apps.

---

## Part 1 - Welcome screen

Started with the basics: one HTML file, a heading, some text, and a link.
Then made it feel less like a document and more like a screen you boot into.
Full-height wallpaper, a big clock, my name, and a short intro. The clock was
the first bit of JavaScript, a `setInterval` that rewrites the time every
second.

Spent longer than I want to admit picking a gradient for the wallpaper.

## Part 2 - Top bar and clock

Pulled the clock out of the welcome screen and into a top bar that sits over
everything, like a real menu bar. The bar shows the OS name on the left and a
few menu items on the right (Welcome, Notes, Time). Moved all the styling into
`style.css` and all the logic into `script.js` so the HTML stays readable.

## Part 3 - Windows you can drag and close

This is where it started feeling like an OS. Every panel is now a `.window`
with a header you grab to move it around. The drag logic tracks the mouse delta
on each move and nudges the window's `top` and `left` by that amount. Each
window has a little red close dot in the header.

The math for dragging took a couple tries. I kept moving the window by the
absolute cursor position instead of the change since the last frame, so it
would teleport under the mouse the instant I grabbed it.

## Part 4 - Icons and the Notes app

Added desktop icons on the left. Single click selects an icon (it gets a
highlight), double click opens its window. Clicking empty desktop clears the
selection.

Also built the first real app: Notes. It has a sidebar of entries and an
editor on the right. Notes are saved to `localStorage`, so they live in your
own browser and stick around between visits. There's a "+ New note" button, and
editing the title or body saves as you type. Wrote two starter notes, one
about me and one explaining how the storage works.

Windows now layer properly too. Clicking any window bumps it to the top by
raising its `z-index`, and the top bar always rides one level above so it never
gets buried.

---

## Bugs I hit / still chasing

- **Dragging windows off-screen.** There's nothing stopping a window from being
  dragged off the edge or up under the top bar, and once the header is gone you
  can't grab it back. Need to clamp the position so the header always stays
  reachable.
- **Click vs double-click on icons.** The single-click select fires during a
  double-click too, so the icon flickers selected then deselected right as the
  window opens. Works, but looks twitchy.
- **The close dot starts a drag.** The close button lives in the header, and the
  header listens for mousedown to start dragging. So pressing the close dot also
  arms a drag. If the mouse twitches, the window lurches before it closes.
- **"Time" in the top bar looks clickable.** It has the same hover underline as
  the real menu items but doesn't do anything yet.

## Next up

- Clamp window dragging to the screen
- A dock or a way to reopen closed windows
- Maybe a second app (a little terminal, or a photo viewer)
