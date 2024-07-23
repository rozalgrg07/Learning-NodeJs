const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const upload = require("./multerConfig");
const app = express();
const port = 3000; // or change to 3001 if needed
const saltRounds = 12;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// MySQL connection setup
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "node",
};

const myLogger = function (req, res, next) {
  if (req.url === "/logout") {
    res.send("Thank you");
  }
  next();
};

app.use(myLogger);

const connection = mysql.createConnection(dbConfig);

// Function to connect to the database
const connectToDatabase = () => {
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to the database: ", err.stack);
      return;
    }
    console.log("Connected to the database with ID: ", connection.threadId);
  });
};

connectToDatabase();

// Route to display registration form
app.get("/register", (req, res) => {
  res.status(200).send(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Registration Form</title>
      </head>
      <body>
        <h1>Register</h1>
        <form action="/register" method="POST" enctype="multipart/form-data">
          <label for="username">Username:</label><br>
          <input type="text" id="username" name="username"><br><br>
          <label for="email">Email:</label><br>
          <input type="email" id="email" name="email"><br><br>
          <label for="password">Password:</label><br>
          <input type="password" id="password" name="password"><br><br>
          <label for="file">Profile Picture:</label>
          <input type="file" id="file" name="file" required><br><br>
          <input type="submit" value="Register">
        </form>
      </body>
    </html>
  `);
});

// Route to handle registration
app.post("/register", upload.single("file"), async (req, res) => {
  const { username, email, password } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const filePath = file.path;
    const query = "INSERT INTO users (username, email, password, file_path) VALUES (?, ?, ?, ?)";

    connection.query(query, [username, email, hashedPassword, filePath], (error, results) => {
      if (error) {
        console.error("Error inserting user: ", error.stack);
        res.status(500).send("Error registering user");
        return;
      }
      const successHtml = `
        <p>Registration successful</p>
        <button onclick="window.location.href='/login'">Go to Login</button>
      `;

      res.send(successHtml);
    });
  } catch (error) {
    console.error("Error hashing password: ", error.stack);
    res.status(500).send("Error registering user");
  }
});

// Route to display login form
app.get("/login", (req, res) => {
  res.status(200).send(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login Form</title>
      </head>
      <body>
        <h1>Login</h1>
        <form action="/login" method="POST">
          <label for="username">Username:</label><br>
          <input type="text" id="username" name="username"><br><br>
          <label for="password">Password:</label><br>
          <input type="password" id="password" name="password"><br><br>
          <input type="submit" value="Login">
        </form>
      </body>
    </html>
  `);
});

// Route to handle login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (error, results) => {
    if (error) {
      console.error("Error during login: ", error.stack);
      res.status(500).send("Error logging in");
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          console.log("Login successful: ", user);

          const successHtml = `
            <p>Product added successfully</p>
            <button onclick="window.location.href='/add-product'">Add Products</button>
          `;

          res.send(successHtml);
        } else {
          console.log("Invalid credentials");
          res.status(401).send("Invalid credentials");
        }
      } catch (error) {
        console.error("Error comparing passwords: ", error.stack);
        res.status(500).send("Error logging in");
      }
    } else {
      console.log("Invalid credentials");
      res.status(401).send("Invalid credentials");
    }
  });
});

