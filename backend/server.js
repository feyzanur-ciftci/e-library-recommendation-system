import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import booksRoutes from "./routes/books.js";

dotenv.config(); 

const app = express();   

app.use(express.json());  

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,    
  })
);

app.use(
  session({
    name: "sid",  
    secret: process.env.SESSION_SECRET,  
    resave: false,
    saveUninitialized: false,   
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60,  
    }),
    cookie: { 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,  
    },
  })
);

mongoose
  .connect(process.env.MONGO_URI)   
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/books", booksRoutes);


app.use((req, res) => res.status(404).json({ message: "Not found" }));

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
