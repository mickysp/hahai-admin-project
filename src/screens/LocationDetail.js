import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaTrash, FaEye, FaBan, FaBell, FaCaretDown, FaBoxOpen } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';

function LocationDetail() {
    const [profileImage, setProfileImage] = useState(null);
    const [originalProfileImage, setOriginalProfileImage] = useState(null);
    const [adminUsername, setAdminUsername] = useState('');
    const [lastLoginTime, setLastLoginTime] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState(3);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);

    const [totalBlogs, setTotalBlogs] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState(null);
    const [footerVisible, setFooterVisible] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const { locationname } = useParams();
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [feedback, setFeedbacks] = useState('');
    const [newfeedback, setNewFeedbacks] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const navigate = useNavigate();


    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
    };

    const handleNotifications = () => {
        console.log('Notifications clicked');
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
        const fetchBlogs = async () => {
            if (!locationname) return;
            try {
                const decodedLocation = decodeURIComponent(locationname);
                const response = await axios.get(`https://localhost:5001/blogs/by-location/${decodedLocation}`);
                console.log("Blogs Data:", response.data); // ตรวจสอบข้อมูลที่ได้รับ
                if (response.data) {
                    setBlogs(response.data);
                    setTotalBlogs(response.data.length);
                } else {
                    console.log("No blogs found for this location.");
                }
            } catch (error) {
                console.error("Error fetching blogs:", error);
            }
        };
        fetchBlogs();
    }, [locationname]);

    const filteredBlogs = useMemo(() => {
        return blogs
            .map((blog, index) => ({
                ...blog,
                realIndex: index + 1,
            }))
            .filter(blog => {

                return (
                    blog.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    blog.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    blog.object_subtype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    blog.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    blog.locationname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    blog.note?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
    }, [blogs, searchTerm]);



    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredBlogs, currentPage, itemsPerPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const handleViewDetails = (blogId) => {
        navigate(`/blog/${blogId}`);  // Navigates to the BlogData.js page with the blog ID
    };


    const handleClick = () => {
        navigate('/dashboard');
    };



    return (
        <div className="member">
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
                            <li className="breadcrumb-item active" aria-current="page">
                                {locationname}
                            </li>
                        </ol>
                    </nav>
                    <div className="count">
                        <p>จำนวนกระทู้ทั้งหมด: {totalBlogs} กระทู้</p>
                    </div>
                </div>

                <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''}`}>
                    <h1>{locationname}</h1>

                    <div className="search-container">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="ค้นหากระทู้"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="form-control"
                            />
                            <FaSearch size={20} />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead className="thead-dark">
                                <tr>
                                    <th>#</th>
                                    <th>เจ้าของกระทู้</th>
                                    <th>วันที่พบ</th>
                                    <th>ชนิดสิ่งของ</th>
                                    <th>สี</th>
                                    <th>ตำแหน่งที่พบ</th>
                                    <th>หมายเหตุ</th>
                                    <th>รูปภาพ</th>
                                    <th>ดูรายละเอียดกระทู้</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center' }}>ไม่พบกระทู้ในบริเวณนี้</td>
                                    </tr>
                                ) : (
                                    currentItems.map((blog) => (
                                        <tr key={blog._id}>
                                            <td>{blog.realIndex}</td>
                                            <td>{blog.user?.username ?? "ไม่ระบุ"}</td>
                                            <td>{blog.date || "ไม่ระบุ"}</td>
                                            <td>{blog.object_subtype || "ไม่ระบุ"}</td>
                                            <td>{blog.color || "ไม่ระบุ"}</td>
                                            <td>{blog.locationname || "ไม่ระบุ"}</td>
                                            <td>{blog.note || "-"}</td>
                                            <td><img src={blog.obj_picture} alt="object" width="50" /></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn btn-primary btn-icon"
                                                        onClick={() => handleViewDetails(blog._id)}
                                                    >
                                                        <FaEye className="icon" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        {/* Left Arrow */}
                        {currentPage > 1 && (
                            <button className="arrow" onClick={() => setCurrentPage(currentPage - 1)}>
                                <FaChevronLeft size={15} />
                            </button>
                        )}

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                            <button
                                key={pageNumber}
                                className={`btn ${pageNumber === currentPage ? 'active' : ''}`}
                                onClick={() => paginate(pageNumber)}
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
            </div>
            <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
                <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
            </div>
        </div >
    );
}

export default LocationDetail;
