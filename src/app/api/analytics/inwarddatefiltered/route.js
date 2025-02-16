import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Inward } from "@/models/inward";
import mongooseConnection from "@/lib/mongodb";

export async function GET(req) {
  try {
    mongooseConnection();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ message: "Start date and end date are required" }, { status: 400 });
    }

    // Convert to start and end of the day in timestamp (milliseconds)
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);  // 00:00:00

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 23:59:59

    console.log("Filtering from:", start, "to:", end);

    // Fetch transactions within the date range
    const inwardTransactions = await Inward.find({
      date: { $gte: start.getTime(), $lte: end.getTime() }
    }).sort({ date: -1 });

    return NextResponse.json(inwardTransactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching inward transactions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

