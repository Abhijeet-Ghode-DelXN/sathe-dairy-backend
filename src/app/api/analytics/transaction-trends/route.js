// /api/analytics/transaction-trends?startDate=&endDate=
import { NextResponse } from 'next/server';
import mongooseConnection from '@/lib/mongodb';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';

export async function GET(req) {
  try {
    await mongooseConnection(); // Ensure DB connection

    const { searchParams } = new URL(req.url);
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
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
