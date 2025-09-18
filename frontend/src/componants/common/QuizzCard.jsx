// src/components/QuizCard.jsx
import { Clock, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuizzCard = ({ id, title, category, description, timeLimit, questionCount }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-5 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {description}
      </p>

      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {category}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {timeLimit ? `${timeLimit} min` : "No limit"}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Questions: <span className="font-semibold">{questionCount}</span>
      </div>

      <button 
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={() => navigate(`/quiz/${id}/start`)}  
      >
        Start Quiz
      </button>
      <button 
        className="mt-4 w-full px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition"
        onClick={() => navigate(`/dashboard/performance/${id}/leaderboard`)}  
      >
        Quiz Leaderboard
      </button>
    </div>
  );
};

export default QuizzCard;
