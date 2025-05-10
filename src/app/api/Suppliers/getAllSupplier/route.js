import {supplier} from "@/models/Suppliers";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all suppliers from the database
    const suppliers = await supplier.find({}); // Using `{}` ensures all suppliers are fetched

    // Return the fetched suppliers as a JSON response
    return NextResponse.json(suppliers, { status: 200 });
  } catch (error) {
    console.error("Error fetching suppliers:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch suppliers. Please try again." },
      { status: 500 }
    );
  }
}
