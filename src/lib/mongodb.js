import mongoose from "mongoose";

export default async function mongooseConnection() {
  try {
    // Check if the connection is already established
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return mongoose.connection.asPromise();
    }

    // Fetch the URI from environment variables
    const uri = process.env.MONGO_DB_URI;

    if (!uri) {
      throw new Error(
        "MongoDB URI is not defined in environment variables. Please set 'MONGO_DB_URI' in your .env.local file."
      );
    }

    // Connect to MongoDB
    await mongoose.connect(uri);

    console.log("MongoDB connected successfully");
    return mongoose.connection; // Return the connection instance

  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw new Error("Failed to connect to MongoDB");
  }
}
