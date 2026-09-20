import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function GPSMapView({ locations = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (
      !Array.isArray(locations) ||
      locations.length === 0
    ) {
      return;
    }

    const validLocations = locations.filter(
      (location) =>
        location &&
        location.latitude !== undefined &&
        location.longitude !== undefined
    );

    if (validLocations.length === 0) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const firstLocation = validLocations[0];

    const map = L.map(mapRef.current).setView(
      [
        Number(firstLocation.latitude),
        Number(firstLocation.longitude),
      ],
      13
    );

    mapInstanceRef.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    const coordinates = validLocations.map(
      (location) => [
        Number(location.latitude),
        Number(location.longitude),
      ]
    );

    coordinates.forEach(
      (coordinate, index) => {
        L.marker(coordinate)
          .addTo(map)
          .bindPopup(
            `Location ${index + 1}`
          );
      }
    );

    if (coordinates.length > 1) {
      L.polyline(coordinates).addTo(map);

      map.fitBounds(
        L.latLngBounds(coordinates),
        {
          padding: [30, 30],
        }
      );
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  if (
    !Array.isArray(locations) ||
    locations.length === 0
  ) {
    return (
      <div className="card">
        <h2>GPS History</h2>
        <p>No GPS location history is available.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>GPS History</h2>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

export default GPSMapView;

