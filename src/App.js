import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './screens/Login.js';
import Dashboard from './screens/Dashboard.js';
import Feedback from './screens/Feedback.js';
import Category from './screens/Category.js';
import Member from './screens/Member.js';
import Report from './screens/Report.js';
import AddCategory from './screens/AddCategory.js';
import UpdateCategory from './screens/UpdateCategory.js';
import Admin from './screens/Admin.js';
import MemberDetail from './screens/MemberDetail.js';
import ReportDetail from './screens/ReportDetail.js';
import LocationDetail from './screens/LocationDetail.js';
import Blogdata from './screens/BlogData.js';
import FeedbackDetail from './screens/FeedbackDetail.js';
import Receive from './screens/Receive.js';
import ReceiveDetail from './screens/ReportDetail.js';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={< Dashboard />} />
        <Route path="/feedback" element={< Feedback />} />
        <Route path="/feedbackdetail" element={< FeedbackDetail />} />
        <Route path="/category" element={<Category />} />
        <Route path="/member" element={<Member />} />
        <Route path="/report" element={<Report />} />
        <Route path="/add-category" element={<AddCategory />} />
        <Route path="/update-category/:id" element={<UpdateCategory />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/memberdetail" element={< MemberDetail />} />
        <Route path="/memberdetail/:id" element={< MemberDetail />} />
        <Route path="/reportdetail" element={< ReportDetail />} />
        <Route path="/locationdetail/:locationname" element={<LocationDetail />} />
        <Route path="/blog/:blogId" element={< Blogdata />} />
        <Route path="/receive" element={< Receive />} />
        <Route path="/receivedetail" element={< ReceiveDetail />} />

      </Routes>
    </Router>
  );
};

export default App;
