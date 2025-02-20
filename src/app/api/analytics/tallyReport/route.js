import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
import { Inward } from "@/models/inward";
import { Outward } from "@/models/outward";

export async function GET(req) {
  try {
    await mongooseConnection();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Start and end dates are required." },
        { status: 400 }
      );
    }

    // Parse dates in UTC
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Fetch Inward Summary
    const inwardSummary = await Inward.aggregate([
      { $match: { date: { $gte: start, $lte: end } } }, // Fixed missing closing brace
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    // Fetch Outward Summary
    const outwardSummary = await Outward.aggregate([
      { $match: { "transportDetails.transportDate": { $gte: start, $lte: end } } }, // Fixed missing closing brace
      { $group: { 
          _id: null, 
          total: { $sum: "$total" }, 
          outstanding: { $sum: "$outstandingPayment" }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // Structure Tally
    const tally = {
      inward: {
        total: inwardSummary[0]?.total || 0,
        transactions: inwardSummary[0]?.count || 0,
      },
      outward: {
        total: outwardSummary[0]?.total || 0,
        outstanding: outwardSummary[0]?.outstanding || 0,
        transactions: outwardSummary[0]?.count || 0,
      },
      netFlow: (inwardSummary[0]?.total || 0) - (outwardSummary[0]?.total || 0)
    };

    return NextResponse.json(tally);
    
  } catch (error) {
    console.error("Tally report error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
