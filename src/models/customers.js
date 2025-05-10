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
      required: false,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    customerEmailId: {
      type: String,
      required: false,
    },
    customerBranchName:{
      type:String,
      required: false
    },
    customerAccountNumber: {
      type: String,
      required: false,
    },
    customerIFSCCode: {  
      type: String,
      required: false,  
    },
    
    customerPanNumber: {
      type: String,
      required: false,
    },
    
  },
  { timestamps: true }
);
delete mongoose.models.Customer;
export const Customer = models.Customer || model("Customer", customerSchema);

export default Customer;
