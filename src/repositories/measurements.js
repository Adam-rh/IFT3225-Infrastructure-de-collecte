import Measurement from "../models/Measurement.js";

export function findDepuis(location, depuis) {
  return Measurement.find({ location, timestamp: { $gte: depuis } })
    .sort({ timestamp: -1 })
    .lean();
}

export function findParLieu(location) {
  return Measurement.find({ location }).sort({ timestamp: 1 }).lean();
}

export function findParLieux(locations) {
  return Measurement.find({ location: { $in: locations } })
    .sort({ timestamp: 1 })
    .lean();
}