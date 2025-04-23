import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import path from 'path';
import multer from 'multer';
import haversine from "haversine-distance";

import moment from 'moment';
import Admin from './models/admin.js';
import Category from './models/category.js';
import Feedback from './models/feedback.js';
import User from './models/user.js';
import Report from './models/report.js';
import Blog from './models/blog.js';
import Notification from './models/notification.js';
import Received from './models/received.js';

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = '1234';

    const existingAdmin = await Admin.findOne();
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const newAdmin = new Admin({
        username: ADMIN_USERNAME,
        password: hashedPassword,
      });
      await newAdmin.save();
      console.log('สร้างผู้ดูแลระบบเริ่มต้นแล้ว');
    } else {
      console.log('มีผู้ดูแลระบบอยู่แล้ว');
    }
  })
  .catch((err) => console.log('MongoDB Connection Error:', err));


const generateSecretKey = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

const verifyPassword = async (inputPassword, storedPassword) => {
  const isMatch = await bcrypt.compare(inputPassword, storedPassword);
  if (isMatch) {
    console.log('Password matches');
  } else {
    console.log('Incorrect password');
  }
};

const secretKey = generateSecretKey();
console.log('Generated JWT_SECRET_KEY:', secretKey);

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'ไม่พบ token' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// api สำหรับการล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
  }

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
  }

  const token = jwt.sign(
    { userId: admin._id, username: admin.username },
    secretKey,
    { expiresIn: '2h' }
  );

  admin.lastLoginTime = new Date();
  admin.isLoggedIn = true;
  await admin.save();

  res.json({ message: 'เข้าสู่ระบบสำเร็จ', token });
});

// api ออกจากระบบ
app.post('/logout', authenticateToken, async (req, res) => {
  const admin = await Admin.findById(req.user.userId);
  if (!admin) {
    return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
  }

  admin.isLoggedIn = false;
  await admin.save();

  res.json({ message: 'ออกจากระบบสำเร็จ' });
});

app.get('/admin', async (req, res) => {
  try {
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลแอดมิน' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/admin', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลแอดมิน' });
    }

    const usernameRegex = /^[A-Za-z]+$/;  // ให้รับเฉพาะตัวอักษร A-Z, a-z
    if (username && !usernameRegex.test(username)) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องเป็นตัวอักษรเท่านั้นและห้ามมีเว้นวรรค' });
    }

    // อัปเดตชื่อผู้ใช้หากมีการเปลี่ยนแปลง
    admin.username = username || admin.username;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่และตัวพิมพ์เล็กอย่างน้อย 1 ตัว' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      admin.password = hashedPassword;  // อัปเดตข้อมูลรหัสผ่าน
    }

    await admin.save();  // บันทึกการเปลี่ยนแปลง

    res.json({ message: 'ข้อมูลแอดมินถูกอัพเดตเรียบร้อย' });
  } catch (error) {
    console.error('Error updating admin info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/profile-image', async (req, res) => {
  const { profileImage } = req.body;

  if (!profileImage) {
    return res.status(400).json({ message: 'ไม่มีข้อมูลรูปภาพ' });
  }

  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลแอดมิน' });
    }

    admin.profileImage = profileImage;
    await admin.save();

    res.status(200).json({ message: 'บันทึกรูปภาพสำเร็จ' });
  } catch (error) {
    console.error('Error saving profile image:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก' });
  }
});

// api ดึงข้อมูลหมวดหมู่
app.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find().populate('admin', 'username');
    const totalCount = await Category.countDocuments();
    res.status(200).json({ categories, totalCount });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
});

// api สำหรับเพิ่มหมวดหมู่ 
app.post('/categories', authenticateToken, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const adminId = req.user.userId;

    const newCategory = new Category({
      title,
      description,
      admin: adminId,
    });

    await newCategory.save();
    res.status(201).json({ message: 'หมวดหมู่ถูกเพิ่มแล้ว' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' });
  }
});

// api สำหรับดึงหมวดหมู่ตาม id
app.get('/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id).populate('admin', 'username');
    if (!category) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ระบุ' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
});

// api สำหรับแก้ไขหมวดหมู่
app.put("/categories/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const category = await Category.findByIdAndUpdate(
      id,
      { title: title.trim(), description: description.trim() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข" });
    }

    res.status(200).json({
      message: "หมวดหมู่ถูกแก้ไขเรียบร้อยแล้ว",
      category,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่" });
  }
});

