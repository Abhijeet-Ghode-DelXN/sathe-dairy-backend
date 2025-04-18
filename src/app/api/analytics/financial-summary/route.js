// /api/analytics/financial-summary?startDate=&endDate=
import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {Outward} from '../../../../models/outward';
import {Inward} from '../../../../models/inward';
import {Product} from '../../../../models/products';
import mongooseConnection from '@/lib/mongodb';

export async function GET(req) {
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await mongooseConnection();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

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
        { $group: { _id: null, totalValuation: { $sum: { $multiply: ["$quantity", "$productPrice"] } } } }
      ])
    ]);

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
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}
