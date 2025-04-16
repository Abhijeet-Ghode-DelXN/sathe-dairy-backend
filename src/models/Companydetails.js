const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
 // company_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
 // registration_number: { type: String, unique: true },
  industry: { type: String, default: "Dairy & Food Processing" },
  //description: { type: String },
  founded_year: { type: Number },
 // website: { type: String },
  email: { type: String, unique: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: "India" }
  },
 
 // logo_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);


module.exports = Company;