// api สำหรับลบหมวดหมู่
app.delete("/categories/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ต้องการลบ" });
    }

    res.status(200).json({
      message: "หมวดหมู่ถูกลบเรียบร้อยแล้ว",
      deletedCategory: {
        id: category._id,
        title: category.title,
        description: category.description,
      }
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบหมวดหมู่" });
  }
});

app.get('/feedbacks', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "username firstname lastname")
      .exec();
    const totalCount = await Feedback.countDocuments();

    res.status(200).json({ feedbacks, totalCount });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งปัญหา" });
  }
});

app.delete('/feedbacks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeedback = await Feedback.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Error deleting feedback" });
  }
});

app.put('/feedbacks/:feedbackId/status', async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.status(200).json({ message: 'Feedback status updated successfully', feedback });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ message: 'Error updating feedback status' });
  }
});

app.put('/feedback/:feedbackId/reply', async (req, res) => {
  const { feedbackId } = req.params;
  const { message } = req.body;  // The reply message from the admin

  try {
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.reply = message;
    await feedback.save();

    const notification = new Notification({
      description: message,
      user: feedback.user,
      feedback: feedbackId,
    });
    await notification.save();

    // Respond with a success message
    res.status(200).json({ message: 'Reply sent successfully', feedback });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/users', authenticateToken, async (req, res) => {
  try {
    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await User.find().select('username email firstname lastname profileImage createdAt isOnline accountStatus lastLogin blog suspendedHistory');
    const totalUsers = await User.countDocuments();

    // คำนวณผู้ใช้ที่ถูกระงับการใช้งาน (accountStatus = 'suspended')
    const suspendedUsers = await User.countDocuments({
      accountStatus: 'suspended'  // ตรวจสอบว่า accountStatus เป็น suspended
    });

    const usersWithPostCount = users.map(user => ({
      ...user.toObject(),
      postCount: user.blog.length,
      suspensionCount: user.suspendedHistory.length  // นับจำนวนการระงับในประวัติ
    }));

    // ส่งข้อมูลทั้งหมดกลับไป
    res.status(200).json({ users: usersWithPostCount, totalUsers, suspendedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.get('/ban-users', authenticateToken, async (req, res) => {
  try {
    const { timePeriod } = req.query; // ดึงค่า timePeriod จาก query parameter

    let filter = {};

    // กรองข้อมูลตามช่วงเวลา
    const currentDate = new Date();
    switch (timePeriod) {
      case 'วันนี้':
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
          },
        };
        break;
      case 'เมื่อวาน':
        const yesterday = new Date(currentDate.setDate(currentDate.getDate() - 1));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lt: new Date(yesterday.setHours(23, 59, 59, 999)),
          },
        };
        break;
      case '1สัปดาห์':
        const oneWeekAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: oneWeekAgo,
          },
        };
        break;
      case '2สัปดาห์':
        const twoWeeksAgo = new Date(currentDate.setDate(currentDate.getDate() - 14));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: twoWeeksAgo,
          },
        };
        break;
      case 'เดือนนี้':
        const startOfMonth = new Date(currentDate.setDate(1));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: startOfMonth,
          },
        };
        break;
      case 'เดือนที่แล้ว':
        const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        const startOfLastMonth = new Date(lastMonth.setDate(1));
        const endOfLastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() + 1)).setDate(0);
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: startOfLastMonth,
            $lt: new Date(endOfLastMonth),
          },
        };
        break;
      case 'ปีนี้':
        const startOfYear = new Date(currentDate.setMonth(0, 1));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: startOfYear,
          },
        };
        break;
      case 'ปีที่แล้ว':
        const lastYear = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
        const startOfLastYear = new Date(lastYear.setMonth(0, 1));
        const endOfLastYear = new Date(lastYear.setFullYear(lastYear.getFullYear() + 1, 0, 0));
        filter = {
          ...filter,
          'suspendedHistory.suspendedAt': {
            $gte: startOfLastYear,
            $lt: new Date(endOfLastYear),
          },
        };
        break;
      case 'ทั้งหมด':
      default:
        break;
    }

    // ค้นหาผู้ใช้ที่ถูกระงับ
    const suspendedUsers = await User.countDocuments({
      accountStatus: 'suspended',
      ...filter,
    });

    res.status(200).json({ suspendedUsers });
  } catch (error) {
    console.error('Error fetching suspended users:', error);
    res.status(500).json({ message: 'Error fetching suspended users' });
  }
});

