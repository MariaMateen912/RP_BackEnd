const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const MSP = require("../models/MSP");
const Auction = require("../models/Auction");
const Event = require('../models/Events');


const JWT_SECRET = "Thisprojectissecured";

router.post("/reg", async (req, res) => {
  let success = false;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }
  try {
    let user = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (user) {
      return res
        .status(400)
        .json({ success, error: "Phone number already in use" });
    }

    const { name, phoneNumber, birthdate, email } = req.body;
    const formattedBirthdate = new Date(birthdate)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    let username = `${name}${phoneNumber.slice(-4)}${formattedBirthdate}`;

    let existingUser = await User.findOne({ username });
    let counter = 1;
    while (existingUser) {
      username = `${name}${phoneNumber.slice(
        -4
      )}${formattedBirthdate}${counter}`;
      existingUser = await User.findOne({ username });
      counter++;
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
      registrationType: req.body.registrationType,
      state: req.body.state,
      name: req.body.name,
      birthdate: req.body.birthdate,
      phoneNumber: req.body.phoneNumber,
      cityTehsil: req.body.cityTehsil,
      password: secPass,
      username, // Save the generated username
    });

    const data = {
      user: {
        id: user.id,
      },
    };
    const authoken = jwt.sign(data, JWT_SECRET);
    success = true;

    // Nodemailer setup to send email
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like SendGrid, etc.
      auth: {
        user: "your-email@gmail.com", // Your email
        pass: "your-email-password", // Your email password
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com", // Sender address
      to: email, // Receiver's email
      subject: "Registration Successful",
      text: `Dear ${name},\n\nYour registration was successful. Your username is ${username}.\n\nBest regards,\nYour Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Email sent: " + info.response);
    });

    res.json({ success, authoken, username }); // Send username in response
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/user-stats', async (req, res) => {
  try {
      const userStats = await User.aggregate([
          {
              $group: {
                  _id: { state: "$state", registrationType: "$registrationType" },
                  count: { $sum: 1 }
              }
          },
          {
              $project: {
                  state: "$_id.state",
                  registrationType: "$_id.registrationType",
                  count: 1,
                  _id: 0
              }
          },
          {
              $sort: { state: 1, registrationType: 1 }
          }
      ]);

      res.json(userStats);
  } catch (error) {
      res.status(500).send('Server Error');
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    console.log(user);

    // Compare the password
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate JWT token
    const data = {
      user: {
        id: user.id,
      },
    };
    const authToken = jwt.sign(data, JWT_SECRET);

    // Return auth token
    res.json({ authToken, user });
    console.log(express.response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/mspForm", async (req, res) => {
  try {
    const { year, cropType, price, username } = req.body;

    // Create a new MSP document
    const newMSP = new MSP({
      year,
      cropType,
      price,
      username,
    });

    // Save the document to the database
    await newMSP.save();

    // Send success response
    res.status(201).json({ message: "MSP data saved successfully" });
  } catch (error) {
    console.error("Error saving MSP data:", error);
    res.status(500).json({ error: "Failed to save MSP data" });
  }
});

router.get("/mspForm", async (req, res) => {
  try {
    // Fetch all MSP documents from the database
    const msps = await MSP.find();

    // Send the fetched data as a response
    res.status(200).json(msps);
  } catch (error) {
    console.error("Error fetching MSP data:", error);
    res.status(500).json({ error: "Failed to fetch MSP data" });
  }
});

router.post("/auction", async (req, res) => {
  try {
    const { cropType, weight, mandi, arrivalDate, biddingAmount, username } =
      req.body;

    console.log("Received request body:", req.body); // Log request body

    // Validate arrivalDate (ensure it is a future date)

    const now = new Date();

    const arrival = new Date(arrivalDate);

    if (arrival <= now) {
      return res
        .status(400)
        .json({ error: "Arrival date must be a future date." });
    }

    console.log("Received username:", username); // Check the received username

    let user = await User.findOne({ username });

    console.log("Fetched user:", user); // Check if user is fetched from DB

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const registrationType = user.registrationType;

    console.log("User's registration type:", registrationType); // Check registrationType

    // Check if the user is a farmer

    if (registrationType !== "Farmer") {
      return res
        .status(403)
        .json({ error: "Only farmers can add crops to the auction." });
    }

    // Create new auction object

    const newAuction = new Auction({
      cropType,

      weight,

      mandi,

      arrivalDate,

      biddingAmount,

      username: username, // Save the farmer's username
    });

    // Save the auction in the database

    await newAuction.save();

    // Respond with success message

    res.status(201).json({ message: "Auction added successfully" });
  } catch (error) {
    // Log the error for debugging

    console.error("Failed to add auction:", error);

    // Respond with failure message

    res.status(500).json({ error: error.message || "Failed to add auction" });
  }
});
router.get("/auction", async (req, res) => {
  try {
    const { cropType, mandi, date } = req.query;

    let query = {};

    if (cropType) query.cropType = cropType;

    if (mandi) query.mandi = mandi;

    if (date) query.arrivalDate = { $gte: new Date(date) };

    const auctions = await Auction.find(query);

    res.json(auctions);
  } catch (error) {
    console.error("Failed to fetch auctions:", error);

    res.status(500).json({ error: "Failed to fetch auctions" });
  }
});

router.post("/bid", async (req, res) => {
  try {
    const { auctionUsername, bidAmount, buyerUsername ,buyerName,buyerPhone,bidDate} = req.body;
console.log(req.body);
    // Check if auction exists based on auctionUsername
    const auction = await Auction.findOne({ username: auctionUsername });

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // Add the new bid to the bids array in the auction
    auction.bids.push({
      username: buyerUsername,
      bidAmount,
      buyerName,
      buyerPhone,
      
    });

    // Save the auction with the new bid
    await auction.save();

    res.status(201).json({ message: "Bid placed successfully" });
  } catch (error) {
    console.error("Failed to place bid:", error);
    res.status(500).json({ error: "Failed to place bid" });
  }
});


router.post('/bids', async (req, res) => {
  try {
    const { username } = req.body;  // Extract username from request body

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find bids with the provided username
    const bids = await Auction.find({ username });

    if (!bids.length) {
      return res.status(404).json({ message: 'No bids found for this user' });
    }

    res.status(200).json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/receipt', async (req, res) => {
  try {
    const { username } = req.body;
    console.log('Username received:', username); // Add this for debugging

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Fetching auction where the user placed a bid
    const auction = await Auction.findOne({ "bids.username": username });

    if (!auction) {
      return res.status(404).json({ message: 'No auction found for this bid' });
    }

    const selectedBid = auction.bids.find(bid => bid.username === username);
    if (!selectedBid) {
      return res.status(404).json({ message: 'No matching bid found' });
    }

    res.status(200).json({
      ...auction.toObject(),
      selectedBid: {
        buyerName: 'Buyer Name',  // Replace with actual buyer's name from user collection
        buyerPhone: 'Buyer Phone', // Replace with actual buyer's phone number
        ...selectedBid,
      }
    });
  } catch (error) {
    console.error('Error fetching auction details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post("/events", async (req, res) => {
  let success = false;
  console.log(req.body);
  // Extract event details from request body
  const { title, start } = req.body;

  try {
    // Create new event document
    const event = await Event.create({
      title,
      start,
    });

    success = true;
    res.json({ success, event });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
