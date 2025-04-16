import { NextResponse } from 'next/server';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';
import mongooseConnection from '@/lib/mongodb';

// Handle GET request
export async function GET(req) {
  try {
    await mongooseConnection();
    const { searchParams } = new URL(req.url);
    const gstNumber = searchParams.get('gstNumber');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!gstNumber) {
      return NextResponse.json({ error: 'GST number is required' }, { status: 400 });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Fetch outward (sales) transactions
    const outwardTransactions = await Outward.find({
      'customerDetails.customerGSTNo': gstNumber,
      ...dateFilter,
    })
      .sort({ createdAt: 1 })
      .select('invoiceNo total createdAt customerDetails');

    // Fetch inward (purchase) transactions
    const inwardTransactions = await Inward.find({
      'supplierDetails.supplierGSTNo': gstNumber,
      ...dateFilter,
    })
      .sort({ createdAt: 1 })
      .select('invoiceNo amount createdAt supplierDetails');

    // Combine and sort transactions
    const allTransactions = [
      ...outwardTransactions.map((t) => ({
        ...t.toObject(),
        type: 'sale',
        amount: t.total,
        partyName: t.customerDetails.name,
      })),
      ...inwardTransactions.map((t) => ({
        ...t.toObject(),
        type: 'purchase',
        amount: t.amount,
        partyName: t.supplierDetails.supplierName,
      })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate running balance
    let balance = 0;
    const ledger = allTransactions.map((transaction) => {
      balance += transaction.type === 'sale' ? transaction.amount : -transaction.amount;
      return {
        ...transaction,
        balance,
      };
    });

    return NextResponse.json({
      gstNumber,
      transactions: ledger,
      summary: {
        totalSales: ledger.reduce((sum, t) => sum + (t.type === 'sale' ? t.amount : 0), 0),
        totalPurchases: ledger.reduce((sum, t) => sum + (t.type === 'purchase' ? t.amount : 0), 0),
        balance,
      },
    });
  } catch (error) {
    console.error('Error fetching GST ledger:', error);
    return NextResponse.json({ error: 'Failed to fetch GST ledger' }, { status: 500 });
  }
}
