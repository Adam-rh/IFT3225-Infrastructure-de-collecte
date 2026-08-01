import Observation from "../models/Observation.js";

export function findDerniere(location) {
  return Observation.findOne({ location }).sort({ timestamp: -1 }).lean();
}

export function findParLieu(location) {
  return Observation.find({ location }).lean();
}
