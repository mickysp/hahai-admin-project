import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaSearch, FaChevronRight, FaChevronLeft, FaTrash, FaBell, FaUserCircle, FaHome, FaUsers, FaFlag, FaTag, FaComments, FaEye, FaCaretDown, FaBoxOpen, FaReply } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';

function Feedback() {
  const [profileImage, setProfileImage] = useState(null);
  const [originalProfileImage, setOriginalProfileImage] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false); // State for delete success message
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newfeedback, setNewFeedbacks] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
      const response = await axios.get('https://hahai-admin-79ly.onrender.com/feedbacks', {
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

  const confirmDelete = (id) => {
    setSelectedFeedbackId(id);
    setShowDeletePopup(true);
  };

  const handleDeleteFeedback = async () => {
    if (!selectedFeedbackId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`https://hahai-admin-79ly.onrender.com/feedbacks/${selectedFeedbackId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setFeedbacks((prevFeedbacks) =>
          prevFeedbacks.filter((feedback) => feedback._id !== selectedFeedbackId)
        );

        setShowDeletePopup(false); // ปิด pop-up หลังการลบ
        setDeleteSuccess(true); // ตั้งค่าสถานะลบสำเร็จ

        // ซ่อนข้อความหลังจาก 3 วินาที
        setTimeout(() => setDeleteSuccess(false), 3000);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบฟีดแบ็ค:", error);
    }
  };

  const handleViewDetails = (id) => {
    console.log(`Viewing details for feedback ID: ${id}`);
    const feedback = feedbacks.find(f => f._id === id);
    if (feedback) {
      navigate('/feedbackdetail', { state: { feedback } });
    } else {
      alert("ไม่พบ feedback ที่มี ID นี้");
    }
  };

  const handleReply = async (feedbackId) => {
    const message = "เราได้รับทราบปัญหาของคุณแล้ว เราจะรีบดำเนินการแก้ไขให้เร็วที่สุด ขอบคุณที่แจ้งให้เราทราบ";

    try {
      setIsLoading(true);  // Show loading spinner

      const response = await axios.put(`https://hahai-admin-79ly.onrender.com/feedback/${feedbackId}/reply`, { message });

      if (response.status === 200) {
        alert("คำตอบของคุณถูกส่งไปยังผู้ใช้เรียบร้อยแล้ว");

        // Update the feedback list to reflect the reply
        const updatedFeedbacks = feedbacks.map((feedback) =>
          feedback._id === feedbackId ? { ...feedback, reply: message } : feedback
        );
        setFeedbacks(updatedFeedbacks);  // Update feedbacks state with the reply

      } else {
        alert("เกิดข้อผิดพลาดในการตอบกลับ");
      }

      setIsLoading(false);  // Hide loading after the request is done
    } catch (error) {
      console.error('Error replying to feedback:', error);
      alert("เกิดข้อผิดพลาดในการตอบกลับ");
      setIsLoading(false);
    }
  };


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

  const statusMapping = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    resolved: 'แก้ไขแล้ว',
    closed: 'ปิด',
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .map((feedback, index) => ({
        ...feedback,
        realIndex: index + 1,
      }))
      .filter(feedback => {
        const formattedDate = formatThaiDate(feedback.createdAt);
        const statusTranslation = statusMapping[feedback.status];
        return (
          feedback.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.user?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (statusTranslation && statusTranslation.toLowerCase().includes(searchTerm.toLowerCase())) ||
          feedback.reply?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formattedDate.includes(searchTerm)
        );
      });
  }, [feedbacks, searchTerm]);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredFeedbacks.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredFeedbacks, currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleScroll = () => {
    const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
    setFooterVisible(bottom);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  const handleStatusChange = async (feedbackId, newStatus) => {
    const updatedFeedbacks = feedbacks.map(feedback =>
      feedback._id === feedbackId ? { ...feedback, status: newStatus } : feedback
    );
    setFeedbacks(updatedFeedbacks);

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`https://hahai-admin-79ly.onrender.com/feedbacks/${feedbackId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="feedback">
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
              <li className="breadcrumb-item active">จัดการรายการปัญหาการใช้งาน</li>
            </ol>
          </nav>
          <div className="count"><p>จัดการรายการปัญหาการใช้งาน: {totalCount}</p></div>
        </div>

        <div className={`content ${isSidebarCollapsed ? 'full-screen' : ''}`}>
          <h1>จัดการรายการปัญหาการใช้งาน</h1>
          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="ค้นหารายงานปัญหา"
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
                  <th>ผู้ใช้</th>
                  <th>รายละเอียด</th>
                  <th>ดำเนินการสถานะ</th>
                  <th>สถานะ</th>
                  <th>วันที่แจ้งปัญหา</th>
                  <th>การตอบกลับ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}>ไม่พบข้อมูล</td></tr>
                ) : (
                  currentItems.map((feedback, index) => (
                    <tr key={feedback._id}>
                      <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                      <td>{feedback.user.firstname} {feedback.user.lastname}</td>
                      <td>{feedback.description}</td>
                      <td>
                        <select
                          value={feedback.status}
                          onChange={(e) => handleStatusChange(feedback._id, e.target.value)}
                          className="custom-select-dropdown"
                        >
                          <option value="pending">รอดำเนินการ</option>
                          <option value="in_progress">กำลังดำเนินการ</option>
                          <option value="resolved">แก้ไขแล้ว</option>
                          {/* <option value="closed">ปิด</option> */}
                        </select>
                      </td>
                      <td>
                        {feedback.status === 'pending' && <span style={{ color: 'orange' }}>รอดำเนินการ</span>}
                        {feedback.status === 'in_progress' && <span style={{ color: 'blue' }}>กำลังดำเนินการ</span>}
                        {feedback.status === 'resolved' && <span style={{ color: 'green' }}>แก้ไขแล้ว</span>}
                        {/* {feedback.status === 'closed' && <span style={{ color: 'gray' }}>ปิด</span>} */}
                      </td>

                      <td>{formatThaiDate(feedback.createdAt)}</td>

                      <td>
                        {feedback.reply ? (
                          <div className="feedback-reply">
                            <strong>ตอบกลับแล้ว</strong>
                            <p>{feedback.reply}</p>
                          </div>
                        ) : (
                          <p>ยังไม่ได้ตอบกลับ</p>
                        )}
                      </td>

                      <td>
                        <div className="button-container">
                          <button
                            className="btn btn-primary btn-icon"
                            onClick={() => handleViewDetails(feedback._id)}
                          >
                            <FaEye className="icon" />
                          </button>
                          <button
                            className="btn btn-success btn-icon"
                            onClick={() => handleReply(feedback._id)}  // Pass the correct feedback ID here
                          >
                            <FaReply className="icon" />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => { setSelectedFeedbackId(feedback._id); setShowDeletePopup(true); }}
                          >
                            <FaTrash />
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
            {currentPage > 1 && <button className="arrow" onClick={() => setCurrentPage(currentPage - 1)}><FaChevronLeft size={15} /></button>}
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={currentPage === index + 1 ? 'active' : ''}
              >
                {index + 1}
              </button>
            ))}
            {currentPage < totalPages && <button className="arrow" onClick={() => setCurrentPage(currentPage + 1)}><FaChevronRight size={15} /></button>}
          </div>
        </div>

        {showDeletePopup && (
          <div className="delete-popup-overlay">
            <div className="delete-popup">
              <h3>ยืนยันการลบ</h3>
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?</p>
              <div className="popup-buttons">
                <button onClick={() => setShowDeletePopup(false)} className="btn btn-c-fb">ยกเลิก</button>
                <button onClick={handleDeleteFeedback} className="btn btn-cf-fb">ยืนยัน</button>
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

export default Feedback;
