import { User } from "@/models/user";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Import mongoose to validate ObjectId
import bcrypt from "bcryptjs"; // Import bcrypt for hashing the password
import mongooseConnection from "@/lib/mongodb";

export async function PATCH(req, { params }) {
  await mongooseConnection();
  const { id } = await params;
  const userId = id[0]; // Access the first element of the array

  const updateData = await req.json(); // Extract the request body data (partial user data)

  console.log("Received User ID:", userId); // Log the received ID
  console.log("Data to update:", updateData); // Log the update data

  // Validate the MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error("Invalid ID format:", userId); // Log invalid ID format
    return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
  }

  try {
    // Check if username is being updated and if it's already taken
    if (updateData.username) {
      const existingUser = await User.findOne({
        username: updateData.username,
        _id: { $ne: userId } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Validation failed", details: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Check if email is being updated and if it's already taken
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Validation failed", details: "Email is already registered" },
          { status: 400 }
        );
      }
    }

    // Check if mobile number is being updated and if it's already taken
    if (updateData.mobileNumber) {
      const existingUser = await User.findOne({
        mobileNumber: updateData.mobileNumber,
        _id: { $ne: userId } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Validation failed", details: "Mobile number is already registered" },
          { status: 400 }
        );
      }
    }

    // Check if password is part of the update data
    if (updateData.password) {
      // Log the password before hashing
      console.log("Hashing password:", updateData.password);

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      
      // Log the hashed password
      console.log("Hashed password:", hashedPassword);

      updateData.password = hashedPassword; // Replace password with hashed password
    }

    // Find user by ID and apply the updates
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: updateData }, // Only apply the changes provided in the request body
      { new: true, runValidators: true } // Return the updated user document and run validators
    );

    // If user not found, return 404
    if (!updatedUser) {
      console.error("User not found with ID:", userId); // Log user not found
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return the updated user (excluding sensitive data)
    const { password, refreshToken, ...userWithoutSensitiveData } = updatedUser.toObject();
    return NextResponse.json(userWithoutSensitiveData, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}
