const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const userSchema = new Schema({
    fullName:{
        type:String,
        trim:true,
        minLength:3,
        maxLength:10
    },
    emaill:{
        type:String,
        trim:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    emailActive:{
        type:Boolean,
        default:false
    }
},{collection:"githubProj2",timestamps:true});

const userModel =mongoose.model("user",userSchema);
module.exports=userModel;