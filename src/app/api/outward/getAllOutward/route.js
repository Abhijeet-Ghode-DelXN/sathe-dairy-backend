import { Outward } from "@/models/outward";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Outwards from the database
    const Outwards = await Outward.find({}); // Using `{}` ensures all Outwards are fetched

    // Return the fetched Outwards as a JSON response
    return NextResponse.json(Outwards, { status: 200 });
  } catch (error) {
    console.error("Error fetching Outwards:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Outwards. Please try again." },
      { status: 500 }
    );
  }
}
