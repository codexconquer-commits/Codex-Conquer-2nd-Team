import mongoose from "mongoose";

const userSchema =  mongoose.Schema({
  fullName:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
  },
  contact:{
    type:Number,
    required:true,
    min: [1000000000, "Contact number must be a 10-digit number"],
    max: [9999999999, "Contact number must be a 10-digit number"]
  },
  
  password:{
    type:String,

  },

},
{
  timestamps:true,
}
)

export const User = mongoose.model("User", userSchema);

export default User;
