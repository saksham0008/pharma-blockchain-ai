/**
 * GPS validation middleware.
 * Expects req.body.lat and req.body.lng (or req.body.latitude / req.body.longitude).
 * Returns HTTP 400 if coordinates are outside valid ranges:
 *   latitude:  [-90,  90]
 *   longitude: [-180, 180]
 */
function validateGPS(req, res, next) {
  const lat = req.body.lat ?? req.body.latitude;
  const lng = req.body.lng ?? req.body.longitude;

  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return res.status(400).json({
      error: "GPS coordinates are required (lat and lng)",
      code: "MISSING_GPS"
    });
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({
      error: "GPS coordinates must be valid numbers",
      code: "INVALID_GPS"
    });
  }

  if (latNum < -90 || latNum > 90) {
    return res.status(400).json({
      error: `Latitude must be between -90 and 90, got ${latNum}`,
      code: "INVALID_GPS"
    });
  }

  if (lngNum < -180 || lngNum > 180) {
    return res.status(400).json({
      error: `Longitude must be between -180 and 180, got ${lngNum}`,
      code: "INVALID_GPS"
    });
  }

  // Attach parsed numbers to req for downstream use
  req.gps = { lat: latNum, lng: lngNum };
  next();
}

/**
 * Validate request body has required fields.
 * Usage: validateFields(["drugID", "name", "batch"])
 */
function validateFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === "");
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(", ")}`,
        code: "MISSING_FIELDS"
      });
    }
    next();
  };
}

module.exports = { validateGPS, validateFields };
