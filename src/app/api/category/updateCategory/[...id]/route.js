import { Category } from "@/models/categories";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import mongooseConnection from "@/lib/mongodb";

export async function PATCH(req, context) {
  await mongooseConnection();

  const { id } = await context.params; // ✅ Await params
  const CategoryId = Array.isArray(id) ? id[0] : id;
  const updateData = await req.json();

  console.log("Received Category ID:", CategoryId);
  console.log("Data to update:", updateData);

  if (!mongoose.Types.ObjectId.isValid(CategoryId)) {
    return NextResponse.json({ message: "Invalid Category ID format" }, { status: 400 });
  }

  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ message: "Authentication token is required" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Only admins can update the Category" }, { status: 403 });
    }

    const updateQuery = { $set: { ...updateData } };

    if (updateData.subCategories && Array.isArray(updateData.subCategories)) {
      updateQuery.$addToSet = { subcategory: { $each: updateData.subCategories.filter(Boolean) } }; 
    }
    

    const updatedCategory = await Category.findByIdAndUpdate(
      CategoryId,
      {
        $set: {
          categoryName: updateData.categoryName, // Update category name
          subcategory: updateData.subCategories.filter(Boolean), // Replace entire subcategory array
        }
      },
      { new: true } // Return the updated document
    );
    

    if (!updatedCategory) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    console.log("Updated category:", updatedCategory);
    return NextResponse.json(updatedCategory, { status: 200 });

  } catch (error) {
    console.error("Error updating Category:", error.message);
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token or token expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update Category" }, { status: 500 });
  }
}
