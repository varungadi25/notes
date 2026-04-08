/* ================================================================
   Notes App — app.js
   ================================================================ */

/* ── Priority Definitions ── */
const PRIORITIES = {
  critical: {
    rank: 1, label: 'Very Important', emoji: '🔴',
    desc: 'Rank 1 — Highest priority. Shown first.',
    dark:  { bg: '#3d1212', title: '#fca5a5', text: '#fecaca', tag: '#f87171', badge: 'rgba(239,68,68,0.25)', badgeTxt: '#fca5a5', dot: '#ef4444' },
    light: { bg: '#fee2e2', title: '#991b1b', text: '#7f1d1d', tag: '#dc2626', badge: 'rgba(239,68,68,0.15)', badgeTxt: '#b91c1c', dot: '#ef4444' }
  },
  general: {
    rank: 2, label: 'General', emoji: '🟡',
    desc: 'Rank 2 — Everyday notes. Shown second.',
    dark:  { bg: '#3a2e00', title: '#fde047', text: '#fef08a', tag: '#facc15', badge: 'rgba(234,179,8,0.25)', badgeTxt: '#fde047', dot: '#eab308' },
    light: { bg: '#fef9c3', title: '#854d0e', text: '#713f12', tag: '#ca8a04', badge: 'rgba(234,179,8,0.15)', badgeTxt: '#92400e', dot: '#eab308' }
  },
  'medium-purple': {
    rank: 3, label: 'Medium', emoji: '🟣',
    desc: 'Rank 3 — Moderate priority.',
    dark:  { bg: '#2a1f4f', title: '#c4b5fd', text: '#ddd6fe', tag: '#a78bfa', badge: 'rgba(139,92,246,0.25)', badgeTxt: '#c4b5fd', dot: '#8b5cf6' },
    light: { bg: '#ede9fe', title: '#6d28d9', text: '#4c1d95', tag: '#7c3aed', badge: 'rgba(139,92,246,0.15)', badgeTxt: '#6d28d9', dot: '#8b5cf6' }
  },
  'medium-blue': {
    rank: 4, label: 'Medium', emoji: '🔵',
    desc: 'Rank 4 — Nice to have.',
    dark:  { bg: '#1e3a5f', title: '#93c5fd', text: '#bfdbfe', tag: '#60a5fa', badge: 'rgba(59,130,246,0.25)', badgeTxt: '#93c5fd', dot: '#3b82f6' },
    light: { bg: '#dbeafe', title: '#1d4ed8', text: '#1e3a8a', tag: '#2563eb', badge: 'rgba(59,130,246,0.15)', badgeTxt: '#1d4ed8', dot: '#3b82f6' }
  },
  low: {
    rank: 5, label: 'Least Important', emoji: '🟢',
    desc: 'Rank 5 — Lowest priority. Shown last.',
    dark:  { bg: '#0f2e1a', title: '#86efac', text: '#bbf7d0', tag: '#4ade80', badge: 'rgba(34,197,94,0.25)', badgeTxt: '#86efac', dot: '#22c55e' },
    light: { bg: '#dcfce7', title: '#15803d', text: '#14532d', tag: '#16a34a', badge: 'rgba(34,197,94,0.15)', badgeTxt: '#15803d', dot: '#22c55e' }
  }
};

const PRIORITY_HINTS = {
  critical:        { text: '🔴 Very Important — Rank 1. Highest priority, shown first.',   bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: '#ef4444' },
  general:         { text: '🟡 General — Rank 2. Everyday tasks, shown second.',           bg: 'rgba(234,179,8,0.12)',  color: '#ca8a04', border: '#eab308' },
  'medium-purple': { text: '🟣 Medium — Rank 3. Moderate priority.',                      bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '#8b5cf6' },
  'medium-blue':   { text: '🔵 Medium — Rank 4. Nice to have, not urgent.',               bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '#3b82f6' },
  low:             { text: '🟢 Least Important — Rank 5. Lowest priority, shown last.',   bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', border: '#22c55e' }
};

/* ── App State ── */
let notes           = JSON.parse(localStorage.getItem('notes_v2') || '[]');
let editId          = null;
let activeTag       = 'All';
let activePri       = 'all';
let selectedPriority = 'critical';
let theme           = localStorage.getItem('notes_theme') || 'dark';

/* ================================================================
   THEME
   ================================================================ */
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('notes_theme', t);
  renderNotes();
}
function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
}

/* ================================================================
   PERSISTENCE
   ================================================================ */
function save() {
  localStorage.setItem('notes_v2', JSON.stringify(notes));
}

/* ================================================================
   PRIORITY PICKER (inside modal)
   ================================================================ */
function selectPriority(p) {
  selectedPriority = p;
  document.querySelectorAll('.pri-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.priority === p);
  });
  const h = PRIORITY_HINTS[p];
  const hint = document.getElementById('priority-hint');
  hint.textContent   = h.text;
  hint.style.background  = h.bg;
  hint.style.color       = h.color;
  hint.style.borderColor = h.border;
}

/* ================================================================
   PRIORITY FILTER (above grid)
   ================================================================ */
function setPri(p) {
  activePri = p;
  document.querySelectorAll('.pri-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.pri === p);
  });
  renderNotes();
}

/* ================================================================
   TAG ROW
   ================================================================ */
