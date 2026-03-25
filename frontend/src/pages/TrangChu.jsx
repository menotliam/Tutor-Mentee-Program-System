import React from "react";
import { Link } from "react-router-dom";
import DarkModeToggle from "../components/DarkModeToggle";
import "../styles/TrangChu.css";

export default function TrangChu() {
  return (
    <div className="desktop">
      {/* Dark mode toggle button - top right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <DarkModeToggle />
      </div>

      <div className="frame-card" role="region" aria-label="Form đăng nhập">
        {/* Logo lớn ở trên cùng */}
        <img className="card-logo" src="/logoBK.png" alt="BK Logo" />

        {/* Dòng phân cách */}
        <div className="card-divider" />

        {/* Tiêu đề bằng tiếng Việt, căn giữa */}
        <h3 className="card-subtitle">Đăng nhập bằng tài khoản:</h3>

        {/* Danh sách nút (KHÔNG có icon trước mỗi nút) */}
        <div className="btn-list">
          <Link to="/login?role=student" className="btn-white">
            <span className="btn-text">Sinh viên / Students</span>
          </Link>

          <Link to="/login?role=admin" className="btn-white">
            <span className="btn-text">Admin</span>
          </Link>

          <Link to="/login?role=instructor" className="btn-white">
            <span className="btn-text">Instructor</span>
          </Link>
        </div>

        {/* Footer nhỏ căn giữa */}
        <div className="card-footer">
          <div className="lang">Tiếng Việt (vi)</div>
          <button className="cookie-btn">Chính sách cookie</button>
        </div>
      </div>
    </div>
  );
}