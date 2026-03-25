import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FacultySelectionModal from '../components/FacultySelectionModal';
import '../styles/TutorRegister.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function TutorRegister() {
  const navigate = useNavigate();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [gpaCheckResult, setGpaCheckResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const requirements = [
    {
      title: 'Yêu cầu về học tập',
      items: [
        'GPA tổng trung bình từ 3.2 trở lên',
        'Điểm của môn đăng ký làm Tutor phải đạt từ 8.5 trở lên',
        'Không có môn học nào bị điểm F trong toàn bộ quá trình học'
      ]
    },
    {
      title: 'Yêu cầu về điểm rèn luyện',
      items: [
        'Điểm rèn luyện trung bình từ 80 điểm trở lên',
        'Không vi phạm kỷ luật trong quá trình học tập',
        'Tích cực tham gia các hoạt động của trường, khoa'
      ]
    },
    {
      title: 'Kỹ năng và thái độ',
      items: [
        'Kỹ năng giao tiếp tốt',
        'Tinh thần trách nhiệm cao',
        'Khả năng quản lý thời gian hiệu quả',
        'Sẵn sàng hỗ trợ và chia sẻ kiến thức với các bạn sinh viên'
      ]
    }
  ];

  useEffect(() => {
    checkGPAEligibility();
  }, []);

  const checkGPAEligibility = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      const data = await res.json();
      
      if (data.success && data.profile) {
        setStudentProfile(data.profile);

        // Kiểm tra GPA
        const gpa = data.profile.GPA;
        
        if (gpa === null || gpa === undefined) {
          setGpaCheckResult({
            eligible: false,
            message: 'Thông tin GPA chưa được cập nhật. Vui lòng liên hệ admin để cập nhật thông tin.'
          });
        } else if (gpa < 3.2) {
          setGpaCheckResult({
            eligible: false,
            message: `GPA của bạn là ${gpa.toFixed(2)}, không đạt điều kiện để apply làm Instructor (yêu cầu GPA ≥ 3.2)`
          });
        } else {
          setGpaCheckResult({
            eligible: true,
            message: `GPA của bạn là ${gpa.toFixed(2)}, đạt điều kiện apply làm Instructor`
          });
        }
      } else {
        alert('Không thể lấy thông tin profile');
        navigate('/firstpage');
      }
    } catch (error) {
      console.error('Error checking GPA:', error);
      alert('Lỗi kết nối tới server. Vui lòng thử lại.');
      navigate('/firstpage');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!gpaCheckResult || !gpaCheckResult.eligible) {
      alert('Bạn không đủ điều kiện để apply làm Instructor');
      return;
    }

    // Mở modal để chọn khoa/chuyên ngành/môn học
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (selectedData) => {
    try {
      setSubmittingModal(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        alert('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      // Gửi API tới backend để check tài khoản sinh viên
      const res = await fetch(`${API_BASE}/tutor/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facultyId: selectedData.facultyId,
          majorId: selectedData.majorId,
          subjectId: selectedData.subjectId,
          facultyName: selectedData.facultyName,
          majorName: selectedData.majorName,
          subjectName: selectedData.subjectName
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedSubject(selectedData);
        setIsModalOpen(false);
        alert('Đăng ký làm Tutor thành công! Yêu cầu sẽ được xét duyệt.');
        navigate('/tutor-landing');
      } else {
        alert(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error registering tutor:', error);
      alert('Lỗi kết nối tới server. Vui lòng thử lại.');
    } finally {
      setSubmittingModal(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="tutor-register-page">
          <div className="tutor-register-container">
            <div className="header-section">
              <h1>Đang kiểm tra điều kiện...</h1>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <FacultySelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      <div className="tutor-register-page">
        <div className="tutor-register-container">
          <div className="header-section">
            <h1>Đăng ký làm Tutor</h1>
            <p className="subtitle">
              Hãy đọc kỹ các điều kiện dưới đây trước khi đăng ký làm Tutor
            </p>
          </div>

          {/* Thông báo kiểm tra GPA */}
          {gpaCheckResult && (
            <div 
              className={`gpa-check-result ${gpaCheckResult.eligible ? 'success' : 'error'}`}
            >
              <h3>
                {gpaCheckResult.eligible ? '✅ Đủ điều kiện' : '❌ Không đủ điều kiện'}
              </h3>
              <p>{gpaCheckResult.message}</p>
            </div>
          )}

          {/* Chỉ hiển thị requirements và form nếu đủ điều kiện */}
          {gpaCheckResult && gpaCheckResult.eligible ? (
            <>
              <div className="requirements-section">
                {requirements.map((section, index) => (
                  <div key={index} className="requirement-card">
                    <h2>{section.title}</h2>
                    <ul>
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="terms-section">
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={hasReadTerms}
                    onChange={(e) => setHasReadTerms(e.target.checked)}
                  />
                  <span>
                    Tôi đã đọc và đồng ý với tất cả các điều kiện trên.
                  </span>
                </label>
              </div>

              <div className="action-section">
                <button
                  className={`apply-button ${hasReadTerms ? 'active' : ''}`}
                  onClick={handleApply}
                  disabled={!hasReadTerms}
                >
                  Đăng ký làm Tutor
                </button>
              </div>
            </>
          ) : (
            <div className="action-section">
              <button
                className="apply-button back-button"
                onClick={() => navigate('/firstpage')}
              >
                Quay lại trang chủ
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}