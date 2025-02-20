import { NextResponse } from 'next/server'; 
import { Inward } from '../../../../models/inward'; // Adjust the path if needed
import { verify } from 'jsonwebtoken'; // If you're using JWT

export async function POST(request) {
  try {
    const body = await request.json();

    // Get the token from the Authorization header
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is missing' },
        { status: 401 }
      );
    }

    // Verify the token and extract the userId
    const decoded = verify(token, process.env.JWT_SECRET); // Replace with your secret key
    const userId = decoded.userId; // Assuming userId is included in the token payload

    // Log the incoming rate and quantity values
    const { rate, quantity } = body;
    console.log('Rate:', rate);
    console.log('Quantity:', quantity);

    // Check for missing or invalid fields
    if (
      rate === undefined || 
      quantity === undefined || 
      isNaN(Number(rate)) || 
      isNaN(Number(quantity))
    ) {
      return NextResponse.json(
        { error: 'Rate and quantity are required and must be valid numbers' },
        { status: 400 }
      );
    }

    // Convert rate and quantity to numbers
    const numericRate = Number(rate);
    const numericQuantity = Number(quantity);

    // Create the Inward document using the extracted userId and other request data
    const inward = new Inward({
      userId: userId, // Automatically set userId from the token
      source: body.source,
      destination: body.destination,
      category: body.category,
      warehouse: body.warehouse,
      transportDetails: body.transportDetails,
      supplierDetails: body.supplierDetails,
      bagQuantity: body.bagQuantity,
      rate: numericRate,
      amount: body.amount,
      date: body.date || new Date(),
      supplierContactDetails: body.supplierContactDetails,
      invoiceNo: body.invoiceNo,
      quantity: numericQuantity,
      remarks: body.remarks,
      productDetails: body.productDetails,
    });

    // Save the document to the database
    await inward.save();

    return NextResponse.json(
      { message: 'Inward data created successfully', inward },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating Inward document:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
