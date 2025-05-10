require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2cje9ya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB");


// Collections
    const datafile = client.db("sahabastore");
    const userInfoCollection = datafile.collection("users");
    const categoriesCollection = datafile.collection("categories");
    const productsCollection = datafile.collection("products");
   





      app.get("/", (req, res) => {
      res.send("Hello..! This is Rian Hasan....");
    });


//user data post

app.post("/userData", async (req,res)=>{

try{

let userData = req.body;


// Check if the user already exists in the database (you can use email or another unique field as a filter)
        const existingUser = await userInfoCollection.findOne({
          email: userData.email,
        });
    
        if (existingUser) {
          // If the user already exists, send a response and avoid insertion
          // Console.log("kire abar id khulos")
          return res.send({ message: "User already exists" });
        } else {
          // Add a default role to the user data
          userData.userRole = "Customer";
    
          // If the user doesn't exist, insert the new user data with the role
          const result = await userInfoCollection.insertOne(userData);
          
          // Send success response
          res.send(result);
        }


} catch{

 console.error("Error inserting user data:", error);
        res.status(500).send("Internal Server Error");

}




})




//fetch all user
  app.get("/allusers", async (req, res) => {
      try {
        const result = await userInfoCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });




 // Route to delete a user
    app.delete("/delete-user/:id", async (req, res) => {
      try {
        const id = req.params.id;
      

        const query = { _id: new ObjectId(id) };

        const result = await userInfoCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res
            .status(200)
            .send({ message: "Application canceled successfully" });
        } else {
          res.status(404).send({ message: "Application not found" });
        }
      } catch (error) {
        console.error("Error canceling application:", error);
        res.status(500).send({ message: "Error canceling application" });
      }
    });













    
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
  }
}

run().catch(console.dir);
