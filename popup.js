'use strict';

const NOTE_IDS = ['yellow', 'purple', 'orange', 'green', 'blue'];

const NOTE_COLOURS = {
  yellow: '#FFF4A3',
  purple: '#E6D5FF',
  orange: '#FFD8AE',
  green:  '#D8F5D1',
  blue:   '#D7EBFF'
};

const DEFAULT_STATE = {
  selectedNote: 'yellow',
  notes: { yellow: '', purple: '', orange: '', green: '', blue: '' }
};

const textarea = document.getElementById('note');
const counter = document.getElementById('counter');
const tabs = document.querySelectorAll('.note-tab');

let state = structuredClone(DEFAULT_STATE);

async function loadNotes() {
  const stored = await chrome.storage.local.get(['selectedNote', 'notes']);

  state.notes = { ...DEFAULT_STATE.notes, ...(stored.notes || {}) };
  state.selectedNote = NOTE_IDS.includes(stored.selectedNote)
    ? stored.selectedNote
    : DEFAULT_STATE.selectedNote;

  render();
  textarea.focus();
}

function saveCurrentNote() {
  state.notes[state.selectedNote] = textarea.value;
  updateCharacterCount();
  updateContentDots();
  chrome.storage.local.set({ notes: state.notes });
}

function switchNote(noteId) {
  if (!NOTE_IDS.includes(noteId) || noteId === state.selectedNote) return;

  // Make sure the outgoing note is stored before switching.
  state.notes[state.selectedNote] = textarea.value;
  state.selectedNote = noteId;

  chrome.storage.local.set({ selectedNote: noteId, notes: state.notes });

  render();
  textarea.focus();
}

function updateCharacterCount() {
  const count = textarea.value.length;
  counter.textContent = count + (count === 1 ? ' character' : ' characters');
}

function updateContentDots() {
  tabs.forEach(tab => {
    const text = state.notes[tab.dataset.note] || '';
    tab.classList.toggle('has-text', text.trim().length > 0);
  });
}

function render() {
  const id = state.selectedNote;

  textarea.value = state.notes[id] || '';
  textarea.style.backgroundColor = NOTE_COLOURS[id];

  tabs.forEach(tab => {
    const isActive = tab.dataset.note === id;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  updateCharacterCount();
  updateContentDots();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchNote(tab.dataset.note));
});

textarea.addEventListener('input', saveCurrentNote);

loadNotes();
