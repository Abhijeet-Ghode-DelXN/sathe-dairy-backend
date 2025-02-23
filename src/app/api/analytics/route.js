// routes/analytics.js
import express from 'express';
import Outward from '../models/Outward';
import Inward from '../models/Inward';
import Product from '../models/Product';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';

const router = express.Router();

// Middleware to verify user authentication
const authenticateUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = req.user._id;
  next();
};

// 1. Financial Summary Analytics
router.get('/financial-summary', authenticateUser, async (req, res) => {
  try {
    const [salesData, purchasesData, transportCosts, inventory] = await Promise.all([
      Outward.aggregate([
        { $match: { userId: req.userId } },
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
        { $match: { userId: req.userId } },
        { $group: { _id: null, totalPurchases: { $sum: "$amount" } } }
      ]),
      Promise.all([
        Inward.aggregate([
          { $match: { userId: req.userId } },
          { $group: { _id: null, total: { $sum: "$transportDetails.rentalCost" } } }
        ]),
        Outward.aggregate([
          { $match: { userId: req.userId } },
          { $group: { _id: null, total: { $sum: "$transportDetails.rentalCost" } } }
        ])
      ]).then(([inward, outward]) => {
        return (inward[0]?.total || 0) + (outward[0]?.total || 0);
      }),
      Product.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: null,
            totalValuation: { $sum: { $multiply: ["$quantity", "$productPrice"] } },
          }
        }
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

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Inventory Analysis
router.get('/inventory-analysis', authenticateUser, async (req, res) => {
  try {
    const inventoryData = await Product.aggregate([
      { $match: { userId: req.userId } },
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

    res.json({
      totalInventoryValue: inventoryData[0]?.totalValuation || 0,
      lowStockItems: inventoryData[0]?.lowStockItems || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. GST Summary Report
router.get('/gst-summary', authenticateUser, async (req, res) => {
  try {
    const [salesGST, purchasesGST] = await Promise.all([
      Outward.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: "$customerDetails.customerGSTNo",
            totalSales: { $sum: "$total" },
            count: { $sum: 1 }
          }
        }
      ]),
      Inward.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: "$supplierDetails.supplierGSTNo",
            totalPurchases: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      salesByGST: salesGST,
      purchasesByGST: purchasesGST
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Transaction Trends
router.get('/transaction-trends', authenticateUser, async (req, res) => {
  try {
    const [outwardTrends, inwardTrends] = await Promise.all([
      Outward.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      Inward.aggregate([
        { $match: { userId: req.userId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    res.json({
      outwardTrends,
      inwardTrends
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Customer/Supplier Ledgers
router.get('/ledgers/:type/:id', authenticateUser, async (req, res) => {
  try {
    const { type, id } = req.params;
    let transactions;

    if (type === 'customer') {
      transactions = await Outward.find({
        userId: req.userId,
        'customerDetails.customerId': id
      }).sort({ createdAt: -1 });
    } else if (type === 'supplier') {
      transactions = await Inward.find({
        userId: req.userId,
        'supplierDetails.supplierId': id
      }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ error: 'Invalid ledger type' });
    }

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;