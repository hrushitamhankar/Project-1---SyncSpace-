import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(mongoURI);

        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

export async function disconnectDB() {
    try {
        await mongoose.connection.close();
        console.log("MongoDB Disconnected");
    } catch (error) {
        console.error("MongoDB disconnect error:", error.message);
    }
}