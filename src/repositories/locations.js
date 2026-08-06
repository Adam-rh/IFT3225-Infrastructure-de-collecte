import Location from "../models/Location.js";

export function findTous() {
  return Location.find().lean();
}