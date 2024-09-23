const mongoose = require('mongoose');
const { Schema } = mongoose;
const UserSchema = new Schema({
    registrationType:{
        type: String,
        required : true
    },
    
    state:{
        type: String,
        required : true
    },
    name:{
        type: String,
        required : true,
       
    },
    birthdate:{
        type: Date,
        required : true,
        default:Date.now,
        
    },
    phoneNumber:{
        type: String,
        required : true,
        unique :true,
        
    },
    cityTehsil: {
        type: String,
        required: true
    },
    
    password:{
        type: String,
        required : true 
    },
    username: {
        type: String,
        required: true,
        unique: true 
    }

})
module.exports = mongoose.model('user',UserSchema);