import { NextResponse } from 'next/server';
import { Product } from '../../../../models/products';
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

    const inventoryData = await Product.aggregate([
      { $match: { userId } },
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
      lowStockItems: inventoryData[0]?.lowStockItems || []
    });
  } catch (error) {
    console.error("Error in inventory analysis API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
