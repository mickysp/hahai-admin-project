import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaFlag, FaComments, FaTag, FaUserCircle, FaBell, FaCaretDown, FaUserSlash, FaBlog, FaDownload, FaBoxOpen } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../hahai.css';
import '../menu.css';
import axios from 'axios';
import Mapfound from './components/Mapfound.js';

function Dashboard() {
  const [profileImage, setProfileImage] = useState(null);
  const [originalProfileImage, setOriginalProfileImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [adminUsername, setAdminUsername] = useState('');
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [suspendedUsers, setSuspendedUsers] = useState(0);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedbacks] = useState('');
  const [newfeedback, setNewFeedbacks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [topSubtypes, setTopSubtypes] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [locations, setLocations] = useState([]);
  const [timePeriod, setTimePeriod] = useState("ทั้งหมด");
  const [timePeriodForSubtypes, setTimePeriodForSubtypes] = useState("ทั้งหมด");
  const [timePeriodForThreads, setTimePeriodForThreads] = useState("ทั้งหมด");
  const [timePeriodForAllUser, setTimePeriodForAllUser] = useState("ทั้งหมด");
  const [timePeriodForBanUsers, setTimePeriodForBanUsers] = useState("ทั้งหมด");
  const [timePeriodForBlogs, setTimePeriodForBlogs] = useState("ทั้งหมด");

  const [receivedCount, setReceivedCount] = useState(0);
  const [notReceivedCount, setNotReceivedCount] = useState(0);

  const [uniqueItemCount, setUniqueItemCount] = useState(0); // เพิ่ม state สำหรับ uniqueItemCount
  const [showAll, setShowAll] = useState(false);

  const [displayedLocations, setDisplayedLocations] = useState([]);  // สำหรับแสดงผล
  const [showAllLocations, setShowAllLocations] = useState(false);


  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleClick = () => {
    navigate('/dashboard');
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
    const fetchCounts = async () => {
      try {
        const response = await axios.get("https://localhost:5001/blogs");
        console.log(response.data);
        setReceivedCount(response.data.receivedCount);
        setNotReceivedCount(response.data.notReceivedCount);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      }
    };

    fetchCounts();
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

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      const optionsTime = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };

      const formattedDate = now.toLocaleDateString('th-TH', optionsDate);
      const formattedTime = now.toLocaleTimeString('th-TH', optionsTime);

      setCurrentDate({ formattedDate, formattedTime });
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://localhost:5001/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        setOnlineUsers(response.data.users.filter(user => user.isOnline).length);
        setSuspendedUsers(response.data.suspendedUsers);
        setTotalUsers(response.data.totalUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handlePeriodForBanUsers = (e) => {
    setTimePeriodForBanUsers(e.target.value);
  };

  useEffect(() => {
    const fetchBanUsers = async () => {
      try {
        const response = await axios.get(`https://localhost:5001/ban-users?timePeriod=${timePeriodForBanUsers}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        setSuspendedUsers(response.data.suspendedUsers);
      } catch (error) {
        console.error('Error fetching banned users:', error);
      }
    };

    fetchBanUsers();
  }, [timePeriodForBanUsers]); // เรียกข้อมูลใหม่เมื่อเลือกช่วงเวลาเปลี่ยน

  //กระทู้ทั้งหมด
  const handleForBlogsChange = (e) => {
    setTimePeriodForBlogs(e.target.value);
  };

  useEffect(() => {
    const fetchTotalBlogs = async () => {
      try {
        const response = await axios.get('https://hahai-admin-79ly.onrender.com/blogs', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          params: {
            timePeriod: timePeriodForBlogs, // ส่ง timePeriod ไปใน request
          },
        });

        setTotalBlogs(response.data.totalBlogs); // ตั้งค่าจำนวน totalBlogs
      } catch (error) {
        console.error('Error fetching total blogs:', error);
      }
    };

    fetchTotalBlogs();
  }, [timePeriodForBlogs]); // ดึงข้อมูลเมื่อ timePeriodForBlogs เปลี่ยน

  const handleShowAllToggle = () => {
    setShowAll((prev) => !prev); // เปลี่ยนสถานะการแสดงผล
  };

  const displaySubtypes = showAll ? topSubtypes : topSubtypes.slice(0, 5); // แสดงผลตามสถานะ showAll

  const handleSubtypeTimePeriodChange = (e) => {
    setTimePeriodForSubtypes(e.target.value);
  };

  useEffect(() => {
    console.log("Current subtype time period:", timePeriodForSubtypes);

    const fetchUrl = `https://localhost:5001/blogs/top-object-subtypes?period=${timePeriodForSubtypes}`;
    console.log("Fetching from:", fetchUrl);

    fetch(fetchUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched subtype data:", data);
        if (data.topSubtypes.length > 0) {
          setTopSubtypes(data.topSubtypes); // ถ้ามีข้อมูลให้ตั้งค่า topSubtypes
          // คำนวณจำนวนชนิดสิ่งของที่ไม่ซ้ำ
          const uniqueItemTypes = new Set(data.topSubtypes.map(subtype => subtype.type));
          setUniqueItemCount(uniqueItemTypes.size); // เก็บค่า uniqueItemCount ใน state
        } else {
          setTopSubtypes([]); // ถ้าไม่มีข้อมูลให้ตั้งค่าเป็น array ว่าง
        }
      })
      .catch((error) => console.error("Error fetching top subtypes:", error));
  }, [timePeriodForSubtypes]);



  //แผนที่

  // ฟังก์ชันที่ใช้สลับการแสดงผลทั้งหมด

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
  };

  useEffect(() => {
    console.log("Current time period:", timePeriod);
    const fetchUrl = `https://localhost:5001/blogs/top-object-location?timePeriod=${timePeriod}`;

    fetch(fetchUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data);
        setLocations(data.topLocations);
        setDisplayedLocations(data.topLocations.slice(0, 5)); // เริ่มต้นแสดงแค่ 5 อันดับแรก
      })
      .catch((error) => console.error("Error fetching locations:", error));
  }, [timePeriod]);  // จะทำงานทุกครั้งที่ timePeriod เปลี่ยน

  const handleShowAllTogglelocation = () => {
    if (showAllLocations) {
      setDisplayedLocations(locations.slice(0, 5));  // ถ้าย่อให้เหลือ 5 อันดับแรก
    } else {
      setDisplayedLocations(locations);  // ถ้าเลือกดูทั้งหมด จะใช้ข้อมูลทั้งหมด
    }
    setShowAllLocations((prev) => !prev);  // สลับสถานะการแสดงผล
  };

  //การรับสิ่งของ

  const handlePeriodForThreadsChange = (e) => {
    setTimePeriodForThreads(e.target.value); // อัปเดตค่า timePeriodForThreads
  };

  useEffect(() => {
    const fetchReceivedItemCounts = async () => {
      try {
        const response = await axios.get(`https://localhost:5001/thread-counts?period=${timePeriodForThreads}`);
        setReceivedCount(response.data.receivedCount); // 🔹 ใช้ await ให้แน่ใจว่าข้อมูลโหลดครบ
        setNotReceivedCount(response.data.notReceivedCount);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    if (timePeriodForThreads) { // 🔹 เช็คว่ามีค่าก่อน fetch
      fetchReceivedItemCounts();
    }
  }, [timePeriodForThreads]); // จะรันทุกครั้งที่ timePeriodForThreads เปลี่ยน



  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/admin');
  };

  return (
    <div className="dashboard">
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
          {/* <li className="menu-item">
            <Link to="/receive" className="menu-link">
              <FaBox size={20} />
              <h5>รับสิ่งของ</h5>
            </Link>
          </li> */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', marginLeft: 'auto' }}>
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

      <div className={`content-dashboard ${isSidebarCollapsed ? 'full-screen' : ''}`}>
        <div className="header-content">
          <h1>Dashboard</h1>
        </div>
        <p className="date-time">
          {currentDate.formattedDate} เวลา {currentDate.formattedTime}
        </p>

        <div className="container">
          <div className="row">


            <div className="col-lg-3 col-md-6 col-12 mb-3">
              <div className="info-box active-users" style={{ paddingTop: "0px", }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: "10px", }}>
                    <div>
                      <h4 style={{ paddingTop: "4px", }}>ผู้ใช้ที่กำลังใช้งาน</h4>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0px' }}>
                    <p style={{ marginRight: '10px', paddingTop: '18px' }}>{onlineUsers}</p>
                    <FaUsers size={40} color="#d1d8e0" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 col-12 mb-3">
              <div className="info-box total-users" style={{ paddingTop: "0px", }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: "10px", }}>
                    <div>
                      <h4 style={{ paddingTop: "4px", }}>ผู้ใช้ทั้งหมด</h4>
                    </div>
                    {/* <div className="filter-container" style={{ marginLeft: 'auto' }}>
                      <select
                        value={timePeriodForAllUser}
                        onChange={handlePeriodForAllUser}
                        style={{
                          padding: "2px",
                          fontSize: "13px",
                          border: "0px",
                          backgroundColor: "#78B0FF",
                          color: "white",
                        }}
                      >
                        <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">ทั้งหมด</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">วันนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">เมื่อวาน</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">1 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">2 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">เดือนนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">เดือนที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">ปีนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">ปีที่แล้ว</option>
                      </select>
                    </div> */}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0px' }}>
                    <p style={{ marginRight: '10px', paddingTop: '18px' }}>{totalUsers}</p>
                    <FaUsers size={40} color="#d1d8e0" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              </div>
            </div>


            <div className="col-lg-3 col-md-6 col-12 mb-3">
              <div className="info-box suspended-users" style={{ paddingTop: "0px", }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: "10px", }}>
                    <div>
                      <h4 style={{ paddingTop: "4px", }}>ผู้ใช้ที่ถูกระงับ</h4>
                    </div>
                    <div className="filter-container" style={{ marginLeft: 'auto' }}>
                      <select
                        value={timePeriodForBanUsers}
                        onChange={handlePeriodForBanUsers}
                        style={{
                          padding: "2px",
                          fontSize: "13px",
                          border: "0px",
                          backgroundColor: "#78B0FF",
                          color: "white",
                        }}
                      >
                        <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">ทั้งหมด</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">วันนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">เมื่อวาน</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">1 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">2 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">เดือนนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">เดือนที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">ปีนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">ปีที่แล้ว</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0px' }}>
                    <p style={{ marginRight: '10px', paddingTop: '18px' }}>{suspendedUsers}</p>
                    <FaUserSlash size={40} color="#d1d8e0" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 col-12 mb-3">
              <div className="info-box total-blogs" style={{ paddingTop: "0px", }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: "10px", }}>
                    <div>
                      <h4 style={{ paddingTop: "4px", }}>กระทู้ทั้งหมด</h4>
                    </div>
                    <div className="filter-container" style={{ marginLeft: 'auto' }}>
                      <select
                        value={timePeriodForBlogs}
                        onChange={handleForBlogsChange}
                        style={{
                          padding: "2px",
                          fontSize: "13px",
                          border: "0px",
                          backgroundColor: "#78B0FF",
                          color: "white",
                        }}
                      >
                        <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">ทั้งหมด</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">วันนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">เมื่อวาน</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">1 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">2 สัปดาห์ที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">เดือนนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">เดือนที่แล้ว</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">ปีนี้</option>
                        <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">ปีที่แล้ว</option>
                      </select>
                    </div>
                  </div>


                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0px' }}>

                    <p style={{ marginRight: '10px', paddingTop: '18px' }}>{totalBlogs}</p>
                    <FaBlog size={40} color="#d1d8e0" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="container-reported">
            <div className="top-reported-items" style={{ paddingTop: "5px" }}>
              <div style={{ backgroundColor: "#f9fafc", padding: "5px", paddingTop: "0px", borderRadius: "8px" }}>
                <div className="header-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "20px", marginTop: "20px", color: "#4e73df" }}>
                    สิ่งของที่ถูกรายงานบ่อยที่สุด
                  </h2>
                  <div className="filter-container">
                    <select
                      value={timePeriodForSubtypes}
                      onChange={handleSubtypeTimePeriodChange}
                      style={{
                        padding: "5px",
                        fontSize: "14px",
                        border: "0px",
                        backgroundColor: "#78B0FF",
                        color: "white",
                      }}
                    >
                      <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">
                        ทั้งหมด
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">
                        วันนี้
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">
                        เมื่อวาน
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">
                        1 สัปดาห์ที่แล้ว
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">
                        2 สัปดาห์ที่แล้ว
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">
                        เดือนนี้
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">
                        เดือนที่แล้ว
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">
                        ปีนี้
                      </option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">
                        ปีที่แล้ว
                      </option>
                    </select>
                  </div>
                </div>

                <p style={{ color: "gray", fontSize: 14, marginBottom: 30 }}>
                  แสดง 5 อันดับสิ่งของที่ถูกรายงานบ่อยที่สุดในมหาวิทยาลัยขอนแก่น
                </p>

                {/* แสดงจำนวนชนิดสิ่งของที่ไม่ซ้ำบนส่วนหัวของตาราง */}
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f1f1f1", textAlign: "left" }}>
                      <th style={{ fontWeight: "bold", fontSize: "14px", color: "#007bff" }}>#</th>
                      <th style={{ fontSize: "14px" }}>สิ่งของ</th>
                      <th style={{ fontSize: "14px" }}>จำนวนสิ่งของที่ถูกรายงาน</th>
                      <th className="text-danger" style={{ fontSize: "14px" }}>
                        % ของสิ่งของที่ถูกรายงาน
                      </th>
                      <th style={{ fontSize: "14px" }}>จำนวนที่สิ่งของถูกรับไป</th>
                      <th className="text-danger" style={{ fontSize: "14px" }}>
                        % ของสิ่งของที่ถูกรับไป
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySubtypes.length > 0 ? (
                      displaySubtypes.map((subtype, index) => (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f5f7fa", // สลับสี
                          }}
                        >
                          <td style={{ fontWeight: "bold", fontSize: "14px", color: "#007bff" }}>
                            {index + 1}
                          </td>
                          <td style={{ fontSize: "14px" }}>{subtype.type}</td>
                          <td style={{ fontSize: "14px" }}>{subtype.count}</td>
                          <td className="text-danger" style={{ fontSize: "14px" }}>
                            {subtype.totalPercentage}%
                          </td>
                          <td style={{ fontSize: "14px" }}>{subtype.receivedCount}</td>
                          <td className="text-danger" style={{ fontSize: "14px" }}>
                            {subtype.receivedPercentage}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            textAlign: "center",
                            color: "#6d7c8b",
                            fontSize: "14px",
                            padding: "20px",
                          }}
                        >
                          ไม่มีสิ่งของที่ถูกแจ้งพบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <p style={{ color: "gray", fontSize: 14, marginBottom: 30 }}>
                  จำนวนชนิดสิ่งของที่ถูกรายงานทั้งหมด: {uniqueItemCount} ชนิด
                </p>

                {/* ปุ่มสำหรับแสดงผลทั้งหมดหรือย่อ */}
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button
                    onClick={handleShowAllToggle}
                    style={{
                      padding: "5px 15px",
                      backgroundColor: "#78B0FF",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {showAll ? "^" : "แสดงทั้งหมด"}
                  </button>
                </div>
                </div>

              </div>

              <div className="thread-category" style={{ paddingTop: "0px", }}>
                <div className="header-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", }}>
                  <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "20px", marginTop: "20px", color: "#4e73df" }}>การรับสิ่งของ</h2>
                  <div className="filter-container">
                    <select
                      value={timePeriodForThreads}
                      onChange={handlePeriodForThreadsChange}
                      style={{
                        padding: "5px",
                        fontSize: "14px",
                        border: "0px",
                        backgroundColor: "#78B0FF",
                        color: "white",
                      }}
                    >
                      <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">ทั้งหมด</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">วันนี้</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">เมื่อวาน</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">1 สัปดาห์ที่แล้ว</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">2 สัปดาห์ที่แล้ว</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">เดือนนี้</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">เดือนที่แล้ว</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">ปีนี้</option>
                      <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">ปีที่แล้ว</option>
                    </select>
                  </div>
                </div>

                <div className="counts-container">
                  <div className="count-box">
                    <h3>สิ่งของถูกรับไปแล้ว</h3>
                    <p>{receivedCount} กระทู้</p>
                  </div>
                  <div className="count-box">
                    <h3>ยังไม่ได้รับสิ่งของ</h3>
                    <p>{notReceivedCount} กระทู้</p>
                  </div>
                  {/* <p>
                  สถานะการรับสิ่งของที่ยังไม่ได้รับทั้งหมดมี {notReceivedCount} กระทู้ที่รอการตอบรับ.
                  ขณะที่ {receivedCount} กระทู้ได้มีการรับสิ่งของแล้ว.
                </p> */}
                </div>
              </div>
            </div>

            <div className="location-section">
            <div className="location-header">
              <h2 className="location-heading">สถานที่ที่แจ้งพบสิ่งของบ่อย</h2>
              <div className="filter-container">
                <select
                  value={timePeriod}
                  onChange={handleTimePeriodChange}
                  style={{
                    padding: "5px",
                    fontSize: "14px",
                    border: "0px",
                    backgroundColor: "#78B0FF",
                    color: "white",
                  }}
                >
                  <option style={{ backgroundColor: "white", color: "black" }} value="ทั้งหมด">ทั้งหมด</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="วันนี้">วันนี้</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="เมื่อวาน">เมื่อวาน</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="1สัปดาห์">1 สัปดาห์ที่แล้ว</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="2สัปดาห์">2 สัปดาห์ที่แล้ว</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="เดือนนี้">เดือนนี้</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="เดือนที่แล้ว">เดือนที่แล้ว</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="ปีนี้">ปีนี้</option>
                  <option style={{ backgroundColor: "white", color: "black" }} value="ปีที่แล้ว">ปีที่แล้ว</option>
                </select>

              </div>
            </div>

            <p style={{ color: "gray", fontSize: 14, marginBottom: 30 }}>
              แสดง 5 อันดับสถานที่ที่พบสิ่งของบ่อยที่สุดในมหาวิทยาลัยขอนแก่น
            </p>

            <main className="map-container">
              {/* แผนที่ */}
              <Mapfound timePeriod={timePeriod} />
            </main>

            <div className="Mapcont" style={{ marginTop: "54px" }}>
              {locations.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {displayedLocations.map((loc, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "13px 20px",
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f5f7fa",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                        <span style={{ fontWeight: "bold", fontSize: "14px", color: "#007bff" }}>
                          {index + 1}.
                        </span>
                        <span style={{ fontWeight: "600", color: "#2c3e50", fontSize: "14px" }}>{loc.locationname}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <span style={{ color: "#6c757d", fontSize: "14px" }}>
                          <strong>{loc.count}</strong> ครั้ง
                        </span>
                      </div>

                      <div style={{ flex: 1, textAlign: "right" }}>
                        <span style={{ color: "#ff6b6b", fontWeight: "bold", fontSize: "14px" }}>
                          {loc.percentage}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ textAlign: "center", color: "#6d7c8b", fontSize: "14px", marginTop: "20px" }}>
                  ไม่มีสถานที่ที่ถูกรายงานบ่อย
                </p>
              )}
            </div>
            <p style={{ color: "gray", fontSize: 14, marginBottom: 30 }}>
            จำนวนสถานที่ที่แจ้งพบสิ่งของทั้งหมด: {locations.length} แห่ง
            </p>
            {/* ปุ่มสำหรับแสดงผลทั้งหมดหรือย่อ */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={handleShowAllTogglelocation}
                style={{
                  padding: "5px 15px",
                  backgroundColor: "#78B0FF",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                {showAllLocations ? "^" : "แสดงทั้งหมด"}
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
