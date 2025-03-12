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
    customerBranchName:{
      type:String,
      require:true
    },
    customerAccountNumber: {
      type: String, // If it's always numeric, you can use type: Number
      required: true,
    },
    customerIFSCCode: {  
      type: String,
      required: true,  
      match: [/^[A-Z]{4}[0-9]{7}$/, "Invalid IFSC Code"],
    },
    
    customerPanNumber: {
      type: String,
      required: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number"], // PAN validation for India
    },
    
  },
  { timestamps: true }
);

export const Customer = models.Customer || model("Customer", customerSchema);

export default Customer;
