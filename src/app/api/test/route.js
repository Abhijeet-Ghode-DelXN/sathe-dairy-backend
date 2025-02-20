// test-api.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Inward } from '@/models/inward';
import { Outward } from '@/models/outward';
import { Customer } from '@/models/customers';
import { Category } from '@/models/categories';

// Mock data for testing
const mockInwardData = [
  {
    date: new Date('2024-02-01'),
    amount: 1000,
    description: 'Test Inward 1'
  },
  {
    date: new Date('2024-02-10'),
    amount: 2000,
    description: 'Test Inward 2'
  },
  {
    date: new Date('2024-02-15'),
    amount: 1500,
    description: 'Test Inward 3'
  }
];

const mockOutwardData = [
  {
    createdAt: new Date('2024-02-01'),
    total: 800,
    customerDetails: {
      name: 'John Doe',
      contactNumber: '1234567890'
    },
    productDetails: [
      {
        productCode: 'P001',
        name: 'Product 1',
        quantity: 2,
        productPrice: 400
      }
    ],
    transportDetails: {
      transportDate: new Date('2024-02-01')
    }
  },
  {
    createdAt: new Date('2024-02-12'),
    total: 1200,
    customerDetails: {
      name: 'Jane Smith',
      contactNumber: '0987654321'
    },
    productDetails: [
      {
        productCode: 'P002',
        name: 'Product 2',
        quantity: 3,
        productPrice: 400
      }
    ],
    transportDetails: {
      transportDate: new Date('2024-02-12')
    }
  }
];

// Test functions
async function testInwardAPI() {
  try {
    // Setup test data
    await Inward.deleteMany({});
    await Inward.insertMany(mockInwardData);

    // Test case 1: Valid date range
    const req1 = new Request(
      'http://localhost:3000/api/inward?startDate=2024-02-01&endDate=2024-02-15'
    );
    const response1 = await GET(req1);
    const data1 = await response1.json();
    console.log('Test 1 - Valid date range:', data1.length === 3 ? 'PASS' : 'FAIL');

    // Test case 2: Invalid date format
    const req2 = new Request(
      'http://localhost:3000/api/inward?startDate=invalid&endDate=2024-02-15'
    );
    const response2 = await GET(req2);
    const data2 = await response2.json();
    console.log('Test 2 - Invalid date format:', data2.message === 'Invalid date format' ? 'PASS' : 'FAIL');

    // Test case 3: Missing dates
    const req3 = new Request('http://localhost:3000/api/inward');
    const response3 = await GET(req3);
    const data3 = await response3.json();
    console.log('Test 3 - Missing dates:', data3.message === 'Start date and end date are required' ? 'PASS' : 'FAIL');
  } catch (error) {
    console.error('Error in testInwardAPI:', error);
  }
}

async function testOutwardAPI() {
  try {
    // Setup test data
    await Outward.deleteMany({});
    await Outward.insertMany(mockOutwardData);

    // Test case 1: Valid date range
    const req1 = new Request(
      'http://localhost:3000/api/outward?startDate=2024-02-01&endDate=2024-02-15'
    );
    const response1 = await GET(req1);
    const data1 = await response1.json();
    console.log('Test 1 - Valid date range:', data1.length === 2 ? 'PASS' : 'FAIL');

    // Test case 2: No transactions in range
    const req2 = new Request(
      'http://localhost:3000/api/outward?startDate=2024-03-01&endDate=2024-03-15'
    );
    const response2 = await GET(req2);
    const data2 = await response2.json();
    console.log('Test 2 - No transactions:', data2.length === 0 ? 'PASS' : 'FAIL');

    // Test case 3: Invalid date format
    const req3 = new Request(
      'http://localhost:3000/api/outward?startDate=invalid&endDate=2024-02-15'
    );
    const response3 = await GET(req3);
    const data3 = await response3.json();
    console.log('Test 3 - Invalid date format:', data3.message === 'Invalid date format.' ? 'PASS' : 'FAIL');
  } catch (error) {
    console.error('Error in testOutwardAPI:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('Starting API tests...');
  await testInwardAPI();
  await testOutwardAPI();
  console.log('API tests completed.');
}

runAllTests();