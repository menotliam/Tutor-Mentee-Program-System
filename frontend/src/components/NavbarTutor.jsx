import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

export default function NavbarTutor() {
  const [unreadNotifications, setUnreadNotifications] = useState(2); // Demo: 2 thông báo chưa đọc

  const menuItems = [
    { name: "Trang Chủ", path: "/tutor-landing" },
    { name: "Cập nhật lịch rảnh", path: "/setcalendar" },
    { name: "Danh sách sinh viên", path: "/studentlist" },
    { name: "Danh sách buổi học", path: "/classlist" },
    { name: "Thông tin cá nhân", path: "/tutor-profile" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="logo">
          <img src="/logoBK.png" alt="Logo" />
        </Link>

        {/* Menu chính */}
        <div className="navbar__menu">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-item">
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mail Icon và Đăng xuất */}
        <div className="navbar__actions">
          <button className="mail-icon-button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>

          <div className="dangnhap">
            <Link to="/" className="dangnhap-link">
              Đăng xuất
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}