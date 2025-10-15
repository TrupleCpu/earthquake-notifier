import { Schema, model, models } from "mongoose";


export interface IEarthquake {
  dateTime: string,
  latitude: string,
  longitude: string,
  depth: string,
  magnitude: string,
  location: string,
}

const EarthquakeSchema = new Schema({
  dateTime: String,
  latitude: String,
  longitude: String,
  depth: String,
  magnitude: String,
  location: String,
}, { timestamps: true });

export default models.Earthquake || model("Earthquake", EarthquakeSchema);
