import mongoose, { Schema, model, models } from "mongoose";

// Product schema defines the structure for product data
const ProductSchema = new Schema(
  
  {
      // User details for the outward transaction
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model
          required: true,
        },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    // productDescription: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productCode: {
      type: String,
      required: true,
      unique: true, // Ensures the product code is unique
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    // image: {
    //   type: String, // URL or file path for the product image
    //   required: true,
    // },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    configuration: {
      // numberOfPieces: {
      //   type: Number,
      //   required: true,
      //   min: 0,
      // },
      numberOfBags: {
        type: Number,
        required: true,
        min: 0,
      },
      skuQuantity: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Virtual field to calculate total cost based on quantity and selling price
ProductSchema.virtual("totalCost").get(function () {
  return this.sellingPrice * this.quantity; // Selling price multiplied by quantity
});

// Virtual field to calculate total pieces based on the configuration
ProductSchema.virtual("totalPieces").get(function () {
  return this.configuration.numberOfPieces * this.configuration.skuQuantity; // Total pieces based on config
});

// Virtual field to calculate total bags based on the configuration
ProductSchema.virtual("totalBags").get(function () {
  return this.configuration.numberOfBags * this.configuration.skuQuantity; // Total bags based on config
});


delete mongoose.models.Product;
// Export the Product model, creating it if it does not already exist
export const Product = models.Product || model("Product", ProductSchema);
