import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  formatReservationLocationTime,
  getReservationAvailabilityText,
  isActiveReservation,
  restaurantLocation
} from '../utils/reservationarrival';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const mapPosition = (location) => [Number(location.latitude), Number(location.longitude)];

const FitReservationRoute = ({ customerLocation, routePositions }) => {
  const map = useMap();

  useEffect(() => {
    const points = routePositions.length > 0
      ? routePositions
      : customerLocation
        ? [mapPosition(customerLocation), mapPosition(restaurantLocation)]
        : [mapPosition(restaurantLocation)];

    map.fitBounds(L.latLngBounds(points), {
      padding: [28, 28],
      maxZoom: 16
    });
  }, [customerLocation, map, routePositions]);

  return null;
};

const InvalidateMapSize = () => {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
};

const ReservationRouteMap = ({ reservation }) => {
  const latestLocation = reservation?.latestReservationLocation;
  const activeReservation = isActiveReservation(reservation);
  const [routePositions, setRoutePositions] = useState([]);
  const [routeError, setRouteError] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasLocation = Boolean(latestLocation?.latitude && latestLocation?.longitude);

  const routeUrl = useMemo(() => {
    if (!hasLocation || !activeReservation) {
      return '';
    }

    const start = `${latestLocation.longitude},${latestLocation.latitude}`;
    const end = `${restaurantLocation.longitude},${restaurantLocation.latitude}`;

    return `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
  }, [activeReservation, hasLocation, latestLocation]);

  useEffect(() => {
    if (!routeUrl) {
      setRoutePositions([]);
      setRouteError('');
      return undefined;
    }

    const controller = new AbortController();

    const loadRoute = async () => {
      try {
        setLoadingRoute(true);
        setRouteError('');

        const response = await fetch(routeUrl, { signal: controller.signal });
        const result = await response.json();
        const coordinates = result?.routes?.[0]?.geometry?.coordinates;

        if (!response.ok || !Array.isArray(coordinates) || coordinates.length === 0) {
          throw new Error('No route returned');
        }

        setRoutePositions(
          coordinates.map(([longitude, latitude]) => [latitude, longitude])
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          setRoutePositions([]);
          setRouteError('Unable to load a real road route right now. Please refresh the route or try again later.');
        }
      } finally {
        setLoadingRoute(false);
      }
    };

    loadRoute();

    return () => controller.abort();
  }, [refreshKey, routeUrl]);

  if (!activeReservation) {
    return (
      <div className="reservation-map-empty">
        Location map is unavailable because this reservation is {getReservationAvailabilityText(reservation).toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="reservation-route-map-card">
      <div className="reservation-route-map-header">
        <div>
          <span>Arrival map</span>
          <strong>{hasLocation ? 'Customer route to restaurant' : 'Waiting for customer location'}</strong>
          <small>
            {hasLocation
              ? `Last shared ${formatReservationLocationTime(latestLocation.timestamp)}`
              : 'Ask the customer to share location from their reservation tracking page.'}
          </small>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loadingRoute || !hasLocation}
        >
          {loadingRoute ? 'Refreshing...' : 'Refresh Location'}
        </button>
      </div>

      {!hasLocation && (
        <div className="reservation-map-empty-inline">
          No customer location has been shared for this active reservation yet. The restaurant marker is shown below.
        </div>
      )}
      {routeError && <p className="checkout-error">{routeError}</p>}

      <MapContainer
        className="reservation-route-map"
        center={mapPosition(restaurantLocation)}
        zoom={14}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLocation && (
          <Marker position={mapPosition(latestLocation)}>
            <Popup>Customer latest shared location</Popup>
          </Marker>
        )}
        <Marker position={mapPosition(restaurantLocation)}>
          <Popup>{restaurantLocation.name}</Popup>
        </Marker>
        {routePositions.length > 0 && (
          <Polyline positions={routePositions} pathOptions={{ color: '#6A6F4C', weight: 5 }} />
        )}
        <FitReservationRoute
          customerLocation={hasLocation ? latestLocation : null}
          routePositions={routePositions}
        />
        <InvalidateMapSize />
      </MapContainer>
    </div>
  );
};

export default ReservationRouteMap;
