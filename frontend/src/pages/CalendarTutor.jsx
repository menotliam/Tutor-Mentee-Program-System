import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import NavbarTutor from "../components/NavbarTutor";
import "../styles/CalendarTutor.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timeSlots = [
  { id: "08-10", label: "08:00 - 10:00" },
  { id: "10-12", label: "10:00 - 12:00" },
  { id: "13-15", label: "13:00 - 15:00" },
  { id: "15-17", label: "15:00 - 17:00" },
  { id: "18-20", label: "18:00 - 20:00" },
  { id: "20-22", label: "20:00 - 22:00" },
];

export default function CalendarTutor() {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState([]);
  const [schedule, setSchedule] = useState({}); // { date: { timeSlots: [], subjects: [], notes: '' } }
  const [teachingSubjects, setTeachingSubjects] = useState([]);
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [originalSchedules, setOriginalSchedules] = useState({}); // Lưu dữ liệu ban đầu để so sánh
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingScheduleKey, setEditingScheduleKey] = useState(null); // Track schedule đang được edit

  // Lấy token từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // Fetch teaching subjects
  useEffect(() => {
    const fetchTeachingSubjects = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/tutors/teaching-subjects`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setTeachingSubjects(data.data || []);
        } else {
          if (res.status === 401) {
            localStorage.removeItem("authToken");
            navigate("/login");
            return;
          }
          setError(data.message || "Không thể tải danh sách môn học");
        }
      } catch (err) {
        console.error("Fetch teaching subjects error:", err);
        setError("Lỗi kết nối server. Vui lòng thử lại.");
      }
    };

    fetchTeachingSubjects();
  }, [navigate]);

  // Function để fetch schedules (có thể dùng lại)
  const fetchSchedules = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/schedules`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const schedules = data.data || [];
        setExistingSchedules(schedules);

        // Load existing schedules vào state
        // Mỗi schedule sẽ có unique key để có thể có nhiều schedules cùng ngày
        const scheduleMap = {};
        const originalMap = {}; // Lưu dữ liệu ban đầu để so sánh
        const datesSet = new Set();
        
        schedules.forEach((sched) => {
          // Chỉ lấy subject đầu tiên nếu có nhiều subjects (tương thích với dữ liệu cũ)
          const subjects = sched.subjects || [];
          const scheduleKey = `${sched.date}-${sched._id}`; // Unique key cho mỗi schedule
          const scheduleData = {
            date: sched.date,
            timeSlots: sched.timeSlots || [],
            subjects: subjects.length > 0 ? [subjects[0]] : [], // Chỉ lấy 1 subject
            notes: sched.notes || "",
            scheduleId: sched._id,
            isNew: false, // Đánh dấu là schedule đã tồn tại
          };
          
          scheduleMap[scheduleKey] = scheduleData;
          // Lưu bản copy để so sánh sau này
          originalMap[scheduleKey] = {
            timeSlots: [...(sched.timeSlots || [])],
            subjects: subjects.length > 0 ? [{ ...subjects[0] }] : [],
            notes: sched.notes || "",
          };
          datesSet.add(sched.date);
        });
        
        setSchedule(scheduleMap);
        setOriginalSchedules(originalMap);
        
        // Khởi tạo selectedDates với các ngày có schedules (để hiển thị ban đầu)
        setSelectedDates(Array.from(datesSet));
      } else {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        console.error("Error fetching schedules:", data.message);
      }
    } catch (err) {
      console.error("Fetch schedules error:", err);
    }
  }, [navigate]);

  // Fetch existing schedules
  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      await fetchSchedules();
      setLoading(false);
    };

    if (teachingSubjects.length > 0) {
      loadSchedules();
    }
  }, [teachingSubjects, fetchSchedules]);

  // Helper function để format date theo local timezone (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function để lấy tất cả schedules cho một ngày
  const getSchedulesForDate = (dateStr) => {
    return Object.entries(schedule).filter(([, sched]) => sched.date === dateStr);
  };

  // Memoize selectedDates để tránh re-render không cần thiết
  const selectedDatesSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const handleDateClick = (date) => {
    // Kiểm tra ngày quá khứ và ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    
    // Chỉ cho phép tạo lịch từ ngày tiếp theo (không cho ngày hôm nay)
    if (clickedDate <= today) {
      alert("Chỉ có thể tạo lịch rảnh từ ngày tiếp theo!");
      return;
    }

    const formatted = formatDateLocal(date);
    const isSelected = selectedDatesSet.has(formatted);
    const schedulesForDate = getSchedulesForDate(formatted);
    
    // Lấy schedules mới (chưa lưu) cho ngày này
    const newSchedules = schedulesForDate.filter(([, sched]) => !sched.scheduleId);
    const hasNewSchedules = newSchedules.length > 0;
    
    // Lấy schedules đã lưu cho ngày này
    const savedSchedules = schedulesForDate.filter(([, sched]) => sched.scheduleId);
    const hasSavedSchedules = savedSchedules.length > 0;

    // Nếu đang được chọn (có trong selectedDates)
    if (isSelected) {
      // Nếu có schedules mới, bỏ chọn bằng cách xóa schedules mới
      if (hasNewSchedules) {
        setSchedule((prev) => {
          const newSchedule = { ...prev };
          newSchedules.forEach(([key]) => {
            delete newSchedule[key];
          });
          return newSchedule;
        });

        setOriginalSchedules((prev) => {
          const newOriginal = { ...prev };
          newSchedules.forEach(([key]) => {
            delete newOriginal[key];
          });
          return newOriginal;
        });

        // Bỏ chọn ngày (xóa khỏi selectedDates)
        setSelectedDates((prev) => prev.filter((d) => d !== formatted));
        return;
      }
      
      // Nếu chỉ có schedules đã lưu, chỉ bỏ chọn (không xóa schedules)
      if (hasSavedSchedules && !hasNewSchedules) {
        setSelectedDates((prev) => prev.filter((d) => d !== formatted));
        return;
      }
    }

    // Nếu chưa được chọn, thêm vào selectedDates và tạo schedule mới
    if (!isSelected) {
      setSelectedDates((prev) => [...prev, formatted]);
      
      const scheduleKey = `${formatted}-${Date.now()}`;
      setSchedule((prev) => ({
        ...prev,
        [scheduleKey]: {
          date: formatted,
          timeSlots: [],
          subjects: [],
          notes: "",
          isNew: true,
        },
      }));
      
      // Tự động load schedule mới vào form edit
      setEditingScheduleKey(scheduleKey);
    } else {
      // Nếu đã được chọn, load schedule đầu tiên của ngày đó vào form edit
      const schedulesForDate = getSchedulesForDate(formatted);
      if (schedulesForDate.length > 0) {
        setEditingScheduleKey(schedulesForDate[0][0]);
      }
    }
  };

  // Lấy danh sách timeSlots đã được sử dụng trong ngày đó
  const getUsedTimeSlotsForDate = (date) => {
    const usedSlots = new Set();
    Object.values(schedule).forEach((sched) => {
      if (sched.date === date && sched.timeSlots) {
        sched.timeSlots.forEach((slot) => usedSlots.add(slot));
      }
    });
    return Array.from(usedSlots);
  };

  // Ref để tránh duplicate alerts (không gây re-render)
  const lastAlertRef = useRef({ message: '', time: 0 });

  const toggleSlot = (scheduleKey, slotId) => {
    setSchedule((prev) => {
      const current = prev[scheduleKey] || { timeSlots: [], subjects: [], notes: "" };
      const timeSlots = current.timeSlots || [];
      
      // Kiểm tra xem timeSlot này đã được sử dụng trong ngày đó chưa (trừ schedule hiện tại)
      const date = current.date;
      const usedSlots = getUsedTimeSlotsForDate(date);
      if (!timeSlots.includes(slotId) && usedSlots.includes(slotId)) {
        const message = `Khung giờ ${slotId} đã được sử dụng trong ngày này. Vui lòng chọn khung giờ khác!`;
        const now = Date.now();
        // Chỉ hiển thị alert nếu chưa hiển thị trong 500ms gần đây
        if (lastAlertRef.current.message !== message || now - lastAlertRef.current.time > 500) {
          alert(message);
          lastAlertRef.current = { message, time: now };
        }
        return prev;
      }
      
      return {
        ...prev,
        [scheduleKey]: {
          ...current,
          timeSlots: timeSlots.includes(slotId)
            ? timeSlots.filter((s) => s !== slotId)
            : [...timeSlots, slotId],
        },
      };
    });
  };

  const selectSubject = (scheduleKey, subject) => {
    setSchedule((prev) => {
      const current = prev[scheduleKey] || { timeSlots: [], subjects: [], notes: "" };
      // Chỉ cho chọn 1 môn học - thay thế môn học cũ bằng môn học mới
      return {
        ...prev,
        [scheduleKey]: {
          ...current,
          subjects: [subject], // Chỉ lưu 1 môn học
        },
      };
    });
  };

  const updateNotes = (scheduleKey, notes) => {
    setSchedule((prev) => {
      const current = prev[scheduleKey] || { timeSlots: [], subjects: [], notes: "" };
      return {
        ...prev,
        [scheduleKey]: {
          ...current,
          notes,
        },
      };
    });
  };

  // Function để click vào schedule trong sidebar để edit
  const handleEditSchedule = (scheduleKey) => {
    // Chỉ cho phép edit 1 schedule tại một thời điểm
    setEditingScheduleKey(scheduleKey);
    
    // Đảm bảo ngày này được thêm vào selectedDates nếu chưa có
    const scheduleData = schedule[scheduleKey];
    if (scheduleData) {
      const dateStr = scheduleData.date;
      setSelectedDates((prev) => {
        if (!prev.includes(dateStr)) {
          return [...prev, dateStr];
        }
        return prev;
      });
    }
  };

  const removeSchedule = async (scheduleKey) => {
    const scheduleData = schedule[scheduleKey];
    const scheduleId = scheduleData?.scheduleId;
    
    // Nếu đang edit schedule này, reset editingScheduleKey
    if (editingScheduleKey === scheduleKey) {
      setEditingScheduleKey(null);
    }

    // Nếu có scheduleId, xóa từ backend
    if (scheduleId) {
      if (
        !window.confirm(
          "Bạn có chắc chắn muốn xóa lịch rảnh này không?"
        )
      ) {
        return;
      }

      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/schedules/${scheduleId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Xóa khỏi UI
          const newSchedule = { ...schedule };
          delete newSchedule[scheduleKey];
          setSchedule(newSchedule);
          
          // Xóa khỏi originalSchedules
          const newOriginal = { ...originalSchedules };
          delete newOriginal[scheduleKey];
          setOriginalSchedules(newOriginal);
          
          setExistingSchedules(
            existingSchedules.filter((s) => s._id !== scheduleId)
          );
          
          // Kiểm tra xem còn schedule nào cho ngày đó không
          const date = scheduleData.date;
          const hasOtherSchedules = Object.values(newSchedule).some(
            (s) => s.date === date
          );
          if (!hasOtherSchedules) {
            setSelectedDates((prev) => prev.filter((d) => d !== date));
          }
        } else {
          alert(data.message || "Không thể xóa lịch rảnh");
        }
      } catch (err) {
        console.error("Delete schedule error:", err);
        alert("Lỗi kết nối server. Vui lòng thử lại.");
      }
    } else {
      // Chỉ xóa khỏi UI nếu chưa lưu
      const newSchedule = { ...schedule };
      delete newSchedule[scheduleKey];
      setSchedule(newSchedule);
      
      // Xóa khỏi originalSchedules nếu có (cho trường hợp schedule mới)
      const newOriginal = { ...originalSchedules };
      delete newOriginal[scheduleKey];
      setOriginalSchedules(newOriginal);
      
      // Kiểm tra xem còn schedule nào cho ngày đó không
      const date = scheduleData?.date;
      if (date) {
        const hasOtherSchedules = Object.values(newSchedule).some(
          (s) => s.date === date
        );
        if (!hasOtherSchedules) {
          setSelectedDates((prev) => prev.filter((d) => d !== date));
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Validate từng schedule (có thể có nhiều schedules cho cùng 1 ngày)
    const errors = [];
    const schedulesToCreate = []; // Schedules mới cần tạo
    const schedulesToUpdate = []; // Schedules cũ cần cập nhật
    
    Object.entries(schedule).forEach(([scheduleKey, sched]) => {
      if (!sched.date) {
        errors.push(`Schedule ${scheduleKey}: Chưa có ngày`);
        return;
      }
      
      // Validate timeSlots - phải có ít nhất 1
      if (!sched.timeSlots || sched.timeSlots.length === 0) {
        errors.push(`Ngày ${sched.date}: Vui lòng chọn ít nhất một khung giờ`);
        return;
      }
      
      // Validate subjects - phải có đúng 1 môn học
      if (!sched.subjects || sched.subjects.length === 0) {
        errors.push(`${sched.date}: Vui lòng chọn một môn học`);
        return;
      }
      
      if (sched.subjects.length !== 1) {
        errors.push(`${sched.date}: Chỉ được chọn một môn học`);
        return;
      }
      
      // Phân loại: schedule mới hay schedule cần cập nhật
      if (sched.scheduleId) {
        // Schedule đã tồn tại - kiểm tra xem có thay đổi không
        const original = originalSchedules[scheduleKey];
        if (!original) {
          // Không tìm thấy original data, bỏ qua (có thể đã bị xóa)
          return;
        }
        
        // So sánh dữ liệu hiện tại với dữ liệu ban đầu
        const currentTimeSlots = [...(sched.timeSlots || [])].sort();
        const originalTimeSlots = [...(original.timeSlots || [])].sort();
        const timeSlotsChanged = JSON.stringify(currentTimeSlots) !== JSON.stringify(originalTimeSlots);
        
        const currentSubjectCode = sched.subjects?.[0]?.subjectCode;
        const originalSubjectCode = original.subjects?.[0]?.subjectCode;
        const subjectChanged = currentSubjectCode !== originalSubjectCode;
        
        const notesChanged = (sched.notes || "") !== (original.notes || "");
        
        // Chỉ thêm vào updates nếu có thay đổi
        if (timeSlotsChanged || subjectChanged || notesChanged) {
          schedulesToUpdate.push({
            scheduleId: sched.scheduleId,
            date: sched.date,
            timeSlots: sched.timeSlots,
            subjects: sched.subjects, // Array với 1 phần tử
            notes: sched.notes || "",
          });
        }
      } else {
        // Schedule mới - cần tạo
        schedulesToCreate.push({
          date: sched.date,
          timeSlots: sched.timeSlots,
          subjects: sched.subjects, // Array với 1 phần tử
          notes: sched.notes || "",
        });
      }
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    if (schedulesToCreate.length === 0 && schedulesToUpdate.length === 0) {
      alert(
        "Không có thay đổi nào để lưu!"
      );
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();

      if (!token) {
        alert("Vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      // Gửi cả schedules mới và schedules cần cập nhật
      const res = await fetch(`${API_BASE}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          schedules: schedulesToCreate,
          updates: schedulesToUpdate 
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Cập nhật state thay vì reload
        if (data.data && data.data.length > 0) {
          alert(`✅ ${data.message || "Lưu lịch rảnh thành công!"}`);
          
          // Fetch lại schedules để cập nhật danh sách
          await fetchSchedules();
          
          // Reset editingScheduleKey sau khi save thành công
          setEditingScheduleKey(null);
        } else {
          // Không có thay đổi nào được lưu
          alert("Không thể thay đổi lịch rảnh hiện tại!");
        }
      } else {
        alert(data.message || "Lưu lịch rảnh thất bại. Vui lòng thử lại.");
        if (data.errors && data.errors.length > 0) {
          console.error("Errors:", data.errors);
        }
      }
    } catch (err) {
      console.error("Save schedule error:", err);
      alert("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavbarTutor />
        <div className="tutorcalendar-container">
          <h1 className="tutortitle">Đang tải lịch tư vấn...</h1>
        </div>
      </>
    );
  }

  if (error && teachingSubjects.length === 0) {
    return (
      <>
        <NavbarTutor />
        <div className="tutorcalendar-container">
          <h1 className="tutortitle">Cập nhật lịch tư vấn</h1>
          <p className="error-text">{error}</p>
          <p>
            Vui lòng cập nhật danh sách môn học trong profile trước khi tạo
            lịch rảnh.
          </p>
        </div>
      </>
    );
  }

  // Lấy danh sách schedules đã lưu (có scheduleId) để hiển thị trong sidebar
  const savedSchedulesList = Object.entries(schedule).filter(
    ([, sched]) => sched.scheduleId
  );

  // Lấy schedule đang được edit
  const editingSchedule = editingScheduleKey ? schedule[editingScheduleKey] : null;

  return (
    <>
      <NavbarTutor />
      <div className="tutorcalendar-container">
        <h1 className="tutortitle">Cập nhật lịch tư vấn</h1>

        {error && <p className="error-text">{error}</p>}

        <div className="calendar-main-layout">
          {/* Cột trái: Calendar */}
          <div className="calendar-column">
            <div className="calendar-card">
              <Calendar
                onClickDay={handleDateClick}
                minDate={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  return tomorrow;
                })()}
                tileDisabled={({ date }) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const checkDate = new Date(date);
                  checkDate.setHours(0, 0, 0, 0);
                  // Disable ngày hôm nay và các ngày quá khứ
                  return checkDate <= today;
                }}
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return '';
                  
                  const dateStr = formatDateLocal(date);
                  const isSelected = selectedDatesSet.has(dateStr);
                  
                  return isSelected ? "tutorreact-calendar__tile--active" : "";
                }}
              />
            </div>
          </div>

          {/* Cột giữa: Form edit schedule */}
          <div className="edit-column">
            {editingSchedule ? (
              <div className="schedule-card">
                <div className="schedule-header">
                  <h3>
                    {editingSchedule.date}
                    {editingSchedule.scheduleId && (
                      <span className="muted-text" style={{ fontSize: "12px", marginLeft: "8px" }}>
                        (Đã lưu)
                      </span>
                    )}
                  </h3>
                  <button
                    className="remove-btn"
                    onClick={() => {
                      setEditingScheduleKey(null);
                    }}
                    title="Đóng form chỉnh sửa"
                  >
                    ✕
                  </button>
                </div>

                <div className="schedule-content">
                  <div className="slots-section">
                    <h4>Khung giờ:</h4>
                    <div className="slots-grid">
                      {timeSlots.map((slot) => {
                        const active = editingSchedule.timeSlots?.includes(slot.id);
                        const usedTimeSlots = getUsedTimeSlotsForDate(editingSchedule.date);
                        const disabled = usedTimeSlots.includes(slot.id) && 
                                       !editingSchedule.timeSlots?.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            className={`slot-btn ${active ? "active" : ""} ${
                              disabled ? "disabled" : ""
                            }`}
                            onClick={() => toggleSlot(editingScheduleKey, slot.id)}
                            disabled={disabled}
                            title={disabled ? "Khung giờ này đã được sử dụng" : ""}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                    {editingSchedule.timeSlots?.length > 0 && (
                      <p className="muted-text" style={{ fontSize: "12px", marginTop: "8px" }}>
                        Đã chọn: {editingSchedule.timeSlots.length} khung giờ
                      </p>
                    )}
                  </div>

                  <div className="subjects-section">
                    <h4>Môn học: <span style={{ color: "red" }}>*</span></h4>
                    {teachingSubjects.length === 0 ? (
                      <p className="warning-text">
                        Vui lòng cập nhật danh sách môn học trong profile trước.
                      </p>
                    ) : (
                      <div className="subjects-radio-group">
                        {teachingSubjects.map((subject) => {
                          const isSelected = editingSchedule.subjects?.some(
                            (s) => s.subjectCode === subject.subjectCode
                          );
                          return (
                            <label
                              key={subject.subjectCode}
                              className={`subject-radio-label ${
                                isSelected ? "selected" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`subject-${editingScheduleKey}`}
                                value={subject.subjectCode}
                                checked={isSelected}
                                onChange={() => selectSubject(editingScheduleKey, subject)}
                              />
                              <span className="subject-radio-text">
                                {subject.subjectName || subject.subjectCode}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="notes-section">
                    <h4>Ghi chú (tùy chọn):</h4>
                    <textarea
                      className="notes-textarea"
                      placeholder="Nhập ghi chú cho lịch này..."
                      value={editingSchedule.notes || ""}
                      onChange={(e) => updateNotes(editingScheduleKey, e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-edit-message">
                <p>Chọn một lịch từ danh sách bên phải để chỉnh sửa, hoặc chọn ngày trên lịch để tạo mới.</p>
              </div>
            )}

            {/* Hiển thị schedules mới (chưa lưu) nếu có */}
            {Object.entries(schedule)
              .filter(([key, sched]) => !sched.scheduleId && key !== editingScheduleKey)
              .map(([scheduleKey, sched]) => {
                const usedTimeSlots = getUsedTimeSlotsForDate(sched.date);
                const isUsedSlot = (slotId) => {
                  return usedTimeSlots.includes(slotId) && 
                         !sched.timeSlots?.includes(slotId);
                };
                
                return (
                  <div className="schedule-card" key={scheduleKey}>
                    <div className="schedule-header">
                      <h3>{sched.date} <span className="muted-text" style={{ fontSize: "12px" }}>(Mới)</span></h3>
                      <button
                        className="remove-btn"
                        onClick={() => removeSchedule(scheduleKey)}
                      >
                        X
                      </button>
                    </div>

                    <div className="schedule-content">
                      <div className="slots-section">
                        <h4>Khung giờ:</h4>
                        <div className="slots-grid">
                          {timeSlots.map((slot) => {
                            const active = sched.timeSlots?.includes(slot.id);
                            const disabled = isUsedSlot(slot.id);
                            return (
                              <button
                                key={slot.id}
                                className={`slot-btn ${active ? "active" : ""} ${
                                  disabled ? "disabled" : ""
                                }`}
                                onClick={() => toggleSlot(scheduleKey, slot.id)}
                                disabled={disabled}
                                title={disabled ? "Khung giờ này đã được sử dụng" : ""}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="subjects-section">
                        <h4>Môn học: <span style={{ color: "red" }}>*</span></h4>
                        {teachingSubjects.length === 0 ? (
                          <p className="warning-text">
                            Vui lòng cập nhật danh sách môn học trong profile trước.
                          </p>
                        ) : (
                          <div className="subjects-radio-group">
                            {teachingSubjects.map((subject) => {
                              const isSelected = sched.subjects?.some(
                                (s) => s.subjectCode === subject.subjectCode
                              );
                              return (
                                <label
                                  key={subject.subjectCode}
                                  className={`subject-radio-label ${
                                    isSelected ? "selected" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`subject-${scheduleKey}`}
                                    value={subject.subjectCode}
                                    checked={isSelected}
                                    onChange={() => selectSubject(scheduleKey, subject)}
                                  />
                                  <span className="subject-radio-text">
                                    {subject.subjectName || subject.subjectCode}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="notes-section">
                        <h4>Ghi chú (tùy chọn):</h4>
                        <textarea
                          className="notes-textarea"
                          placeholder="Nhập ghi chú cho lịch này..."
                          value={sched.notes || ""}
                          onChange={(e) => updateNotes(scheduleKey, e.target.value)}
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Nút lưu duy nhất cho cả tạo mới và cập nhật */}
            {(editingScheduleKey || Object.keys(schedule).filter(key => !schedule[key].scheduleId).length > 0) && (
              <button
                className="save-btn"
                onClick={handleSubmit}
                disabled={saving}
                style={{ marginTop: "20px", width: "100%" }}
              >
                {saving ? "Đang lưu..." : "Lưu lịch rảnh"}
              </button>
            )}
          </div>

          {/* Cột phải: Sidebar danh sách schedules đã lưu */}
          <div className="sidebar-column">
            <div className="schedules-sidebar">
              <h3 className="sidebar-title">Lịch đã lưu</h3>
              {savedSchedulesList.length === 0 ? (
                <p className="sidebar-empty">Chưa có lịch nào được lưu</p>
              ) : (
                <div className="schedules-list">
                  {savedSchedulesList.map(([scheduleKey, sched]) => {
                    const subjectName = sched.subjects?.[0]?.subjectName || sched.subjects?.[0]?.subjectCode || "Chưa chọn môn";
                    const timeSlotsText = sched.timeSlots?.length > 0 
                      ? sched.timeSlots.map(slotId => {
                          const slot = timeSlots.find(s => s.id === slotId);
                          return slot ? slot.label : slotId;
                        }).join(", ")
                      : "Chưa chọn khung giờ";
                    const isEditing = editingScheduleKey === scheduleKey;
                    
                    return (
                      <div
                        key={scheduleKey}
                        className={`schedule-item ${isEditing ? "active" : ""}`}
                        onClick={() => handleEditSchedule(scheduleKey)}
                      >
                        <div className="schedule-item-header">
                          <h4>{sched.date}</h4>
                          {isEditing && <span className="editing-badge">Đang chỉnh sửa</span>}
                        </div>
                        <div className="schedule-item-content">
                          <p className="schedule-item-subject">
                            <strong>Môn:</strong> {subjectName}
                          </p>
                          <p className="schedule-item-time">
                            <strong>Giờ:</strong> {timeSlotsText}
                          </p>
                          {sched.notes && (
                            <p className="schedule-item-notes">
                              <strong>Ghi chú:</strong> {sched.notes.substring(0, 50)}
                              {sched.notes.length > 50 ? "..." : ""}
                            </p>
                          )}
                        </div>
                        <button
                          className="schedule-item-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSchedule(scheduleKey);
                          }}
                          title="Xóa lịch này"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
