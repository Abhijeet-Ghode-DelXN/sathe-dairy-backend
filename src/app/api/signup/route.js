import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongooseConnection from '../../../lib/mongodb'; // MongoDB connection
import { User } from '../../../models/user'; // User model
import jwt from 'jsonwebtoken';

export async function POST(req) {
  
  try {
    await mongooseConnection(); // Ensure MongoDB connection

    const body = await req.json();
    const { fullName, email, password, mobileNumber, role = 'user' } = body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      mobileNumber,
      role,
    });

    // Generate a JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expiry of 1 hour
    );

    // Send token in the response
    return NextResponse.json({ message: 'Signup Successful', token }, { status: 201 });
  } catch (error) {
    console.log('Error during signup:', error);
    return NextResponse.json({ error: 'Signup Failed', details: error.message }, { status: 500 });
  }
}
