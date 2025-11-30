import React, { useState, useEffect } from 'react';
import NavbarTutor from '../components/NavbarTutor';
import '../styles/TutorProfile.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function TutorProfile() {
  const [tutorProfile, setTutorProfile] = useState({
    name: '',        // Map từ fullName
    email: '',
    phone: '',       // Map từ phoneNumber
    teachingSubjects: [],  // Danh sách môn học có thể dạy
    degree: '',      // Bằng cấp
    specialization: '',  // Chuyên ngành
    bio: ''          // Tiểu sử
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch profile từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          alert('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
          window.location.href = '/login';
          return;
        }
        
        const res = await fetch(`${API_BASE}/tutors/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Tutor profile data:', data.data);
          const profile = data.data || {};
          setTutorProfile({
            name: profile.fullName || '',
            email: profile.email || '',
            phone: profile.phoneNumber || '',
            teachingSubjects: profile.teachingSubjects || [],
            degree: profile.degree || '',
            specialization: profile.specialization || '',
            bio: profile.bio || ''
          });
        } else if (res.status === 401) {
          alert('Token hết hạn. Vui lòng đăng nhập lại.');
          localStorage.clear();
          window.location.href = '/login';
        } else {
          const data = await res.json();
          alert(data.message || 'Không thể tải thông tin profile');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        alert('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTutorProfile(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation functions
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return 'Số điện thoại không được để trống';
    }
    // Kiểm tra định dạng: 10-11 chữ số
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.trim())) {
      return 'Số điện thoại phải có 10-11 chữ số';
    }
    return '';
  };

  const validateBio = (bio) => {
    if (!bio || bio.trim() === '') {
      return 'Tiểu sử không được để trống';
    }
    if (bio.trim().length < 10) {
      return 'Tiểu sử phải có ít nhất 10 ký tự';
    }
    if (bio.trim().length > 500) {
      return 'Tiểu sử không được quá 500 ký tự';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    const phoneError = validatePhoneNumber(tutorProfile.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }
    
    const bioError = validateBio(tutorProfile.bio);
    if (bioError) {
      newErrors.bio = bioError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form trước khi submit
    if (!validateForm()) {
      // Hiển thị alert với tất cả lỗi
      const errorMessages = Object.values(errors).filter(msg => msg !== '').join('\n');
      if (errorMessages) {
        alert('Vui lòng sửa các lỗi sau:\n' + errorMessages);
      }
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      
      // Instructor chỉ được phép update phoneNumber và bio
      const updateData = {
        phoneNumber: tutorProfile.phone.trim(),
        bio: tutorProfile.bio.trim()
      };
      
      console.log('Sending update data:', updateData);
      
      const res = await fetch(`${API_BASE}/tutors/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();
      console.log('Update response:', data);
      
      if (res.ok) {
        alert('Cập nhật profile thành công!');
        // Cập nhật state với dữ liệu mới từ server
        if (data.data) {
          const profile = data.data;
          setTutorProfile(prev => ({
            ...prev,
            phone: profile.phoneNumber || prev.phone,
            bio: profile.bio || prev.bio
          }));
        }
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      alert('Lỗi kết nối tới server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavbarTutor />
        <div className="tutor-profile-page">
          <div className="tutor-profile-container">
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarTutor />
      <div className="tutor-profile-page">
        <div className="tutor-profile-container">
          <h1 className="tutor-profile-title">Thông tin cá nhân</h1>
          
          <form className="tutor-profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Thông tin cơ bản</h2>
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={tutorProfile.name}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={tutorProfile.email}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={tutorProfile.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại (10-11 chữ số)"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-section">
              <h2>Thông tin chuyên môn</h2>
              <div className="form-group">
                <label htmlFor="teachingSubjects">Môn dạy</label>
                <div className="teaching-subjects-display">
                  {tutorProfile.teachingSubjects && tutorProfile.teachingSubjects.length > 0 ? (
                    <div className="subjects-list">
                      {tutorProfile.teachingSubjects.map((subject, index) => (
                        <span key={index} className="subject-tag">
                          {subject.subjectName || subject.subjectCode || subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-subjects">Chưa có môn học nào</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="degree">Bằng cấp</label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  value={tutorProfile.degree}
                  readOnly
                  className="readonly"
                  placeholder="Chưa có thông tin"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Chuyên ngành</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={tutorProfile.specialization}
                  readOnly
                  className="readonly"
                  placeholder="Chưa có thông tin"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Giới thiệu</h2>
              <div className="form-group">
                <label htmlFor="bio">Tiểu sử <span className="required">*</span></label>
                <textarea
                  id="bio"
                  name="bio"
                  value={tutorProfile.bio}
                  onChange={handleChange}
                  placeholder="Nhập tiểu sử của bạn (ít nhất 10 ký tự, tối đa 500 ký tự)"
                  rows={6}
                  className={errors.bio ? 'error' : ''}
                />
                {errors.bio && <span className="error-message">{errors.bio}</span>}
                <div className="char-count">
                  {tutorProfile.bio.length}/500 ký tự
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
