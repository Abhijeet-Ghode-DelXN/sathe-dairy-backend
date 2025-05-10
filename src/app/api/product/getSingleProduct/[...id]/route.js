// import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { Product } from "@/models/products";

export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const ProductId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("Product ID:", ProductId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!ProductId || ProductId.length !== 24) {
      return NextResponse.json({ message: "Invalid Product ID" }, { status: 400 });
    }

    const user = await Product.findById(ProductId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching Product:", error.message);
    return NextResponse.json({ error: "Failed to fetch Product" }, { status: 500 });
  }
}