app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});


// ลบสมาชิก
app.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'ลบผู้ใช้สำเร็จ' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
  }
});

// แก้ไขสมาชิก
app.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้' });
  }
});

// ระงับการใช้งานผู้ใช้
app.put('/users/suspend/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // รับค่า reason จาก body (สามารถเป็นค่า "การละเมิดกฎ" หากไม่มีการส่ง)

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ต้องการระงับ" });
    }

    // เปลี่ยนสถานะบัญชีเป็น "ระงับ"
    user.accountStatus = "suspended";

    // เพิ่มประวัติการระงับบัญชี
    user.suspendedHistory.push({
      suspendedAt: Date.now(),
      reason: reason || "การละเมิดกฎ",  // ใช้ค่า reason จาก body หรือใช้ค่าเริ่มต้น
    });

    await user.save();  // บันทึกข้อมูล

    res.status(200).json({
      message: "ผู้ใช้ถูกระงับการใช้งานเรียบร้อย",
      user,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการระงับผู้ใช้", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการระงับผู้ใช้", error: error.message });
  }
});

// ปลดล็อคการระงับ
app.put('/users/unsuspend/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.accountStatus === "active") {
      return res.status(400).json({ message: "User is already active" });
    }

    // ปลดล็อคการระงับ
    user.accountStatus = "active";
    await user.save();

    res.status(200).json({ message: "User unsuspended successfully", user });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    res.status(500).json({ message: "Error unsuspending user" });
  }
});

app.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('category', 'title description')
      .populate('user', 'username firstname lastname profileImage')
      .populate('blog', 'obj_picture object_subtype color location note date createdAt received')
      .populate('blogOwner', 'username firstname lastname profileImage');

    const totalReports = await Report.countDocuments();

    res.status(200).json({ reports, totalReports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error fetching reports" });
  }
});

//แสดงการรับสิ่งของ
app.get('/received', authenticateToken, async (req, res) => {
  try {
    const received = await Received.find()
      .populate('user', 'username firstname lastname profileImage')
      .populate('blog', 'obj_picture object_subtype color location note date createdAt receivedStatus')
      .exec();

    const totalReceived = await Received.countDocuments();

    res.status(200).json({ received, totalReceived });
  } catch (error) {
    console.error("Error fetching received:", error);
    res.status(500).json({ message: "Error fetching received" });
  }
});

// app.get('/received', authenticateToken, async (req, res) => {
//   try {
//       const received = await Receive.find()
//           .populate('userReceive', 'username firstname lastname profileImage')
//           .populate('blog', 'obj_picture object_subtype color location note date createdAt receivedStatus') 
//           .populate('user', 'username firstname lastname profileImage');

//       const totalReceived = await Receive.countDocuments();

//       res.status(200).json({ received, totalReceived });
//   } catch (error) {
//       console.error("Error fetching received:", error);
//       res.status(500).json({ message: "Error fetching received" });
//   }
// });

app.delete("/reports/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ message: "ไม่พบรายงานที่ต้องการลบ" });
    }

    res.status(200).json({
      message: "รายงานถูกลบเรียบร้อยแล้ว",
      deletedReport: {
        id: report._id,
        category: report.category,
        user: report.user,
        blog: report.blog,
        blogOwner: report.blogOwner,
        createdAt: report.createdAt,
      }
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบรายงาน" });
  }
});

// app.get("/blogs", async (req, res) => {
//   try {
//     // ดึงข้อมูลกระทู้ทั้งหมดพร้อมจำนวน
//     const blogs = await Blog.find().populate("user", "username firstname lastname profileImage");
//     const totalBlogs = await Blog.countDocuments();

//     res.status(200).json({ blogs, totalBlogs });
//   } catch (error) {
//     console.log("เกิดข้อผิดพลาดในการแสดงกระทู้", error);
//     res.status(500).json({ message: "เกิดข้อผิดพลาดในการแสดงกระทู้" });
//   }
// });


