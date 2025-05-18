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

    // Create proper date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure proper time range (start of day to end of day)
    start.setHours(0, 0, 0, 0);  // 00:00:00
    end.setHours(23, 59, 59, 999); // 23:59:59
    
    console.log("Tally Report - Date range:", {
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Use createdAt field for consistent date filtering
    const dateQuery = {
      createdAt: { $gte: start, $lte: end }
    };
    
    console.log("Tally Report - Date query:", JSON.stringify(dateQuery));

    // Fetch Inward Summary
    const inwardSummary = await Inward.aggregate([
      { $match: dateQuery }, 
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    // Fetch Outward Summary
    const outwardSummary = await Outward.aggregate([
      { $match: dateQuery }, 
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

    console.log("Tally Report - Results:", {
      inwardTotal: tally.inward.total,
      inwardCount: tally.inward.transactions,
      outwardTotal: tally.outward.total,
      outwardCount: tally.outward.transactions
    });

    return NextResponse.json(tally);
    
  } catch (error) {
    console.error("Tally report error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
