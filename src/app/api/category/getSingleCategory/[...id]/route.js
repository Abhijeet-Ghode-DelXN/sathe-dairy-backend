// import Category from "@/models/Category";
import { NextResponse } from "next/server";

import { Category } from "@/models/categories";
export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const CategoryId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("Category ID:", CategoryId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!CategoryId || CategoryId.length !== 24) {
      return NextResponse.json({ message: "Invalid Category ID" }, { status: 400 });
    }

    const user = await Category.findById(CategoryId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching Category:", error.message);
    return NextResponse.json({ error: "Failed to fetch Category" }, { status: 500 });
  }
}
