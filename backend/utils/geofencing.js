/**
 * Calculates the great-circle distance between two points (latitude and longitude)
 * using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in meters
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Checks if a coordinate is within the radius of any office location with precision verification.
 * @param {string} userLocation - "lat, lng"
 * @param {Array} offices - Array of office objects { location, radius }
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {object} - { inRange: boolean, lowPrecision: boolean }
 */
const isWithinRange = (userLocation, offices, accuracy = 0) => {
  const GEOFENCE_STRICT_MODE = process.env.GEOFENCE_STRICT_MODE === 'true';
  const MAX_ACCURACY_THRESHOLD = parseInt(process.env.MAX_GPS_ACCURACY) || 100; // Meters

  // Signal Quality Check
  const lowPrecision = accuracy > MAX_ACCURACY_THRESHOLD;

  if (!userLocation || !offices || offices.length === 0) {
    // If strict mode is ON, we fail if no office data exists
    return { inRange: !GEOFENCE_STRICT_MODE, lowPrecision: false };
  }

  try {
    const [uLat, uLng] = userLocation.split(',').map(Number);
    
    const matchedOffice = offices.find(office => {
      const [oLat, oLng] = office.location.split(',').map(Number);
      const distance = getDistance(uLat, uLng, oLat, oLng);
      // We keep the office.radius (typically 100m) as requested
      return distance <= (office.radius || 100);
    });

    return { inRange: !!matchedOffice, lowPrecision, matchedOffice };
  } catch (err) {
    console.error('Spatial Verification Error:', err);
    return { inRange: false, lowPrecision: true };
  }
};

module.exports = { getDistance, isWithinRange };
