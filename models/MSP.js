const mongoose = require('mongoose');
const { Schema } = mongoose;
const MSPSchema = new Schema({
    cropType:{
        type: String,
        required : true
    },
    
    price:{
        type: Number,
        required : true
    },
    username:{
        type: String,
        required : true,
       
    },
    year:{
        type: String,
        required : true,
        
        
    },
    
})
module.exports = mongoose.model('MSP',MSPSchema);