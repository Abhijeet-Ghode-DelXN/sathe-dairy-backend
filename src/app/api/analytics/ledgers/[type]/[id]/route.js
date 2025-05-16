import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import mongooseConnection from '@/lib/mongodb';
import { Outward } from '@/models/outward';
import { Inward } from '@/models/inward';

export async function GET(request, { params }) {
  try {
    await mongooseConnection();
    const { type, id } = params;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate ID
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Build date filter (date-only filtering, time ignored)
    const dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0); // Set to start of the day

      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999); // Set to end of the day

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }

      dateFilter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Build query
    let query;
    let model;

    if (type === 'customer') {
      model = Outward;
      query = {
        'customerDetails.customerId': mongoose.Types.ObjectId.isValid(id)
          ? new mongoose.Types.ObjectId(id)
          : id,
        ...dateFilter
      };
    } else if (type === 'supplier') {
      model = Inward;
      query = {
        'supplierDetails.supplierId': mongoose.Types.ObjectId.isValid(id)
          ? new mongoose.Types.ObjectId(id)
          : id,
        ...dateFilter
      };
    } else {
      return NextResponse.json({ error: 'Invalid ledger type' }, { status: 400 });
    }

    // Execute query
    const transactions = await model.find(query)
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JS objects

    return NextResponse.json(transactions);

  } catch (error) {
    console.error("Error in ledgers API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
