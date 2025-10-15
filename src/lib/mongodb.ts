import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URL!;
if (!MONGODB_URI) {
  throw new Error("URI NOT DEFINED!");
}

// Define a global type for the cache
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

// Extend NodeJS global type
declare global {
  var mongoose: MongooseCache | undefined;
}


// Use the global cache
const globalCache: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
};

global.mongoose = globalCache;

export async function connectToDatabase(): Promise<Mongoose> {
  if (globalCache.conn) return globalCache.conn;

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
  } catch (err) {
    globalCache.promise = null;
    throw err;
  }

  return globalCache.conn;
}
