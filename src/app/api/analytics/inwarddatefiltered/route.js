import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Inward } from "@/models/inward"; // Adjust the path based on your project structure
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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
    }

    // Fetch transactions within the date range
    const inwardTransactions = await Inward.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    return NextResponse.json(inwardTransactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching inward transactions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
