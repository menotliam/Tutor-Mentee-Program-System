import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarTutor from '../components/NavbarTutor';
import '../styles/StudentList.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timeSlotLabels = {
  "08-10": "08:00 - 10:00",
  "10-12": "10:00 - 12:00",
  "13-15": "13:00 - 15:00",
  "15-17": "15:00 - 17:00",
  "18-20": "18:00 - 20:00",
  "20-22": "20:00 - 22:00"
};

export default function StudentList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/tutors/enrolled-students-grouped`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();
        
        if (res.ok && data.success) {
          setSessions(data.data || []);
        } else {
          if (res.status === 401) {
            localStorage.removeItem("authToken");
            navigate("/login");
            return;
          }
          setError(data.message || "Không thể tải danh sách sinh viên");
        }
      } catch (err) {
        console.error("Fetch sessions error:", err);
        setError("Lỗi kết nối server. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <NavbarTutor />
        <div className="studentlist-page">
          <div className="studentlist-container">
            <h1 className="studentlist-title">Danh sách sinh viên</h1>
            <p>Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarTutor />
      <div className="studentlist-page">
        <div className="studentlist-container">
          <h1 className="studentlist-title">Danh sách sinh viên</h1>
          <p className="studentlist-subtitle">
            Danh sách sinh viên đã đăng ký lịch tư vấn, được nhóm theo từng buổi học.
          </p>

          {error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">Chưa có sinh viên nào đăng ký lịch tư vấn.</div>
              <div className="empty-note">Sau khi có sinh viên đăng ký, danh sách sẽ xuất hiện ở đây.</div>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session, idx) => (
                <div key={idx} className="session-card">
                  <div className="session-header">
                    <h3>
                      {session.date} • {timeSlotLabels[session.timeSlot] || session.timeSlot}
                    </h3>
                    <div className="session-subject">
                      Môn: {session.subject?.subjectName || session.subject?.subjectCode || "N/A"}
                    </div>
                    <div className="session-student-count">
                      Số sinh viên: {session.studentCount}
                    </div>
                  </div>
                  
                  <div className="students-list">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Họ và tên</th>
                          <th>MSSV</th>
                          <th>Email</th>
                          <th>SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.students.map((student, sIdx) => (
                          <tr key={sIdx}>
                            <td>{student.name}</td>
                            <td>{student.studentId || "N/A"}</td>
                            <td>{student.email}</td>
                            <td>{student.phone || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
