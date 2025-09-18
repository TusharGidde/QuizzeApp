// src/pages/QuizzesPage.jsx
import { useEffect, useState } from "react";
import { fetchAllQuizzes } from "../services/QuizService";
import QuizCard from "../componants/common/QuizzCard";
import { Loader2, ListChecks, Layers } from "lucide-react"; // icons

const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetchAllQuizzes();
        if (response.success) {
          setQuizzes(response.data);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading quizzes...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 ">
          Available Quizzes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Challenge yourself and test your knowledge with these quizzes!
        </p>
      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <ListChecks className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {quizzes.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {new Set(quizzes.map((q) => q.category)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              id={quiz.id}
              title={quiz.title}
              category={quiz.category}
              description={quiz.description}
              timeLimit={quiz.timeLimit}
              questionCount={quiz.questionCount}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No quizzes available at the moment. Please check back later.
        </p>
      )}
    </div>
  );
};

export default QuizzesPage;
