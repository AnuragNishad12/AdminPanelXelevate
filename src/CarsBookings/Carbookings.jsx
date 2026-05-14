import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebaseConfig';
import './CarBookings.css';

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Cancelled', 'Completed'];

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'badge--pending' },
  confirmed: { label: 'Confirmed', cls: 'badge--confirmed' },
  cancelled: { label: 'Cancelled', cls: 'badge--cancelled' },
  completed: { label: 'Completed', cls: 'badge--completed' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d)
    ? str
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSubmitted(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

function getInitials(first = '', last = '') {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CarBookings() {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('All');
  const [search,      setSearch]      = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [updating,    setUpdating]    = useState(null);

  // ── Live Firebase listener ───────────────────────────────────────────────
  useEffect(() => {
    const bookingsRef = ref(database, 'Carsbookings');

    const unsub = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          list.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
          setBookings(list);
        } else {
          setBookings([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firebase error:', err);
        setError('Could not load bookings. Check your Firebase database rules.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ── Write status to Firebase ─────────────────────────────────────────────
  async function handleStatusChange(id, newStatus) {
    setUpdating(id);
    try {
      await update(ref(database, `Carsbookings/${id}`), { status: newStatus });
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status. Check your Firebase rules.');
    } finally {
      setUpdating(null);
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const counts = STATUS_TABS.reduce((acc, tab) => {
    if (tab === 'All') { acc[tab] = bookings.length; return acc; }
    acc[tab] = bookings.filter(b => b.status === tab.toLowerCase()).length;
    return acc;
  }, {});

  const filtered = bookings.filter((b) => {
    const matchTab = activeTab === 'All' || b.status === activeTab.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase().includes(q) ||
      (b.email    ?? '').toLowerCase().includes(q) ||
      (b.carTitle ?? '').toLowerCase().includes(q) ||
      (b.carCity  ?? '').toLowerCase().includes(q) ||
      (b.pickup   ?? '').toLowerCase().includes(q) ||
      (b.dropoff  ?? '').toLowerCase().includes(q) ||
      (b.phone    ?? '').includes(q);
    return matchTab && matchSearch;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="cb-root">
      <div className="cb-noise" />

      {/* ── Header ── */}
      <header className="cb-header">
        <div className="cb-header__left">
          <span className="cb-admin-label">ADMIN PANEL</span>
          <h1 className="cb-title">
            Car Bookings
            <span className="cb-title__badge">{bookings.length}</span>
          </h1>
        </div>

        <div className="cb-search-wrap">
          <svg className="cb-search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="cb-search"
            placeholder="Search by name, email, city, car…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* ── Filter tabs ── */}
      <nav className="cb-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`cb-tab ${activeTab === tab ? 'cb-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className="cb-tab__count">{counts[tab] ?? 0}</span>
          </button>
        ))}
      </nav>

      {/* ── Loading ── */}
      {loading && (
        <div className="cb-state">
          <div className="cb-spinner" />
          <span>Loading bookings…</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="cb-state cb-state--error">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="cb-table-wrap">
          <table className="cb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Car</th>
                <th>Route</th>
                <th>Date &amp; Time</th>
                <th>Price</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>

              {/* Empty state */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="cb-empty">
                    {bookings.length === 0
                      ? 'No bookings in database yet.'
                      : 'No results match your search.'}
                  </td>
                </tr>
              )}

              {filtered.map((b, idx) => {
                const meta       = STATUS_META[b.status] ?? STATUS_META.pending;
                const isExpanded = expandedRow === b.id;
                const isUpdating = updating === b.id;

                return (
                  <>
                    {/* ── Main row ── */}
                    <tr
                      key={b.id}
                      className={`cb-row ${isExpanded ? 'cb-row--expanded' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                    >
                      {/* # */}
                      <td className="cb-cell--num">{idx + 1}</td>

                      {/* Customer */}
                      <td>
                        <div className="cb-passenger">
                          <span className="cb-avatar">
                            {getInitials(b.firstName, b.lastName)}
                          </span>
                          <div>
                            <div className="cb-passenger__name">
                              {b.firstName} {b.lastName}
                            </div>
                            <div className="cb-passenger__email">{b.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Car */}
                      <td>
                        <div className="cb-car">
                          <div className="cb-car__title">{b.carTitle ?? '—'}</div>
                          <div className="cb-car__city">{b.carCity ?? '—'}</div>
                        </div>
                      </td>

                      {/* Route */}
                      <td>
                        <div className="cb-route">
                          <span className="cb-route__from">{b.pickup ?? '—'}</span>
                          <svg className="cb-route__arrow" viewBox="0 0 24 10" fill="none">
                            <path
                              d="M0 5h20M16 1l4 4-4 4"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="cb-route__to">{b.dropoff ?? '—'}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div className="cb-date">{formatDate(b.date)}</div>
                        <div className="cb-time">{b.time ?? '—'}</div>
                      </td>

                      {/* Price */}
                      <td>
                        <span className="cb-price">{b.carPrice ?? '—'}</span>
                      </td>

                      {/* Submitted */}
                      <td className="cb-submitted">{formatSubmitted(b.bookedAt)}</td>

                      {/* Status badge */}
                      <td>
                        <span className={`cb-badge ${meta.cls}`}>{meta.label}</span>
                      </td>

                      {/* Actions — stop row click propagation */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={`cb-action-wrap ${isUpdating ? 'cb-action-wrap--busy' : ''}`}>
                          <select
                            className="cb-select"
                            value={b.status ?? 'pending'}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                          {isUpdating ? (
                            <div className="cb-mini-spinner" />
                          ) : (
                            <svg className="cb-select-chevron" viewBox="0 0 10 6" fill="none">
                              <path
                                d="M1 1l4 4 4-4"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {isExpanded && (
                      <tr key={`${b.id}-detail`} className="cb-detail-row">
                        <td colSpan={9}>
                          <div className="cb-detail">
                            <div className="cb-detail__grid">

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Phone</span>
                                <span className="cb-detail__value">{b.phone ?? '—'}</span>
                              </div>

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Extra Hours</span>
                                <span className="cb-detail__value">
                                  {b.extraHr ?? 0} hr @ €{b.extraHrRate ?? 0}/hr
                                </span>
                              </div>

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Extra KM</span>
                                <span className="cb-detail__value">
                                  {b.extraKm ?? 0} km @ €{b.extraKmRate ?? 0}/km
                                </span>
                              </div>

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Estimated Total</span>
                                <span className="cb-detail__value cb-detail__value--highlight">
                                  €{Number(b.estimatedTotal ?? 0).toFixed(2)}
                                </span>
                              </div>

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Car Country</span>
                                <span className="cb-detail__value">{b.carCountry || '—'}</span>
                              </div>

                              <div className="cb-detail__item">
                                <span className="cb-detail__label">Car ID</span>
                                <span className="cb-detail__value cb-detail__value--mono">
                                  {b.carId ?? '—'}
                                </span>
                              </div>

                              <div className="cb-detail__item cb-detail__item--full">
                                <span className="cb-detail__label">Additional Info</span>
                                <span className="cb-detail__value">{b.additionalInfo || '—'}</span>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}