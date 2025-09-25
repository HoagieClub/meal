// Experimental map interface

'use client';

import React, { useEffect, useState } from 'react';
import { Pane, Heading, Text, Spinner, majorScale, minorScale } from 'evergreen-ui';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const diningHalls = [
  { name: 'Forbes College', lat: 40.342845, lng: -74.656916 },
  { name: 'Mathey College', lat: 40.351372, lng: -74.659893 },
  { name: 'Rockefeller College', lat: 40.350985, lng: -74.659274 },
  { name: 'Whitman & Butler Colleges', lat: 40.343839, lng: -74.655138 },
  { name: 'Yeh College & NCW', lat: 40.345294, lng: -74.657619 },
  { name: 'Center for Jewish Life', lat: 40.346671, lng: -74.653615 },
  { name: 'Graduate College', lat: 40.337425, lng: -74.651343 },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

const ClosestDiningMap = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [closest, setClosest] = useState<(typeof diningHalls)[0] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(coords);

      let minDist = Infinity;
      let nearest = null;
      for (const hall of diningHalls) {
        const dist = getDistance(coords.lat, coords.lng, hall.lat, hall.lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = hall;
        }
      }
      setClosest(nearest);
    });
  }, []);

  if (!userLocation) {
    return (
      <Pane
        height='100vh'
        background='#D8F6C7'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Spinner />
      </Pane>
    );
  }

  return (
    <Pane height='100vh' background='#D8F6C7' padding={majorScale(3)}>
      <Heading size={700} color='green800' marginBottom={majorScale(2)}>
        Closest Princeton Dining Hall
      </Heading>
      <Text size={500} marginBottom={majorScale(2)}>
        Based on your current location, the closest dining hall is:
      </Text>
      {closest && (
        <Text size={600} fontWeight={600} color='green900' marginBottom={majorScale(2)}>
          🍽️ {closest.name}
        </Text>
      )}

      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={16}
        style={{ height: '70vh', width: '100%', borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>You are here</Popup>
        </Marker>
        {diningHalls.map((hall) => (
          <Marker key={hall.name} position={[hall.lat, hall.lng]}>
            <Popup>{hall.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </Pane>
  );
};

export default ClosestDiningMap;
