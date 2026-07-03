// Client-side booking history (localStorage). Each booking captures enough of
// the therapist to re-open the booking flow and "continue" a pending/failed one.
const KEY = "mindspace_bookings";

export function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  // let any open screen (e.g. the therapist page) refresh
  window.dispatchEvent(new CustomEvent("mindspace:bookings-changed"));
}

export function addBooking(b) {
  const list = loadBookings();
  const booking = {
    id: `bk-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...b,
  };
  list.unshift(booking);
  save(list);
  return booking;
}

export function updateBooking(id, patch) {
  const list = loadBookings().map((b) =>
    b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
  );
  save(list);
  return list;
}

export function removeBooking(id) {
  save(loadBookings().filter((b) => b.id !== id));
}

// Keep only the therapist fields we need to re-render and re-book.
export function slimTherapist(t) {
  return {
    id: t.id,
    name: t.name,
    title: t.title,
    initials: t.initials,
    color: t.color,
    price: t.price,
    rating: t.rating,
    reviews: t.reviews,
    specialties: t.specialties,
    sessionTypes: t.sessionTypes,
    available: t.available,
  };
}
