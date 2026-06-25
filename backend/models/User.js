import mongoose from "mongoose";
import Joi from "joi";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    toRead: { type: [Number], default: [] },
    
    completed: [
      {
        bookId: { type: Number, required: true },
        title: { type: String, required: true }
      }
    ],

    inProgress: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },

    ratings: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

function validateRegister(user) {
  return Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(6).required(),
  }).validate(user);  
}

function validateLogin(user) {
  return Joi.object({
    email: Joi.string().email().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
  }).validate(user);
}

const User = mongoose.model("User", userSchema); 

export default User;
export { validateRegister, validateLogin };