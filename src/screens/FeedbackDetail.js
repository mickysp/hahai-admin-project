import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaTrash, FaEye, FaBan, FaBell, FaUserCircle, FaCaretDown, FaBoxOpen } from 'react-icons/fa';
import axios from 'axios';

function FeedbackDetail() {
    const [profileImage, setProfileImage] = useState(null);
    const [originalProfileImage, setOriginalProfileImage] = useState(null);
    const [adminUsername, setAdminUsername] = useState('');
    const [lastLoginTime, setLastLoginTime] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [footerVisible, setFooterVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const { receive } = location.state; 
    console.log(receive);
    
    const handleScroll = () => {
        const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
        if (bottom) {
            setFooterVisible(true);
        } else {
            setFooterVisible(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
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

    const handleLogout = () => {
        console.log('Logout clicked');
        localStorage.removeItem('authToken');
        navigate('/');
    };

    const handleProfile = () => {
        console.log('Profile clicked');
        navigate('/admin');
    };

    useEffect(() => {
        if (location.state?.feedback) {
            setFeedback(location.state.feedback);
            setLoading(false);
        } else {
            alert("ไม่พบข้อมูล feedback");
            setLoading(false);
        }
    }, [location.state]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    if (loading) {
        return <div className="loading-container"><div className="loading-spinner"></div></div>;
    }

    const handleClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="feedback-detail">
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
                            <li className="breadcrumb-item">
                                <Link to="/feedback">จัดการรายการปัญหา</Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                รายละเอียด
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="content">
                    <h1>รายละเอียด</h1>
                    {feedback ? (
                        <div className="user-details-container">
                            <div className="user-details">
                                <div className="user-profile">
                                    {feedback?.feedback_image ? (
                                        <img
                                            src={feedback.feedback_image}
                                            alt="Feedback"
                                            className="profile-image"
                                        />
                                    ) : (
                                        <FaUserCircle size={280} style={{ width: '100%', height: '100%', borderRadius: '15px', border: '2px solid #ddd', color: '#888', backgroundColor: '#f4f4f4' }} />
                                    )}
                                </div>
                                <div className="user-info">
                                    <p><strong>ประเภท:</strong> {feedback.category}</p>
                                    <p><strong>ชื่อผู้ใช้:</strong> {feedback.user.firstname} {feedback.user.lastname}</p>
                                    <p><strong>รายละเอียด:</strong> {feedback.description}</p>
                                    <p><strong>วันที่แจ้งปัญหา:</strong> {formatDate(feedback.createdAt)}</p>
                                    <p><strong>สถานะ: </strong>
                                        {feedback.status === 'pending' && 'รอดำเนินการ'}
                                        {feedback.status === 'in_progress' && 'กำลังดำเนินการ'}
                                        {feedback.status === 'resolved' && 'แก้ไขแล้ว'}
                                        {feedback.status === 'closed' && 'ปิด'}
                                    </p>
                                </div>
                            </div>

                            {/* <div className="action-buttons-container">
                                <button
                                    className="action-button"
                                    onClick={() => alert("ยืนยันการลบฟีดแบ็ค")}
                                >
                                    ลบ
                                </button>
                            </div> */}
                        </div>
                    ) : (
                        <p>ไม่พบข้อมูล</p>
                    )}
                </div>
            </div>

            <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
                <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
            </div>
        </div>
    );
}

export default FeedbackDetail;
