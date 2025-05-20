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
    const couponDetailsCollection = datafile.collection("coupon");
    const orderDetailsCollection = datafile.collection("orders");
   





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


app.get("/user", async (req, res) => {

  try {
    const { email } = req.query;
    
    // Validate email exists and is properly formatted
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email query parameter is required" 
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await userInfoCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Remove sensitive data before sending response
    const { password, ...safeUserData } = user;
    
    res.status(200).json({
      success: true,
      data: safeUserData
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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







// POST: Add Category
app.post("/add-category", async (req, res) => {
  try {
    const category = req.body;

    const existingCategory = await categoriesCollection.findOne({
      name: category.name,
    });

    if (existingCategory) {
      return res.send({ message: "Category already exists" });
    }

    const result = await categoriesCollection.insertOne({
      name: category.name,
      availableAmount: category.availableAmount,
      image: category.image, // Add image field
    });

    res.send({ message: "Category added successfully", result });
  } catch (error) {
    console.error("Error inserting category data:", error);
    res.status(500).send("Internal Server Error");
  }
});



//fetch categories data

  app.get("/allcategories", async (req, res) => {
      try {
        const result = await categoriesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });




app.put("/edit-category/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedCategory = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid category ID" });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        name: updatedCategory.name,
        availableAmount: updatedCategory.availableAmount,
        image: updatedCategory.image, // Add image field for update
      },
    };

    const result = await categoriesCollection.updateOne(filter, updateDoc);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ message: "Category not found or not modified" });
    }

    res.send({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send({ message: "Failed to update category" });
  }
});





    // Delete Category by ID
    app.delete("/delete-category/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid category ID" });
        }

        const result = await categoriesCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Category not found" });
        }

        res.send({ message: "Category deleted successfully" });
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send({ message: "Failed to delete category" });
      }
    });







// POST: Add products
app.post("/add-product", async (req, res) => {
  try {
    const product = req.body;

    // Validate required fields
    const requiredFields = ['productId', 'name'];
    const missingFields = requiredFields.filter(field => !product[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).send({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        fields: missingFields
      });
    }

    // Validate field types
    if (isNaN(product.price)) {
      return res.status(400).send({ 
        message: "Price and available amount must be numbers" 
      });
    }

    // Check if product ID already exists
    const existingProduct = await productsCollection.findOne({
      $or: [
        { productId: product.productId },
        { name: product.name } // Optional: prevent duplicate names too
      ]
    });

    if (existingProduct) {
      const conflictField = existingProduct.productId === product.productId 
        ? 'Product ID' : 'Product name';
      return res.status(409).send({ 
        message: `${conflictField} already exists` 
      });
    }

    // Validate category exists if provided
    if (product.category) {
      const categoryExists = await categoriesCollection.findOne({
        _id: new ObjectId(product.category)
      });

      if (!categoryExists) {
        return res.status(400).send({ 
          message: "Specified category does not exist" 
        });
      }
    }

    // Prepare new product document
    const newProduct = {
      productId: product.productId,
      name: product.name,
      description: product.description || "",
      price: parseFloat(product.price),
      availableAmount: product.availableAmount,
      image: product.image || null, // Add image field
      category: product.category ? new ObjectId(product.category) : null, // Store as ObjectId if exists
      createdAt: new Date(),
      updatedAt: new Date(),
      shortDescription: product.shortDescription  // Additional useful field
    };

    // Insert the new product
    const result = await productsCollection.insertOne(newProduct);

    // Return the complete product data
    const createdProduct = await productsCollection.findOne({
      _id: result.insertedId
    });

    // Convert ObjectId to string for client
    if (createdProduct.category) {
      createdProduct.category = createdProduct.category.toString();
    }

    res.status(201).send({ 
      success: true,
      message: "Product added successfully",
      product: createdProduct
    });

  } catch (error) {
    console.error("Error adding product:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoServerError') {
      if (error.code === 121) {
        return res.status(400).send({ 
          message: "Validation failed against schema rules",
          details: error.errInfo.details
        });
      }
      if (error.code === 11000) {
        return res.status(409).send({
          message: "Duplicate key error - product ID or name already exists"
        });
      }
    }

    res.status(500).send({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    });
  }
});


//fetch categories data

  app.get("/products", async (req, res) => {
      try {
        const result = await productsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });


// Get single product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }; // Convert string ID to MongoDB ObjectId
    const result = await productsCollection.findOne(query);
    
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});





