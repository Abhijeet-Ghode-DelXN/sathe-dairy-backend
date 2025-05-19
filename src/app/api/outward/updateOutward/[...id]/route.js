import { Outward } from "@/models/outward";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Import mongoose to validate ObjectId
import jwt from "jsonwebtoken"; // Import a library for JWT verification (if you're using JWT)
import mongooseConnection from "@/lib/mongodb";
export async function PATCH(req, { params }) {
  await mongooseConnection()
  // Destructure the 'id' from the array since it's a catch-all route
  const { id } = await params; 
  const OutwardId = id[0]; // Access the first element of the array

  const updateData = await req.json(); // Extract the request body data (partial Outward data)

  console.log("Received Outward ID:", OutwardId); // Log the received ID
  console.log("Data to update:", updateData); // Log the update data

  // Validate the MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(OutwardId)) {
    console.error("Invalid ID format:", OutwardId); // Log invalid ID format
    return NextResponse.json({ message: "Invalid Outward ID format" }, { status: 400 });
  }

  // Extract token from the request headers (assuming JWT)
  const token = req.headers.get("Authorization")?.split(" ")[1]; // Assuming Bearer token

  if (!token) {
    return NextResponse.json({ message: "Authentication token is required" }, { status: 401 });
  }

  try {
    // Verify the token and extract the user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assuming you have a JWT_SECRET in your environment variables

    // Check if the user has the 'admin' role
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Only admins can update the Outward" }, { status: 403 });
    }

    // Find Outward by ID and apply the updates
    const updatedOutward = await Outward.findByIdAndUpdate(
      OutwardId, 
      { $set: updateData }, // Only apply the changes provided in the request body
      { new: true } // Return the updated Outward document
    );

    // If Outward not found, return 404
    if (!updatedOutward) {
      console.error("Outward not found with ID:", OutwardId); // Log Outward not found
      return NextResponse.json({ message: "Outward not found" }, { status: 404 });
    }

    // Return the updated Outward data
    return NextResponse.json(updatedOutward, { status: 200 });
  } catch (error) {
    console.error("Error updating Outward:", error.message);

    // Handle errors such as invalid token, missing token, etc.
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token or token expired" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update Outward" }, { status: 500 });
  }
}
