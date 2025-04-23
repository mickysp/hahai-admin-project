import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaTrash, FaChevronLeft, FaChevronRight, FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaEye, FaBoxOpen, FaBell, FaCaretDown } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';

function ReportDetail() {
    const [profileImage, setProfileImage] = useState(null);
    const [originalProfileImage, setOriginalProfileImage] = useState(null);
    const [adminUsername, setAdminUsername] = useState('');
    const [lastLoginTime, setLastLoginTime] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const location = useLocation();
    const { report } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [reports, setReports] = useState([]);
    const [footerVisible, setFooterVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedbacks] = useState('');
    const [newfeedback, setNewFeedbacks] = useState('');
    const token = localStorage.getItem('authToken');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
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
        if (!report) {
            setLoading(false);
            setErrorMessage('ไม่พบข้อมูลรายงาน');
        } else {
            console.log("Blog Owner ID:", report.blogOwner?._id);
            console.log("สถานะการรับสิ่งของ:", report.blog?.received);
            setLoading(false);
        }
    }, [report]);


    const handleProfile = () => {
        navigate('/admin');
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/');
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

    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
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

    useEffect(() => {
        if (!report) {
            setLoading(false);
            setErrorMessage('ไม่พบข้อมูลรายงาน');
        } else {
            setLoading(false);
        }
    }, [report]);

    const formatThaiDate = (dateString) => {
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

    const handleDeleteReport = async (id) => {
        const confirmDelete = window.confirm("คุณต้องการลบรายงานนี้จริงหรือไม่?");

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await axios.delete(`https://localhost:5001/reports/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure `token` is defined and valid
                },
            });

            if (response.status === 200) {
                setReports(reports.filter((report) => report._id !== id));
                alert("รายงานถูกลบเรียบร้อยแล้ว");
                navigate('/reports');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert("เกิดข้อผิดพลาดในการลบรายงาน");
        }
    };

    const handleNavigateToMemberDetail = (user) => {
        if (user && user._id) {
            console.log("Navigating to member detail with user:", user);  // Debugging output
            navigate(`/memberdetail/${user._id}`, { state: { user } });  // ส่งข้อมูลไปยังหน้า memberdetail
        } else {
            alert("ไม่พบข้อมูลผู้ใช้");
        }
    };

    useEffect(() => {
        if (!report) {
            setLoading(false);
            setErrorMessage('ไม่พบข้อมูลรายงาน');
        } else {
            console.log("Blog Owner ID:", report.blogOwner?._id);
            setLoading(false);
        }
    }, [report]);


    if (loading) {
        return <div>Loading...</div>;
    }

    if (errorMessage) {
        return <div>{errorMessage}</div>;
    }

    const handleClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="reportdetail">
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

            {/* Content */}
            <div className={`wrapper ${isSidebarCollapsed ? 'full-screen' : ''}`}>
                <div className="breadcrumb-container">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to="/dashboard">แดชบอร์ด</Link>
                            </li>
                            <li className="breadcrumb-item">
                                <Link to="/report">จัดการกระทู้ไม่พึงประสงค์</Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                รายละเอียดกระทู้ไม่พึงประสงค์
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''} ${isMobile ? 'mobile' : ''}`}>

                    <h1>รายละเอียดกระทู้ไม่พึงประสงค์</h1>
                    {report ? (
                        <>
                            <div className="report-details-container">
                                <div className="report-details">
                                    <h3>รายละเอียดการรายงาน</h3>
                                    <p><strong>หมวดหมู่:</strong> {report.category?.title || 'ไม่มีหมวดหมู่'}</p>
                                    <p><strong>คำอธิบายหมวดหมู่:</strong> {report.category?.description || 'ไม่มีคำอธิบาย'}</p>
                                    <p><strong>ผู้รายงาน:</strong> {`${report.user?.firstname} ${report.user?.lastname}` || 'ไม่มีข้อมูลผู้รายงาน'}</p>
                                    <p><strong>วันที่รายงาน:</strong> {formatThaiDate(report.createdAt)}</p>
                                </div>

                            </div>

                            <div className="blog-info">
                                <div className="row">
                                    <div className="col-12 col-md-4">
                                        <div className="blog-img-rp">
                                            <img src={report.blog?.obj_picture} alt="ไม่พบรูปภาพสิ่งของ" className="img-fluid mx-auto d-block" />
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-8">
                                        <div className="blogs-info-rp">
                                            <h3>รายละเอียดกระทู้</h3>
                                            <p><strong>ประเภทกระทู้:</strong> {report.blog?.object_subtype || 'ไม่มีข้อมูล'}</p>
                                            <p><strong>สี:</strong> {report.blog?.color || 'ไม่มีข้อมูล'}</p>
                                            <p><strong>สถานที่:</strong> {report.blog?.location || 'ไม่มีข้อมูล'}</p>
                                            <p><strong>หมายเหตุ:</strong> {report.blog?.note || 'ไม่มีข้อมูล'}</p>
                                            <p><strong>วันที่แจ้งพบสิ่งของ:</strong> {formatThaiDate(report.blog?.createdAt) || 'ไม่มีข้อมูล'}</p>
                                            <p><strong>สถานะการรับสิ่งของ:</strong> {report.blog?.received === false ? 'สิ่งของยังไม่ได้ถูกรับ' : report.blog?.received === true ? 'สิ่งของถูกรับไปแล้ว' : 'ไม่มีข้อมูล'}</p>
                                            <p><strong>เจ้าของกระทู้:</strong> {`${report.blogOwner?.firstname} ${report.blogOwner?.lastname}` || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </>
                    ) : (
                        <p>ไม่พบข้อมูลกระทู้ไม่พึงประสงค์ หรือข้อมูลผู้ใช้ไม่ครบถ้วน</p>
                    )}
                    <div className="action-buttons-container">
                        <button
                            className="delete-blog"
                            onClick={() => handleDeleteReport(report._id)}
                        >
                            ลบกระทู้
                        </button>

                        {/* <button
                            className="unlock-button"
                            onClick={() => handleNavigateToMemberDetail(report.blogOwner)}
                        >
                            เจ้าของกระทู้
                        </button> */}


                    </div>
                </div>
            </div>

            <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
                <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
            </div>
        </div>
    );
}

export default ReportDetail;
