import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Inward } from "@/models/inward";
import mongooseConnection from "@/lib/mongodb";

export async function GET(req) {
  try {
    await mongooseConnection();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ message: "Start date and end date are required" }, { status: 400 });
    }

    // Create proper date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure proper time range (start of day to end of day)
    start.setHours(0, 0, 0, 0);  // 00:00:00
    end.setHours(23, 59, 59, 999); // 23:59:59

    console.log("Inward Date Filtered - Date range:", {
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Improved date query using createdAt field which is more reliable
    const query = {
      createdAt: { $gte: start, $lte: end }
    };

    console.log("Inward Date Filtered - Query:", JSON.stringify(query));

    // Fetch transactions within the date range
    const inwardTransactions = await Inward.find(query).sort({ createdAt: -1 });

    console.log(`Inward Date Filtered - Found ${inwardTransactions.length} transactions`);

    return NextResponse.json(inwardTransactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching inward transactions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

