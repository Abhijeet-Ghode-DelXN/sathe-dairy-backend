import mongooseConnection from "@/lib/mongodb";
import {Inward} from "@/models/inward";
import {Outward} from "@/models/outward";
// New endpoint: /api/analytics/ledgers-by-gst/[type]/[gstNumber]
export async function GET(request, { params }) {
    const { type, gstNumber } = await params;
    
    try {
      await mongooseConnection();
      
      let query;
      let transactions;
      
      if (type === 'supplier') {
        // Find transactions for suppliers with this GST number
        transactions = await Inward.find({
          'supplierDetails.supplierGSTNo': gstNumber
        }).sort({ date: 1 });
      } 
      else if (type === 'customer') {
        // Find transactions for customers with this GST number
        // Check both possible field names since the schema might vary
        transactions = await Outward.find({
          $or: [
            { 'customerDetails.customerGSTNo': gstNumber },
            { 'customerDetails.gstNumber': gstNumber }
          ]
        }).sort({ createdAt: 1 });
      } 
      else {
        return Response.json({ error: 'Invalid party type' }, { status: 400 });
      }
      
      return Response.json(transactions);
    } catch (error) {
      console.error('Error in ledgers-by-gst:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }