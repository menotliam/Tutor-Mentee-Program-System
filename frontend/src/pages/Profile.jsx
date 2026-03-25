import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/Profile.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const [userProfile, setUserProfile] = useState({
    name: '',        // Map từ fullName
    studentId: '',
    email: '',
    phone: '',       // Map từ phoneNumber
    gpa: '',         // Map từ GPA
    major: '',
    academicYear: '',
    conductScore: '',
    role: ''
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
        
        const res = await fetch(`${API_BASE}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Profile data:', data.profile);
          setUserProfile({
            name: data.profile.fullName || '',
            studentId: data.profile.studentId || '',
            email: data.profile.email || '',
            phone: data.profile.phoneNumber || '',
            gpa: data.profile.GPA || '',
            major: data.profile.major || '',
            academicYear: data.profile.academicYear || '',
            conductScore: data.profile.conductScore || '',
            role: data.profile.role || ''
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
    setUserProfile(prev => ({
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

  // Validation function cho phoneNumber
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

  const validateForm = () => {
    const newErrors = {};
    
    const phoneError = validatePhoneNumber(userProfile.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form trước khi submit
    if (!validateForm()) {
      // Hiển thị alert với lỗi
      const errorMessages = Object.values(errors).filter(msg => msg !== '').join('\n');
      if (errorMessages) {
        alert('Vui lòng sửa các lỗi sau:\n' + errorMessages);
      }
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      
      // Student chỉ được phép update phoneNumber
      const updateData = {
        phoneNumber: userProfile.phone.trim()
      };
      
      console.log('Sending update data:', updateData);
      
      // Student sử dụng endpoint riêng
      const res = await fetch(`${API_BASE}/auth/profile/student`, {
        method: 'PUT',
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
        if (data.profile) {
          setUserProfile(prev => ({
            ...prev,
            phone: data.profile.phoneNumber || prev.phone
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
        <Navbar />
        <div className="profile-page">
          <div className="profile-container">
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <h1 className="profile-title">Thông tin cá nhân</h1>
          
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Thông tin sinh viên</h2>
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userProfile.name}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentId">Mã số sinh viên</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={userProfile.studentId}
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
                  value={userProfile.email}
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
                  value={userProfile.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại (10-11 chữ số)"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-section">
              <h2>Thông tin từ hệ thống</h2>
              <div className="form-group">
                <label htmlFor="gpa">GPA Trung bình</label>
                <input
                  type="text"
                  id="gpa"
                  name="gpa"
                  value={userProfile.gpa}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="major">Ngành học</label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={userProfile.major}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Khóa</label>
                <input
                  type="text"
                  id="academicYear"
                  name="academicYear"
                  value={userProfile.academicYear}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="conductScore">Điểm rèn luyện</label>
                <input
                  type="text"
                  id="conductScore"
                  name="conductScore"
                  value={userProfile.conductScore}
                  readOnly
                  className="readonly"
                />
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