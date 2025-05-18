import mongooseConnection from "@/lib/mongodb";
import {Inward} from "@/models/inward";
import {Outward} from "@/models/outward";
import { NextResponse } from 'next/server';

// New endpoint: /api/analytics/ledgers-by-gst/[type]/[gstNumber]
export async function GET(request, context) {
    try {
      await mongooseConnection();

      // The proper way to handle params in App Router (with the spread operator)
      const type = context.params?.type;
      const gstNumber = context.params?.gstNumber;
      
      console.log("Ledgers by GST - Type and GST:", { type, gstNumber });
      
      // Get query parameters
      const searchParams = request.nextUrl.searchParams;
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0); // Set to start of the day

        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); // Set to end of the day

        dateFilter.createdAt = {
          $gte: start,
          $lte: end
        };
        
        console.log("Ledgers by GST - Date filter:", JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }));
      }
      
      let transactions;
      
      if (type === 'supplier') {
        // Find transactions for suppliers with this GST number
        const query = {
          'supplierDetails.supplierGSTNo': gstNumber,
          ...dateFilter
        };
        
        console.log("Ledgers by GST - Supplier query:", JSON.stringify(query));
        
        transactions = await Inward.find(query).sort({ createdAt: 1 });
      } 
      else if (type === 'customer') {
        // Find transactions for customers with this GST number
        // Check both possible field names since the schema might vary
        const query = {
          $or: [
            { 'customerDetails.customerGSTNo': gstNumber },
            { 'customerDetails.gstNumber': gstNumber }
          ],
          ...dateFilter
        };
        
        console.log("Ledgers by GST - Customer query:", JSON.stringify(query));
        
        transactions = await Outward.find(query).sort({ createdAt: 1 });
      } 
      else {
        return NextResponse.json({ error: 'Invalid party type' }, { status: 400 });
      }
      
      console.log(`Ledgers by GST - Found ${transactions.length} transactions`);
      
      return NextResponse.json(transactions);
    } catch (error) {
      console.error('Error in ledgers-by-gst:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }