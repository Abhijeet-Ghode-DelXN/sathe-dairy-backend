import { Product } from "@/models/products";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Products from the database
    const Products = await Product.find({}); // Using `{}` ensures all Products are fetched

    // Return the fetched Products as a JSON response
    return NextResponse.json(Products, { status: 200 });
  } catch (error) {
    console.error("Error fetching Products:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Products. Please try again." },
      { status: 500 }
    );
  }
}
