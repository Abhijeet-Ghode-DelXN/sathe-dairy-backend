import { NextResponse } from 'next/server';
import {Product} from '../../../../models/products';
import mongooseConnection from '@/lib/mongodb';

export async function GET() {
  try {
    await mongooseConnection();
    const inventoryData = await Product.aggregate([
      {
        $project: {
          productName: 1,
          quantity: 1,
          valuation: { $multiply: ["$quantity", "$productPrice"] },
          lowStock: { $lt: ["$quantity", 10] }
        }
      },
      {
        $group: {
          _id: null,
          totalValuation: { $sum: "$valuation" },
          lowStockItems: {
            $push: {
              $cond: [
                "$lowStock",
                { productName: "$productName", quantity: "$quantity" },
                "$$REMOVE"
              ]
            }
          }
        }
      }
    ]);

    return NextResponse.json({
      totalInventoryValue: inventoryData[0]?.totalValuation || 0,
      lowStockItems: inventoryData[0]?.lowStockItems?.filter(item => item !== null) || []
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
