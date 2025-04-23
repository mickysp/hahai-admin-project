import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaBell, FaCamera, FaCaretDown, FaBoxOpen } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';
import axios from 'axios';

function Dashboard() {
  const [adminUsername, setAdminUsername] = useState('');
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const profilePictureContainerRef = useRef(null);
  const formContainerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [footerVisible, setFooterVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const [feedback, setFeedbacks] = useState('');
  const [newfeedback, setNewFeedbacks] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    const adjustHeight = () => {
      if (formContainerRef.current && profilePictureContainerRef.current) {
        profilePictureContainerRef.current.style.height = `${formContainerRef.current.offsetHeight}px`;
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, []);

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleOldPasswordVisibility = () => {
    setShowOldPassword(!showOldPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  // Scroll event handler
  const handleScroll = () => {
    const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
    if (bottom) {
      setFooterVisible(true);
    } else {
      setFooterVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log('Logout clicked');
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleProfile = () => {
    console.log('Profile clicked');
    navigate('/admin');
  };

  // ฟังก์ชันเพื่อดึงข้อมูล feedbacks
  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('https://localhost:5001/feedbacks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFeedbacks(response.data.feedbacks);

      // นับจำนวนการแจ้งเตือนจาก feedback ที่ยังไม่ได้รับการตอบกลับ
      const unreadNotifications = response.data.feedbacks.filter(fb => !fb.reply).length;
      setNotifications(unreadNotifications);  // ตั้งค่าจำนวนแจ้งเตือน
      localStorage.setItem('notifications', unreadNotifications);  // บันทึกใน localStorage

      // เก็บ feedback ที่ใหม่เข้ามาเพื่อแสดงใน dropdown
      const newFeedbacksList = response.data.feedbacks.filter(fb => !fb.reply);
      setNewFeedbacks(newFeedbacksList);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedbacks', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(Number(storedNotifications));  // ดึงค่าจำนวนแจ้งเตือนจาก localStorage
    }
    fetchFeedbacks();
  }, []);

  const handleNotifications = () => {
    setShowDropdown(!showDropdown);  // เปิดหรือปิด dropdown ของแจ้งเตือน
    if (notifications > 0) {
      setNotifications(0);  // รีเซ็ตจำนวนแจ้งเตือนเมื่อคลิก
      localStorage.setItem('notifications', 0);  // บันทึกการรีเซ็ตใน localStorage
    }
  };

  const fetchAdminInfo = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setErrorMessage('ไม่พบผู้ใช้ โปรดเข้าสู่ระบบใหม่');
      return;
    }

    try {
      const response = await axios.get('https://localhost:5001/admin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdminUsername(response.data.username);
      setLastLoginTime(response.data.lastLoginTime);
      setIsLoggedIn(response.data.isLoggedIn);
      setCreatedAt(response.data.createdAt);
      setProfileImage(response.data.profileImage);
      setOriginalProfileImage(response.data.profileImage);
      setLoading(false);
    } catch (error) {
      setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูลแอดมิน');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([uintArray], { type: mimeString });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setPasswordError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('รหัสผ่านต้องมีตัวพิมพ์ใหญ่และตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setPasswordError('');

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('username', adminUsername);
      formData.append('password', newPassword);
      if (profileImage) {
        const imageBlob = dataURLtoBlob(profileImage);
        formData.append('profileImage', imageBlob);
      }

      await axios.put('https://hahai-admin-79ly.onrender.com/admin', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage('ข้อมูลของคุณได้รับการอัปเดตเรียบร้อยแล้ว!');
      setTimeout(() => setSuccessMessage(''), 15000);

      window.location.reload();
    } catch (error) {
      setErrorMessage('ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  const handleClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="admin">
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="top-bar">
          <div className="hamburger-menu"
            onClick={toggleSidebar}
            style={{ color: isSidebarCollapsed ? '#fff' : '#000' }}>
            ☰
          </div>
          <div className="logohahai text-center mb-4 ">
            <img
              className="imglogo"
              src="https://i.imgur.com/hcl6qVY.png"
              alt="เมนู"
              style={{ maxWidth: '80%', height: 'auto', cursor: 'pointer' }}
              onClick={handleClick}
            />
          </div>
        </div>
        <ul className="list-unstyled">
          <li className="menu-item">
            <Link to="/dashboard" className="menu-link">
              <FaHome size={20} />
              <h5>แดชบอร์ด</h5>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/member" className="menu-link">
              <FaUsers size={20} />
              <h5>จัดการสมาชิก</h5>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/report" className="menu-link">
              <FaFlag size={20} />
              <h5>จัดการกระทู้ไม่พึงประสงค์</h5>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/category" className="menu-link">
              <FaTag size={20} />
              <h5>จัดการหมวดหมู่</h5>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/feedback" className="menu-link">
              <FaComments size={20} />
              <h5>จัดการรายการปัญหา
                {notifications > 0 && (
                  <span className="notification-badge">{notifications}</span> // แสดงจำนวนการแจ้งเตือน
                )}</h5>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/receive" className="menu-link">
              <FaBoxOpen size={20} />
              <h5>รับสิ่งของ</h5>

            </Link>
          </li>
        </ul>
      </div>

      <div className="top-menu">
        <div className="hamburger-menu"
          onClick={toggleSidebar}
          style={{ color: isSidebarCollapsed ? '#fff' : '#000' }}>
          ☰
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', marginLeft: 'auto' }}>
          {/* <div className="notification-icon" onClick={handleNotifications}>
                <FaBell size={25} />
                {notifications > 0 && <span className="notification-badge">{notifications}</span>}
              </div> */}
          <div className="profile-icon" onClick={handleDropdownToggle}>
            {isLoading ? (
              <p>กำลังโหลด...</p>
            ) : profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <FaUserCircle size={30} />
            )}
            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#006AFF' }}>
              {adminUsername}
              <FaCaretDown size={12} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
            </span>
          </div>
          <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
            <div className="dropdown-item" onClick={handleProfile}>จัดการโปรไฟล์</div>
            <div className="dropdown-item" onClick={handleLogout}>ออกจากระบบ</div>
          </div>
        </div>
      </div>

      <div className="wrapper">
        <div className="breadcrumb-container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/dashboard">แดชบอร์ด</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                จัดการโปรไฟล์
              </li>
            </ol>
          </nav>
        </div>

        <div className="content">
          {successMessage && (
            <div className="alert alert-success" role="alert" style={{ marginTop: '20px' }}>
              {successMessage}
            </div>
          )}
          <h1>จัดการโปรไฟล์</h1>
          <div className="profile-card">
            <div className="row">
              <div className="col-md-4">
                <div
                  ref={profilePictureContainerRef}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '350px',
                    backgroundColor: profileImage ? 'transparent' : '#f9f9f9',
                    borderRadius: '10px',
                    padding: '20px',
                    cursor: 'pointer',
                    border: profileImage ? 'none' : '2px solid #ccc',
                    width: '100%', // Make it responsive to the container
                  }}
                  className="profile-picture-container"
                  onClick={() => document.getElementById('profileImageInput').click()}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="img-fluid rounded-circle"
                    />
                  ) : (
                    <FaCamera size={40} color="#888" />
                  )}

                  <input
                    type="file"
                    id="profileImageInput"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {profileImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents the click event on the div from triggering
                        document.getElementById('profileImageInput').click();
                      }}
                      className="change-image-button" // Apply the CSS class here
                    >
                      เปลี่ยนรูปภาพ
                    </button>

                  )}
                </div>

              </div>

              <div className="col-md-8" style={{ position: 'relative' }}>
                <form>
                  <div className="form-group">
                    <label htmlFor="name" style={{ fontSize: 14 }}>ชื่อผู้ใช้</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      placeholder="ชื่อผู้ใช้"
                      value={adminUsername}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" style={{ fontSize: 14 }}>
                      รหัสผ่านเดิม
                    </label>
                    <div className="input-admin">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        placeholder="กรอกรหัสผ่านเดิม"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={toggleOldPasswordVisibility}
                      >
                        <i className={`fa ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" style={{ fontSize: 14 }}>
                      รหัสผ่านใหม่
                    </label>
                    <div className="input-admin">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control"
                        id="newPassword"
                        placeholder="กรอกรหัสผ่านใหม่"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={toggleNewPasswordVisibility}
                      >
                        <i className={`fa ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" style={{ fontSize: 14 }}>
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="input-admin" style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        id="confirmPassword"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>

                  {passwordError && <div className="text-danger">{passwordError}</div>}
                </form>
              </div>
            </div>
            <div className="form-group save-button-wrapper">
              <button className="save-button" onClick={handleSubmit}>
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
        <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
      </div>
    </div>
  );
}

export default Dashboard;
