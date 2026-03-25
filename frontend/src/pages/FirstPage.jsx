import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/FirstPage.css";
import Navbar from "../components/Navbar";

export default function FirstPage() {
  // slides data: you can add/remove slides or change images/text here
  const slides = [
    {
      titleTop: "HCMUT",
      titleBottom: "Tutor List",
      description: "Danh sách các Tutor để bạn có thể trau dồi kiến thức",
      cta: "Tutor List",
      path: "/library",
      image: "sinhvienBK1.jpg",
    },
    {
      titleTop: "HCMUT",
      titleBottom: "Tutor Application",
      description: "Đăng ký trở thành Tutor để chia sẻ kiến thức của bạn",
      cta: "Apply Now",
      path: "/tutor-register",
      image: "sinhvienBK3.jpg",
    },
    {
      titleTop: "HCMUT",
      titleBottom: "Class Meeting",
      description: "Đăng ký và tham gia các buổi học với Tutor của bạn",
      cta: "Tham gia",
      path: "/calendar",
      image: "lophoc.jpg",
    },
    // duplicated / additional slide to make 4 slides total
    {
      titleTop: "HCMUT",
      titleBottom: "Tutor List",
      description: "Các tutor hàng đầu sẵn sàng hỗ trợ bạn",
      cta: "Xem ngay",
      image: "sinhvienBK1.jpg",
    },
  ];

  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <>
      <Navbar />
      <div className="firstpage">
        <div
          className="hero-section slider-container"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
          }}
        >
          <button className="arrow arrow-left" onClick={prev} aria-label="Previous slide">
            ‹
          </button>

          <div className="slides-viewport">
            <div
              className="slides-row"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {slides.map((s, i) => (
                <div className="slide" key={i}>
                  <div className="frame">
                    <div className="text">
                      <p className="HCMUT-tutor-list">
                        <span className="text-wrapper">
                          {s.titleTop}
                          <br />
                        </span>

                        <span className="span">{s.titleBottom}</span>
                      </p>

                      <p className="div">{s.description}</p>

                      <Link to={s.path || '/'} className="div-wrapper">
                        <div className="text-wrapper-2">{s.cta}</div>
                      </Link>
                    </div>
                  </div>

                  <div className="illustration">
                    <img className="image" alt={`Slide ${i + 1}`} src={s.image} />
                  </div>
                </div>
              ))}
            </div>
          </div>

            <div className="dots" aria-hidden={false}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={"dot" + (i === index ? " active" : "")}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button className="arrow arrow-right" onClick={next} aria-label="Next slide">
              ›
            </button>
        </div>

        <img className="lulut" alt="Lulut" src="lulut.jpg" />
      </div>
    </>
  );
}