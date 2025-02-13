// import { NextResponse } from 'next/server';
// import { Inward } from '../../../models/inward';
// import { Outward } from "../../../models/outward";
// import { Customer } from "../../../models/customers";
// import { Category } from "../../../models/categories";
// import mongooseConnection from "@/lib/mongodb";
// import mongoose from 'mongoose';
// import { unstable_cache } from 'next/cache';

// // ============= Utility Functions =============

// function formatResponse(data, error = null) {
//   return NextResponse.json({
//     success: !error,
//     data: error ? null : data,
//     error: error ? { message: error.message } : null,
//     timestamp: new Date().toISOString()
//   });
// }

// function isValidDate(dateString) {
//   const date = new Date(dateString);
//   return date instanceof Date && !isNaN(date);
// }

// function buildDateFilter(startDate, endDate) {
//   const dateFilter = {};
  
//   if (startDate && isValidDate(startDate)) {
//     dateFilter.$gte = new Date(startDate);
//   }
  
//   if (endDate && isValidDate(endDate)) {
//     dateFilter.$lte = new Date(endDate);
//   }
  
//   return Object.keys(dateFilter).length > 0 ? dateFilter : null;
// }

// function getCacheKey(type, params = {}) {
//   const { startDate, endDate, transactionType } = params;
//   return `${type}-${startDate || ''}-${endDate || ''}-${transactionType || ''}`;
// }

// // ============= Data Fetching Functions =============

// async function getSummary({ startDate, endDate, transactionType }) {
//   try {
//     const dateFilter = buildDateFilter(startDate, endDate);
//     const query = dateFilter ? { date: dateFilter } : {};

//     let totalInwardTransactions = 0;
//     let totalOutwardTransactions = 0;
//     let totalRevenue = [{ total: 0 }];
//     let outstandingPayments = [{ outstanding: 0 }];

//     if (!transactionType || transactionType === 'inward') {
//       totalInwardTransactions = await Inward.countDocuments(query);
//     }

//     if (!transactionType || transactionType === 'outward') {
//       const outwardQuery = dateFilter ? 
//         { "transportDetails.transportDate": dateFilter } : {};
      
//       [totalOutwardTransactions, totalRevenue, outstandingPayments] = await Promise.all([
//         Outward.countDocuments(outwardQuery),
//         Outward.aggregate([
//           ...(Object.keys(outwardQuery).length ? [{ $match: outwardQuery }] : []),
//           { $group: { _id: null, total: { $sum: "$total" } } }
//         ]),
//         Outward.aggregate([
//           ...(Object.keys(outwardQuery).length ? [{ $match: outwardQuery }] : []),
//           { $group: { _id: null, outstanding: { $sum: "$outstandingPayment" } } }
//         ])
//       ]);
//     }

//     const [totalCustomers, totalCategories] = await Promise.all([
//       Customer.countDocuments(),
//       Category.countDocuments()
//     ]);

//     return {
//       totalCustomers,
//       totalCategories,
//       totalInwardTransactions,
//       totalOutwardTransactions,
//       totalRevenue: totalRevenue[0]?.total || 0,
//       outstandingPayments: outstandingPayments[0]?.outstanding || 0,
//       period: {
//         startDate: startDate || 'all time',
//         endDate: endDate || 'present',
//         transactionType: transactionType || 'all'
//       }
//     };
//   } catch (error) {
//     throw new Error(`Summary Error: ${error.message}`);
//   }
// }

// async function getTopCategories({ startDate, endDate, transactionType }) {
//   try {
//     if (transactionType === 'inward') {
//       return [];
//     }

//     const dateFilter = buildDateFilter(startDate, endDate);
//     const matchStage = dateFilter ? 
//       { $match: { "transportDetails.transportDate": dateFilter } } : 
//       { $match: {} };

//     const topCategories = await Outward.aggregate([
//       matchStage,
//       {
//         $group: {
//           _id: "$category",
//           totalSales: { $sum: "$total" },
//           totalOrders: { $sum: 1 },
//           averageOrderValue: { $avg: "$total" }
//         }
//       },
//       { $sort: { totalSales: -1 } },
//       { $limit: 5 },
//       {
//         $project: {
//           category: "$_id",
//           totalSales: 1,
//           totalOrders: 1,
//           averageOrderValue: { $round: ["$averageOrderValue", 2] },
//           _id: 0
//         }
//       }
//     ]);
//     return topCategories;
//   } catch (error) {
//     throw new Error(`Category Analysis Error: ${error.message}`);
//   }
// }

