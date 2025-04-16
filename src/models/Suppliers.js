import mongoose, { Schema, model, models } from "mongoose";

const supplierSchema = new Schema(
  {
    userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Refers to the User model
          required: true,
        },
    supplierId: {
      type: String,
      // required: true,
      // unique: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    supplierMobileNo: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    supplierGSTNo: {
      type: String,
      required: true,
    },
    supplierAddress: {
      type: String,
      required: true,
    },
    supplierEmailId: {
      type: String,
      required: true,
    },
    supplierAccountNumber: {
      type: String, // If it's always numeric, you can use type: Number
      required: true,
    },
    supplierIFSCode: {  
      type: String,
      required: true,  
      match: [/^[A-Z]{4}[0-9]{7}$/, "Invalid IFSC Code"],
    },
    supplierPanNumber: {
      type: String,
      required: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number"], // PAN validation for India
    },
    
  },
  { timestamps: true }
);


delete mongoose.models.supplier;
export const supplier = models.supplier || model("supplier", supplierSchema);


