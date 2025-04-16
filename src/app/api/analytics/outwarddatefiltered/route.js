import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Outward } from "@/models/outward"; // Ensure the correct import path

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate date input
    if (!startDate || !endDate) {
      return NextResponse.json({ message: "Start date and end date are required." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include all transactions on the end date

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json({ message: "Invalid date format." }, { status: 400 });
    }

    // Fetch outward transactions within the date range
    const transactions = await Outward.find({
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching outward transactions:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
