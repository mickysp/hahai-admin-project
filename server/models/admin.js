import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String, 
        default: null,
    },
    lastLoginTime: { 
        type: Date, 
        default: null 
    }, 
    isLoggedIn: { 
        type: Boolean, 
        default: false 
    }, 
    createdAt: {
        type: Date,
        default: Date.now,  
    },
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin
