import mongoose, {Schema, model, models,  } from "mongoose";
const categorySchema = new Schema(
  {
    // User details for the outward transaction
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User", // Reference to the User model
              required: true,
            },
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },
    subcategory: {
      type: [String],  // An array to store multiple subcategories
      default: [],
    },
  },
  { timestamps: true }
);

// const Category = mongoose.model("Category", categorySchema);
  export const Category = models.Category || model("Category", categorySchema);

export default Category;
