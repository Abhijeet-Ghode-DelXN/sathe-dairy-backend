import Customer from "@/models/customers";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Customers from the database
    const Customers = await Customer.find({}); // Using `{}` ensures all Customers are fetched

    // Return the fetched Customers as a JSON response
    return NextResponse.json(Customers, { status: 200 });
  } catch (error) {
    console.error("Error fetching Customers:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Customers. Please try again." },
      { status: 500 }
    );
  }
}
