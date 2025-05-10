// /api/analytics/ledgers/customer/67a3218617ba004e79f43cce?startDate=&endDate=
// /api/analytics/ledgers/supplier/60a3218617ba004e79f43cce?startDate=&endDate=
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import mongooseConnection from '@/lib/mongodb';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';

// Helper function to verify authentication
const authenticateUser = (request) => {
  // TODO: Implement proper authentication check
  // For now, return a placeholder ObjectId string
  return "66a3a9a3f8d8a9a7f8d8a9a8"; // Placeholder ObjectId
};

export async function GET(request, { params }) {
  try {
    const userId = authenticateUser(request);
    const { type, id } = params;
    mongooseConnection();

    // Await params correctly
    const searchParams = request.nextUrl.searchParams;
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
        userId,
        'customerDetails.customerId': objectId,
        ...dateFilter,
      }).sort({ createdAt: -1 });
    } else if (type === 'supplier') {
      transactions = await Inward.find({
        userId,
        'supplierDetails.supplierId': objectId,
        ...dateFilter,
      }).sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Invalid ledger type' }, { status: 400 });
    }

    console.log("Fetched Transactions:", transactions);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error in ledgers API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
