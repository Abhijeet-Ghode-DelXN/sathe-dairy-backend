// /api/analytics/gst-summary?startDate=&endDate=

import { NextResponse } from 'next/server';
import { Outward } from '../../../../models/outward';
import { Inward } from '../../../../models/inward';
import mongooseConnection from "@/lib/mongodb";

// Helper function to verify authentication
const authenticateUser = (request) => {
  // TODO: Implement proper authentication check
  // For now, return a placeholder ObjectId string
  return "66a3a9a3f8d8a9a7f8d8a9a8"; // Placeholder ObjectId
};

export async function GET(request) {
  try {
    const userId = authenticateUser(request);
    mongooseConnection();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [salesGST, purchasesGST] = await Promise.all([
      Outward.aggregate([
        { $match: { userId } },
        { $group: {
            _id: "$customerDetails.customerGSTNo",
            totalSales: { $sum: "$total" },
            count: { $sum: 1 }
          }
        }
      ]),
      Inward.aggregate([
        { $match: { userId } },
        { $group: {
            _id: "$supplierDetails.supplierGSTNo",
            totalPurchases: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return NextResponse.json({
      salesByGST: salesGST,
      purchasesByGST: purchasesGST
    });
  } catch (error) {
    console.error("Error in GST summary API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
