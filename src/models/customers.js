import mongoose, { Schema, model, models } from "mongoose";

const customerSchema = new Schema(
  {
    userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Refers to the User model
          required: true,
        },
    customerId: {
      type: String,
      // required: true,
      // unique: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMobileNo: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    customerGSTNo: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    customerEmailId: {
      type: String,
      required: true,
    },
    
  },
  { timestamps: true }
);

export const Customer = models.Customer || model("Customer", customerSchema);

export default Customer;