// async function getTopProducts({ startDate, endDate, transactionType }) {
//   try {
//     if (transactionType === 'inward') {
//       return [];
//     }

//     const dateFilter = buildDateFilter(startDate, endDate);
//     const matchStage = dateFilter ? 
//       { $match: { "transportDetails.transportDate": dateFilter } } : 
//       { $match: {} };

//     const topProducts = await Outward.aggregate([
//       matchStage,
//       { $unwind: "$productDetails" },
//       {
//         $group: {
//           _id: "$productDetails.productCode",
//           productName: { $first: "$productDetails.name" },
//           totalQuantity: { $sum: "$productDetails.quantity" },
//           totalRevenue: { 
//             $sum: { 
//               $multiply: ["$productDetails.quantity", "$productDetails.productPrice"] 
//             }
//           },
//           averagePrice: { $avg: "$productDetails.productPrice" },
//           orderCount: { $sum: 1 }
//         }
//       },
//       {
//         $addFields: {
//           averageOrderValue: { $divide: ["$totalRevenue", "$orderCount"] }
//         }
//       },
//       { $sort: { totalRevenue: -1 } },
//       { $limit: 5 },
//       {
//         $project: {
//           _id: 0,
//           productCode: "$_id",
//           productName: 1,
//           totalQuantity: 1,
//           totalRevenue: { $round: ["$totalRevenue", 2] },
//           averagePrice: { $round: ["$averagePrice", 2] },
//           averageOrderValue: { $round: ["$averageOrderValue", 2] },
//           orderCount: 1
//         }
//       }
//     ]);
//     return topProducts;
//   } catch (error) {
//     throw new Error(`Product Analysis Error: ${error.message}`);
//   }
// }

// async function getMonthlyTrends({ startDate, endDate, transactionType }) {
//   try {
//     const dateFilter = buildDateFilter(startDate, endDate);
    
//     const pipeline = [
//       {
//         $facet: {
//           inwardTrends: [
//             ...(dateFilter ? [{ $match: { date: dateFilter } }] : []),
//             {
//               $group: {
//                 _id: {
//                   month: { $month: "$date" },
//                   year: { $year: "$date" }
//                 },
//                 totalInward: { $sum: "$amount" },
//                 transactionCount: { $sum: 1 },
//                 averageTransaction: { $avg: "$amount" }
//               }
//             },
//             { $sort: { "_id.year": 1, "_id.month": 1 } }
//           ],
//           outwardTrends: [
//             ...(dateFilter ? [{ $match: { "transportDetails.transportDate": dateFilter } }] : []),
//             {
//               $group: {
//                 _id: {
//                   month: { $month: "$transportDetails.transportDate" },
//                   year: { $year: "$transportDetails.transportDate" }
//                 },
//                 totalOutward: { $sum: "$total" },
//                 transactionCount: { $sum: 1 },
//                 averageTransaction: { $avg: "$total" }
//               }
//             },
//             { $sort: { "_id.year": 1, "_id.month": 1 } }
//           ]
//         }
//       }
//     ];
    
//     const [results] = await (transactionType === 'inward' ? 
//       Inward.aggregate(pipeline) : 
//       transactionType === 'outward' ? 
//         Outward.aggregate(pipeline) : 
//         Outward.aggregate(pipeline));
    
//     const formatTrends = (trends) => trends.map(t => ({
//       month: t._id.month,
//       year: t._id.year,
//       total: t.totalInward || t.totalOutward,
//       transactionCount: t.transactionCount,
//       averageTransaction: Math.round(t.averageTransaction * 100) / 100,
//       date: new Date(t._id.year, t._id.month - 1, 1)
//     }));

//     return {
//       inwardTrends: transactionType === 'outward' ? [] : formatTrends(results.inwardTrends),
//       outwardTrends: transactionType === 'inward' ? [] : formatTrends(results.outwardTrends),
//       period: {
//         startDate: startDate || 'all time',
//         endDate: endDate || 'present',
//         transactionType: transactionType || 'all'
//       }
//     };
//   } catch (error) {
//     throw new Error(`Trend Analysis Error: ${error.message}`);
//   }
// }

