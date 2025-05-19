import { Warehouse } from "@/models/warehouse";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Import mongoose to validate ObjectId
import jwt from "jsonwebtoken"; // Import a library for JWT verification (if you're using JWT)
import mongooseConnection from "@/lib/mongodb";

export async function PATCH(req, { params }) {
  await mongooseConnection();
  // Destructure the 'id' from the array since it's a catch-all route
  const { id } = await params; 
  const WarehouseId = id[0]; // Access the first element of the array

  const updateData = await req.json(); // Extract the request body data (partial Warehouse data)

  console.log("Received Warehouse ID:", WarehouseId); // Log the received ID
  console.log("Data to update:", updateData); // Log the update data

  // Validate the MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(WarehouseId)) {
    console.error("Invalid ID format:", WarehouseId); // Log invalid ID format
    return NextResponse.json({ message: "Invalid Warehouse ID format" }, { status: 400 });
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
      return NextResponse.json({ message: "Only admins can update the Warehouse" }, { status: 403 });
    }

    // Find Warehouse by ID and apply the updates
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      WarehouseId, 
      { $set: updateData }, // Only apply the changes provided in the request body
      { new: true } // Return the updated Warehouse document
    );

    // If Warehouse not found, return 404
    if (!updatedWarehouse) {
      console.error("Warehouse not found with ID:", WarehouseId); // Log Warehouse not found
      return NextResponse.json({ message: "Warehouse not found" }, { status: 404 });
    }

    // Return the updated Warehouse data
    return NextResponse.json(updatedWarehouse, { status: 200 });
  } catch (error) {
    console.error("Error updating Warehouse:", error.message);

    // Handle errors such as invalid token, missing token, etc.
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token or token expired" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update Warehouse" }, { status: 500 });
  }
}
