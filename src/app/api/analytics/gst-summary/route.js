// /api/analytics/gst-summary?startDate=&endDate=

import { NextResponse } from 'next/server';
import { Outward } from '../../../../models/outward';
import { Inward } from '../../../../models/inward';

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;
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
        { $match: dateFilter }, // Removed userId
        { $group: {
            _id: "$customerDetails.customerGSTNo",
            totalSales: { $sum: "$total" },
            count: { $sum: 1 }
          }
        }
      ]),
      Inward.aggregate([
        { $match: dateFilter }, // Removed userId
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
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