function getAllTags() {
  const s = new Set();
  notes.forEach(n => { if (n.tag) s.add(n.tag); });
  return [...s].sort();
}

function renderTagRow() {
  const row = document.getElementById('tags-row');
  row.innerHTML = '<span class="label">Tag:</span>';
  ['All', ...getAllTags()].forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill' + (activeTag === t ? ' active' : '');
    pill.textContent = t;
    pill.onclick = () => { activeTag = t; renderNotes(); };
    row.appendChild(pill);
  });
}

/* ================================================================
   RENDER NOTES
   ================================================================ */
function renderNotes() {
  const q = document.getElementById('search').value.trim().toLowerCase();

  // Start with full list, sort by priority rank then date
  let list = [...notes];
  list.sort((a, b) => {
    const ra = (PRIORITIES[a.priority] || PRIORITIES.low).rank;
    const rb = (PRIORITIES[b.priority] || PRIORITIES.low).rank;
    if (ra !== rb) return ra - rb;
    return new Date(b.date) - new Date(a.date);
  });

  // Apply filters
  if (activeTag !== 'All') list = list.filter(n => n.tag === activeTag);
  if (activePri !== 'all') list = list.filter(n => n.priority === activePri);
  if (q) list = list.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.body.toLowerCase().includes(q)  ||
    (n.tag || '').toLowerCase().includes(q)
  );

  const grid  = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = '';

  document.getElementById('count-badge').textContent = notes.length + ' / 20';
  document.getElementById('limit-warn').style.display = notes.length >= 20 ? 'block' : 'none';
  renderTagRow();

  if (list.length === 0) { empty.style.display = 'flex'; return; }
  empty.style.display = 'none';

  list.forEach((n, idx) => {
    const pri = PRIORITIES[n.priority] || PRIORITIES.low;
    const c   = pri[theme] || pri.dark;
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.background = c.bg;
    card.style.color = c.text;
    card.innerHTML = `
      <div class="rank-badge">#${idx + 1}</div>
      <div class="imp-badge" style="background:${c.badge};color:${c.badgeTxt};">
        <div class="imp-dot" style="background:${c.dot};"></div>
        ${pri.emoji} ${pri.label}
      </div>
      ${n.tag ? `<div class="card-tag" style="color:${c.tag}">${escHtml(n.tag)}</div>` : ''}
      <h3 style="color:${c.title}">${escHtml(n.title)}</h3>
      <p>${escHtml(n.body)}</p>
      <div class="card-footer">
        <span class="card-date">${fmt(n.date)}</span>
        <div class="card-actions">
          <button class="card-btn" onclick="openEdit('${n.id}')">Edit</button>
          <button class="card-btn del" onclick="deleteNote('${n.id}')">Delete</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

/* ================================================================
   CRUD — OPEN / CLOSE MODAL
   ================================================================ */
function openModal(id) {
  editId = id || null;
  const note = id ? notes.find(n => n.id === id) : null;
  document.getElementById('modal-title').textContent = id ? 'Edit Note' : 'New Note';
  document.getElementById('inp-title').value = note ? note.title : '';
  document.getElementById('inp-body').value  = note ? note.body  : '';
  document.getElementById('inp-tag').value   = note ? (note.tag || '') : '';
  selectPriority(note ? (note.priority || 'critical') : 'critical');
  document.getElementById('modal-err').style.display = 'none';
  updateChar();
  document.getElementById('modal-bg').classList.add('open');
  setTimeout(() => document.getElementById('inp-title').focus(), 60);
}

function openEdit(id) { openModal(id); }

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
}

function bgClick(e) {
  if (e.target === document.getElementById('modal-bg')) closeModal();
}

function updateChar() {
  const len = document.getElementById('inp-body').value.length;
  document.getElementById('char-hint').textContent = len + ' / 500';
}

/* ── Save (create or update) ── */
function saveNote() {
  const title = document.getElementById('inp-title').value.trim();
  const body  = document.getElementById('inp-body').value.trim();
  const tag   = document.getElementById('inp-tag').value;
  const err   = document.getElementById('modal-err');

  if (!title || !body) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  if (editId) {
    const i = notes.findIndex(n => n.id === editId);
    if (i !== -1) {
      notes[i] = { ...notes[i], title, body, tag, priority: selectedPriority, date: new Date().toLocaleDateString('en-IN') };
    }
  } else {
    if (notes.length >= 20) return;
    notes.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title, body, tag,
      priority: selectedPriority,
      date: new Date().toISOString()
    });
  }

  save();
  closeModal();
  renderNotes();
}

/* ── Delete ── */
function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  notes = notes.filter(n => n.id !== id);
  save();
  renderNotes();
}

/* ================================================================
   HELPERS
   ================================================================ */
function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
     day: 'numeric', month: 'short', year: 'numeric'
  });
}

/* ================================================================
   KEYBOARD SHORTCUTS
   ================================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search').focus();
  }
});

/* ================================================================
   SEED DEMO NOTES (only on first load)
   ================================================================ */
if (notes.length === 0) {
  notes.push({ id: 'demo1', title: 'Welcome to Notes App', body: 'This is a demo note to get you started. Feel free to edit or delete it!', tag: 'none', priority: 'general'
 , date: new Date().toISOString() });
  
  save();
}

/* ── Boot ── */
applyTheme(theme);
selectPriority('critical');
setPri('all');
renderNotes();