// async function getTopCustomers({ startDate, endDate, transactionType }) {
//   try {
//     if (transactionType === 'inward') {
//       return [];
//     }

//     const dateFilter = buildDateFilter(startDate, endDate);
//     const matchStage = dateFilter ? 
//       { $match: { "transportDetails.transportDate": dateFilter } } : 
//       { $match: {} };

//     const topCustomers = await Outward.aggregate([
//       matchStage,
//       {
//         $group: {
//           _id: "$customerDetails.contactNumber",
//           customerName: { $first: "$customerDetails.name" },
//           totalSpent: { $sum: "$total" },
//           totalOrders: { $sum: 1 },
//           averageOrderValue: { $avg: "$total" },
//           lastOrderDate: { $max: "$transportDetails.transportDate" },
//           customerDetails: { $first: "$customerDetails" }
//         }
//       },
//       {
//         $addFields: {
//           loyalty: {
//             $multiply: [
//               { $divide: ["$totalSpent", { $max: "$totalSpent" }] },
//               { $divide: ["$totalOrders", { $max: "$totalOrders" }] }
//             ]
//           }
//         }
//       },
//       { $sort: { totalSpent: -1 } },
//       { $limit: 5 },
//       {
//         $project: {
//           _id: 0,
//           contactNumber: "$_id",
//           customerName: 1,
//           totalSpent: { $round: ["$totalSpent", 2] },
//           totalOrders: 1,
//           averageOrderValue: { $round: ["$averageOrderValue", 2] },
//           lastOrderDate: 1,
//           loyalty: { $round: ["$loyalty", 4] },
//           email: "$customerDetails.email",
//           address: "$customerDetails.address"
//         }
//       }
//     ]);
//     return topCustomers;
//   } catch (error) {
//     throw new Error(`Customer Analysis Error: ${error.message}`);
//   }
// }

// // ============= Request Handlers =============

// async function handleSpecificTypeRequest(type, customerId, queryParams) {
//   const cacheKey = getCacheKey(type, queryParams);
  
//   switch (type) {
//     case 'summary':
//       return await unstable_cache(
//         () => getSummary(queryParams),
//         [cacheKey],
//         { revalidate: 300 }
//       )();
//     case 'topCategories':
//       return await unstable_cache(
//         () => getTopCategories(queryParams),
//         [cacheKey],
//         { revalidate: 300 }
//       )();
//     case 'topProducts':
//       return await unstable_cache(
//         () => getTopProducts(queryParams),
//         [cacheKey],
//         { revalidate: 300 }
//       )();
//     case 'monthlyTrends':
//       return await unstable_cache(
//         () => getMonthlyTrends(queryParams),
//         [cacheKey],
//         { revalidate: 300 }
//       )();
//     case 'topCustomers':
//       return await unstable_cache(
//         () => getTopCustomers(queryParams),
//         [cacheKey],
//         { revalidate: 300 }
//       )();
//     default:
//       throw new Error('Invalid type parameter');
//   }
// }

// async function handleAllDataRequest(queryParams) {
//   return {
//     summary: await getSummary(queryParams),
//     topCategories: await getTopCategories(queryParams),
//     topProducts: await getTopProducts(queryParams),
//     monthlyTrends: await getMonthlyTrends(queryParams),
//     topCustomers: await getTopCustomers(queryParams)
//   };
// }

// // ============= Main API Handler =============

// export async function GET(req) {
//   try {
//     await mongooseConnection();

//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get('type');
//     const customerId = searchParams.get('customerId');
//     const startDate = searchParams.get('startDate');
//     const endDate = searchParams.get('endDate');
//     const transactionType = searchParams.get('transactionType')?.toLowerCase();

//     if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
//       return formatResponse(null, new Error('Invalid date format'));
//     }

//     if (transactionType && !['inward', 'outward'].includes(transactionType)) {
//       return formatResponse(null, new Error('Invalid transaction type'));
//     }

//     const queryParams = { startDate, endDate, transactionType };

//     if (type) {
//       const data = await handleSpecificTypeRequest(type, customerId, queryParams);
//       return formatResponse(data);
//     }

//     const data = await handleAllDataRequest(queryParams);
//     return formatResponse(data);

//   } catch (error) {
//     console.error('API Error:', error);
//     return formatResponse(null, error);
//   }
// }


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