// PUT: Update product by ID
app.put("/update-product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedProduct = req.body;

    // Validate ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid product ID" });
    }

    // Validate required fields
    if (!updatedProduct.productId || !updatedProduct.name) {
      return res.status(400).send({ 
        message: "Product ID and Name are required",
        fields: {
          productId: !updatedProduct.productId ? 'Required' : 'Valid',
          name: !updatedProduct.name ? 'Required' : 'Valid'
        }
      });
    }

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingProduct) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Check for duplicate product ID (if changed)
    if (updatedProduct.productId !== existingProduct.productId) {
      const duplicate = await productsCollection.findOne({
        productId: updatedProduct.productId,
        _id: { $ne: new ObjectId(id) } // Exclude current product
      });
      if (duplicate) {
        return res.status(409).send({ 
          message: "Product ID already exists in another product" 
        });
      }
    }

    // Validate category exists if provided
    if (updatedProduct.category) {
      const categoryExists = await categoriesCollection.findOne({
        _id: new ObjectId(updatedProduct.category)
      });
      if (!categoryExists) {
        return res.status(400).send({ 
          message: "Specified category does not exist" 
        });
      }
    }

    // Validate field types
    if (isNaN(updatedProduct.price)) {
      return res.status(400).send({ 
        message: "Price and available amount must be numbers" 
      });
    }

    // Prepare update document
    const updateDoc = {
      $set: {
        productId: updatedProduct.productId,
        name: updatedProduct.name,
        description: updatedProduct.description || existingProduct.description,
        price: parseFloat(updatedProduct.price) || existingProduct.price,
        availableAmount: updatedProduct.availableAmount || existingProduct.availableAmount,
        image: updatedProduct.image || existingProduct.image, // Handle image update
        category: updatedProduct.category 
          ? new ObjectId(updatedProduct.category) 
          : existingProduct.category,
        updatedAt: new Date()
      }
    };

    // Execute update
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.modifiedCount === 0) {
      return res.status(200).send({ 
        message: "No changes detected",
        product: existingProduct
      });
    }

    // Return updated product
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    
    // Convert ObjectId to string for client
    if (product.category) {
      product.category = product.category.toString();
    }

    res.status(200).send({ 
      success: true,
      message: "Product updated successfully",
      product 
    });

  } catch (error) {
    console.error("Error updating product:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongoServerError') {
      if (error.code === 121) {
        return res.status(400).send({ 
          message: "Validation failed against schema rules",
          details: error.errInfo.details
        });
      }
      if (error.code === 11000) {
        return res.status(409).send({
          message: "Duplicate key error - product ID already exists"
        });
      }
    }

    res.status(500).send({ 
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    });
  }
});




