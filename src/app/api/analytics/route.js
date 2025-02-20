import { NextResponse } from "next/server";
// import { connectToDB } from "@utils/database"; // Adjust based on your DB connection
import {Inward} from "../../../models/inward";
import {Outward} from "../../../models/outward";
import mongooseConnection from "@/lib/mongodb";

export const GET = async (req) => {
  try {
    await mongooseConnection();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate input parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Both startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Set time boundaries
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    // Fetch data in parallel
    const [inwards, outwards] = await Promise.all([
      Inward.find({
        date: { $gte: start, $lte: end },
      }).lean(),
      Outward.find({
        "transportDetails.transportDate": { $gte: start, $lte: end },
      }).lean(),
    ]);

    // Process data
    const tallyData = {};

    // Process inward transactions
    inwards.forEach((inward) => {
      const dateKey = inward.date.toISOString().split("T")[0];
      if (!tallyData[dateKey]) {
        tallyData[dateKey] = {
          date: dateKey,
          inwards: [],
          outwards: [],
          totalInward: 0,
          totalOutward: 0,
          netBalance: 0,
        };
      }

      const { _id, __v, ...cleanInward } = inward;
      tallyData[dateKey].inwards.push(cleanInward);
      tallyData[dateKey].totalInward += inward.amount;
    });

    // Process outward transactions
    outwards.forEach((outward) => {
      const transportDate = outward.transportDetails.transportDate;
      const dateKey = transportDate.toISOString().split("T")[0];
      
      if (!tallyData[dateKey]) {
        tallyData[dateKey] = {
          date: dateKey,
          inwards: [],
          outwards: [],
          totalInward: 0,
          totalOutward: 0,
          netBalance: 0,
        };
      }

      const { _id, __v, ...cleanOutward } = outward;
      tallyData[dateKey].outwards.push(cleanOutward);
      tallyData[dateKey].totalOutward += outward.total;
    });

    // Calculate net balance and sort results
    const result = Object.values(tallyData)
      .map((entry) => ({
        ...entry,
        netBalance: entry.totalInward - entry.totalOutward,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Error generating tally report:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};