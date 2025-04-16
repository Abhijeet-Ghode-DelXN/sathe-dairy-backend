import mongooseConnection from '@/lib/mongodb';

import { Inward } from '@/models/inward'; // Adjust the path to your models
import { Outward } from '@/models/outward'; // Adjust the path to your models

export async function GET(req) {
  try {
    await mongooseConnection();

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const transactionType = searchParams.get('transactionType');

    // Validate input
    if (!startDate || !endDate || !transactionType) {
      return Response.json({ message: 'Missing required query parameters: startDate, endDate, transactionType' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!['inward', 'outward'].includes(transactionType.toLowerCase())) {
      return Response.json({ message: 'Invalid transaction type. Must be "inward" or "outward".' }, { status: 400 });
    }

    let transactions;
    if (transactionType.toLowerCase() === 'inward') {
      transactions = await Inward.find({ date: { $gte: start, $lte: end } }).populate('productDetails.productId');
    } else {
      transactions = await Outward.find({ date: { $gte: start, $lte: end } }).populate('productDetails.productId');
    }

    const totalQuantity = transactions.reduce((sum, transaction) => sum + transaction.quantity, 0);
    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const report = {
      startDate,
      endDate,
      transactionType,
      totalTransactions: transactions.length,
      totalQuantity,
      totalAmount,
      transactions,
    };

    return Response.json(report, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
