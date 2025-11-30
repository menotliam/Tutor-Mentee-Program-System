import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/History.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timeSlotLabels = {
  "08-10": "08:00 - 10:00",
  "10-12": "10:00 - 12:00",
  "13-15": "13:00 - 15:00",
  "15-17": "15:00 - 17:00",
  "18-20": "18:00 - 20:00",
  "20-22": "20:00 - 22:00"
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutorSchedules, setTutorSchedules] = useState([]);
  const [selectedNewSchedule, setSelectedNewSchedule] = useState(null);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [changing, setChanging] = useState(false);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false); // Track layout mode

  // Lấy token từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // Fetch danh sách bookings từ backend
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để xem lịch sử");
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setBookings(data.data || []);
      } else {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        setError(data.message || "Không thể tải lịch sử đặt lịch");
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Hủy lịch
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch học này?")) {
      return;
    }

    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/bookings/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("✅ Hủy lịch thành công!");
        // Refresh danh sách
        fetchBookings();
      } else {
        alert(data.message || "Hủy lịch thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert("Lỗi kết nối server. Vui lòng thử lại.");
    }
  };

  // Helper: Kiểm tra có thể đổi lịch không (phải trước 3 tiếng)
  const canReschedule = (booking) => {
    if (!booking.isTutorSchedule || !booking.date || !booking.timeSlot) {
      return false; // Chỉ hỗ trợ TutorSchedule
    }
    
    try {
      const scheduleDate = new Date(booking.date);
      const [startHour] = booking.timeSlot.split('-').map(Number);
      const sessionStartTime = new Date(scheduleDate);
      sessionStartTime.setHours(startHour, 0, 0, 0);
      
      const now = new Date();
      const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
      
      return hoursUntilStart >= 3;
    } catch {
      return false;
    }
  };

  // Helper: Kiểm tra có thể hủy lịch không (phải trước 3 tiếng)
  const canCancel = (booking) => {
    if (!booking.isTutorSchedule || !booking.date || !booking.timeSlot) {
      return true; // Cho phép hủy nếu không phải TutorSchedule (legacy)
    }
    
    try {
      const scheduleDate = new Date(booking.date);
      const [startHour] = booking.timeSlot.split('-').map(Number);
      const sessionStartTime = new Date(scheduleDate);
      sessionStartTime.setHours(startHour, 0, 0, 0);
      
      const now = new Date();
      const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
      
      return hoursUntilStart >= 3;
    } catch {
      return false;
    }
  };

  // Bắt đầu đổi lịch
  const handleStartReschedule = async (booking) => {
    // Validation: Phải đổi trước 3 tiếng
    if (!canReschedule(booking)) {
      alert('Chỉ có thể đổi lịch trước giờ bắt đầu ít nhất 3 tiếng');
      return;
    }

    setReschedulingBookingId(booking._id);
    setSelectedTutor(null);
    setTutorSchedules([]);
    setSelectedNewSchedule(null);
    setIsRescheduleMode(true); // Chuyển sang layout 2 sidebar
    
    // Fetch danh sách tutors
    try {
      setLoadingTutors(true);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/schedules/available-tutors`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setTutors(data.data || []);
      }
    } catch (err) {
      console.error("Fetch tutors error:", err);
    } finally {
      setLoadingTutors(false);
    }
  };

  // Chọn tutor để xem lịch rảnh (toggle: click 2 lần để bỏ chọn)
  const handleSelectTutorForReschedule = async (tutor) => {
    // Nếu click vào tutor đã được chọn, bỏ chọn
    if (selectedTutor && selectedTutor.tutorId === tutor.tutorId) {
      setSelectedTutor(null);
      setTutorSchedules([]);
      setSelectedNewSchedule(null);
      return;
    }

    setSelectedTutor(tutor);
    setTutorSchedules([]);
    setSelectedNewSchedule(null);
    
    try {
      setLoadingSchedules(true);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/schedules/tutor/${tutor.tutorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setTutorSchedules(data.data || []);
      }
    } catch (err) {
      console.error("Fetch schedules error:", err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Helper: Kiểm tra time slot có hợp lệ không
  const isTimeSlotValid = (date, timeSlot) => {
    try {
      const scheduleDate = new Date(date);
      const [startHour] = timeSlot.split('-').map(Number);
      const sessionStartTime = new Date(scheduleDate);
      sessionStartTime.setHours(startHour, 0, 0, 0);
      
      const now = new Date();
      if (sessionStartTime < now) return false;
      
      const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
      return hoursUntilStart >= 3;
    } catch {
      return false;
    }
  };

  // Xác nhận đổi lịch
  const handleConfirmReschedule = async () => {
    if (!selectedNewSchedule) {
      alert('Vui lòng chọn lịch mới');
      return;
    }

    const booking = bookings.find(b => b._id === reschedulingBookingId);
    if (!booking) {
      alert('Không tìm thấy lịch cần đổi');
      return;
    }

    try {
      setChanging(true);
      const token = getAuthToken();
      
      const subject = selectedNewSchedule.schedule.subjects[0];
      if (!subject) {
        alert('Lịch rảnh không có môn học');
        return;
      }

      const res = await fetch(`${API_BASE}/bookings/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oldBookingId: booking._id,
          newScheduleId: selectedNewSchedule.schedule.scheduleId,
          newTimeSlot: selectedNewSchedule.timeSlot,
          newSubject: {
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName
          }
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Đổi lịch thành công!');
        setReschedulingBookingId(null);
        setSelectedTutor(null);
        setTutorSchedules([]);
        setSelectedNewSchedule(null);
        setIsRescheduleMode(false); // Quay lại layout 1 bar center
        // Refresh danh sách
        fetchBookings();
      } else {
        alert(data.message || 'Đổi lịch thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error("Reschedule error:", err);
      alert('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setChanging(false);
    }
  };

  // Hủy đổi lịch
  const handleCancelReschedule = () => {
    setReschedulingBookingId(null);
    setSelectedTutor(null);
    setTutorSchedules([]);
    setSelectedNewSchedule(null);
    setIsRescheduleMode(false); // Quay lại layout 1 bar center
  };

  // Format ngày giờ
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
  };

  // Map status sang tiếng Việt
  const getStatusLabel = (status) => {
    const statusMap = {
      "ACTIVE": "Đang hoạt động",
      "CANCELLED": "Đã hủy",
      "COMPLETED": "Đã đặt lịch"
    };
    return statusMap[status] || status;
  };

  // CSS class cho status
  const getStatusClass = (status) => {
    const classMap = {
      "ACTIVE": "active",
      "CANCELLED": "cancelled",
      "COMPLETED": "completed"
    };
    return classMap[status] || "pending";
  };

  return (
    <>
      <Navbar />
      <div className="history-page">
        <h2 className="history-title">Lịch sử buổi học đã đặt</h2>

        {loading ? (
          <div className="loading-container">
            <p>Đang tải lịch sử...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="btn retry" onClick={fetchBookings}>
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-container">
            <p className="muted">Chưa có buổi học nào được đặt.</p>
            <button className="btn primary" onClick={() => navigate("/calendar")}>
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          <div className={`history-container ${isRescheduleMode ? 'reschedule-mode' : ''}`}>
            {/* Lịch sử - bên trái khi reschedule mode, center khi bình thường */}
            <div className={`history-list ${isRescheduleMode ? 'history-list-left' : ''}`}>
              {bookings.map((b) => {
              // Xử lý date và time cho cả booking từ Class và TutorSchedule
              let date, time;
              if (b.isTutorSchedule) {
                // Booking từ TutorSchedule
                date = b.date ? new Date(b.date).toLocaleDateString("vi-VN") : "N/A";
                time = b.time || "N/A";
              } else {
                // Booking từ Class (legacy)
                const dt = formatDateTime(b.startTime);
                date = dt.date;
                time = dt.time;
              }
              
              return (
                <div className="history-card" key={b._id}>
                  <div className="history-info">
                    <h4>📅 {date}</h4>
                    <p>Giờ học: <strong>⏰ {time}</strong></p>
                    {b.tutorName && <p>Tutor: <strong>👨‍🏫 {b.tutorName}</strong></p>}
                    {b.subject && <p>Môn: <strong>📚 {b.subject}</strong></p>}
                    {b.timeSlot && <p>Khung giờ: <strong>🕐 {b.timeSlot}</strong></p>}
                    <p>
                      Trạng thái:{" "}
                      <span className={`status ${getStatusClass(b.status)}`}>
                        {getStatusLabel(b.status)}
                      </span>
                    </p>
                  </div>

                  <div className="history-actions">
                    {(b.status === "ACTIVE" || b.status === "COMPLETED") && (
                      <>
                        {b.isTutorSchedule && canReschedule(b) && (
                          <button 
                            className="btn change" 
                            onClick={() => handleStartReschedule(b)}
                            disabled={reschedulingBookingId === b._id}
                          >
                            Đổi lịch
                          </button>
                        )}
                        {(!b.isTutorSchedule || !canReschedule(b)) && (
                          <button 
                            className="btn change" 
                            onClick={() => navigate("/calendar")}
                            title={b.isTutorSchedule ? "Chỉ có thể đổi lịch trước giờ bắt đầu ít nhất 3 tiếng" : "Chuyển sang trang đặt lịch"}
                          >
                            Đổi lịch
                          </button>
                        )}
                        <button 
                          className="btn cancel" 
                          onClick={() => {
                            if (!canCancel(b)) {
                              alert('Chỉ có thể hủy lịch trước giờ bắt đầu ít nhất 3 tiếng');
                              return;
                            }
                            handleCancel(b._id);
                          }}
                          disabled={!canCancel(b)}
                          title={!canCancel(b) ? "Chỉ có thể hủy lịch trước giờ bắt đầu ít nhất 3 tiếng" : ""}
                        >
                          Hủy lịch
                        </button>
                      </>
                    )}
                    {b.status === "CANCELLED" && (
                      <span className="cancelled-label">Đã hủy</span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Form đổi lịch - sidebar bên phải khi reschedule mode */}
            {isRescheduleMode && reschedulingBookingId && (
              <div className="reschedule-sidebar">
                <div className="reschedule-form">
                      <h5>Chọn lịch mới:</h5>
                      
                      {/* Danh sách tutors */}
                      {loadingTutors ? (
                        <p>Đang tải danh sách tutor...</p>
                      ) : tutors.length === 0 ? (
                        <p className="muted">Không có tutor nào có lịch rảnh.</p>
                      ) : (
                        <div className="tutor-list">
                          <label>Chọn tutor:</label>
                          {tutors.map((tutor) => (
                            <button
                              key={tutor.tutorId}
                              className={`tutor-btn ${selectedTutor?.tutorId === tutor.tutorId ? 'active' : ''}`}
                              onClick={() => handleSelectTutorForReschedule(tutor)}
                            >
                              {tutor.tutorName}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Danh sách schedules của tutor đã chọn */}
                      {selectedTutor && (
                        <div className="schedule-list">
                          {loadingSchedules ? (
                            <p>Đang tải lịch rảnh...</p>
                          ) : tutorSchedules.length === 0 ? (
                            <p className="muted">Tutor này chưa có lịch rảnh nào.</p>
                          ) : (
                            <>
                              <label>Chọn lịch rảnh:</label>
                              {Object.entries(
                                tutorSchedules.reduce((acc, schedule) => {
                                  const date = schedule.date;
                                  if (!acc[date]) acc[date] = [];
                                  acc[date].push(schedule);
                                  return acc;
                                }, {})
                              ).map(([date, schedules]) => (
                                <div key={date} className="date-group">
                                  <div className="date-header">{date}</div>
                                  {schedules.map((schedule) => (
                                    <div key={schedule.scheduleId} className="schedule-card">
                                      <div className="schedule-subjects">
                                        Môn: {schedule.subjects.map(s => s.subjectName || s.subjectCode).join(", ")}
                                      </div>
                                      <div className="schedule-time-slots">
                                        {schedule.timeSlots
                                          .filter(slotInfo => isTimeSlotValid(schedule.date, slotInfo.timeSlot))
                                          .map((slotInfo) => (
                                            <button
                                              key={slotInfo.timeSlot}
                                              className={`time-slot-btn ${
                                                selectedNewSchedule?.schedule.scheduleId === schedule.scheduleId &&
                                                selectedNewSchedule?.timeSlot === slotInfo.timeSlot
                                                  ? "active"
                                                  : ""
                                              } ${slotInfo.isFull ? "disabled" : ""}`}
                                              onClick={() => {
                                                if (!slotInfo.isFull) {
                                                  setSelectedNewSchedule({ schedule, timeSlot: slotInfo.timeSlot, slotInfo });
                                                }
                                              }}
                                              disabled={slotInfo.isFull}
                                            >
                                              {timeSlotLabels[slotInfo.timeSlot] || slotInfo.timeSlot}
                                              <span>({slotInfo.availableSlots}/{slotInfo.maxCapacity})</span>
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="reschedule-actions">
                        <button
                          className="btn confirm"
                          onClick={handleConfirmReschedule}
                          disabled={!selectedNewSchedule || changing}
                        >
                          {changing ? "Đang xử lý..." : "Xác nhận đổi lịch"}
                        </button>
                        <button
                          className="btn cancel"
                          onClick={handleCancelReschedule}
                          disabled={changing}
                        >
                          Hủy
                        </button>
                      </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="history-footer">
          <button className="btn secondary" onClick={fetchBookings}>
            🔄 Làm mới
          </button>
          <button className="btn primary" onClick={() => navigate("/calendar")}>
            ➕ Đặt lịch mới
          </button>
        </div>
      </div>
    </>
  );
}