app.get("/blogs", async (req, res) => {
  try {
    const timePeriod = req.query.timePeriod || 'ทั้งหมด'; // ค่า default เป็น 'ทั้งหมด'
    const today = new Date();

    // ฟังก์ชันช่วยในการกรองข้อมูลตามช่วงเวลา
    const getDateFilter = (timePeriod) => {
      let startDate = null;
      let endDate = null;

      if (timePeriod === 'วันนี้') {
        startDate = new Date(today.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของวันนี้
        endDate = new Date(today.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของวันนี้
      } else if (timePeriod === 'เมื่อวาน') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของเมื่อวาน
        endDate = new Date(yesterday.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของเมื่อวาน
      } else if (timePeriod === '1สัปดาห์') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7); // 7 วันก่อน
        endDate = new Date();
      } else if (timePeriod === '2สัปดาห์') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14); // 14 วันก่อน
        endDate = new Date();
      } else if (timePeriod === 'เดือนนี้') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (timePeriod === 'ปีนี้') {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (timePeriod === 'เดือนที่แล้ว') {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = new Date(firstDayOfLastMonth.setHours(0, 0, 0, 0)); // เริ่มต้นเดือนที่แล้ว
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate = new Date(lastDayOfLastMonth.setHours(23, 59, 59, 999)); // สิ้นสุดเดือนที่แล้ว
      } else if (timePeriod === 'ปีที่แล้ว') {
        startDate = new Date(today.getFullYear() - 1, 0, 1); // ปีที่แล้ว
        endDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else {
        // 'ทั้งหมด' ไม่กรองตามวันที่
        return {};
      }

      return { createdAt: { $gte: startDate, $lte: endDate } };  // เปลี่ยนจาก `date` เป็น `createdAt`
    };

    const dateFilter = getDateFilter(timePeriod);

    // ดึงข้อมูล blogs ตามการกรองช่วงเวลา
    const blogs = await Blog.find({ ...dateFilter })
      .populate("user", "username firstname lastname profileImage") // populate ข้อมูลของ user
      .lean();  // .lean() เพื่อให้ข้อมูลเป็น plain objects

    const totalBlogs = await Blog.countDocuments(dateFilter); // นับจำนวน blog ที่กรองตามช่วงเวลา

    res.status(200).json({ blogs, totalBlogs });
  } catch (error) {
    console.log("เกิดข้อผิดพลาดในการแสดงกระทู้", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแสดงกระทู้" });
  }
});


// app.get("/blogs/top-object-subtypes", async (req, res) => {
//   try {
//     const blogs = await Blog.find();

//     const subtypeCounts = {};

//     blogs.forEach(blog => {
//       const subtype = blog.object_subtype;
//       if (subtype) {
//         subtypeCounts[subtype] = (subtypeCounts[subtype] || 0) + 1;
//       }
//     });

//     const totalReports = Object.values(subtypeCounts).reduce((sum, count) => sum + count, 0);

//     // Convert object to array, sort, and calculate percentage
//     const sortedSubtypes = Object.entries(subtypeCounts)
//       .map(([type, count]) => ({
//         type,
//         count,
//         percentage: ((count / totalReports) * 100).toFixed(2), // Calculate percentage
//       }))
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 5); // Select top 5

//     res.status(200).json(sortedSubtypes);
//   } catch (error) {
//     console.error("Error calculating top subtypes:", error);
//     res.status(500).json({ message: "Error calculating top subtypes" });
//   }
// });

