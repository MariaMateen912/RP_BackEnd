const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  cropType: { type: String, required: true },
  weight: { type: Number, required: true },
  mandi: { type: String, required: true },
  arrivalDate: { type: Date, required: true },
  biddingAmount: { type: Number, required: true },
  username: { type: String, required: true }, // Farmer's username
  bids: [
    {
      username: { type: String, required: true }, // Buyer's username
      bidAmount: { type: Number, required: true },
      bidDate: { type: Date, default: Date.now },
      buyerName:{type:String},
      buyerPhone: { type: Number },
    },
  ],
  selectedBid: {
    buyerUsername: { type: String }, // Selected buyer's username
    bidAmount: { type: Number },

  },
});

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
