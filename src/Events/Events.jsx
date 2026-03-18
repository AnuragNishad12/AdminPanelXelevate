import React, { useState, useEffect, useRef } from "react";
import { ref as dbRef, push, onValue, off } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "../firebaseConfig";
import "./Events.css";


const DB_PATH = "xelevateEvents";

const EMPTY_FORM = {
  eventTitle: "",
  dateTime: "",
  location: "",
  organisedBy: "",
  totalSeats: "",
  availableSeats: "",
  pricePerSeat: "",
  benefits: "",
  description: "",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Events() {
  const [form, setForm]               = useState(EMPTY_FORM);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [events, setEvents]           = useState([]);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const fileInputRef                  = useRef(null);

  // ── Real-time listener — Firebase Realtime Database ──────────────────────
  useEffect(() => {
    const eventsRef = dbRef(database, DB_PATH);

    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setEvents([]);
        return;
      }
      // Convert { key: {...} } → [{ id: key, ...data }], newest first
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setEvents(list);
    });

    return () => off(eventsRef); // detach listener on unmount
  }, []);

  // ── Field handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) setErrors((prev) => ({ ...prev, image: "" }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    const requiredFields = [
      ["eventTitle",     "Event title is required"],
      ["dateTime",       "Date & time is required"],
      ["location",       "Location is required"],
      ["organisedBy",    "Organiser name is required"],
      ["totalSeats",     "Total seats is required"],
      ["availableSeats", "Available seats is required"],
      ["pricePerSeat",   "Price per seat is required"],
      ["benefits",       "Benefits are required"],
      ["description",    "Description is required"],
    ];

    requiredFields.forEach(([field, msg]) => {
      if (!form[field].toString().trim()) newErrors[field] = msg;
    });

    if (!imageFile) {
      newErrors.image = "Event image is required";
    }

    if (
      form.availableSeats &&
      form.totalSeats &&
      Number(form.availableSeats) > Number(form.totalSeats)
    ) {
      newErrors.availableSeats = "Available seats cannot exceed total seats";
    }

    if (form.totalSeats && Number(form.totalSeats) <= 0) {
      newErrors.totalSeats = "Total seats must be greater than 0";
    }

    if (form.pricePerSeat && Number(form.pricePerSeat) < 0) {
      newErrors.pricePerSeat = "Price cannot be negative";
    }

    return newErrors;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      // 1️⃣  Upload image → Firebase Storage
      const imgRef = storageRef(
        storage,
        `xelevateEvents/${Date.now()}_${imageFile.name}`
      );
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);

      // 2️⃣  Push record → Firebase Realtime Database
      const eventsRef = dbRef(database, DB_PATH);
      await push(eventsRef, {
        ...form,
        totalSeats:     Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        pricePerSeat:   Number(form.pricePerSeat),
        imageUrl,
        createdAt:      Date.now(), // epoch ms — used for sorting
      });

      // 3️⃣  Reset
      setForm(EMPTY_FORM);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Event published successfully! 🎉");
    } catch (err) {
      console.error("Firebase error:", err);
      showToast("Failed to publish event. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="xe-root">

      {/* Toast */}
      {toast && (
        <div className={`xe-toast ${toast.isError ? "xe-toast--error" : ""}`}>
          {toast.msg}
        </div>
      )}

      <div className="xe-layout">

        {/* ══════════ LEFT — FORM ══════════ */}
        <aside className="xe-sidebar">
          <div className="xe-form-header">
            <span className="xe-form-eyebrow">New Event</span>
            <h2 className="xe-form-title">Add Event Details</h2>
          </div>

          <form className="xe-form" onSubmit={handleSubmit} noValidate>

            {/* Image upload */}
            <div className="xe-field">
              <label className="xe-label">Event Image</label>
              <div
                className={`xe-image-drop
                  ${imagePreview ? "xe-image-drop--filled" : ""}
                  ${errors.image ? "xe-image-drop--error"  : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="xe-image-preview" />
                ) : (
                  <div className="xe-image-placeholder">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span>Click to upload image</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="xe-file-hidden"
              />
              {errors.image && <span className="xe-error">{errors.image}</span>}
            </div>

            <Field label="Event Title" error={errors.eventTitle}>
              <input
                name="eventTitle"
                value={form.eventTitle}
                onChange={handleChange}
                placeholder="e.g. Tech Summit 2025"
                className={`xe-input ${errors.eventTitle ? "xe-input--error" : ""}`}
              />
            </Field>

            <Field label="Date & Time" error={errors.dateTime}>
              <input
                type="datetime-local"
                name="dateTime"
                value={form.dateTime}
                onChange={handleChange}
                className={`xe-input ${errors.dateTime ? "xe-input--error" : ""}`}
              />
            </Field>

            <Field label="Location" error={errors.location}>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Dubai, UAE"
                className={`xe-input ${errors.location ? "xe-input--error" : ""}`}
              />
            </Field>

            <Field label="Organised By" error={errors.organisedBy}>
              <input
                name="organisedBy"
                value={form.organisedBy}
                onChange={handleChange}
                placeholder="e.g. Xelevate Group"
                className={`xe-input ${errors.organisedBy ? "xe-input--error" : ""}`}
              />
            </Field>

            <div className="xe-row">
              <Field label="Total Seats" error={errors.totalSeats}>
                <input
                  type="number"
                  name="totalSeats"
                  value={form.totalSeats}
                  onChange={handleChange}
                  placeholder="500"
                  min="1"
                  className={`xe-input ${errors.totalSeats ? "xe-input--error" : ""}`}
                />
              </Field>
              <Field label="Available Seats" error={errors.availableSeats}>
                <input
                  type="number"
                  name="availableSeats"
                  value={form.availableSeats}
                  onChange={handleChange}
                  placeholder="320"
                  min="0"
                  className={`xe-input ${errors.availableSeats ? "xe-input--error" : ""}`}
                />
              </Field>
            </div>

            <Field label="Price Per Seat (€)" error={errors.pricePerSeat}>
              <input
                type="number"
                name="pricePerSeat"
                value={form.pricePerSeat}
                onChange={handleChange}
                placeholder="e.g. 299"
                min="0"
                step="0.01"
                className={`xe-input ${errors.pricePerSeat ? "xe-input--error" : ""}`}
              />
            </Field>

            <Field label="Benefits Provided" error={errors.benefits}>
              <input
                name="benefits"
                value={form.benefits}
                onChange={handleChange}
                placeholder="e.g. Lunch, Certificate, Networking"
                className={`xe-input ${errors.benefits ? "xe-input--error" : ""}`}
              />
            </Field>

            <Field label="Event Description" error={errors.description}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your event…"
                rows={4}
                className={`xe-textarea ${errors.description ? "xe-input--error" : ""}`}
              />
            </Field>

            <button type="submit" className="xe-submit" disabled={submitting}>
              {submitting ? <span className="xe-spinner" /> : "Publish Event"}
            </button>

          </form>
        </aside>

        {/* ══════════ RIGHT — CARDS ══════════ */}
        <main className="xe-main">
          <div className="xe-main-header">
            <h1 className="xe-main-title">Available Events</h1>
            <span className="xe-event-count">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="xe-divider" />

          {events.length === 0 ? (
            <div className="xe-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <p>No events yet. Add your first event!</p>
            </div>
          ) : (
            <div className="xe-grid">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="xe-field">
      <label className="xe-label">{label}</label>
      {children}
      {error && <span className="xe-error">{error}</span>}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }) {
  const seatsLeft = event.availableSeats;
  const soldOut   = seatsLeft === 0;
  const lowStock  = seatsLeft > 0 && seatsLeft <= 10;

  return (
    <div className="xe-card">
      <div className="xe-card-img-wrap">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.eventTitle} className="xe-card-img" />
        ) : (
          <div className="xe-card-img-placeholder">No Image</div>
        )}
        {soldOut  && <span className="xe-badge xe-badge--sold">Sold Out</span>}
        {lowStock && !soldOut && (
          <span className="xe-badge xe-badge--low">Only {seatsLeft} left</span>
        )}
      </div>

      <div className="xe-card-body">
        <h3 className="xe-card-title">{event.eventTitle}</h3>
        <p className="xe-card-location">{event.location}</p>

        {event.organisedBy && (
          <p className="xe-card-category">
            Organised by <strong>{event.organisedBy}</strong>
          </p>
        )}

        <p className="xe-card-desc">{event.description}</p>

        {event.dateTime && (
          <div className="xe-tags">
            <span className="xe-tag xe-tag--date">
              📅 {formatDate(event.dateTime)}
            </span>
          </div>
        )}

        <div className="xe-chips">
          <span className="xe-chip">🎟 {event.totalSeats} seats</span>
          <span className={`xe-chip
            ${soldOut  ? "xe-chip--sold" : ""}
            ${lowStock ? "xe-chip--low"  : ""}`}>
            ✅ {event.availableSeats} available
          </span>
        </div>

        {event.benefits && (
          <div className="xe-benefits">
            <span className="xe-benefits-label">Includes:</span>
            <span className="xe-benefits-text">{event.benefits}</span>
          </div>
        )}

        <div className="xe-card-footer">
          <span className="xe-price">€{Number(event.pricePerSeat).toFixed(2)}</span>
          <span className="xe-price-label">per seat</span>
        </div>
      </div>
    </div>
  );
}