app.get("/blogs/top-object-subtypes", async (req, res) => {
  try {
    const { period } = req.query;
    let startDate, endDate;
    const now = new Date();

    // Set date range based on the selected period
    if (period === "วันนี้") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "เมื่อวาน") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "1สัปดาห์") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = now;
    } else if (period === "2สัปดาห์") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      endDate = now;
    } else if (period === "เดือนนี้") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
    } else if (period === "เดือนที่แล้ว") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "ปีนี้") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
    } else if (period === "ปีที่แล้ว") {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear(), 0, 1); // ข้อมูลต้องมาก่อนปีนี้
    }

    console.log("Filtering period:", period);
    console.log("Start Date for filter:", startDate);
    console.log("End Date for filter:", endDate);

    let query = {};
    if (startDate && endDate) {
      query = { createdAt: { $gte: startDate, $lt: endDate } };
    } else if (startDate) {
      query = { createdAt: { $gte: startDate } };
    }

    const blogs = await Blog.find(query);
    console.log("Total blogs found:", blogs.length);

    if (blogs.length === 0) {
      return res.status(200).json({ topSubtypes: [] });
    }

    const subtypeCounts = {};
    const receivedCounts = {};

    blogs.forEach(blog => {
      const subtype = blog.object_subtype;
      if (subtype) {
        subtypeCounts[subtype] = (subtypeCounts[subtype] || 0) + 1;
        if (blog.receivedStatus) {
          receivedCounts[subtype] = (receivedCounts[subtype] || 0) + 1;
        }
      }
    });

    const totalReports = Object.values(subtypeCounts).reduce((sum, count) => sum + count, 0);
    console.log("Total reported subtypes:", totalReports);

    const sortedSubtypes = Object.entries(subtypeCounts)
      .map(([type, count]) => {
        const receivedCount = receivedCounts[type] || 0;

        // คำนวณจำนวนทั้งหมดที่ถูกรับไปแล้ว
        const totalReceived = Object.values(receivedCounts).reduce((sum, received) => sum + received, 0);

        // คำนวณเปอร์เซ็นต์ของการถูกรับแต่ละประเภท
        const receivedPercentage = totalReceived > 0 ? ((receivedCount / totalReceived) * 100).toFixed(2) : 0;

        return {
          type,
          count,
          receivedCount,
          totalPercentage: totalReports > 0 ? ((count / totalReports) * 100).toFixed(2) : 0,
          foundPercentage: totalReports > 0 ? ((receivedCount / count) * 100).toFixed(2) : 0,
          receivedPercentage, // เพิ่มเปอร์เซ็นต์ที่คำนวณได้
        };
      })
      .sort((a, b) => b.count - a.count)



    console.log("Top subtypes:", sortedSubtypes);

    res.status(200).json({ topSubtypes: sortedSubtypes });
  } catch (error) {
    console.error("Error calculating top subtypes:", error);
    res.status(500).json({ message: "Error calculating top subtypes" });
  }
});



//ชนิดปกติ
// app.get("/blogs/top-object-location", async (req, res) => {
//   try {
//     const timePeriod = req.query.timePeriod || 'ทั้งหมด'; // ค่า default เป็น 'ทั้งหมด'
//     const today = new Date();

//     // ฟังก์ชันช่วยในการกรองข้อมูลตามช่วงเวลา
//     const getDateFilter = (timePeriod) => {
//       let startDate = null;
//       let endDate = null;

//       if (timePeriod === 'วันนี้') {
//         startDate = new Date(today.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของวันนี้
//         endDate = new Date(today.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของวันนี้
//       } else if (timePeriod === 'เมื่อวาน') {
//         const yesterday = new Date(today);
//         yesterday.setDate(today.getDate() - 1);
//         startDate = new Date(yesterday.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของเมื่อวาน
//         endDate = new Date(yesterday.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของเมื่อวาน
//       } else if (timePeriod === '1สัปดาห์') {
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 7); // 7 วันก่อน
//         endDate = new Date();
//       } else if (timePeriod === '2สัปดาห์') {
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 14); // 14 วันก่อน
//         endDate = new Date();
//       } else if (timePeriod === 'เดือนนี้') {
//         startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
//       } else if (timePeriod === 'ปีนี้') {
//         startDate = new Date(today.getFullYear(), 0, 1);
//         endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
//       } else if (timePeriod === 'เดือนที่แล้ว') {
//         const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//         startDate = new Date(firstDayOfLastMonth.setHours(0, 0, 0, 0)); // เริ่มต้นเดือนที่แล้ว
//         const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
//         endDate = new Date(lastDayOfLastMonth.setHours(23, 59, 59, 999)); // สิ้นสุดเดือนที่แล้ว
//       } else if (timePeriod === 'ปีที่แล้ว') {
//         startDate = new Date(today.getFullYear() - 1, 0, 1); // ปีที่แล้ว
//         endDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
//       } else {
//         // 'ทั้งหมด' ไม่กรองตามวันที่
//         return {};
//       }

//       return { createdAt: { $gte: startDate, $lte: endDate } };  // เปลี่ยนจาก `date` เป็น `createdAt`
//     };