// DELETE: Delete product by ID
app.delete("/delete-product/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid product ID" });
    }

    // Optional: Check if product exists first
    const productExists = await productsCollection.findOne({
      _id: new ObjectId(id)
    });
    if (!productExists) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Delete product
    const result = await productsCollection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Optional: Clean up related data (e.g., remove from orders)
    // await ordersCollection.updateMany(
    //   { 'items.product': new ObjectId(id) },
    //   { $pull: { items: { product: new ObjectId(id) } } }
    // );

    res.send({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ 
      message: "Failed to delete product",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// PUT /add-to-cart
app.put("/add-to-cart", async (req, res) => {

  try {
    const { email, productId } = req.body;
  

    if (!email || !productId) {
      return res
        .status(400)
        .send({ message: "Email and productId are required" });
    }

    const user = await userInfoCollection.findOne({ email });
      

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const alreadyExists = user.addToCart?.some(
      (item) => item.productId === productId
    );

    if (alreadyExists) {
      return res
        .status(400)
        .send({ message: "Product already in cart" });
    }

    const result = await userInfoCollection.updateOne(
      { email },
      {
        $push: {
          addToCart: {
            productId,
            addedAt: new Date(), // optional
          },
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Product added to cart successfully" });
    } else {
      res.status(400).send({ message: "Cart not updated" });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



// Wishlist route
app.put("/add-to-wishlist", async (req, res) => {
  try {
    const { email, productId } = req.body;
   

    if (!email || !productId) {
      return res.status(400).send({ message: "Email and productId are required" });
    }

    const user = await userInfoCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Optional: prevent duplicate productId in wishlist
    const alreadyExists = user.addToWishlist?.some(item => item.productId === productId);

    if (alreadyExists) {
      return res.status(400).send({ message: "Product already in wishlist" });
    }

    // Add to wishlist array
    const result = await userInfoCollection.updateOne(
      { email },
      {
        $push: {
          addToWishlist: {
            productId,
            addedAt: new Date(),
          },
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Product added to wishlist successfully" });
    } else {
      res.status(400).send({ message: "Wishlist not updated" });
    }

  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});




//remove wishlist
app.put("/remove-from-wishlist", async (req, res) => {
  try {
    const { email, productId } = req.body;


    if (!email || !productId) {
      return res.status(400).send({ message: "Email and productId are required" });
    }

    const user = await userInfoCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Remove product from wishlist
    const result = await userInfoCollection.updateOne(
      { email },
      {
        $pull: {
          addToWishlist: { productId },
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Product removed from wishlist successfully" });
    } else {
      res.status(400).send({ message: "Product not found in wishlist" });
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});








// Fetch each product by its ID
app.get("/eachproduct/:id", async (req, res) => {
  const { id } = req.params;
 

  // Validate the ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid product ID format" });
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await productsCollection.findOne(query);

    if (!result) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Return the product details
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});






// GET /add-to-cart-list?email=user@example.com
app.get("/addtocart-list", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await userInfoCollection.findOne({ email });

    if (!user || !user.addToCart || user.addToCart.length === 0) {
      return res.send({ cartItems: [] });
    }

    const productIds = user.addToCart.map((item) => item.productId);

    const products = await productsCollection
      .find({ _id: { $in: productIds.map(id => new ObjectId(id)) } })
      .toArray();

    res.send({ cartItems: products });
  } catch (error) {
    console.error("Error fetching cart list:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



app.delete("/remove-from-cart", async (req, res) => {
  try {
    const { email, productId } = req.body; // Get email and productId from the request body



    // Validate if email and productId are provided
    if (!email || !productId) {
      return res.status(400).send({ message: "Email and productId are required" });
    }

    const user = await userInfoCollection.findOne({ email });

    // Check if the user exists and has items in their cart
    if (!user || !user.addToCart || user.addToCart.length === 0) {
      return res.status(404).send({ message: "No items in the cart to remove" });
    }



    // Filter out the item to be removed by matching productId
    const updatedCart = user.addToCart.filter(item => item.productId !== productId);

    // Update the cart in the database
    await userInfoCollection.updateOne(
      { email },
      { $set: { addToCart: updatedCart } }
    );

    // Send the updated cart as a response
    res.send({ message: "Item removed from cart", cartItems: updatedCart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});





//post coupon code
app.post("/add-coupon", async (req, res) => {
  try {
    const coupon = req.body;
    

    // Basic validation
    if (!coupon.code || isNaN(coupon.discount)) {
      return res.status(400).send({ message: "Coupon code and discount are required" });
    }

    // Check for duplicate
    const existing = await couponDetailsCollection.findOne({ code: coupon.code });
    if (existing) {
      return res.status(409).send({ message: "Coupon code already exists" });
    }

    // Insert
    const result = await couponDetailsCollection.insertOne({
      ...coupon,
      discount: parseFloat(coupon.discount),
      minOrder: Number(coupon.minOrder || 0),
      expires: new Date(coupon.expires),
      status: coupon.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.send({ success: true, message: "Coupon added", result });
  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});



//get coupon
app.get("/coupons", async (req, res) => {
  try {
    const result = await couponDetailsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch coupons" });
  }
});



//update coupon
app.put("/update-coupon/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedCoupon = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid coupon ID" });
    }

    const existing = await couponDetailsCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({ message: "Coupon not found" });
    }

    // Check for duplicate code if changed
    if (updatedCoupon.code && updatedCoupon.code !== existing.code) {
      const duplicate = await couponDetailsCollection.findOne({ code: updatedCoupon.code });
      if (duplicate) {
        return res.status(409).send({ message: "Coupon code already in use" });
      }
    }

    const updateDoc = {
      $set: {
        ...updatedCoupon,
        discount: parseFloat(updatedCoupon.discount),
        minOrder: Number(updatedCoupon.minOrder || 0),
        expires: new Date(updatedCoupon.expires),
        updatedAt: new Date()
      }
    };

    const result = await couponDetailsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);

    res.send({ success: true, message: "Coupon updated", result });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).send({ message: "Update failed" });
  }
});








//delete coupon 
app.delete("/delete-coupon/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid coupon ID" });
    }

    const result = await couponDetailsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Coupon not found" });
    }

    res.send({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).send({ message: "Failed to delete coupon" });
  }
});



// delete user
app.delete("/delete-order/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    const result = await orderDetailsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({ message: "Failed to delete user" });
  }
});




// POST /add-order
app.post("/add-order", async (req, res) => {
  try {
    const order = req.body;

    // Basic validation
    if (!order.customer?.name || !order.customer?.email || !order.products?.length) {
      return res.status(400).send({ message: "Customer info and products are required" });
    }

    // Optionally validate each product
    const invalidProduct = order.products.find(p => !p.productId || !p.price || !p.quantity);
    if (invalidProduct) {
      return res.status(400).send({ message: "Each product must have productId, price, and quantity" });
    }

    // Create order object
    const newOrder = {
      ...order,
      status: order.status || "pending",
      orderTotal: parseFloat(order.orderTotal || 0),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into DB
    const result = await orderDetailsCollection.insertOne(newOrder);

    res.send({ success: true, message: "Order placed successfully", result });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});


// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await orderDetailsCollection.find({}).toArray();
    res.send({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});





app.put("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // Only accept status updates

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid order ID" });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        status, // Only update the status
        updatedAt: new Date()
      }
    };

    const result = await orderDetailsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send({ success: false, message: "Order not found" });
    }

    res.send({ success: true, message: "Order status updated successfully", result });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send({ success: false, message: "Server error" });
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
