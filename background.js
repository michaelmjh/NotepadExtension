/* background.js - Sticky Notes
   Keeps notes in step with the Duck Dashboard extension
   (michaelmjh/EdgeDashboard), whose new tab page shows the same five notes.
   Sticky Notes owns the notes; the dashboard asks for them and sends edits.

   Messages:
     to dashboard   { app: 'sticky-notes', type: 'hello' | 'notes', notes }
     from dashboard { app: 'duck-dashboard', type: 'get-notes' }          reply { ok, notes }
                    { app: 'duck-dashboard', type: 'set-notes', notes }   only changed colours

   Only the dashboard's fixed extension ID is accepted. */

'use strict';

const DASHBOARD_ID = 'kgnlnhdenhgddbggpccmpodgogfhkggh';
const NOTE_IDS = ['yellow', 'purple', 'orange', 'green', 'blue'];
const EMPTY = { yellow: '', purple: '', orange: '', green: '', blue: '' };

// Last notes exchanged with the dashboard, so its own edits aren't echoed back.
let lastSynced = null;

async function readNotes() {
  const { notes } = await chrome.storage.local.get('notes');
  return { ...EMPTY, ...(notes || {}) };
}

async function tellDashboard(type) {
  const notes = await readNotes();
  const json = JSON.stringify(notes);
  if (type === 'notes' && json === lastSynced) return;
  lastSynced = json;
  try {
    await chrome.runtime.sendMessage(DASHBOARD_ID, { app: 'sticky-notes', type, notes });
  } catch (e) {
    // Dashboard not installed or switched off. Nothing to do.
  }
}

chrome.runtime.onInstalled.addListener(() => tellDashboard('hello'));
chrome.runtime.onStartup.addListener(() => tellDashboard('hello'));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.notes) tellDashboard('notes');
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.id !== DASHBOARD_ID || !message || message.app !== 'duck-dashboard') return false;

  if (message.type === 'get-notes') {
    readNotes().then((notes) => {
      lastSynced = JSON.stringify(notes);
      sendResponse({ ok: true, notes });
    });
    return true;
  }

  if (message.type === 'set-notes' && message.notes && typeof message.notes === 'object') {
    (async () => {
      const notes = await readNotes();
      NOTE_IDS.forEach((id) => {
        if (typeof message.notes[id] === 'string') notes[id] = message.notes[id];
      });
      lastSynced = JSON.stringify(notes);
      await chrome.storage.local.set({ notes });
      sendResponse({ ok: true });
    })();
    return true;
  }

  return false;
});
