import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebaseConfig';
import './EventsBooked.css';

/* ── Helpers ── */
const initials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).replace(',', ' •');
  } catch { return iso; }
};

const eur = (n) =>
  new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

/* ── Icons ── */
const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const SeatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/>
    <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/>
    <path d="M6 19v2M18 19v2"/>
  </svg>
);

const MailIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MusicIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1">
    <path d="M9 19V6l12-3v13"/>
    <circle cx="6" cy="19" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Status config ── */
const STATUS_OPTIONS = [
  { key: 'pending',   label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)'  },
  { key: 'confirmed', label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)'  },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'   },
];

const getStatusCfg = (s = 'pending') =>
  STATUS_OPTIONS.find(o => o.key === s.toLowerCase()) ?? STATUS_OPTIONS[0];

/* ── Status Badge (top of card image) ── */
const Badge = ({ status = 'pending' }) => {
  const k = status.toLowerCase();
  return (
    <div className={`eb-badge ${k}`}>
      <div className={`eb-dot ${k}`} />
      {k.charAt(0).toUpperCase() + k.slice(1)}
    </div>
  );
};

/* ────────────────────────────────────────────
   Status Changer — dropdown inside the card
──────────────────────────────────────────── */
const StatusChanger = ({ bookingId, currentStatus }) => {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [current, setCurrent] = useState((currentStatus ?? 'pending').toLowerCase());

  const cfg = getStatusCfg(current);

  const handleSelect = async (newStatus) => {
    if (newStatus === current) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      await update(ref(database, `EventBookingDetails/${bookingId}`), { status: newStatus });
      setCurrent(newStatus);
    } catch (e) {
      console.error('Status update failed:', e);
      alert('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sc-wrap">
      {/* ── Trigger ── */}
      <button
        className="sc-trigger"
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        onClick={() => !saving && setOpen(v => !v)}
        disabled={saving}
      >
        <span className="sc-dot" style={{ background: cfg.color }} />
        <span className="sc-label">{saving ? 'Saving…' : cfg.label}</span>
        <span className="sc-chevron" style={{ color: cfg.color }}>
          {saving ? <span className="sc-spinner" /> : <ChevronIcon />}
        </span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          <div className="sc-backdrop" onClick={() => setOpen(false)} />
          <div className="sc-dropdown">
            <div className="sc-dropdown-label">Change Status</div>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className="sc-option"
                style={current === opt.key
                  ? { background: opt.bg, borderColor: opt.border }
                  : {}
                }
                onClick={() => handleSelect(opt.key)}
              >
                <span className="sc-opt-dot" style={{ background: opt.color }} />
                <span
                  className="sc-opt-label"
                  style={{ color: current === opt.key ? opt.color : '#e5e5e5' }}
                >
                  {opt.label}
                </span>
                {current === opt.key && (
                  <span className="sc-opt-check" style={{ color: opt.color }}>
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Booking Card ── */
const BookingCard = ({ booking, idx }) => {
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  const {
    id, eventTitle, location, organisedBy, dateTime,
    pricePerSeat, seatsBooked, totalAmount, status,
    userName, userEmail, userPhone, image,
    attendeeNames,
  } = booking;

  const allAttendees = attendeeNames
    ? Array.isArray(attendeeNames)
      ? attendeeNames
      : Object.values(attendeeNames)
    : [userName].filter(Boolean);

  return (
    <div className="eb-card" style={{ animationDelay: `${idx * 0.07}s` }}>

      {/* Image */}
      <div className="eb-img-wrap">
        {image
          ? <img src={image} alt={eventTitle} onError={e => { e.target.style.display = 'none'; }} />
          : <div className="eb-img-placeholder"><MusicIcon /></div>
        }
        <Badge status={status} />
        <div className="eb-booking-ref">#{(id || '').slice(-8).toUpperCase()}</div>
      </div>

      {/* Body */}
      <div className="eb-body">

        <div className="eb-event-name">{eventTitle || '—'}</div>
        {location    && <div className="eb-location">📍 {location}</div>}
        {organisedBy && <div className="eb-org">Organised by <strong>{organisedBy}</strong></div>}

        {/* Chips */}
        <div className="eb-chips">
          {dateTime && <div className="eb-chip"><CalIcon />{formatDate(dateTime)}</div>}
          {seatsBooked != null && (
            <div className="eb-chip teal">
              <SeatIcon />{seatsBooked} {seatsBooked === 1 ? 'Seat' : 'Seats'} Booked
            </div>
          )}
        </div>

        <div className="eb-divider" />

        {/* Primary booker */}
        <div className="eb-user">
          <div className="eb-avatar">{initials(userName)}</div>
          <div>
            <div className="eb-uname">{userName || '—'}</div>
            <div className="eb-uemail">{userEmail || '—'}</div>
          </div>
        </div>

        <div className="eb-contacts">
          {userEmail && <div className="eb-contact"><MailIcon />{userEmail}</div>}
          {userPhone && <div className="eb-contact"><PhoneIcon />{userPhone}</div>}
        </div>

        {/* Attendees */}
        {allAttendees.length > 0 && (
          <>
            <div className="eb-divider" />
            <div className="eb-attendees-header">
              <div className="eb-attendees-label">
                <UsersIcon /> Attendees ({allAttendees.length})
              </div>
              {allAttendees.length > 1 && (
                <button
                  className="eb-attendees-toggle"
                  onClick={() => setShowAllAttendees(v => !v)}
                >
                  {showAllAttendees ? 'Hide ▲' : 'Show all ▼'}
                </button>
              )}
            </div>

            <div className="eb-attendees-list">
              <div className="eb-attendee-row primary">
                <div className="eb-attendee-num">1</div>
                <div className="eb-attendee-avatar">{initials(allAttendees[0])}</div>
                <div className="eb-attendee-name">
                  {allAttendees[0] || '—'}
                  <span className="eb-attendee-primary-badge">Primary</span>
                </div>
              </div>

              {allAttendees.slice(1).map((name, i) => {
                const visible = showAllAttendees || allAttendees.length <= 3;
                if (!visible) return null;
                return (
                  <div key={i} className="eb-attendee-row">
                    <div className="eb-attendee-num">{i + 2}</div>
                    <div className="eb-attendee-avatar">{initials(name)}</div>
                    <div className="eb-attendee-name">{name || '—'}</div>
                  </div>
                );
              })}

              {!showAllAttendees && allAttendees.length > 3 && (
                <div className="eb-attendees-more" onClick={() => setShowAllAttendees(true)}>
                  +{allAttendees.length - 1} more attendees — click to expand
                </div>
              )}
            </div>
          </>
        )}

        <div className="eb-divider" />

        {/* Pricing */}
        <div className="eb-price-box">
          <div className="eb-breakdown">
            <span>{eur(pricePerSeat)}</span> per seat<br />
            × <span>{seatsBooked}</span> seats
          </div>
          <div>
            <div className="eb-total-label">Total</div>
            <div className="eb-total-amount">{eur(totalAmount)}</div>
          </div>
        </div>

        <div className="eb-divider" />

        {/* ── Status Changer ── */}
        <div className="eb-status-section">
          <div className="eb-status-section-label">Update Booking Status</div>
          <StatusChanger bookingId={id} currentStatus={status} />
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const EventsBooked = () => {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const bookingsRef = ref(database, 'EventBookingDetails');
    const unsub = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .reverse();
        setBookings(parsed);
      } else {
        setBookings([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const count = (s) => bookings.filter(b => b.status?.toLowerCase() === s).length;

  const totalRevenue = bookings
    .filter(b => b.status?.toLowerCase() !== 'cancelled')
    .reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === 'all' || b.status?.toLowerCase() === filter;
    const q = searchQuery.toLowerCase();
    const attendeeList = b.attendeeNames
      ? Array.isArray(b.attendeeNames) ? b.attendeeNames : Object.values(b.attendeeNames)
      : [];
    const matchSearch =
      !q ||
      b.userName?.toLowerCase().includes(q)   ||
      b.userEmail?.toLowerCase().includes(q)  ||
      b.eventTitle?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q)         ||
      attendeeList.some(n => n?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const FILTERS = [
    { key: 'all',       label: `All (${bookings.length})` },
    { key: 'pending',   label: `Pending (${count('pending')})` },
    { key: 'confirmed', label: `Confirmed (${count('confirmed')})` },
    { key: 'cancelled', label: `Cancelled (${count('cancelled')})` },
  ];

  return (
    <div className="eb-root">

      <div className="eb-eyebrow">Dashboard</div>
      <h1 className="eb-title">Events <span>Booked</span></h1>

      <div className="eb-stats">
        <div className="eb-stat">
          <div className="eb-stat-val">{bookings.length}</div>
          <div className="eb-stat-label">Total Bookings</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-val">{count('pending')}</div>
          <div className="eb-stat-label">Pending</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-val">{count('confirmed')}</div>
          <div className="eb-stat-label">Confirmed</div>
        </div>
        <div className="eb-stat">
          <div className="eb-stat-val" style={{ fontSize: '18px', paddingTop: '5px' }}>
            {new Intl.NumberFormat('en-EU', {
              style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
            }).format(totalRevenue)}
          </div>
          <div className="eb-stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="eb-filters">
        <input
          className="eb-search"
          placeholder="Search by name, attendee, email or event…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`eb-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="eb-loading">
          <div className="eb-spinner" />
          <div className="eb-loading-txt">Loading bookings…</div>
        </div>
      ) : (
        <div className="eb-grid">
          {filtered.length === 0 ? (
            <div className="eb-empty">
              <div className="eb-empty-icon">🎟️</div>
              <div className="eb-empty-title">No bookings found</div>
              <div>Try adjusting your search or filter</div>
            </div>
          ) : (
            filtered.map((b, i) => (
              <BookingCard key={b.id} booking={b} idx={i} />
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default EventsBooked;