// Route for adding product
app.get("/add-product", (req, res) => {
  res.status(200).send(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Add Product</title>
      </head>
      <body>
        <h1>Add Product</h1>
        <form action="/add-product" method="POST" enctype="multipart/form-data">
          <label for="name">Product Name:</label>
          <input type="text" id="name" name="name" required><br><br>

          <label for="description">Description:</label>
          <textarea id="description" name="description" required></textarea><br><br>

          <label for="price">Price:</label>
          <input type="number" id="price" name="price" step="0.01" required><br><br>

          <label for="productImage">Product Image:</label>
          <input type="file" id="productImage" name="productImage" required><br><br>

          <button type="submit">Add Product</button>
        </form>
      </body>
    </html>
  `);
});

//Route for adding product
app.post("/add-product", upload.single("productImage"), async (req, res) => {
  const { name, description, price } = req.body;
  const productImage = req.file;

  if (!productImage) {
    return res.status(400).send('No product image uploaded.');
  }

  try {
    const imagePath = productImage.path;
    const query = "INSERT INTO products (name, description, price, image_path) VALUES (?, ?, ?, ?)";

    connection.query(query, [name, description, price, imagePath], (error, results) => {
      if (error) {
        console.error("Error adding product: ", error.stack);
        res.status(500).send("Error adding product");
        return;
      }
      console.log("Product added: ", results);

      const successHtml = `
        <p>Product added successfully</p>
        <button onclick="window.location.href='/products'">View Products</button>
      `;

      res.send(successHtml);
    });
  } catch (error) {
    console.error("Error adding product: ", error.stack);
    res.status(500).send("Error adding product");
  }
});

//Route for shwoing products
app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";

  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching products: ", error.stack);
      res.status(500).send("Error fetching products");
      return;
    }
    let productsHtml = '<h1>Products</h1>';
    productsHtml += '<ul>';
    results.forEach(product => {
      productsHtml += `
        <li>
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <p>Price: $${product.price}</p>
          <img src="${product.image_path}" alt="${product.name}" style="width: 100px; height: 100px;">
          <br>
          <button onclick="window.location.href='/edit-product/${product.id}'">Edit product</button>
        </li>
      `;
    });
    productsHtml += '</ul>';
    res.status(200).send(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Products</title>
        </head>
        <body>
          ${productsHtml}
        </body>
      </html>
    `);
  });
});

//Route for editing button
app.get("/edit-product/:id", (req, res) => {
  const productId = req.params.id;
  const query = "SELECT * FROM products WHERE id = ?";

  connection.query(query, [productId], (error, results) => {
    if (error) {
      console.error("Error fetching product: ", error.stack);
      res.status(500).send("Error fetching product");
      return;
    }

    const product = results[0];

    if (!product) {
      res.status(404).send("Product not found");
      return;
    }

    res.status(200).send(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Edit Product</title>
        </head>
        <body>
          <h1>Edit Product</h1>
          <form action="/update-product/${product.id}" method="POST" enctype="multipart/form-data">
            <label for="name">Product Name:</label>
            <input type="text" id="name" name="name" value="${product.name}" required><br><br>

            <label for="description">Description:</label>
            <textarea id="description" name="description" required>${product.description}</textarea><br><br>

            <label for="price">Price:</label>
            <input type="number" id="price" name="price" value="${product.price}" step="0.01" required><br><br>

            <label for="productImage">Product Image:</label>
            <input type="file" id="productImage" name="productImage"><br><br>
            <img src="${product.image_path}" alt="${product.name}" style="width: 100px; height: 100px;"><br><br>

            <button type="submit">Update Product</button>
          </form>
        </body>
      </html>
    `);
  });
});


//Route for updating product
app.post("/update-product/:id", upload.single("productImage"), (req, res) => {
  const productId = req.params.id;
  const { name, description, price } = req.body;
  const productImage = req.file;

  let query = "UPDATE products SET name = ?, description = ?, price = ?";
  const queryParams = [name, description, price];

  if (productImage) {
    const imagePath = productImage.path;
    query += ", image_path = ?";
    queryParams.push(imagePath);
  }

  query += " WHERE id = ?";
  queryParams.push(productId);

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      console.error("Error updating product: ", error.stack);
      res.status(500).send("Error updating product");
      return;
    }
    console.log("Product updated: ", results);
    res.redirect('/products');
  });
});



// Start the server
app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  const open = await import('open'); // Dynamic import for 'open'
  await open.default(`http://localhost:${port}/register`);
});