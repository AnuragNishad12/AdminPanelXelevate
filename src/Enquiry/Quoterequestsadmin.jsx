import { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import { database } from '../firebaseConfig';
import './QuoteRequestsAdmin.css';

const STATUS_OPTIONS = [
  'PENDING',
  'DELAYED',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',          
];

const STATUS_COLORS = {
  PENDING   : 'status--pending',
  DELAYED    : 'status--delayed',
  CONFIRMED : 'status--confirmed',
  CANCELLED : 'status--cancelled',
  COMPLETED : 'status--completed', 
};

const STATUS_LABELS = {
  PENDING   : 'Pending',
  DELAYED    : 'Delayed',
  CONFIRMED : 'Confirmed',
  CANCELLED : 'Cancelled',
  COMPLETED : 'Completed',         
};

const FLIGHT_TYPE_LABELS = {
  ONE_WAY_CHARTER    : 'One Way Charter',
  ROUND_TRIP_CHARTER : 'Round Trip Charter',
  EMPTY_LEG          : 'Empty Leg',
  MULTI_LEG_TRIP     : 'Multi-Leg Trip',
  ''                 : '—',
};


const fmt = (iso) => {
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


export default function QuoteRequestsAdmin() {
  const [quotes, setQuotes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilter]     = useState('ALL');
  const [search, setSearch]           = useState('');
  const [updating, setUpdating]       = useState(null);
  const [expanded, setExpanded]       = useState(null);
  const [arrivedIds, setArrivedIds]   = useState({});   // quoteId -> true if flight marked COMPLETED
  const [emptyLegIds, setEmptyLegIds] = useState({});   // quoteId -> true if empty leg created
  const [savingArrival, setSaving]    = useState(null);
  const [savingEmptyLeg, setSavingEL] = useState(null);
  const [toast, setToast]             = useState(null);

  // ── fetch all quotes in real-time ──
  useEffect(() => {
    const quotesRef = ref(database, 'quoteRequests');
    const unsub = onValue(quotesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setQuotes([]); setLoading(false); return; }

      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) =>
        new Date(b.meta?.createdAt || 0) - new Date(a.meta?.createdAt || 0)
      );

      setQuotes(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ── update status ──
  const handleStatusChange = async (quoteId, newStatus) => {
    setUpdating(quoteId);
    try {
      await update(ref(database, `quoteRequests/${quoteId}/meta`), {
        status   : newStatus,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // ── "User Arrived" → mark flight as COMPLETED ──────────────────────────────
  const handleUserArrived = async (q) => {
    setSaving(q.id);
    try {
      await update(ref(database, `quoteRequests/${q.id}/meta`), {
        status   : 'COMPLETED',
        updatedAt: new Date().toISOString(),
      });

      setArrivedIds(prev => ({ ...prev, [q.id]: true }));
      showToast('Flight marked as Completed ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to mark as completed', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ── "Empty Leg Mode" → create EmptyLegData record (reversed route) ─────────
  const handleEmptyLegMode = async (q) => {
    setSavingEL(q.id);
    try {
      const emptyLegRef = ref(database, 'EmptyLegData');

      const emptyLegRecord = {
        sourceQuoteId: q.id,

        aircraftDetails: {
          name         : q.aircraftDetails?.name          || '—',
          price        : q.aircraftDetails?.price         || '—',
          aircraftType : q.aircraftDetails?.aircraftType  || '—',
          maxPassengers: q.aircraftDetails?.maxPassengers || '—',
        },

        passenger: {
          firstName: q.personalInfo?.firstName || '',
          lastName : q.personalInfo?.lastName  || '',
          email    : q.personalInfo?.email     || '',
          phone    : q.personalInfo?.phone     || null,
        },

        // Reversed route — jet is now at destination, returning empty
        emptyLegRoute: {
          departureCity      : q.flightDetails?.destinationCity || '—',
          destinationCity    : q.flightDetails?.departureCity   || '—',
          originalFlightType : q.flightDetails?.flightType      || null,
        },

        arrivedAt: new Date().toISOString(),

        meta: {
          status   : 'AVAILABLE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await push(emptyLegRef, emptyLegRecord);

      setEmptyLegIds(prev => ({ ...prev, [q.id]: true }));
      showToast('Empty Leg created — jet is now available for booking!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create Empty Leg', 'error');
    } finally {
      setSavingEL(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── filter + search ──
  const filtered = quotes.filter((q) => {
    const matchStatus =
      filterStatus === 'ALL' || q.meta?.status === filterStatus;

    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      q.personalInfo?.firstName?.toLowerCase().includes(term) ||
      q.personalInfo?.lastName?.toLowerCase().includes(term)  ||
      q.personalInfo?.email?.toLowerCase().includes(term)     ||
      q.flightDetails?.departureCity?.toLowerCase().includes(term) ||
      q.flightDetails?.destinationCity?.toLowerCase().includes(term) ||
      q.aircraftDetails?.name?.toLowerCase().includes(term);

    return matchStatus && matchSearch;
  });

  // ── counts ──
  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = quotes.filter((q) => q.meta?.status === s).length;
    return acc;
  }, {});

  return (
    <div className="qra-root">

      {/* ── Toast ── */}
      {toast && (
        <div className={`qra-toast qra-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="qra-header">
        <div className="qra-header__left">
          <span className="qra-header__eyebrow">ADMIN PANEL</span>
          <h1 className="qra-header__title">
            Quote Requests
            <span className="qra-header__count">{quotes.length}</span>
          </h1>
        </div>

        <div className="qra-search-wrap">
          <span className="qra-search-icon">⌕</span>
          <input
            className="qra-search"
            type="text"
            placeholder="Search by name, email, city, aircraft..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Status Filter Bar ── */}
      <div className="qra-filter-bar">
        <button
          className={`qra-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All <span className="qra-filter-badge">{quotes.length}</span>
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`qra-filter-btn ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABELS[s]}
            <span className={`qra-filter-badge ${STATUS_COLORS[s]}`}>
              {counts[s] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="qra-loading">
          <div className="qra-spinner" />
          <p>Loading quote requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="qra-empty">
          <div className="qra-empty__icon">✈</div>
          <p>No quote requests found</p>
        </div>
      ) : (
        <div className="qra-table-wrap">
          <table className="qra-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passenger</th>
                <th>Aircraft</th>
                <th>Route</th>
                <th>Date</th>
                <th>Pax</th>
                <th>Flight Type</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <>
                  <tr
                    key={q.id}
                    className={`qra-row ${expanded === q.id ? 'qra-row--expanded' : ''}`}
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  >
                    <td className="qra-td qra-td--num">{i + 1}</td>

                    <td className="qra-td">
                      <div className="qra-passenger">
                        <div className="qra-avatar">
                          {(q.personalInfo?.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="qra-name">
                            {q.personalInfo?.firstName} {q.personalInfo?.lastName}
                          </div>
                          <div className="qra-email">{q.personalInfo?.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="qra-td" onClick={(e) => e.stopPropagation()}>
                      {q.aircraftDetails?.name ? (
                        <div className="qra-aircraft">
                          <div className="qra-aircraft__name">{q.aircraftDetails.name}</div>
                          {q.aircraftDetails?.aircraftType && (
                            <div className="qra-aircraft__type">{q.aircraftDetails.aircraftType}</div>
                          )}
                          {q.aircraftDetails?.maxPassengers && (
                            <div className="qra-aircraft__seats">
                              ✈ Max {q.aircraftDetails.maxPassengers} seats
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="qra-na">—</span>
                      )}
                    </td>

                    <td className="qra-td">
                      <div className="qra-route">
                        <span className="qra-city">{q.flightDetails?.departureCity || '—'}</span>
                        <span className="qra-arrow">→</span>
                        <span className="qra-city">{q.flightDetails?.destinationCity || '—'}</span>
                      </div>
                    </td>

                    <td className="qra-td qra-td--date">
                      {fmt(q.flightDetails?.departureDate)}
                    </td>

                    <td className="qra-td qra-td--center">
                      <span className="qra-pax-badge">
                        ✈ {q.flightDetails?.passengers || '—'}
                      </span>
                    </td>

                    <td className="qra-td">
                      <span className="qra-type-badge">
                        {FLIGHT_TYPE_LABELS[q.flightDetails?.flightType] ||
                         q.flightDetails?.flightType || '—'}
                      </span>
                    </td>

                    <td className="qra-td qra-td--date">
                      {fmtDateTime(q.meta?.createdAt)}
                    </td>

                    <td className="qra-td" onClick={(e) => e.stopPropagation()}>
                      <span className={`qra-status ${STATUS_COLORS[q.meta?.status] || 'status--pending'}`}>
                        {STATUS_LABELS[q.meta?.status] || q.meta?.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="qra-td" onClick={(e) => e.stopPropagation()}>
                      <div className="qra-action-wrap">
                        <select
                          className="qra-status-select"
                          value={q.meta?.status || 'PENDING'}
                          disabled={updating === q.id}
                          onChange={(e) => handleStatusChange(q.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {updating === q.id && <div className="qra-mini-spinner" />}
                      </div>
                    </td>
                  </tr>

                  {/* ── Expanded detail row ── */}
                  {expanded === q.id && (
                    <tr key={`${q.id}-detail`} className="qra-detail-row">
                      <td colSpan={10}>
                        <div className="qra-detail">

                          {q.aircraftDetails?.name && (
                            <div className="qra-detail__section qra-detail__section--aircraft">
                              <h4 className="qra-detail__heading">✈ Aircraft Details</h4>
                              <div className="qra-detail__grid">
                                <div className="qra-detail__item">
                                  <span className="qra-detail__label">Aircraft Name</span>
                                  <span className="qra-detail__value qra-detail__value--highlight">
                                    {q.aircraftDetails.name}
                                  </span>
                                </div>
                                {q.aircraftDetails?.aircraftType && (
                                  <div className="qra-detail__item">
                                    <span className="qra-detail__label">Aircraft Type</span>
                                    <span className="qra-detail__value">{q.aircraftDetails.aircraftType}</span>
                                  </div>
                                )}
                                {q.aircraftDetails?.maxPassengers && (
                                  <div className="qra-detail__item">
                                    <span className="qra-detail__label">Max Passengers</span>
                                    <span className="qra-detail__value">{q.aircraftDetails.maxPassengers}</span>
                                  </div>
                                )}
                                {q.aircraftDetails?.price && (
                                  <div className="qra-detail__item">
                                    <span className="qra-detail__label">Starting Price</span>
                                    <span className="qra-detail__value qra-detail__value--price">
                                      {q.aircraftDetails.price}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Personal Info */}
                          <div className="qra-detail__section">
                            <h4 className="qra-detail__heading">Personal Info</h4>
                            <div className="qra-detail__grid">
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Full Name</span>
                                <span className="qra-detail__value">
                                  {q.personalInfo?.firstName} {q.personalInfo?.lastName}
                                </span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Email</span>
                                <span className="qra-detail__value">{q.personalInfo?.email}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Phone</span>
                                <span className="qra-detail__value">{q.personalInfo?.phone || '—'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Flight Details */}
                          <div className="qra-detail__section">
                            <h4 className="qra-detail__heading">Flight Details</h4>
                            <div className="qra-detail__grid">
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">From</span>
                                <span className="qra-detail__value">{q.flightDetails?.departureCity || '—'}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">To</span>
                                <span className="qra-detail__value">{q.flightDetails?.destinationCity || '—'}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Departure Date</span>
                                <span className="qra-detail__value">{fmt(q.flightDetails?.departureDate)}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Passengers</span>
                                <span className="qra-detail__value">{q.flightDetails?.passengers || '—'}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Flight Type</span>
                                <span className="qra-detail__value">
                                  {FLIGHT_TYPE_LABELS[q.flightDetails?.flightType] ||
                                   q.flightDetails?.flightType || '—'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {q.additionalRequirements && (
                            <div className="qra-detail__section">
                              <h4 className="qra-detail__heading">Additional Requirements</h4>
                              <p className="qra-detail__notes">{q.additionalRequirements}</p>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="qra-detail__section">
                            <h4 className="qra-detail__heading">Meta</h4>
                            <div className="qra-detail__grid">
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Quote ID</span>
                                <span className="qra-detail__value qra-detail__value--mono">{q.id}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Submitted</span>
                                <span className="qra-detail__value">{fmtDateTime(q.meta?.createdAt)}</span>
                              </div>
                              <div className="qra-detail__item">
                                <span className="qra-detail__label">Last Updated</span>
                                <span className="qra-detail__value">{fmtDateTime(q.meta?.updatedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick status buttons */}
                          <div className="qra-detail__status-row">
                            <span className="qra-detail__label">Booking Status:</span>
                            <div className="qra-detail__status-btns">
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s}
                                  className={`qra-detail__status-btn ${STATUS_COLORS[s]} ${
                                    q.meta?.status === s ? 'active' : ''
                                  }`}
                                  disabled={updating === q.id}
                                  onClick={() => handleStatusChange(q.id, s)}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ─── Action Buttons Row ─────────────────────────── */}
                          <div className="qra-detail__arrived-row">

                            {/* LEFT: User Arrived → marks flight COMPLETED */}
                            <div className="qra-detail__arrived-info">
                              <span className="qra-detail__arrived-label">
                                User has landed at <strong>{q.flightDetails?.destinationCity || 'destination'}</strong>?
                              </span>
                              <span className="qra-detail__arrived-sub">
                                Marks this flight as <strong>Completed</strong> and closes it.
                              </span>
                            </div>

                            {arrivedIds[q.id] || q.meta?.status === 'COMPLETED' ? (
                              <button
                                className="qra-arrived-btn qra-arrived-btn--done"
                                style={{ color: 'black' }}
                                disabled
                              >
                                ✓ Flight Completed
                              </button>
                            ) : (
                              <button
                                className="qra-arrived-btn"
                                disabled={savingArrival === q.id}
                                onClick={() => handleUserArrived(q)}
                              >
                                {savingArrival === q.id ? (
                                  <>
                                    <div className="qra-mini-spinner qra-mini-spinner--black" />
                                    Saving...
                                  </>
                                ) : (
                                  <span style={{ color: 'black' }}>🛬 User Arrived</span>
                                )}
                              </button>
                            )}
                          </div>

                          {/* RIGHT: Empty Leg Mode → push to EmptyLegData */}
                          <div className="qra-detail__arrived-row" style={{ marginTop: '10px' }}>
                            <div className="qra-detail__arrived-info">
                              <span className="qra-detail__arrived-label">
                                Send jet to <strong>Empty Leg Mode</strong>?
                              </span>
                              <span className="qra-detail__arrived-sub">
                                Creates an Empty Leg listing for the return route:&nbsp;
                                <strong>
                                  {q.flightDetails?.destinationCity || '—'} → {q.flightDetails?.departureCity || '—'}
                                </strong>
                              </span>
                            </div>

                            {emptyLegIds[q.id] ? (
                              <button
                                className="qra-arrived-btn qra-arrived-btn--done"
                                style={{ color: 'black' }}
                                disabled
                              >
                                ✓ Empty Leg Created
                              </button>
                            ) : (
                              <button
                                className="qra-arrived-btn"
                                style={{ background: '#d4af37' }}   /* gold tint to distinguish */
                                disabled={savingEmptyLeg === q.id}
                                onClick={() => handleEmptyLegMode(q)}
                              >
                                {savingEmptyLeg === q.id ? (
                                  <>
                                    <div className="qra-mini-spinner qra-mini-spinner--black" />
                                    Creating...
                                  </>
                                ) : (
                                  <span style={{ color: 'black' }}>✈ Empty Leg Mode</span>
                                )}
                              </button>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}