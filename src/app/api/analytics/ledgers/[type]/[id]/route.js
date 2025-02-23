// /api/analytics/ledgers/customer/67a3218617ba004e79f43cce?startDate=&endDate=
// /api/analytics/ledgers/supplier/60a3218617ba004e79f43cce?startDate=&endDate=
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import mongooseConnection from '@/lib/mongodb';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';

export async function GET(req, context) {
  try {
    await mongooseConnection();

    // Await params correctly
    const { type, id } = await context.params;

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const objectId = new mongoose.Types.ObjectId(id); // Convert ID to ObjectId

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    console.log("Querying Transactions:", { type, id, dateFilter });

    let transactions;
    if (type === 'customer') {
      transactions = await Outward.find({
        'customerDetails.customerId': objectId,
        ...dateFilter,
      }).sort({ createdAt: -1 });
    } else if (type === 'supplier') {
      transactions = await Inward.find({
        'supplierDetails.supplierId': objectId,
        ...dateFilter,
      }).sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Invalid ledger type' }, { status: 400 });
    }

    console.log("Fetched Transactions:", transactions);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error in GET /api/analytics/ledgers/:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
