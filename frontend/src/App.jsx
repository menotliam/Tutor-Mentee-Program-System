import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Navbar from "./components/Navbar";
import NavbarTutor from "./components/NavbarTutor";
import DangNhap from "./pages/DangNhap";
import TrangChu from "./pages/TrangChu";
import FirstPage from "./pages/FirstPage";
import Library from "./pages/Library";
import Calendar from "./pages/Calendar";
import History from "./pages/History";
import DangKy from "./pages/DangKy";
import CalendarTutor from "./pages/CalendarTutor";
import Profile from "./pages/Profile";
import TutorProfile from "./pages/TutorProfile";
import TutorRegister from "./pages/TutorRegister";
import TutorLandingPage from "./pages/TutorLandingPage";
import StudentList from "./pages/StudentList";
import ClassList from "./pages/ClassList";

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TrangChu />} />
          <Route path="/setcalendar" element={<CalendarTutor />} />
          <Route path="/login" element={<DangNhap />} />
          <Route path="/firstpage" element={<FirstPage />} />
          <Route path="/library" element={<Library />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/history" element={<History />} />
          <Route path="/register" element={<DangKy />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tutor-profile" element={<TutorProfile />} />
          <Route path="/tutor-register" element={<TutorRegister />} />
          <Route path="/tutor-landing" element={<TutorLandingPage />} />
          <Route path="/studentlist" element={<StudentList />} />
          <Route path="/classlist" element={<ClassList />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
