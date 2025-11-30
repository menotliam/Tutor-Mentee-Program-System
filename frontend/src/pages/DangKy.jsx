import React, { useState } from "react";
import "../styles/DangKy.css";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DangKy() {
  // state để lưu input (không thay đổi class / cấu trúc HTML)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    // đây là button onClick
    e && e.preventDefault && e.preventDefault();

    if (!email) return alert("Vui lòng nhập email.");
    if (!password) return alert("Vui lòng đặt mật khẩu.");
    if (password !== confirmPassword) return alert("Mật khẩu và xác nhận mật khẩu không khớp.");

    const username = email.includes("@") ? email.split("@")[0] : email;

    const body = { username, email, password };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        // backend trả message thành công
        alert(data.message || "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.");
        // tuỳ ý: bạn có thể điều hướng ở đây; vì UI của bạn không có router ở file này,
        // mình để mặc định không điều hướng (giữ nguyên cấu trúc).
      } else {
        // hiển thị lỗi
        alert(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Lỗi kết nối tới server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dangkyframe">
      <div className="left-column">
        <div className="content">
          <div className="text">
            <div className="text-wrapper">Đăng Ký</div>
          </div>

          <div className="form">
            <input
              className="input"
              placeholder="Nhập Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="div-wrapper">
              <input
                className="div"
                placeholder="Đặt Mật Khẩu"
                type="password"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "399px",
                  marginRight: "18px",
                  textAlign: "left",
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="div-wrapper">
              <input
                className="div"
                placeholder="Xác nhận mật khẩu"
                type="confirmpassword"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "399px",
                  marginRight: "18px",
                  textAlign: "left",
                }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              className="button"
              onClick={handleRegister}
              disabled={loading}
            >
              <div className="text-wrapper-3">{loading ? "Đang gửi..." : "Đăng Ký"}</div>
            </button>
          </div>
          <Link to="/" style={{ textDecoration: "none" }}>
  <div className="text-wrapper-4">Quay về Trang Chủ</div>
</Link>

        </div>
        <img className="logobk" alt="Logobk" src="logoBK.png" />
      </div>

      <div className="right-column">
        <div className="container" />

        <img className="TruongBK" alt="Truongbk" src="TruongBK.png" />
      </div>
    </div>
  );
}