//     const dateFilter = getDateFilter(timePeriod);

//     // ดึงข้อมูล blogs ตามการกรองช่วงเวลา
//     const blogs = await Blog.find({ locationname: { $ne: null }, ...dateFilter })
//       .populate("user", "username") // populate เฉพาะ `username`
//       .lean();  // .lean() เพื่อให้ข้อมูลเป็น plain objects
//     console.log(blogs);  // ดูว่ามี `username` หรือไม่ในแต่ละ `blog`

//     if (blogs.length === 0) {
//       return res.status(200).json({ topLocations: [] });
//     }

//     const locationGroups = {};

//     blogs.forEach(blog => {
//       const { locationname, location, latitude, longitude, obj_picture, object_subtype, color, note, date, createdAt, user } = blog;

//       if (!locationGroups[locationname]) {
//         locationGroups[locationname] = {
//           locationname,
//           location,
//           latitude,
//           longitude,
//           count: 0,
//           obj_picture,
//           object_subtype,
//           color,
//           note,
//           date,
//           createdAt,  // ใช้ `createdAt` แทน `date`
//           user: user ? { _id: user._id, username: user.username } : null
//         };
//       }

//       locationGroups[locationname].count += 1;
//     });

//     const totalBlogsWithLocation = blogs.length;

//     const topLocations = Object.values(locationGroups)
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 5)
//       .map(location => ({
//         ...location,
//         percentage: ((location.count / totalBlogsWithLocation) * 100).toFixed(2)
//       }));

//     res.status(200).json({ topLocations });
//   } catch (error) {
//     console.error("Error calculating top locations:", error);
//     res.status(500).json({ message: "Error calculating top locations" });
//   }
// });


app.get("/blogs/top-object-location", async (req, res) => {
  try {
    const timePeriod = req.query.timePeriod || 'ทั้งหมด'; // ค่า default เป็น 'ทั้งหมด'
    const today = new Date();

    // ฟังก์ชันช่วยในการกรองข้อมูลตามช่วงเวลา
    const getDateFilter = (timePeriod) => {
      let startDate = null;
      let endDate = null;

      if (timePeriod === 'วันนี้') {
        startDate = new Date(today.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของวันนี้
        endDate = new Date(today.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของวันนี้
      } else if (timePeriod === 'เมื่อวาน') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของเมื่อวาน
        endDate = new Date(yesterday.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของเมื่อวาน
      } else if (timePeriod === '1สัปดาห์') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7); // 7 วันก่อน
        endDate = new Date();
      } else if (timePeriod === '2สัปดาห์') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14); // 14 วันก่อน
        endDate = new Date();
      } else if (timePeriod === 'เดือนนี้') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (timePeriod === 'ปีนี้') {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (timePeriod === 'เดือนที่แล้ว') {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = new Date(firstDayOfLastMonth.setHours(0, 0, 0, 0)); // เริ่มต้นเดือนที่แล้ว
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate = new Date(lastDayOfLastMonth.setHours(23, 59, 59, 999)); // สิ้นสุดเดือนที่แล้ว
      } else if (timePeriod === 'ปีที่แล้ว') {
        startDate = new Date(today.getFullYear() - 1, 0, 1); // ปีที่แล้ว
        endDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else {
        // 'ทั้งหมด' ไม่กรองตามวันที่
        return {};
      }

      return { createdAt: { $gte: startDate, $lte: endDate } };  // เปลี่ยนจาก `date` เป็น `createdAt`
    };

    const dateFilter = getDateFilter(timePeriod);

    // ดึงข้อมูล blogs ตามการกรองช่วงเวลา
    const blogs = await Blog.find({ locationname: { $ne: null }, ...dateFilter })
      .populate("user", "username") // populate เฉพาะ `username`
      .lean();  // .lean() เพื่อให้ข้อมูลเป็น plain objects
    console.log(blogs);  // ดูว่ามี `username` หรือไม่ในแต่ละ `blog`

    if (blogs.length === 0) {
      return res.status(200).json({ topLocations: [] });
    }

    const locationGroups = {};

    blogs.forEach(blog => {
      const { locationname, location, latitude, longitude, obj_picture, object_subtype, color, note, date, createdAt, user } = blog;

      if (!locationGroups[locationname]) {
        locationGroups[locationname] = {
          locationname,
          location,
          latitude,
          longitude,
          count: 0,
          obj_picture,
          object_subtype,
          color,
          note,
          date,
          createdAt,  // ใช้ `createdAt` แทน `date`
          user: user ? { _id: user._id, username: user.username } : null
        };
      }

      locationGroups[locationname].count += 1;
    });

    const totalBlogsWithLocation = blogs.length;

    const topLocations = Object.values(locationGroups)
      .sort((a, b) => b.count - a.count)
      .map(location => ({
        ...location,
        percentage: ((location.count / totalBlogsWithLocation) * 100).toFixed(2)
      }));

    res.status(200).json({ topLocations });
  } catch (error) {
    console.error("Error calculating top locations:", error);
    res.status(500).json({ message: "Error calculating top locations" });
  }
});

