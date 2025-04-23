import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaBell, FaCaretDown, FaBoxOpen } from 'react-icons/fa';
import '../hahai.css';
import '../menu.css';

function UpdateCategory() {
    const [profileImage, setProfileImage] = useState(null);
    const [originalProfileImage, setOriginalProfileImage] = useState(null);
    const [adminUsername, setAdminUsername] = useState('');
    const [lastLoginTime, setLastLoginTime] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(0);
    const [category, setCategory] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [buttonColor, setButtonColor] = useState('#006AFF');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    const [feedback, setFeedbacks] = useState('');
    const [newfeedback, setNewFeedbacks] = useState('');
    const token = localStorage.getItem('authToken');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
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

    // ฟังก์ชันเพื่อดึงข้อมูล feedbacks
    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('https://hahai-admin-79ly.onrender.com/feedbacks', {
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
            const response = await axios.get('https://hahai-admin-79ly.onrender.com/admin', {
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
        if (!token) {
            setErrorMessage("ไม่พบ Token โปรดเข้าสู่ระบบใหม่");
            navigate('/');
            return;
        }

        const fetchCategoryById = async () => {
            try {
                const response = await axios.get(`https://hahai-admin-79ly.onrender.com/categories/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.data || response.data.message === "ไม่พบหมวดหมู่ที่ระบุ") {
                    setErrorMessage("ไม่พบข้อมูลหมวดหมู่");
                } else {
                    setCategory(response.data);
                }
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูล", error);
                setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryById();
    }, [id, token, navigate]);

    const handleSave = async () => {
        try {
            if (!token) {
                setErrorMessage('ไม่พบผู้ใช้โปรดเข้าสู่ระบบใหม่');
                navigate('/');
                return;
            }

            const response = await axios.put(
                `https://hahai-admin-79ly.onrender.com/categories/${id}`,
                category,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                setSuccessMessage('หมวดหมู่ถูกแก้ไขเรียบร้อยแล้ว');
                navigate("/category");
            }
        } catch (error) {
            console.error('ไม่สามารถแก้ไขหมวดหมู่ได้', error);
            setErrorMessage('ไม่สามารถแก้ไขหมวดหมู่ได้');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!category || !category.title) {
        return <p>ไม่พบข้อมูลหมวดหมู่</p>;
    }

    const handleClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="category">
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

            <div className={`wrapper ${isSidebarCollapsed ? 'full-screen' : ''}`}>
                <div className="breadcrumb-container">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to="/dashboard">แดชบอร์ด</Link>
                            </li>
                            <li className="breadcrumb-item">
                                <Link to="/category">จัดการหมวดหมู่</Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                แก้ไขข้อมูลหมวดหมู่
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''}`}>
                    <h1>แก้ไขข้อมูลหมวดหมู่</h1>
                    <div className="form-container">
                        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                        {successMessage && <div className="alert alert-success">{successMessage}</div>}

                        <div className="form-group">
                            <label style={{ fontSize: '14px' }}>ชื่อหมวดหมู่</label>
                            <input
                                type="text"
                                className="form-control"
                                value={category.title}
                                onChange={(e) => setCategory({ ...category, title: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '14px' }}>คำอธิบาย</label>
                            <textarea
                                className="form-control"
                                rows="5"
                                value={category.description}
                                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                            />
                        </div>

                        <button
                            className="btn btn-add-category"
                            style={{ backgroundColor: buttonColor }}
                            onMouseEnter={() => setButtonColor('#004c9d')}
                            onMouseLeave={() => setButtonColor('#006AFF')}
                            onClick={handleSave}
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>
            <div className="footer-content-fixed">
                <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
            </div>
        </div>


    );
}

export default UpdateCategory;
