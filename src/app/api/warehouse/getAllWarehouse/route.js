import mongooseConnection from "@/lib/mongodb";
import Warehouse from "@/models/warehouse";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await mongooseConnection();
    // Fetch all warehouses from the database
    const warehouses = await Warehouse.find();

    // Return the fetched warehouses
    return NextResponse.json(warehouses, { status: 200 });
  } catch (error) {
    console.error("Error fetching warehouses:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch warehouses. Please try again." },
      { status: 500 }
    );
  }
}
