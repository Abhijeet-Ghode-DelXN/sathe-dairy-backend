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
    
  },
  { timestamps: true }
);

export const supplier = models.supplier || model("supplier", supplierSchema);

export default supplier;
