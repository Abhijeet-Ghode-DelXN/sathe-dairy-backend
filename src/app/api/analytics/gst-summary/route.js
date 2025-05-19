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
  await mongooseConnection();
  try {
    const userId = authenticateUser(request);
    mongooseConnection();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Better date filtering logic with debug information
    const dateFilter = {};
    if (startDate && endDate) {
      // Create proper date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Ensure end date covers the entire day
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = {
        $gte: start,
        $lte: end
      };
      
      console.log("GST Summary - Date filter:", JSON.stringify({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }));
    } else {
      console.log("GST Summary - No date filter applied");
    }

    // Add clear logging for queries
    console.log("GST Summary - Outward query:", JSON.stringify({ 
      ...dateFilter
    }));
    
    console.log("GST Summary - Inward query:", JSON.stringify({ 
      ...dateFilter
    }));

    const [salesGST, purchasesGST] = await Promise.all([
      Outward.aggregate([
        { $match: { ...dateFilter } },
        { $group: {
            _id: "$customerDetails.customerGSTNo",
            totalSales: { $sum: "$total" },
            count: { $sum: 1 }
          }
        }
      ]),
      Inward.aggregate([
        { $match: { ...dateFilter } },
        { $group: {
            _id: "$supplierDetails.supplierGSTNo",
            totalPurchases: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    console.log("GST Summary - Results:", {
      salesGSTCount: salesGST.length,
      purchasesGSTCount: purchasesGST.length
    });

    return NextResponse.json({
      salesByGST: salesGST,
      purchasesByGST: purchasesGST
    });
  } catch (error) {
    console.error("Error in GST summary API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
