import { Inward } from "@/models/inward";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Inwards from the database
    const Inwards = await Inward.find({}); // Using `{}` ensures all Inwards are fetched

    // Return the fetched Inwards as a JSON response
    return NextResponse.json(Inwards, { status: 200 });
  } catch (error) {
    console.error("Error fetching Inwards:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Inwards. Please try again." },
      { status: 500 }
    );
  }
}
