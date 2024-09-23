const connectToMongo=require('./db');
const express = require('express')
const app = express()
const nodemailer = require('nodemailer');
const port = 5000

const cors = require('cors');
require('dotenv').config();
connectToMongo();

app.use(express.json());
app.use(cors({ origin: "*" }));
//Available routes
app.use('/api/auth', require('./routes/auth'));
  
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

