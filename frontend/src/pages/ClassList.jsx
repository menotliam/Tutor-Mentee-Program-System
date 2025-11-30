import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarTutor from '../components/NavbarTutor';
import '../styles/ClassList.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timeSlotLabels = {
  "08-10": "08:00 - 10:00",
  "10-12": "10:00 - 12:00",
  "13-15": "13:00 - 15:00",
  "15-17": "15:00 - 17:00",
  "18-20": "18:00 - 20:00",
  "20-22": "20:00 - 22:00"
};

export default function ClassList() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/tutors/classes-with-students`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();
        
        if (res.ok && data.success) {
          setClasses(data.data || []);
        } else {
          if (res.status === 401) {
            localStorage.removeItem("authToken");
            navigate("/login");
            return;
          }
          setError(data.message || "Không thể tải danh sách buổi học");
        }
      } catch (err) {
        console.error("Fetch classes error:", err);
        setError("Lỗi kết nối server. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <NavbarTutor />
        <div className="classlist-page">
          <div className="classlist-container">
            <h1 className="classlist-title">Danh sách buổi học</h1>
            <p>Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarTutor />
      <div className="classlist-page">
        <div className="classlist-container">
          <h1 className="classlist-title">Danh sách buổi học</h1>
          <p className="classlist-subtitle">
            Các buổi học có ít nhất 1 sinh viên đăng ký sẽ hiển thị tại đây.
          </p>

          {error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              
              <div className="empty-text">Chưa có buổi học nào có sinh viên đăng ký</div>
              <div className="empty-note">Khi sinh viên đăng ký lịch tư vấn, buổi học sẽ xuất hiện trong danh sách này.</div>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((cls, idx) => (
                <div className="class-card" key={idx}>
                  <div className="class-meta">
                    <div className="datetime">
                      {cls.date} • {timeSlotLabels[cls.timeSlot] || cls.timeSlot}
                    </div>
                    <div className="subject">
                      Môn: {cls.subject?.subjectName || cls.subject?.subjectCode || "N/A"}
                    </div>
                    
                    <div className="student-count">
                      Số sinh viên: {cls.studentCount} sinh viên
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
