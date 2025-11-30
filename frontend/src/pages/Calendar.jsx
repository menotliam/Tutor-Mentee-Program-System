import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/Calendar.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timeSlotLabels = {
  "08-10": "08:00 - 10:00",
  "10-12": "10:00 - 12:00",
  "13-15": "13:00 - 15:00",
  "15-17": "15:00 - 17:00",
  "18-20": "18:00 - 20:00",
  "20-22": "20:00 - 22:00"
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutorSchedules, setTutorSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);

  // Lấy token từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // Fetch danh sách tutor có lịch rảnh
  const fetchAvailableTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để xem lịch học");
        navigate("/login");
        return;
      }

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
      } else {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        setError(data.message || "Không thể tải danh sách tutor");
      }
    } catch (err) {
      console.error("Fetch tutors error:", err);
      setError("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch lịch rảnh của tutor được chọn
  const fetchTutorSchedules = async (tutorId) => {
    try {
      setLoadingSchedules(true);
      setTutorSchedules([]);
      setSelectedSchedule(null);

      const token = getAuthToken();
      if (!token) {
        return;
      }

      const res = await fetch(`${API_BASE}/schedules/tutor/${tutorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setTutorSchedules(data.data || []);
      } else {
        console.error("Error fetching schedules:", data.message);
      }
    } catch (err) {
      console.error("Fetch schedules error:", err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchAvailableTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý chọn tutor
  const handleSelectTutor = (tutor) => {
    setSelectedTutor(tutor);
    fetchTutorSchedules(tutor.tutorId);
  };

  // Helper: Kiểm tra time slot có hợp lệ để book không (không quá khứ và đủ 3 tiếng trước)
  const isTimeSlotValid = (date, timeSlot) => {
    try {
      const scheduleDate = new Date(date);
      const [startHour] = timeSlot.split('-').map(Number);
      
      // Tạo Date object cho giờ bắt đầu buổi học
      const sessionStartTime = new Date(scheduleDate);
      sessionStartTime.setHours(startHour, 0, 0, 0);
      
      const now = new Date();
      
      // Kiểm tra 1: Không cho book lịch trong quá khứ
      if (sessionStartTime < now) {
        return false;
      }
      
      // Kiểm tra 2: Phải book trước giờ bắt đầu ít nhất 3 tiếng
      const hoursUntilStart = (sessionStartTime - now) / (1000 * 60 * 60);
      if (hoursUntilStart < 3) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error validating time slot:', err);
      return false;
    }
  };

  // Xử lý chọn lịch rảnh
  const handleSelectSchedule = (schedule, timeSlot) => {
    const slotInfo = schedule.timeSlots.find(ts => ts.timeSlot === timeSlot);
    if (!slotInfo || slotInfo.isFull) {
      return;
    }
    
    // Kiểm tra time slot có hợp lệ không
    if (!isTimeSlotValid(schedule.date, timeSlot)) {
      alert('Không thể đặt lịch cho khung giờ này. Phải đặt trước giờ bắt đầu ít nhất 3 tiếng.');
      return;
    }
    
    setSelectedSchedule({ schedule, timeSlot, slotInfo });
  };

  // Xử lý đặt lịch
  const handleBooking = async () => {
    if (!selectedSchedule) {
      alert("Vui lòng chọn một lịch rảnh trước khi xác nhận.");
      return;
    }

    try {
      setBooking(true);
      const token = getAuthToken();
      
      if (!token) {
        alert("Vui lòng đăng nhập để đặt lịch");
        navigate("/login");
        return;
      }

      // Lấy subject đầu tiên của schedule
      const subject = selectedSchedule.schedule.subjects[0];
      if (!subject) {
        alert("Lịch rảnh không có môn học. Vui lòng chọn lịch khác.");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings/book-tutor-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule.schedule.scheduleId,
          timeSlot: selectedSchedule.timeSlot,
          subject: {
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName
          }
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("🎉 Đặt lịch thành công! Xem chi tiết trong trang Lịch sử.");
        setSelectedSchedule(null);
        // Refresh lịch rảnh của tutor
        if (selectedTutor) {
          fetchTutorSchedules(selectedTutor.tutorId);
        }
      } else {
        alert(data.message || "Đặt lịch thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setBooking(false);
    }
  };

  // Group schedules by date
  const groupedByDate = tutorSchedules.reduce((acc, schedule) => {
    const date = schedule.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(schedule);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="booking-page">
        <div className="booking-container">
          <h2 className="booking-title">Đăng ký lịch tư vấn với Tutor</h2>
          <p className="booking-subtitle">
            Chọn tutor và xem lịch rảnh của họ để đăng ký buổi tư vấn phù hợp với bạn.
          </p>

          {loading ? (
            <div className="loading-container">
              <p>Đang tải danh sách tutor...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="btn retry" onClick={fetchAvailableTutors}>
                Thử lại
              </button>
            </div>
          ) : tutors.length === 0 ? (
            <div className="empty-container">
              <p className="muted">Hiện tại không có tutor nào có lịch rảnh.</p>
              <button className="btn retry" onClick={fetchAvailableTutors}>
                Tải lại
              </button>
            </div>
          ) : (
            <div className="schedule-area">
              {/* Cột trái: Danh sách tutor */}
              <div className="schedule-left">
                <div className="schedule-list">
                  <h4>Danh sách Tutor</h4>
                  
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.tutorId}
                      className={`class-card ${selectedTutor?.tutorId === tutor.tutorId ? "class-card--active" : ""}`}
                      onClick={() => handleSelectTutor(tutor)}
                    >
                      <div className="class-name">👨‍🏫 {tutor.tutorName}</div>
                      <div className="class-tutor">📧 {tutor.tutorEmail}</div>
                      <div className="class-slots">
                        📅 {tutor.availableDatesCount} ngày có lịch rảnh
                      </div>
                      {tutor.subjects && tutor.subjects.length > 0 && (
                        <div className="class-subjects">
                          Môn: {tutor.subjects.map(s => s.subjectName || s.subjectCode).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột giữa: Lịch rảnh của tutor */}
              <div className="schedule-middle">
                <h4>
                  {selectedTutor 
                    ? `Lịch rảnh của ${selectedTutor.tutorName}` 
                    : "Chọn tutor để xem lịch rảnh"}
                </h4>
                
                {!selectedTutor ? (
                  <p className="muted">Vui lòng chọn một tutor ở bên trái.</p>
                ) : loadingSchedules ? (
                  <div className="loading-container">
                    <p>Đang tải lịch rảnh...</p>
                  </div>
                ) : tutorSchedules.length === 0 ? (
                  <p className="muted">Tutor này chưa có lịch rảnh nào.</p>
                ) : (
                  <div className="schedules-list">
                    {Object.keys(groupedByDate).map((date) => {
                      // Filter các schedule có ít nhất 1 time slot hợp lệ
                      const validSchedules = groupedByDate[date].filter((schedule) => {
                        return schedule.timeSlots.some(slotInfo => 
                          isTimeSlotValid(schedule.date, slotInfo.timeSlot)
                        );
                      });

                      // Chỉ hiển thị date group nếu có ít nhất 1 schedule hợp lệ
                      if (validSchedules.length === 0) {
                        return null;
                      }

                      return (
                        <div key={date} className="date-group">
                          <div className="date-header">{date}</div>
                          {validSchedules.map((schedule) => {
                            // Filter time slots hợp lệ cho mỗi schedule
                            const validTimeSlots = schedule.timeSlots.filter(slotInfo => 
                              isTimeSlotValid(schedule.date, slotInfo.timeSlot)
                            );

                            // Chỉ hiển thị schedule nếu có ít nhất 1 time slot hợp lệ
                            if (validTimeSlots.length === 0) {
                              return null;
                            }

                            return (
                              <div key={schedule.scheduleId} className="schedule-card">
                                <div className="schedule-subjects">
                                  Môn: {schedule.subjects.map(s => s.subjectName || s.subjectCode).join(", ")}
                                </div>
                                <div className="schedule-time-slots">
                                  {validTimeSlots.map((slotInfo) => (
                                <button
                                  key={slotInfo.timeSlot}
                                  className={`time-slot-btn ${
                                    selectedSchedule?.schedule.scheduleId === schedule.scheduleId &&
                                    selectedSchedule?.timeSlot === slotInfo.timeSlot
                                      ? "time-slot-btn--active"
                                      : ""
                                  } ${slotInfo.isFull ? "time-slot-btn--full" : ""}`}
                                  onClick={() => handleSelectSchedule(schedule, slotInfo.timeSlot)}
                                  disabled={slotInfo.isFull}
                                  title={slotInfo.isFull ? "Đã đầy" : `${slotInfo.availableSlots} chỗ còn lại`}
                                >
                                  {timeSlotLabels[slotInfo.timeSlot] || slotInfo.timeSlot}
                                  <span className="slot-availability">
                                    ({slotInfo.availableSlots}/{slotInfo.maxCapacity})
                                  </span>
                                </button>
                                  ))}
                                </div>
                                {schedule.notes && (
                                  <div className="schedule-notes">📝 {schedule.notes}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cột phải: Chi tiết lịch đã chọn */}
              <div className="schedule-right">
                <h4>Chi tiết lịch đã chọn</h4>
                
                {!selectedSchedule ? (
                  <p className="muted">Vui lòng chọn một khung giờ ở giữa.</p>
                ) : (
                  <div className="selected-class-detail">
                    <div className="detail-item">
                      <strong>Tutor:</strong> {selectedSchedule.schedule.tutorName}
                    </div>
                    <div className="detail-item">
                      <strong>Ngày:</strong> {selectedSchedule.schedule.date}
                    </div>
                    <div className="detail-item">
                      <strong>Khung giờ:</strong> {timeSlotLabels[selectedSchedule.timeSlot] || selectedSchedule.timeSlot}
                    </div>
                    <div className="detail-item">
                      <strong>Môn học:</strong> {selectedSchedule.schedule.subjects[0]?.subjectName || selectedSchedule.schedule.subjects[0]?.subjectCode}
                    </div>
                    <div className="detail-item">
                      <strong>Số chỗ còn:</strong> {selectedSchedule.slotInfo.availableSlots}/{selectedSchedule.slotInfo.maxCapacity}
                    </div>
                    {selectedSchedule.schedule.notes && (
                      <div className="detail-item">
                        <strong>Ghi chú:</strong> {selectedSchedule.schedule.notes}
                      </div>
                    )}

                    <div className="confirm-row">
                      <button
                        className="btn confirm"
                        onClick={handleBooking}
                        disabled={booking || selectedSchedule.slotInfo.isFull}
                      >
                        {booking ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                      </button>
                      <button 
                        className="btn cancel" 
                        onClick={() => setSelectedSchedule(null)}
                      >
                        Hủy chọn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hint">
            <small>
              Lưu ý: Sau khi xác nhận, buổi học sẽ xuất hiện trong trang <strong>Lịch sử</strong>.
              Bạn có thể hủy hoặc đổi lịch trong trang Lịch sử.
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
