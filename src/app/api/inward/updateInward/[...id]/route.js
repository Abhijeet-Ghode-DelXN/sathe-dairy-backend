import { Inward } from "@/models/inward";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Import mongoose to validate ObjectId
import jwt from "jsonwebtoken"; // Import a library for JWT verification (if you're using JWT)
import mongooseConnection from "@/lib/mongodb";
export async function PATCH(req, { params }) {
  await mongooseConnection();
  // Destructure the 'id' from the array since it's a catch-all route
  const { id } = await params; 
  const InwardId = id[0]; // Access the first element of the array

  const updateData = await req.json(); // Extract the request body data (partial Inward data)

  console.log("Received Inward ID:", InwardId); // Log the received ID
  console.log("Data to update:", updateData); // Log the update data

  // Validate the MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(InwardId)) {
    console.error("Invalid ID format:", InwardId); // Log invalid ID format
    return NextResponse.json({ message: "Invalid Inward ID format" }, { status: 400 });
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
      return NextResponse.json({ message: "Only admins can update the Inward" }, { status: 403 });
    }

    // Find Inward by ID and apply the updates
    const updatedInward = await Inward.findByIdAndUpdate(
      InwardId, 
      { $set: updateData }, // Only apply the changes provided in the request body
      { new: true } // Return the updated Inward document
    );

    // If Inward not found, return 404
    if (!updatedInward) {
      console.error("Inward not found with ID:", InwardId); // Log Inward not found
      return NextResponse.json({ message: "Inward not found" }, { status: 404 });
    }

    // Return the updated Inward data
    return NextResponse.json(updatedInward, { status: 200 });
  } catch (error) {
    console.error("Error updating Inward:", error.message);

    // Handle errors such as invalid token, missing token, etc.
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token or token expired" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update Inward" }, { status: 500 });
  }
}
