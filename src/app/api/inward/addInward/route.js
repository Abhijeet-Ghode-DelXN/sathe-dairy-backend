import { NextResponse } from 'next/server';
import { Inward } from '../../../../models/inward'; 
import { User } from '../../../../models/user'; 
import { verify } from 'jsonwebtoken';

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
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch the user to get their name
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert rate and quantity to numbers
    const numericRate = Number(body.rate);
    const numericQuantity = Number(body.quantity);

    // Create the Inward document
    const inward = new Inward({
      userId: userId,
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

    const savedInward = await inward.save();

    // Check if inward ID is properly generated
    if (!savedInward || !savedInward._id) {
      throw new Error('Failed to create Inward document.');
    }

    const inwardId = savedInward._id.toString(); // Convert ObjectId to string
    console.log('Generated Inward ID:', inwardId);

    // Notify all admins only if inwardId exists
    const admins = await User.find({ role: 'admin' });
  
    console.log("BEOFREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
    for (const admin of admins) {
      await User.findByIdAndUpdate(admin._id, {
        $push: {
          notifications: {
            message: `New inward added by ${user.fullName} in warehouse ${body.warehouse} on ${new Date().toLocaleString()}`,
            type: 'system',
            inwardId:"2742384923849"
          },
        },
      });
    }
    console.log("AFTERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
    return NextResponse.json(
      { message: 'Inward data created successfully, notification sent to admins', inward: savedInward },
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
