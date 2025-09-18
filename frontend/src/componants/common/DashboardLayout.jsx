import { useAuth } from "../../context/authContext";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart2, FileText, User, BookOpen, PlusSquare, Download } from "lucide-react";

const DashboardLayout = () => {
  const { user } = useAuth(); // { username, email, role }

  const userLinks = [
    { name: "Profile", path: "/dashboard/profile", icon: <User size={18} /> },
    { name: "Quiz History", path: "/dashboard/history", icon: <FileText size={18} /> },
    { name: "Quizzes", path: "/dashboard/quizzes", icon: <BookOpen size={18} /> },
  ];
  
  const adminLinks = [
    { name: "Profile", path: "/dashboard/profile", icon: <User size={18} /> },
    { name: "Create Quiz", path: "/dashboard/create", icon: <PlusSquare size={18} /> },
    { name: "All Quizzes", path: "/dashboard/AllQuizzes", icon: <Download size={18} /> },
    { name: "Quiz Performance", path: "/dashboard/performance", icon: <BarChart2 size={18} /> },
    { name: "Quizzes", path: "/dashboard/quizzes", icon: <BookOpen size={18} /> },
  ];

  const links = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">QuizzeApp</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet /> {/* This is where nested routes will render */}
      </main>
    </div>
  );
};

export default DashboardLayout;