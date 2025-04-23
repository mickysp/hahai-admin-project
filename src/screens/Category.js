import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaEdit, FaTrash, FaBell, FaCaretDown, FaBoxOpen } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';

function Category() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [originalProfileImage, setOriginalProfileImage] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [notifications, setNotifications] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [buttonColor, setButtonColor] = useState('#006AFF');
  const [totalCategories, setTotalCategories] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [footerVisible, setFooterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');  // น้อยไปมาก

  const [feedback, setFeedbacks] = useState('');
  const [newfeedback, setNewFeedbacks] = useState('');


  const token = localStorage.getItem('authToken');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };


  const handleMouseEnter = () => { setButtonColor('#004c9d'); };
  const handleMouseLeave = () => { setButtonColor('#006AFF'); };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
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

  const handleAddCategoryClick = () => {
    navigate('/add-category');
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

  const fetchCategories = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    console.log('Token:', token);

    if (!token) {
      setLoading(false);
      setErrorMessage('ไม่พบผู้ใช้ โปรดเข้าสู่ระบบใหม่');
      return;
    }

    try {
      console.log('Fetching categories with token:', token);
      const response = await axios.get('https://localhost:5001/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        if (response.data.categories) {
          setCategories(response.data.categories); // Set categories data
          setTotalCategories(response.data.totalCount || 0); // Set the total count of categories
        } else {
          console.log("ไม่มีข้อมูลหมวดหมู่");
          setCategories([]);
          setTotalCategories(0);
        }
      }
      if (response.data && response.data.categories) {
        setCategories(response.data.categories); // Set categories data
      }

      setLoading(false);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', error.response?.data || error);
      if (error.response?.data?.message === 'Token ไม่ถูกต้องหรือหมดอายุ') {
        setErrorMessage('Token ของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('authToken');
        navigate('/');
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่');
      }
      setLoading(false);
    }
  }, [navigate]);

  const handleSortChange = () => {
    setSortOrder(prevSortOrder => (prevSortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const sortedCategories = useMemo(() => {
    return categories.sort((a, b) => {
      const compareValue = sortOrder === 'asc'
        ? a.title.localeCompare(b.title) // For sorting by title in ascending order
        : b.title.localeCompare(a.title); // For sorting by title in descending order
      return compareValue;
    });
  }, [categories, sortOrder]);

  useEffect(() => {
    if (token) {
      fetchCategories();
    } else {
      navigate('/');
    }
  }, [token, navigate, fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories
      .map((category, index) => ({
        ...category,
        realIndex: index + 1,
      }))
      .filter(category =>
        category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [categories, searchTerm]);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleDeleteCategory = async (id) => {
    console.log("Deleting category with ID:", id);

    if (!id) {
      alert("Invalid category ID");
      return;
    }

    const confirmDelete = window.confirm("คุณต้องการลบหมวดหมู่นี้หรือไม่?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`https://localhost:5001/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setSuccessMessage('หมวดหมู่ถูกลบเรียบร้อยแล้ว');
        setCategories(prevCategories => prevCategories.filter(category => category._id !== id));
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบหมวดหมู่:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการลบหมวดหมู่');
    }
  };

  const handleEditCategory = (id) => {
    console.log("Editing category with ID:", id);
    navigate(`/update-category/${id}`);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
              <li className="breadcrumb-item active" aria-current="page">
                จัดการสมาชิก
              </li>
            </ol>
          </nav>
          <div className="count">
            <p>จำนวนหมวดหมู่ทั้งหมด: {totalCategories} หมวดหมู่</p>
          </div>
        </div>

        {/* <button onClick={handleSortChange}>
          {sortOrder === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
        </button> */}

        <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''}`}>
          <h1>จัดการหมวดหมู่</h1>

          <div className="search-container">
            <button
              className="btn"
              style={{ backgroundColor: buttonColor, color: 'white', fontSize: '14px', padding: '9px 15px' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleAddCategoryClick}
            >
              เพิ่มหมวดหมู่
            </button>

            <div className="search-bar">
              <input
                type="text"
                placeholder="ค้นหาหมวดหมู่"
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
                  <th>ชื่อหมวดหมู่</th>
                  <th>คำอธิบาย</th>
                  <th>การจัดการ</th>
                  {/* <th className="text-center">ลบ</th> */}
                </tr>
              </thead>
              <tbody>
                {sortedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  sortedCategories.map((category, index) => (
                    <tr key={category._id}>
                      <td>{index + 1}</td> {/* Show the index as the row number */}
                      <td>{category.title}</td>
                      <td>{category.description}</td>
                      <td>
                        <div className="button-container">
                          <button
                            className="btn btn-warning btn-icon"
                            onClick={() => handleEditCategory(category._id)}
                          >
                            <FaEdit className="icon" />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            <FaTrash className="icon" />
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
            {currentPage > 1 && (
              <button className="arrow" onClick={handlePrevPage}>
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
              <button className="arrow" onClick={handleNextPage}>
                <FaChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`footer-content ${footerVisible ? 'visible' : ''}`}>
        <p>&copy; 2025 Hahai Admin Panel. Designed to enhance system management and control.</p>
      </div>
    </div>
  );
}

export default Category;
