import { NextResponse } from 'next/server'; 
import { Inward } from '../../../models/inward'; 
import { Outward } from "../../../models/outward";
import { Customer } from "../../../models/customers";
import { Category } from "../../../models/categories";
import mongooseConnection from "@/lib/mongodb";
import mongoose from 'mongoose';

export async function GET(req) {
  console.log("Received request"); // Log to track the request

  // Collect all the data in one response
  try {
    await mongooseConnection();
    const data = {};

    // Fetch all data without checking for 'type'
    data.summary = await getSummary();
    data.topCategories = await getTopCategories();
    data.topProducts = await getTopProducts();
    data.monthlyTrends = await getMonthlyTrends();
    data.topCustomers = await getTopCustomers();
    data.customerTransaction = await getCustomerTransactions();

    // Return all data in a single response
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: "Server Error", message: error.message }, { status: 500 });
  }
}

// Get summary data
async function getSummary() {
  try {
    const [totalCustomers, totalCategories, totalInwardTransactions, totalOutwardTransactions] = await Promise.all([
      Customer.countDocuments(),
      Category.countDocuments(),
      Inward.countDocuments(),
      Outward.countDocuments()
    ]);

    const [totalRevenue, outstandingPayments] = await Promise.all([
      Outward.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Outward.aggregate([{ $group: { _id: null, outstanding: { $sum: "$outstandingPayment" } } }])
    ]);

    return {
      totalCustomers,
      totalCategories,
      totalInwardTransactions,
      totalOutwardTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      outstandingPayments: outstandingPayments[0]?.outstanding || 0,
    };
  } catch (error) {
    throw new Error("Server Error: " + error.message);
  }
}

// Get top categories
async function getTopCategories() {
  try {
    const topCategories = await Outward.aggregate([
      { $group: { _id: "$category", totalSales: { $sum: "$total" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);
    return topCategories;
  } catch (error) {
    throw new Error("Server Error: " + error.message);
  }
}

// Get top products
async function getTopProducts() {
  try {
    const topProducts = await Outward.aggregate([
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.productCode",
          productName: { $first: "$productDetails.name" },
          totalQuantity: { $sum: "$productDetails.quantity" },
          totalRevenue: { $sum: { $multiply: ["$productDetails.quantity", "$productDetails.productPrice"] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);
    return topProducts;
  } catch (error) {
    throw new Error("Server Error: " + error.message);
  }
}

// Get monthly trends
async function getMonthlyTrends() {
  try {
    const [inwardTrends, outwardTrends] = await Promise.all([
      Inward.aggregate([
        { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" } }, totalInward: { $sum: "$amount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Outward.aggregate([
        { $group: { _id: { month: { $month: "$transportDetails.transportDate" }, year: { $year: "$transportDetails.transportDate" } }, totalOutward: { $sum: "$total" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
    ]);
    return { inwardTrends, outwardTrends };
  } catch (error) {
    throw new Error("Server Error: " + error.message);
  }
}

// Get top customers
async function getTopCustomers() {
  try {
    const topCustomers = await Outward.aggregate([
      { $group: { _id: "$customerDetails.contactNumber", customerName: { $first: "$customerDetails.name" }, totalSpent: { $sum: "$total" }, totalOrders: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]);
    return topCustomers;
  } catch (error) {
    throw new Error("Server Error: " + error.message);
  }
}

async function getCustomerTransactions(customerId) {
  try {
    
    // Check if 'customerId' is valid
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customerId" }, { status: 400 });
    }

    // Fetch customer details
    const customerDetails = await Customer.findById(customerId);
    if (!customerDetails) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Log the customer details and ID to ensure it matches the Outward data
    console.log("customerDetails._id:", customerDetails._id);

    // Fetch transactions related to the customer by matching customerDetails._id
    const transactions = await Outward.find({
     "customerDetails.name": customerDetails.customerName
    });

    // Log transactions to check if any are found
    console.log("Transactions found:", transactions);

    // Return the customer details and the found transactions
    return NextResponse.json({ customerDetails, transactions });
  } catch (error) {
    return NextResponse.json({ error: "Server Error", message: error.message }, { status: 500 });
  }
}