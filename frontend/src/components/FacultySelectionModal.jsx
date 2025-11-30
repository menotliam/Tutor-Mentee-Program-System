import React, { useState, useEffect } from 'react';
import '../styles/FacultySelectionModal.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function FacultySelectionModal({ isOpen, onClose, onSubmit }) {
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch faculties khi modal mở
  useEffect(() => {
    if (isOpen) {
      fetchFaculties();
      setError('');
    }
  }, [isOpen]);

  // Fetch majors khi faculty thay đổi
  useEffect(() => {
    if (selectedFaculty) {
      fetchMajors(selectedFaculty);
      setSelectedMajor('');
      setSelectedSubject('');
    } else {
      setMajors([]);
      setSubjects([]);
    }
  }, [selectedFaculty]);

  // Fetch subjects khi major thay đổi
  useEffect(() => {
    if (selectedMajor) {
      fetchSubjects(selectedFaculty, selectedMajor);
      setSelectedSubject('');
    } else {
      setSubjects([]);
    }
  }, [selectedMajor]);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/faculties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFaculties(data.data || []);
      } else {
        setError('Không thể tải danh sách khoa');
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async (facultyId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/faculties/${facultyId}/majors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMajors(data.data || []);
      } else {
        setError('Không thể tải danh sách chuyên ngành');
      }
    } catch (err) {
      console.error('Error fetching majors:', err);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (facultyId, majorId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/faculties/${facultyId}/majors/${majorId}/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || []);
      } else {
        setError('Không thể tải danh sách môn học');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedFaculty || !selectedMajor || !selectedSubject) {
      setError('Vui lòng chọn khoa, chuyên ngành và môn học');
      return;
    }

    // Lấy tên của các mục đã chọn
    const facultyName = faculties.find(f => f._id === selectedFaculty)?.name || '';
    const majorName = majors.find(m => m._id === selectedMajor)?.name || '';
    const subjectName = subjects.find(s => s._id === selectedSubject)?.name || '';

    onSubmit({
      facultyId: selectedFaculty,
      majorId: selectedMajor,
      subjectId: selectedSubject,
      facultyName,
      majorName,
      subjectName
    });

    // Reset form
    setSelectedFaculty('');
    setSelectedMajor('');
    setSelectedSubject('');
    setError('');
  };

  const handleClose = () => {
    setSelectedFaculty('');
    setSelectedMajor('');
    setSelectedSubject('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chọn môn học để dạy</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="faculty">Khoa *</label>
            <select
              id="faculty"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              disabled={loading}
              className="form-select"
            >
              <option value="">-- Chọn khoa --</option>
              {faculties.map((faculty) => (
                <option key={faculty._id} value={faculty._id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="major">Chuyên ngành *</label>
            <select
              id="major"
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              disabled={!selectedFaculty || loading}
              className="form-select"
            >
              <option value="">-- Chọn chuyên ngành --</option>
              {majors.map((major) => (
                <option key={major._id} value={major._id}>
                  {major.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Môn học *</label>
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedMajor || loading}
              className="form-select"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={!selectedFaculty || !selectedMajor || !selectedSubject || loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
