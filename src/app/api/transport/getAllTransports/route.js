// import { TransportDetail } from "@/models/TransportDetail";
import { TransportDetails } from "@/models/transport";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all TransportDetails from the database
    const TransportDetail = await TransportDetails.find({}); // Using `{}` ensures all TransportDetails are fetched

    // Return the fetched TransportDetails as a JSON response
    return NextResponse.json(TransportDetail, { status: 200 });
  } catch (error) {
    console.error("Error fetching TransportDetails:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch TransportDetails. Please try again." },
      { status: 500 }
    );
  }
}
