import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);

let database = null;

/**
 * Connect to MongoDB and return the database instance.
 */
export async function connectMongo() {
    if (database) {
        return database;
    }

    await client.connect();

    database = client.db(
        process.env.MONGODB_DB || "syncspace"
    );

    console.log("[MONGO] Connected to MongoDB");

    return database;
}

/**
 * Get the existing database connection.
 */
export function getMongoDatabase() {
    if (!database) {
        throw new Error("MongoDB is not connected");
    }

    return database;
}

/**
 * Close MongoDB connection.
 */
export async function closeMongo() {
    await client.close();

    database = null;

    console.log("[MONGO] MongoDB connection closed");
}