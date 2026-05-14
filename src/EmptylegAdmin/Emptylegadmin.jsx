import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebaseConfig';
import './EmptyLegAdmin.css';

const STATUS_OPTIONS = ['AVAILABLE', 'BOOKED', 'EXPIRED', 'CANCELLED'];

const STATUS_META = {
  AVAILABLE : { label: 'Available', cls: 'el-badge--available' },
  BOOKED    : { label: 'Booked',    cls: 'el-badge--booked'    },
  EXPIRED   : { label: 'Expired',   cls: 'el-badge--expired'   },
  CANCELLED : { label: 'Cancelled', cls: 'el-badge--cancelled' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Inline editable field ────────────────────────────────────────────────────
function EditableField({ value, onSave, prefix = '', suffix = '', type = 'text', min, max }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(value ?? '');

  const commit = () => {
    setEditing(false);
    if (String(draft) !== String(value)) onSave(draft);
  };

  if (editing) {
    return (
      <span className="el-edit-wrap">
        <input
          className="el-edit-input"
          type={type}
          min={min}
          max={max}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        />
      </span>
    );
  }

  return (
    <span className="el-editable" onClick={() => { setDraft(value ?? ''); setEditing(true); }}>
      {prefix}{value || <em className="el-placeholder">click to edit</em>}{suffix}
      <span className="el-pen">✎</span>
    </span>
  );
}

// ── Seat bar ─────────────────────────────────────────────────────────────────
function SeatBar({ booked, available }) {
  const total  = Number(available) || 0;
  const filled = Math.min(Number(booked) || 0, total);
  const pct    = total > 0 ? (filled / total) * 100 : 0;

  return (
    <div className="el-seat-bar-wrap">
      <div className="el-seat-bar">
        <div className="el-seat-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="el-seat-label">
        {filled}/{total} seats
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmptyLegAdmin() {
  const [legs,    setLegs   ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter ] = useState('ALL');
  const [search,  setSearch ] = useState('');
  const [saving,  setSaving ] = useState({});   // { [legId]: true }
  const [toast,   setToast  ] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // ── realtime fetch ──
  useEffect(() => {
    const r = ref(database, 'EmptyLegData');
    const unsub = onValue(r, (snap) => {
      const data = snap.val();
      if (!data) { setLegs([]); setLoading(false); return; }
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) => new Date(b.meta?.createdAt || 0) - new Date(a.meta?.createdAt || 0));
      setLegs(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── generic field updater ──
  const saveField = async (legId, path, value) => {
    setSaving(p => ({ ...p, [legId]: true }));
    try {
      const updates = {
        [path]           : value,
        'meta/updatedAt' : new Date().toISOString(),
      };
      await update(ref(database, `EmptyLegData/${legId}`), updates);
      showToast('Saved ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Save failed', 'error');
    } finally {
      setSaving(p => ({ ...p, [legId]: false }));
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── filter + search ──
  const filtered = legs.filter((l) => {
    const matchStatus = filter === 'ALL' || l.meta?.status === filter;
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      l.aircraftDetails?.name?.toLowerCase().includes(term) ||
      l.emptyLegRoute?.departureCity?.toLowerCase().includes(term) ||
      l.emptyLegRoute?.destinationCity?.toLowerCase().includes(term) ||
      l.passenger?.firstName?.toLowerCase().includes(term) ||
      l.passenger?.lastName?.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = legs.filter(l => l.meta?.status === s).length;
    return acc;
  }, {});

  return (
    <div className="el-root">

      {/* Toast */}
      {toast && (
        <div className={`el-toast el-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="el-header">
        <div className="el-header__left">
          <span className="el-header__eyebrow">ADMIN PANEL</span>
          <h1 className="el-header__title">
            Empty Legs
            <span className="el-header__count">{legs.length}</span>
          </h1>
          <p className="el-header__sub">
            Manage available return routes · edit pricing & seat capacity in real-time
          </p>
        </div>

        {/* Stats pills */}
        <div className="el-stats">
          {STATUS_OPTIONS.map(s => (
            <div key={s} className={`el-stat-pill ${STATUS_META[s].cls}`}>
              <span className="el-stat-pill__num">{counts[s] || 0}</span>
              <span className="el-stat-pill__lbl">{STATUS_META[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="el-controls">
        <div className="el-search-wrap">
          <span className="el-search-icon">⌕</span>
          <input
            className="el-search"
            type="text"
            placeholder="Search aircraft, city, passenger..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="el-filter-bar">
          {['ALL', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              className={`el-filter-btn ${filter === s ? 'el-filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'ALL' ? `All (${legs.length})` : `${STATUS_META[s].label} (${counts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="el-loading">
          <div className="el-spinner" />
          <p>Fetching empty legs…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="el-empty">
          <div className="el-empty__icon">✈</div>
          <p>No empty legs found</p>
        </div>
      ) : (
        <div className="el-grid">
          {filtered.map((l) => {
            const isExpanded = expanded === l.id;
            const dep  = l.emptyLegRoute?.departureCity   || '—';
            const dest = l.emptyLegRoute?.destinationCity || '—';
            const status = l.meta?.status || 'AVAILABLE';
            const booked    = Number(l.seats?.booked    ?? 0);
            const available = Number(l.seats?.available ?? l.aircraftDetails?.maxPassengers ?? 0);

            return (
              <div
                key={l.id}
                className={`el-card ${isExpanded ? 'el-card--open' : ''}`}
              >
                {/* ── Card Header ── */}
                <div className="el-card__header" onClick={() => setExpanded(isExpanded ? null : l.id)}>

                  {/* Route */}
                  <div className="el-card__route">
                    <div className="el-card__city el-card__city--dep">{dep}</div>
                    <div className="el-card__arrow">
                      <svg viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 10 Q15 4 30 10 Q45 16 58 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
                        <polygon points="55,7 60,10 55,13" fill="currentColor"/>
                        <circle cx="5" cy="10" r="2" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="el-card__city el-card__city--dest">{dest}</div>
                  </div>

                  {/* Aircraft + status */}
                  <div className="el-card__meta">
                    <div className="el-card__aircraft">
                      <span className="el-card__aircraft-name">{l.aircraftDetails?.name || '—'}</span>
                      {l.aircraftDetails?.aircraftType && (
                        <span className="el-card__aircraft-type">{l.aircraftDetails.aircraftType}</span>
                      )}
                    </div>
                    <span className={`el-badge ${STATUS_META[status]?.cls || 'el-badge--available'}`}>
                      {STATUS_META[status]?.label || status}
                    </span>
                  </div>

                  {/* Price + seats summary */}
                  <div className="el-card__summary">
                    <div className="el-card__price-preview">
                      <span className="el-card__price-label">Price</span>
                      <span className="el-card__price-val">{l.aircraftDetails?.price || '—'}</span>
                    </div>
                    <SeatBar booked={booked} available={available} />
                  </div>

                  <div className={`el-card__chevron ${isExpanded ? 'el-card__chevron--open' : ''}`}>
                    ›
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isExpanded && (
                  <div className="el-card__body">

                    {/* ─ Editable Fields ─ */}
                    <div className="el-edit-section">
                      <h4 className="el-edit-section__title">✏ Editable Fields</h4>
                      <div className="el-edit-grid">

                        {/* Price */}
                        <div className="el-edit-item">
                          <span className="el-edit-label">Price</span>
                          <EditableField
                            value={l.aircraftDetails?.price}
                            onSave={v => saveField(l.id, 'aircraftDetails/price', v)}
                          />
                        </div>

                        {/* Available Seats */}
                        <div className="el-edit-item">
                          <span className="el-edit-label">Available Seats</span>
                          <EditableField
                            value={l.seats?.available ?? l.aircraftDetails?.maxPassengers ?? ''}
                            type="number"
                            min={0}
                            onSave={v => saveField(l.id, 'seats/available', Number(v))}
                            suffix=" seats"
                          />
                        </div>

                        {/* Booked Seats */}
                        <div className="el-edit-item">
                          <span className="el-edit-label">Booked Seats</span>
                          <EditableField
                            value={l.seats?.booked ?? 0}
                            type="number"
                            min={0}
                            onSave={v => saveField(l.id, 'seats/booked', Number(v))}
                            suffix=" booked"
                          />
                        </div>

                        {/* Status */}
                        <div className="el-edit-item">
                          <span className="el-edit-label">Status</span>
                          <select
                            className="el-status-select"
                            value={status}
                            onChange={e => saveField(l.id, 'meta/status', e.target.value)}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                        </div>

                      </div>

                      {/* Seat visual */}
                      <div className="el-seat-visual">
                        <div className="el-seat-visual__bar-wrap">
                          <SeatBar
                            booked={l.seats?.booked ?? 0}
                            available={l.seats?.available ?? l.aircraftDetails?.maxPassengers ?? 0}
                          />
                        </div>
                        <div className="el-seat-visual__dots">
                          {Array.from({ length: Number(l.seats?.available ?? l.aircraftDetails?.maxPassengers ?? 0) }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`el-seat-dot ${idx < Number(l.seats?.booked ?? 0) ? 'el-seat-dot--filled' : ''}`}
                            />
                          ))}
                        </div>
                      </div>

                      {saving[l.id] && (
                        <div className="el-saving-indicator">
                          <div className="el-mini-spinner" /> Saving…
                        </div>
                      )}
                    </div>

                    {/* ─ Route Info ─ */}
                    <div className="el-info-section">
                      <h4 className="el-info-section__title">🛫 Route Info</h4>
                      <div className="el-info-grid">
                        <div className="el-info-item">
                          <span className="el-info-label">Departure</span>
                          <span className="el-info-value">{dep}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Destination</span>
                          <span className="el-info-value">{dest}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Original Flight Type</span>
                          <span className="el-info-value">{l.emptyLegRoute?.originalFlightType || '—'}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Arrived At</span>
                          <span className="el-info-value">{fmtDateTime(l.arrivedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ─ Aircraft Info ─ */}
                    <div className="el-info-section">
                      <h4 className="el-info-section__title">✈ Aircraft</h4>
                      <div className="el-info-grid">
                        <div className="el-info-item">
                          <span className="el-info-label">Name</span>
                          <span className="el-info-value">{l.aircraftDetails?.name || '—'}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Type</span>
                          <span className="el-info-value">{l.aircraftDetails?.aircraftType || '—'}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Max Capacity</span>
                          <span className="el-info-value">{l.aircraftDetails?.maxPassengers || '—'}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Source Quote ID</span>
                          <span className="el-info-value el-info-value--mono">{l.sourceQuoteId || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ─ Original Passenger ─ */}
                    <div className="el-info-section">
                      <h4 className="el-info-section__title">👤 Original Passenger</h4>
                      <div className="el-info-grid">
                        <div className="el-info-item">
                          <span className="el-info-label">Name</span>
                          <span className="el-info-value">
                            {l.passenger?.firstName} {l.passenger?.lastName}
                          </span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Email</span>
                          <span className="el-info-value">{l.passenger?.email || '—'}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Phone</span>
                          <span className="el-info-value">{l.passenger?.phone || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ─ Meta ─ */}
                    <div className="el-info-section el-info-section--meta">
                      <div className="el-info-grid">
                        <div className="el-info-item">
                          <span className="el-info-label">Record ID</span>
                          <span className="el-info-value el-info-value--mono">{l.id}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Created</span>
                          <span className="el-info-value">{fmtDateTime(l.meta?.createdAt)}</span>
                        </div>
                        <div className="el-info-item">
                          <span className="el-info-label">Last Updated</span>
                          <span className="el-info-value">{fmtDateTime(l.meta?.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}