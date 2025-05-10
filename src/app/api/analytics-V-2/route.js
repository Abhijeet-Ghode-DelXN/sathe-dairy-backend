import { NextResponse } from 'next/server'; // Ensure this import
import { Inward } from '../../../models/inward'; // Adjust the path if needed
import { Outward } from "../../../models/outward";
import { Customer } from "../../../models/customers";
import { Category } from "../../../models/categories";
import { Product } from "../../../models/products";
import { TransportDetails } from "../../../models/transport";
import { Warehouse } from "../../../models/warehouse";
import mongooseConnection from "@/lib/mongodb";
import mongoose from 'mongoose';

async function getAnalytics() {  // Removed userId parameter
  try {
    mongooseConnection();
    // 1. Inward Analytics
    const totalInwardQuantity = await Inward.aggregate([
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
    ]);

    const totalInwardAmount = await Inward.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const inwardByCategory = await Inward.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const inwardByProduct = await Inward.aggregate([
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.name",
          totalQuantity: { $sum: "$productDetails.quantity" },
        },
      },
    ]);

    // 2. Outward Analytics
    const totalOutwardQuantity = await Outward.aggregate([
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
    ]);

    const totalOutwardAmount = await Outward.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$total" } } },
    ]);

    const outwardByCategory = await Outward.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const outwardByProduct = await Outward.aggregate([
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.name",
          totalQuantity: { $sum: "$productDetails.quantity" },
        },
      },
    ]);

    // 3. Product Analytics
    const productCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const productQuantityByCategory = await Product.aggregate([
      { $group: { _id: "$category", totalQuantity: { $sum: "$quantity" } } },
    ]);

    // 4. Customer Analytics
    const customerCounts = await Customer.countDocuments(); // No userId filter

    // 5. Transport Analytics (Combined Inward/Outward)
    const transportCountsByType = await TransportDetails.aggregate([
      { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
    ]);

    const transportCostByTransaction = await TransportDetails.aggregate([
      {
        $group: {
          _id: "$transactionType",
          totalRentalCost: { $sum: "$rentalCost" },
        },
      },
    ]);

    // 6. Warehouse Analytics
    const warehouseCounts = await Warehouse.countDocuments(); // No userId filter




    // 7. Customer Transaction Analytics (with Transactions)
    const customerInwardTransactions = await Inward.aggregate([
        {
          $lookup: {
            from: "customers",
            localField: "supplierDetails.name",
            foreignField: "customerName",
            as: "customerInfo",
          },
        },
        { $unwind: "$customerInfo" },
        {
          $group: {
            _id: "$customerInfo.customerName",
            totalInwardQuantity: { $sum: "$quantity" },
            totalInwardAmount: { $sum: "$amount" },
            inwardTransactionCount: { $sum: 1 },
            transactions: { $push: "$$ROOT" }, // Push the entire transaction document
          },
        },
      ]);
  
      const customerOutwardTransactions = await Outward.aggregate([
        {
          $lookup: {
            from: "customers",
            localField: "customerDetails.name",
            foreignField: "customerName",
            as: "customerInfo",
          },
        },
        { $unwind: "$customerInfo" },
        {
          $group: {
            _id: "$customerInfo.customerName",
            totalOutwardQuantity: { $sum: "$quantity" },
            totalOutwardAmount: { $sum: "$total" },
            outwardTransactionCount: { $sum: 1 },
            transactions: { $push: "$$ROOT" }, // Push the entire transaction document
          },
        },
      ]);
  
  

    return {
      inward: {
        totalQuantity: totalInwardQuantity[0]?.totalQuantity || 0,
        totalAmount: totalInwardAmount[0]?.totalAmount || 0,
        byCategory: inwardByCategory,
        byProduct: inwardByProduct,
      },
      outward: {
        totalQuantity: totalOutwardQuantity[0]?.totalQuantity || 0,
        totalAmount: totalOutwardAmount[0]?.totalAmount || 0,
        byCategory: outwardByCategory,
        byProduct: outwardByProduct,
      },
      products: {
        counts: productCounts,
        quantityByCategory: productQuantityByCategory,
      },
      customers: {
        count: customerCounts,
      },
      transport: {
        countsByType: transportCountsByType,
        costByTransaction: transportCostByTransaction,
      },
      warehouses: {
        count: warehouseCounts,
      },

      customerTransactions: {
        inward: customerInwardTransactions,
        outward: customerOutwardTransactions,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
}

// Example usage:
getAnalytics() // No userId needed
  .then((analytics) => {
    console.log("Analytics:", analytics);
  })
  .catch((err) => {
    console.error(err);
  });

export async function GET() {
  try {
    const analytics = await getAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}