app.get("/blogs/by-location/:locationname", async (req, res) => {
  try {
    const locationname = decodeURIComponent(req.params.locationname);
    const blogs = await Blog.find({ locationname })
      .populate("user", "username") // ✅ ดึง username มาด้วย
      .lean(); // ✅ แปลงเป็น plain object ให้ React ใช้ง่ายขึ้น

    console.log("Fetched Blogs:", blogs); // ✅ เช็คข้อมูลที่ถูก populate แล้ว
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
});


app.get('/blogs/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId).populate('user', 'username'); // ดึง username มาด้วย

    if (!blog) {
      return res.status(404).json({ message: 'ไม่พบกระทู้ที่ต้องการ' });
    }

    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกระทู้' });
  }
});


// app.get("/blogs/top-object-location", async (req, res) => {
//   try {
//     const timePeriod = req.query.timePeriod || 'ทั้งหมด'; // ค่า default เป็น 'ทั้งหมด'
//     const today = new Date();

//     // ฟังก์ชันช่วยในการกรองข้อมูลตามช่วงเวลา
//     const getDateFilter = (timePeriod) => {
//       let startDate = null;
//       let endDate = null;

//       if (timePeriod === 'วันนี้') {
//         startDate = new Date(today.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของวันนี้
//         endDate = new Date(today.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของวันนี้
//       } else if (timePeriod === 'เมื่อวาน') {
//         const yesterday = new Date(today);
//         yesterday.setDate(today.getDate() - 1);
//         startDate = new Date(yesterday.setHours(0, 0, 0, 0)); // เริ่มจากเที่ยงคืนของเมื่อวาน
//         endDate = new Date(yesterday.setHours(23, 59, 59, 999)); // สิ้นสุดที่ 23:59:59 ของเมื่อวาน
//       } else if (timePeriod === '1สัปดาห์') {
//         startDate = new Date(today.setDate(today.getDate() - 7)); // 7 วันก่อน
//         endDate = new Date();
//       } else if (timePeriod === '2สัปดาห์') {
//         startDate = new Date(today.setDate(today.getDate() - 14)); // 14 วันก่อน
//         endDate = new Date();
//       } else if (timePeriod === 'เดือนที่แล้ว') {
//         const firstDayOfLastMonth = new Date(today.setMonth(today.getMonth() - 1));
//         firstDayOfLastMonth.setDate(1);
//         startDate = new Date(firstDayOfLastMonth.setHours(0, 0, 0, 0)); // เริ่มต้นเดือนที่แล้ว
//         const lastDayOfLastMonth = new Date(today.setMonth(today.getMonth()));
//         lastDayOfLastMonth.setDate(0);
//         endDate = new Date(lastDayOfLastMonth.setHours(23, 59, 59, 999)); // สิ้นสุดเดือนที่แล้ว
//       } else if (timePeriod === 'ปีที่แล้ว') {
//         startDate = new Date(today.setFullYear(today.getFullYear() - 1)); // ปีที่แล้ว
//         endDate = new Date(today.setFullYear(today.getFullYear()));
//       } else if (timePeriod === 'กำหนดเอง') {
//         const { start, end } = req.query; // ex: start=2024-01-01, end=2024-02-01
//         startDate = new Date(start);
//         endDate = new Date(end);
//       } else {
//         return {};
//       }

//       return { date: { $gte: startDate, $lte: endDate } };
//     };

//     const dateFilter = getDateFilter(timePeriod);

