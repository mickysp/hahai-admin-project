import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    blog: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog"
        }
    ],
    friend: [
        {
            userId: { 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            fromBlogId: { 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Blog',
            },
        },
    ],
    profileImage: {
        type: String,
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
    },
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Admin",
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended"],
        default: "active"
    },
    suspendedHistory: [
        {
          suspendedAt: {
            type: Date,
            default: Date.now,
          },
          reason: {
            type: String,
            default: "การละเมิดกฎ"
          },
        },
      ],
    loginCount: {
        type: Number,
        default: 0 // เก็บจำนวนครั้งที่ผู้ใช้เข้าสู่ระบบ
    },
    lastLogin: {
        type: Date, // เก็บเวลาล่าสุดที่เข้าสู่ระบบ
        default: null
    }
});

const User = mongoose.model("User", userSchema);

export default User;
