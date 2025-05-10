// /api/analytics/transaction-trends?startDate=&endDate=
import { NextResponse } from 'next/server';
import mongooseConnection from '@/lib/mongodb';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';

// Helper function to verify authentication
const authenticateUser = (request) => {
  // TODO: Implement proper authentication check
  // For now, return a placeholder ObjectId string
  return "66a3a9a3f8d8a9a7f8d8a9a8"; // Placeholder ObjectId
};

export async function GET(request) {
  try {
    const userId = authenticateUser(request);
    await mongooseConnection(); // Ensure DB connection

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Convert string dates to JavaScript Date objects
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    console.log("Date Filter:", dateFilter);

    const [outwardTrends, inwardTrends] = await Promise.all([
      Outward.aggregate([
        { $match: { userId } },
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      Inward.aggregate([
        { $match: { userId } },
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    console.log("Outward Trends:", outwardTrends);
    console.log("Inward Trends:", inwardTrends);

    return NextResponse.json({ outwardTrends, inwardTrends });

  } catch (error) {
    console.error("Error in transaction trends API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
