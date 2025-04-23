import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaEdit, FaTrash, FaBell, FaCaretDown, FaBoxOpen, FaEye } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';

function Receive() {
    const [profileImage, setProfileImage] = useState(null);
    const [originalProfileImage, setOriginalProfileImage] = useState(null);
    const [adminUsername, setAdminUsername] = useState('');
    const [lastLoginTime, setLastLoginTime] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [footerVisible, setFooterVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [receivedData, setReceivedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [totalreceiveCount, setTotalReceived] = useState(0);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [selectedReceiveId, setSelectedReceiveId] = useState(null);

    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const confirmDelete = (id) => {
        setSelectedReceiveId(id);  // ตั้งค่าตัวแปร selectedReceiveId
        setShowDeletePopup(true);   // แสดง Popup
    };


    const handleDeleteReceive = async () => {
        if (!selectedReceiveId) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.delete(`https://localhost:5001/received/${selectedReceiveId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200) {
                // ลบรายการจาก state receivedData
                setReceivedData((prevReceivedData) =>
                    prevReceivedData.filter((item) => item._id !== selectedReceiveId)
                );
                setShowDeletePopup(false);  // ปิด Popup

                // ตั้งค่า deleteSuccess เป็น true เพื่อแสดงข้อความ "ลบสำเร็จ"
                setDeleteSuccess(true);

                // ซ่อนข้อความหลังจาก 3 วินาที
                setTimeout(() => setDeleteSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Error deleting receive:", error);
        }
    };

    const handleClick = () => {
        navigate('/dashboard');
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
            setTotalCount(response.data.feedbacks.length);

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

    const handleLogout = () => {
        console.log('Logout clicked');
        localStorage.removeItem('authToken');
        navigate('/');
    };

    const handleProfile = () => {
        console.log('Profile clicked');
        navigate('/admin');
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

    useEffect(() => {
        const fetchReceivedData = async () => {
            try {
                const token = localStorage.getItem('authToken');  // ดึง token จาก localStorage
                if (!token) {
                    throw new Error("No token found");
                }

                const response = await axios.get('https://localhost:5001/received', {
                    headers: { Authorization: `Bearer ${token}` },  // ส่ง token ไปใน headers
                });

                console.log('Received Data:', response.data.received);
                setReceivedData(response.data.received);
                setTotalReceived(response.data.totalReceived);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching received data:', error);
                setLoading(false);
            }
        };

        fetchReceivedData();
    }, []);


    const filteredReceivedData = receivedData.filter((item) => {
        // ตรวจสอบคำค้นหาในทุกฟิลด์ที่เราต้องการ
        return (
            (item.receiverFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||  // ชื่อผู้รับ
            (item.receiverLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||   // นามสกุลผู้รับ
            (item.blog?.object_subtype?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) || // ชนิดสิ่งของ
            (item.blog?.color?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||         // สีของสิ่งของ
            (item.blog?.receivedStatus ? item.blog.receivedStatus.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false) || // สถานะการรับสิ่งของ
            (item.user?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||      // ชื่อเจ้าของกระทู้
            (item.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)          // นามสกุลเจ้าของกระทู้
        );
    });


    console.log('Filtered Data:', filteredReceivedData);  // ตรวจสอบข้อมูลที่กรองแล้ว

    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredReceivedData.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredReceivedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredReceivedData.length / itemsPerPage);

    const handlePagination = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const handleViewDetails = (id) => {
        console.log(`Viewing details for receive ID: ${id}`);
        const selectedReceive = receivedData.find(item => item._id === id);  // หาข้อมูลที่ตรงกับ ID ที่เลือก
        if (selectedReceive) {
            navigate('/receivedetail', { state: { receive: selectedReceive } });  // ส่งข้อมูลไปยังหน้า ReceiveDetail
        } else {
            alert("ไม่พบข้อมูลที่มี ID นี้");
        }
    };

    return (
        <div className="receive">
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
                            <li className="breadcrumb-item"><Link to="/dashboard">แดชบอร์ด</Link></li>
                            <li className="breadcrumb-item active">จัดการการรับสิ่งของ</li>
                        </ol>
                    </nav>
                    <div className="count"><p>รายการรับสิ่งของ: {totalreceiveCount}</p></div>
                </div>

                <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''}`}>
                    <h1>รายการรับสิ่งของ</h1>
                    <div className="search-container">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="ค้นหารายการรับสิ่งของ"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="form-control"
                            />
                            <FaSearch size={20} />
                        </div>
                    </div>

                    {deleteSuccess && (
                        <div className="alert alert-success" role="alert">
                            ลบสำเร็จ!
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead className="thead-dark">
                                <tr>
                                    <th>#</th>
                                    <th>ผู้ใช้ที่รับสิ่งของ</th>
                                    <th>ชนิดสิ่งของ</th>
                                    {/* <th>รายละเอียด</th> */}
                                    <th>สีของสิ่งของ</th>
                                    <th>เจ้าของกระทู้</th>
                                    <th>สถานะการรับสิ่งของ</th>
                                    <th>วันที่รับสิ่งของ</th>
                                    <th>การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</td></tr>
                                ) : (
                                    currentItems.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>ไม่พบข้อมูล</td></tr>
                                    ) : (
                                        currentItems.map((receive, index) => (
                                            <tr key={receive._id}>
                                                <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                                                <td>{receive.receiverFirstName} {receive.receiverLastName}</td>
                                                <td>{receive.blog?.object_subtype || 'ไม่มีข้อมูล'}</td>
                                                <td>{receive.blog?.color || 'ไม่มีข้อมูล'}</td>
                                                <td>{receive.user?.firstname} {receive.user?.lastname}</td>
                                                <td>{receive.blog?.receivedStatus ? 'รับสิ่งของแล้ว' : 'ยังไม่ได้รับสิ่งของ'}</td>
                                                <td>{formatThaiDate(receive.createdAt)}</td>
                                                <td>
                                                    <div className="button-container">
                                                        {/* <button
                                                            className="btn btn-primary btn-icon"
                                                            onClick={() => handleViewDetails(receive._id)}
                                                        >
                                                            <FaEye className="icon" />
                                                        </button> */}

                                                        <button
                                                            className="btn btn-danger btn-icon"
                                                            onClick={() => confirmDelete(receive._id)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        {currentPage > 1 && (
                            <button className="arrow" onClick={() => setCurrentPage(currentPage - 1)}>
                                <FaChevronLeft size={15} />
                            </button>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                            <button
                                key={pageNumber}
                                className={`btn ${pageNumber === currentPage ? 'active' : ''}`}
                                onClick={() => handlePagination(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        ))}
                        {currentPage < totalPages && (
                            <button className="arrow" onClick={() => setCurrentPage(currentPage + 1)}>
                                <FaChevronRight size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {showDeletePopup && (
                    <div className="delete-popup-overlay">
                        <div className="delete-popup">
                            <h3>ยืนยันการลบ</h3>
                            <p>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?</p>
                            <div className="popup-buttons">
                                <button onClick={() => setShowDeletePopup(false)} className="btn btn-c-fb">ยกเลิก</button>
                                <button onClick={handleDeleteReceive} className="btn btn-cf-fb">ยืนยัน</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
                <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
            </div>
        </div>
    );
}

export default Receive;
