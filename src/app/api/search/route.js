import { Inward } from "@/models/inward";
import { Outward } from "@/models/outward";
import { Product } from "@/models/products";
import { Customer } from "@/models/customers";
import mongooseConnection from "@/lib/mongodb";
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('query');

  if (!q) {
    return new NextResponse(JSON.stringify({ error: 'Search query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = await mongooseConnection(); // Assuming this returns the db object
    const results = [];

    // 1. Search in Inward
    const inwardResults = await Inward.find({
      $or: [
        { source: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { warehouse: { $regex: q, $options: 'i' } },
        { "transportDetails.vehicleNumber": { $regex: q, $options: 'i' } },
        { "transportDetails.vehicleType": { $regex: q, $options: 'i' } },
        { "transportDetails.driverMobileNumber": { $regex: q, $options: 'i' } },
        { invoiceNo: { $regex: q, $options: 'i' } },
        { remarks: { $regex: q, $options: 'i' } },
        { "supplierDetails.name": { $regex: q, $options: 'i' } },
        { "supplierDetails.contactNumber": { $regex: q, $options: 'i' } },
        { "supplierDetails.address": { $regex: q, $options: 'i' } },
        {
          productDetails: {
            $elemMatch: { name: { $regex: q, $options: 'i' } },
          },
        },
        {
          productDetails: {
            $elemMatch: { productCode: { $regex: q, $options: 'i' } },
          },
        },
      ],
    }).lean();
    results.push(...inwardResults.map(item => ({ ...item, type: 'inward' })));

    // 2. Search in Outward
    const outwardResults = await Outward.find({
      $or: [
        { category: { $regex: q, $options: 'i' } },
        { source: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { "customerDetails.name": { $regex: q, $options: 'i' } },
        { "customerDetails.contactNumber": { $regex: q, $options: 'i' } },
        { invoiceNo: { $regex: q, $options: 'i' } },
        { "transportDetails.vehicleType": { $regex: q, $options: 'i' } },
        { "transportDetails.vehicleNumber": { $regex: q, $options: 'i' } },
        { "transportDetails.driverName": { $regex: q, $options: 'i' } },
        {
          productDetails: {
            $elemMatch: { name: { $regex: q, $options: 'i' } },
          },
        },
        {
          productDetails: {
            $elemMatch: { productCode: { $regex: q, $options: 'i' } },
          },
        },
      ],
    }).lean();
    results.push(...outwardResults.map(item => ({ ...item, type: 'outward' })));

    // 3. Search in Products
    const productResults = await Product.find({
      $or: [
        { productName: { $regex: q, $options: 'i' } },
        { productDescription: { $regex: q, $options: 'i' } },
        { productCode: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ],
    }).lean();
    results.push(...productResults.map(item => ({ ...item, type: 'product' })));


    // 4. Search in Customers
    const customerResults = await Customer.find({
        $or: [
          { customerName: { $regex: q, $options: 'i' } },
          { customerMobileNo: { $regex: q, $options: 'i' } },
          { customerGSTNo: { $regex: q, $options: 'i' } },
          // Add other customer fields as needed
        ],
      }).lean();
      results.push(...customerResults.map(item => ({ ...item, type: 'customer' })));
  
  

    return new NextResponse(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Search API error:', error);
    return new NextResponse(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}