import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Outward } from "@/models/outward"; // Ensure the correct import path
import mongooseConnection from "@/lib/mongodb";

export async function GET(req) {
  try {
    await mongooseConnection();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate date input
    if (!startDate || !endDate) {
      return NextResponse.json({ message: "Start date and end date are required." }, { status: 400 });
    }

    // Create proper date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure proper time range (start of day to end of day)
    start.setHours(0, 0, 0, 0);  // 00:00:00
    end.setHours(23, 59, 59, 999); // 23:59:59

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json({ message: "Invalid date format." }, { status: 400 });
    }

    console.log("Outward Date Filtered - Date range:", {
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Improved query using createdAt field
    const query = {
      createdAt: { $gte: start, $lte: end }
    };

    console.log("Outward Date Filtered - Query:", JSON.stringify(query));

    // Fetch outward transactions within the date range
    const transactions = await Outward.find(query).sort({ createdAt: -1 });

    console.log(`Outward Date Filtered - Found ${transactions.length} transactions`);

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching outward transactions:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
