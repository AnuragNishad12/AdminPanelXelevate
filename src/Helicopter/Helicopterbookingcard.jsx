import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebaseConfig";
import "../Helicopter/Helicopterbookingcard.css";

const TOTAL_SEATS = 15;

function formatFlightType(type = "") {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(firstName = "", lastName = "") {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

function StatusChip({ label, count, colorClass }) {
  return (
    <div className={`hb-chip ${colorClass}`}>
      <span className="hb-chip-num">{count}</span>
      <span>{label}</span>
    </div>
  );
}

function DetailItem({ label, value, small }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="hb-detail-item">
      <span className="hb-detail-label">{label}</span>
      <span className={`hb-detail-val${small ? " small" : ""}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="hb-section-title">
      <i className={`ti ${icon}`} aria-hidden="true" />
      <span>{title}</span>
    </div>
  );
}

function BookingCard({ booking, bookingId }) {
  const {
    flightDetails = {},
    personalInfo = {},
    aircraftDetails = {},
    meta = {},
    additionalRequirements,
    status,
  } = booking;

  /* ── flight ── */
  const {
    departureDate,
    departureStateCity,
    departureTime,
    destinationCity,
    flightType,
    passengers,
  } = flightDetails;

  /* ── aircraft  (name + price at root of aircraftDetails) ── */
  const { name: aircraftName, price: aircraftPrice, ...otherAircraftFields } = aircraftDetails;

  /* ── personal ── */
  const { firstName, lastName, email, phone } = personalInfo;

  /* ── meta (any extra top-level fields) ── */
  const metaEntries = Object.entries(meta || {});

  const filled       = Number(passengers) || 0;
  const filledPercent = Math.round((filled / TOTAL_SEATS) * 100);

  return (
    <div className="hb-card">

      {/* ── Route header ── */}
      <div className="hb-card-header">
        <div className="hb-route">
          <div>
            <div className="hb-route-from">{departureStateCity || "—"}</div>
            <div className="hb-route-to">{destinationCity || "—"}</div>
          </div>
          <div className="hb-dotted-line" />
          <i className="ti ti-arrow-right hb-arrow" aria-hidden="true" />
        </div>

        <div className="hb-aircraft-info">
          <div className="hb-aircraft-name">{aircraftName || formatFlightType(flightType)}</div>
          <div className="hb-aircraft-type">Helicopter · Private</div>
          <span className="hb-status-badge">{status || "Available"}</span>
        </div>

        <div className="hb-departure-info">
          <div className="hb-dep-label">Departure</div>
          <div className="hb-dep-val">{departureDate || "—"}</div>
          <div className="hb-dep-label" style={{ marginTop: 4 }}>Time</div>
          <div className="hb-dep-time">{departureTime || "—"}</div>
        </div>
      </div>

      {/* ── Seats progress ── */}
      <div className="hb-progress-wrap">
        <div className="hb-progress-bg">
          <div className="hb-progress-fill" style={{ width: `${filledPercent}%` }} />
        </div>
        <p className="hb-seats">{filled} / {TOTAL_SEATS} seats filled</p>
      </div>

      <div className="hb-divider" />

      {/* ── Flight details ── */}
      <SectionTitle icon="ti-plane-departure" title="Flight details" />
      <div className="hb-detail-grid" style={{ marginTop: 10 }}>
        <DetailItem label="From"        value={departureStateCity} />
        <DetailItem label="To"          value={destinationCity} />
        <DetailItem label="Date"        value={departureDate} />
        <DetailItem label="Time"        value={departureTime} />
        <DetailItem label="Passengers"  value={passengers} />
        <DetailItem label="Flight type" value={formatFlightType(flightType)} />
        <DetailItem label="Booking ID"  value={bookingId} small />
      </div>

      <div className="hb-divider" />

      {/* ── Aircraft details ── */}
      <SectionTitle icon="ti-helicopter" title="Aircraft details" />
      <div className="hb-detail-grid" style={{ marginTop: 10 }}>
        <DetailItem label="Aircraft name" value={aircraftName} />
        <DetailItem label="Price"         value={aircraftPrice ? `₹${aircraftPrice}` : undefined} />
        {/* render any extra fields stored under aircraftDetails dynamically */}
        {Object.entries(otherAircraftFields).map(([key, val]) => (
          <DetailItem
            key={key}
            label={key.replace(/([A-Z])/g, " $1").toLowerCase()}
            value={typeof val === "object" ? JSON.stringify(val) : String(val)}
          />
        ))}
      </div>

      {additionalRequirements && (
        <>
          <div className="hb-divider" />
          <SectionTitle icon="ti-notes" title="Additional requirements" />
          <div className="hb-notes-box" style={{ marginTop: 10 }}>
            {additionalRequirements}
          </div>
        </>
      )}

      {metaEntries.length > 0 && (
        <>
          <div className="hb-divider" />
          <SectionTitle icon="ti-info-circle" title="Meta" />
          <div className="hb-detail-grid" style={{ marginTop: 10 }}>
            {metaEntries.map(([key, val]) => (
              <DetailItem
                key={key}
                label={key.replace(/([A-Z])/g, " $1").toLowerCase()}
                value={typeof val === "object" ? JSON.stringify(val) : String(val)}
              />
            ))}
          </div>
        </>
      )}

      <div className="hb-divider" />

      {/* ── Passenger details ── */}
      <SectionTitle icon="ti-user" title="Passenger details" />
      <div className="hb-personal-section" style={{ marginTop: 10 }}>
        <div className="hb-person-row">
          <div className="hb-avatar">{getInitials(firstName, lastName)}</div>
          <div>
            <div className="hb-person-name">{firstName} {lastName}</div>
            <div className="hb-person-meta">Primary passenger</div>
          </div>
        </div>
        <div className="hb-contact-grid">
          <div className="hb-contact-item">
            <i className="ti ti-mail hb-contact-icon" aria-hidden="true" />
            {email || "—"}
          </div>
          <div className="hb-contact-item">
            <i className="ti ti-phone hb-contact-icon" aria-hidden="true" />
            {phone || "—"}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function HelicopterBookingRequest() {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch]           = useState("");

  useEffect(() => {
    const bookingsRef  = ref(database, "HelicopterBookingRequest");
    const unsubscribe  = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsed = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          setBookings(parsed);
        } else {
          setBookings([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filters = ["All", "Available", "Booked", "Expired", "Cancelled"];

  const filtered = bookings.filter((b) => {
    const matchesFilter =
      activeFilter === "All" || (b.status || "Available") === activeFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      b.flightDetails?.destinationCity?.toLowerCase().includes(q) ||
      b.flightDetails?.departureStateCity?.toLowerCase().includes(q) ||
      b.personalInfo?.firstName?.toLowerCase().includes(q) ||
      b.personalInfo?.lastName?.toLowerCase().includes(q) ||
      b.flightDetails?.flightType?.toLowerCase().includes(q) ||
      b.aircraftDetails?.name?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const countFor = (status) =>
    status === "All"
      ? bookings.length
      : bookings.filter((b) => (b.status || "Available") === status).length;

  return (
    <div className="hb-page">
      <p className="hb-admin-label">Admin Panel</p>
      <div className="hb-page-title">
        Helicopter Bookings{" "}
        <span className="hb-badge-count">{bookings.length}</span>
      </div>
      <p className="hb-page-sub">
        Manage booking requests — edit pricing &amp; seat capacity in real-time
      </p>

      <div className="hb-status-chips">
        <StatusChip label="Available" count={countFor("Available")} colorClass="hb-chip-green" />
        <StatusChip label="Booked"    count={countFor("Booked")}    colorClass="hb-chip-blue"  />
        <StatusChip label="Expired"   count={countFor("Expired")}   colorClass="hb-chip-gray"  />
        <StatusChip label="Cancelled" count={countFor("Cancelled")} colorClass="hb-chip-red"   />
      </div>

      <div className="hb-search-bar">
        <i className="ti ti-search" aria-hidden="true" style={{ fontSize: 15, color: "#666" }} />
        <input
          type="text"
          placeholder="Search aircraft, city, passenger..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hb-search-input"
        />
      </div>

      <div className="hb-filter-tabs">
        {filters.map((f) => (
          <button
            key={f}
            className={`hb-tab${activeFilter === f ? " active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f} ({countFor(f)})
          </button>
        ))}
      </div>

      {loading && <div className="hb-state-msg">Loading bookings...</div>}
      {error   && <div className="hb-state-msg hb-error">Error: {error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="hb-state-msg">No bookings found.</div>
      )}

      {filtered.map((booking) => (
        <BookingCard key={booking.id} booking={booking} bookingId={booking.id} />
      ))}
    </div>
  );
}