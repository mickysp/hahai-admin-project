import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    obj_picture: {
        type: String,
        required: true,
    },
    object_subtype: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    locationname: {
        type: String,
        required: true,
    },
    latitude:
    {
        type: Number,
        required: true
    }, // เพิ่ม
    longitude:
    {
        type: Number,
        required: true
    }, // เพิ่ม
    note: {
        type: String,
    },
    date: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receivedStatus: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Blog = mongoose.model("Blog", blogSchema);

export default Blog