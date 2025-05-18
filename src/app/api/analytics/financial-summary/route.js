// /api/analytics/financial-summary?startDate=&endDate=
import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {Outward} from '../../../../models/outward';
import {Inward} from '../../../../models/inward';
import {Product} from '../../../../models/products';
import mongooseConnection from '@/lib/mongodb';

// Helper function to verify authentication
const authenticateUser = (request) => {
  // TODO: Implement proper authentication check
  // For now, return a placeholder ObjectId string
  return "66a3a9a3f8d8a9a7f8d8a9a8"; // Placeholder ObjectId
};

export async function GET(request) {
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = authenticateUser(request);
    await mongooseConnection();
    const { searchParams } = new URL(request.url);
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
      
      console.log("Financial Summary - Date filter:", JSON.stringify({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }));
    } else {
      console.log("Financial Summary - No date filter applied");
    }

    console.log("Financial Summary - Query filter:", JSON.stringify(dateFilter));

    const [salesData, purchasesData, transportCosts, inventory] = await Promise.all([
      Outward.aggregate([
        { $match: dateFilter },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalCOGS: { 
              $sum: { 
                $multiply: ["$productDetails.productPrice", "$productDetails.quantity"] 
              }
            },
            totalOutstanding: { $sum: "$outstandingPayment" },
            creditSales: { 
              $sum: { 
                $cond: [{ $eq: ["$paymentType", "Credit"] }, "$total", 0] 
              } 
            },
          }
        }
      ]),
      Inward.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, totalPurchases: { $sum: "$amount" } } }
      ]),
      Promise.all([
        Inward.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: "$transportDetails.rentalCost" } } }
        ]),
        Outward.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: "$transportDetails.rentalCost" } } }
        ])
      ]).then(([inward, outward]) => {
        return (inward[0]?.total || 0) + (outward[0]?.total || 0);
      }),
      Product.aggregate([
        // Products don't need date filtering
        {
          $group: {
            _id: null,
            totalValuation: { $sum: { $multiply: ["$quantity", "$productPrice"] } },
          }
        }
      ])
    ]);

    console.log("Financial Summary - Results:", {
      hasSalesData: salesData.length > 0,
      hasPurchasesData: purchasesData.length > 0,
      transportCosts,
      hasInventory: inventory.length > 0
    });

    const response = {
      totalRevenue: salesData[0]?.totalRevenue || 0,
      totalCOGS: salesData[0]?.totalCOGS || 0,
      grossProfit: (salesData[0]?.totalRevenue || 0) - (salesData[0]?.totalCOGS || 0),
      totalPurchases: purchasesData[0]?.totalPurchases || 0,
      totalTransportCost: transportCosts,
      inventoryValuation: inventory[0]?.totalValuation || 0,
      outstandingPayments: salesData[0]?.totalOutstanding || 0,
      creditSales: salesData[0]?.creditSales || 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in financial summary API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
