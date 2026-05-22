export const reservationArrivalStatuses = [
  'Not yet on the way',
  'On the way',
  'Nearby',
  'Arrived',
  'Cancelled'
];

export const defaultReservationArrivalStatus = reservationArrivalStatuses[0];

export const reservationLocationConsentText =
  'I agree to share my location for this reservation only to help the restaurant prepare my food before arrival. My location will only be used for reservation preparation and will not be tracked after the reservation is completed, cancelled, or expired.';

export const restaurantLocation = {
  name: 'Persimmonay Cafe',
  latitude: 11.04222563458401,
  longitude: 122.06720001912616
};

export const isReservationOrder = (order) =>
  order?.service === 'Online Reservation' || Boolean(order?.reservation);

export const getReservationArrivalStatus = (order) =>
  order?.reservationArrivalStatus || defaultReservationArrivalStatus;

export const getReservationDateTime = (order) => {
  if (!order?.reservation?.date || !order?.reservation?.time) {
    return null;
  }

  const reservationDate = new Date(`${order.reservation.date}T${order.reservation.time}`);

  return Number.isNaN(reservationDate.getTime()) ? null : reservationDate;
};

export const isReservationExpired = (order, now = Date.now()) => {
  const reservationDate = getReservationDateTime(order);

  if (!reservationDate) {
    return false;
  }

  const activeWindowMs = 3 * 60 * 60 * 1000;

  return reservationDate.getTime() + activeWindowMs < now;
};

export const isActiveReservation = (order) => {
  const arrivalStatus = getReservationArrivalStatus(order);

  return (
    isReservationOrder(order) &&
    !['Completed', 'Cancelled'].includes(order?.status) &&
    arrivalStatus !== 'Cancelled' &&
    !isReservationExpired(order)
  );
};

export const getReservationAvailabilityText = (order) => {
  if (order?.status === 'Completed') return 'Reservation completed';
  if (order?.status === 'Cancelled' || getReservationArrivalStatus(order) === 'Cancelled') {
    return 'Reservation cancelled';
  }
  if (isReservationExpired(order)) return 'Reservation expired';

  return 'Active reservation';
};

export const formatReservationLocationTime = (timestamp) => {
  if (!timestamp) {
    return 'Not shared yet';
  }

  return new Date(timestamp).toLocaleString();
};

export const getLocationMapUrl = (location) => {
  if (!location?.latitude || !location?.longitude) {
    return '#';
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
};

export const getDistanceInKm = (from, to) => {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDistance = toRadians(to.latitude - from.latitude);
  const longitudeDistance = toRadians(to.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const endLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const getArrivalStatusFromLocation = (location) => {
  if (!location?.latitude || !location?.longitude) {
    return defaultReservationArrivalStatus;
  }

  const distanceKm = getDistanceInKm(restaurantLocation, location);

  if (distanceKm <= 0.1) return 'Arrived';
  if (distanceKm <= 1) return 'Nearby';

  return 'On the way';
};
