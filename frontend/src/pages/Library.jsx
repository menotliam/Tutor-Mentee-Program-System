
import "../styles/Library.css";
import Navbar from "../components/Navbar";
import React, { useState } from "react";

export default function Library() {
  const [openIndex, setOpenIndex] = useState(null);

  const subjects = [
    { id: 0, label: "All", className: "group" },
    { id: 1, label: "KHMT", className: "group-2" },
    { id: 2, label: "Hóa", className: "group-3" },
    { id: 3, label: "Cơ kỹ thuật", className: "group-4" },
    { id: 4, label: "Cơ khí", className: "group-5" },
    { id: 5, label: "Cơ-Điện tử", className: "group-6" },
    { id: 6, label: "AI - Data", className: "group-7" },
    { id: 7, label: "Đại cương", className: "group-9" },
    { id: 8, label: "Công nghệ PM", className: "group-10" },
    { id: 9, label: "KTMT", className: "group-11" },
  ];

  return (
    <div className="to-do">
      <Navbar />
      <div className="frame">
        <div className="group-12 search-row">
          <div className="search-input-wrap">
            <input className="p" placeholder="Search for name of tutor" />
          </div>

          <button className="search-btn" aria-label="Search">
            Search
          </button>
        </div>

        {/* All section in its own row */}
        <div className="all-section">
          {subjects
            .filter(s => s.label === "All")
            .map((s) => (
              <div
                key={s.id}
                className={`subject ${s.className}${openIndex === s.id ? ' open' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setOpenIndex(openIndex === s.id ? null : s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setOpenIndex(openIndex === s.id ? null : s.id);
                }}
              >
                <div className={`rectangle ${s.className}-rect`} />
                <div className={`label label-${s.id}`}>{s.label}</div>

                {openIndex === s.id && (
                  <div className="subject-popup">
                    <div className="popup-header">Available Tutors for {s.label}</div>
                    <div className="popup-list">No tutors available yet.</div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Other subjects in a separate grid */}
        <div className="group-row">
          {subjects
            .filter(s => s.label !== "All")
            .map((s) => (
              <div
                key={s.id}
                className={`subject ${s.className}${openIndex === s.id ? ' open' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setOpenIndex(openIndex === s.id ? null : s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setOpenIndex(openIndex === s.id ? null : s.id);
                }}
              >
                <div className={`rectangle ${s.className}-rect`} />
                <div className={`label label-${s.id}`}>{s.label}</div>

                {openIndex === s.id && (
                  <div className="subject-popup">
                    <div className="popup-header">Available Tutors for {s.label}</div>
                    <div className="popup-list">No tutors available yet.</div>
                  </div>
                )}
              </div>
            ))}
        </div>

        <p className="th-vi-n-online-HCMUT">
          <span className="span">
            Danh sách Người hướng dẫn Học tập Online - HCMUT
            <br />
          </span>

          <span className="text-wrapper-10">
            Tìm cho bản thân một Tutor phù hợp để cùng học tập, có thể cùng nhau
            trao đổi các vấn đề học tập cũng như cuộc sống sinh viên.
          </span>
        </p>

        
      </div>
    </div>
  );
}