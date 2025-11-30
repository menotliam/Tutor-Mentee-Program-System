import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const ROLE_LABELS = {
  student: 'Sinh viên',
  admin: 'Admin',
  instructor: 'Giảng viên'
};

export default function DangNhap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiredRole, setRequiredRole] = useState(null);

  useEffect(() => {
    // Lấy role từ URL parameter
    const roleParam = searchParams.get('role');
    if (roleParam && ['student', 'admin', 'instructor'].includes(roleParam)) {
      setRequiredRole(roleParam);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!email) return alert("Vui lòng nhập email.");
    if (!password) return alert("Vui lòng nhập mật khẩu.");

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Kiểm tra role nếu có yêu cầu
        if (requiredRole && data.user.role !== requiredRole) {
          alert(`Lỗi: Bạn chỉ có thể đăng nhập với tài khoản ${ROLE_LABELS[requiredRole]}. Tài khoản này có quyền ${ROLE_LABELS[data.user.role]}.`);
          return;
        }

        if (data.token) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("refreshToken", data.refreshToken);
          
          // Lưu user info (data.user từ backend)
          const userData = {
            ...data.user,
            status: data.user.role // Thêm status = role để tương thích
          };
          localStorage.setItem("user", JSON.stringify(userData));
          
          console.log('✅ Login success:', userData.role);
        }
        
        // Điều hướng theo role
        if (data.user.role === 'instructor') {
          navigate("/tutor-landing");
        } else if (data.user.role === 'admin') {
          navigate("/firstpage"); // Hoặc trang admin riêng
        } else {
          navigate("/firstpage");
        }
      } else {
        alert(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Lỗi kết nối tới server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="frame1">
      {/* Cột trái */}
      <div className="left-column">
        {/* Logo */}
        <img className="logobk" alt="Logo BK" src="logoBK.png" />
        
        {/* Nội dung chính */}
        <div className="content">
          {/* Tiêu đề */}
          <h1 className="text-wrapper">Đăng nhập</h1>
          
          {/* Hiển thị role yêu cầu */}
          {requiredRole && (
            <p style={{ 
              color: '#666', 
              fontSize: '14px', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              Đăng nhập với tài khoản: <strong>{ROLE_LABELS[requiredRole]}</strong>
            </p>
          )}
          
          {/* Form đăng nhập */}
          <form className="form" onSubmit={handleLogin}>
            {/* Input Email */}
            <input 
              className="inputField" 
              type="email" 
              placeholder="Nhập email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Input Mật khẩu */}
            <input 
              className="inputField" 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Nút đăng nhập */}
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </button>
          </form>

          {/* Quay lại */}
          <Link to={"/register"} className="back-link">
            Đăng Ký Tài Khoản
          </Link>
        </div>
      </div>
      
      {/* Cột phải */}
      <div className="right-column">
        <img className="image" alt="Campus BK" src="TruongBK.jpg" />
      </div>
    </div>
  );
}