//     // ดึงข้อมูล blogs ตามการกรองช่วงเวลา
//     const blogs = await Blog.find({
//       locationname: { $ne: null },
//       ...dateFilter
//     }).populate("user", "username"); // ดึงเฉพาะ username ของ user

//     if (blogs.length === 0) {
//       return res.status(200).json({ topLocations: [] });
//     }

//     const locationGroups = {};

//     blogs.forEach(blog => {
//       const { locationname, location, latitude, longitude, obj_picture, object_subtype, color, note, date, user } = blog;

//       if (!locationGroups[locationname]) {
//         locationGroups[locationname] = {
//           locationname,
//           location,
//           latitude,
//           longitude,
//           count: 0,
//           obj_picture,
//           object_subtype,
//           color,
//           note,
//           date,
//           user: user ? { _id: user._id, username: user.username } : null
//         };
//       }

//       locationGroups[locationname].count += 1;
//     });

//     const totalBlogsWithLocation = blogs.length;

//     // แปลง object เป็น array และ sort โดยไม่จำกัดจำนวน
//     const topLocations = Object.values(locationGroups)
//       .sort((a, b) => b.count - a.count) // จัดเรียงตามจำนวนที่มากที่สุด
//       .map(location => ({
//         ...location,
//         percentage: ((location.count / totalBlogsWithLocation) * 100).toFixed(2)
//       }));

//     res.status(200).json({ topLocations });
//   } catch (error) {
//     console.error("Error calculating top locations:", error);
//     res.status(500).json({ message: "Error calculating top locations" });
//   }
// });



// app.get('/thread-counts', async (req, res) => {
//   try {
//     // นับจำนวนกระทู้ที่มีสถานะ received เป็น true
//     const receivedCount = await Blog.countDocuments({ received: true });
//     // นับจำนวนกระทู้ที่มีสถานะ received เป็น false
//     const notReceivedCount = await Blog.countDocuments({ received: false });
//     // ส่งข้อมูลจำนวนที่นับได้
//     res.json({ receivedCount, notReceivedCount });
//   } catch (error) {
//     // หากเกิดข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล
//     res.status(500).json({ error: "Error fetching counts" });
//   }
// });

app.get('/thread-counts', async (req, res) => {
  try {
    const { period, sortBy } = req.query; // รับค่า period และ sortBy จาก query params

    let startDate, endDate;
    const now = new Date();

    // กำหนด startDate และ endDate ตามช่วงเวลา
    if (period === "วันนี้") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "เมื่อวาน") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "1สัปดาห์") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (period === "2สัปดาห์") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (period === "เดือนนี้") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
    } else if (period === "เดือนที่แล้ว") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "ปีนี้") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date();
    } else if (period === "ปีที่แล้ว") {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear(), 0, 1);
    }

    let query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lt: endDate }; // 🔹 ใช้ช่วงเวลาที่ชัดเจน
    }

    // นับจำนวนกระทู้ทั้งหมด
    const totalThreads = await Blog.countDocuments(query);

    // นับจำนวนกระทู้ที่ถูกแจ้งรับแล้ว
    const receivedCount = await Blog.countDocuments({ ...query, receivedStatus: true });

    // คำนวณจำนวนกระทู้ที่ยังไม่ได้รับ
    const notReceivedCount = totalThreads - receivedCount;

    let sortedData = [
      { label: "Received", count: receivedCount },
      { label: "Not Received", count: notReceivedCount }
    ];

    // เรียงลำดับตามที่เลือก
    if (sortBy === "received") {
      sortedData.sort((a, b) => b.count - a.count);
    } else if (sortBy === "notReceived") {
      sortedData.sort((a, b) => a.count - b.count);
    }

    res.json({ receivedCount, notReceivedCount, sortedData });
  } catch (error) {
    res.status(500).json({ error: "Error fetching counts" });
  }
});




app.get('/blogs/by-location/:locationname', async (req, res) => {
  try {
    const locationname = decodeURIComponent(req.params.locationname); // ถอดรหัสชื่อสถานที่จาก URL
    const blogs = await Blog.find({ locationname }); // ค้นหาโพสต์ที่ตรงกับ locationname

    if (!blogs.length) {
      return res.status(404).json({ message: 'ไม่พบโพสต์ในตำแหน่งนี้' });
    }

    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs by location:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
