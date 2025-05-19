import mongooseConnection from "@/lib/mongodb";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_DB_URI; // Replace with your MongoDB URI
const client = new MongoClient(uri);

export async function GET() {
  
  try {
    await mongooseConnection();
    // Connect to MongoDB
    await client.connect();
    const db = client.db('sathe_dairy_admin'); // Replace with your DB name

    // Get today's date at midnight (start of the day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00 for today's start

    // Get the count of documents for today in each collection
    const inwardCount = await db.collection('inwards').countDocuments({
      createdAt: { $gte: startOfDay }
    });
    const outwardCount = await db.collection('outwards').countDocuments({
      createdAt: { $gte: startOfDay }
    });


    const supplierCount = await db.collection('supplier').countDocuments({
      createdAt: { $gte: startOfDay }
    });

    // Return the counts as JSON using NextResponse
    return NextResponse.json({ inwardCount, outwardCount, supplierCount });
  } catch (err) {
    console.error(err);
    // Return an error response with default values
    return NextResponse.json({ inwardCount: 0, outwardCount: 0, supplierCount: 0 }, { status: 500 });
  }
}
