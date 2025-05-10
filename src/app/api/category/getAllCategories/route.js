import Category from "@/models/categories";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Categorys from the database
    const Categories = await Category.find({}); // Using `{}` ensures all Categorys are fetched

    // Return the fetched Categories as a JSON response
    return NextResponse.json(Categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching Categories:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Categories. Please try again." },
      { status: 500 }
    );
  }
}
