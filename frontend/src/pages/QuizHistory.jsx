import { useEffect, useState } from "react";
import { 
  History, 
  Trophy, 
  Clock, 
  Calendar, 
  BookOpen, 
  Target,
  TrendingUp,
  Award,
  ChevronRight
} from "lucide-react";
import { getHistory } from "../services/profileServices";

const QuizHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getHistory();
        console.log("Quiz history response:", res);
        setHistory(res.data?.data?.attempts || []);
      } catch (err) {
        console.error("Error fetching quiz history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
  };

  const getScoreIcon = (percentage) => {
    if (percentage >= 80) return <Trophy className="w-4 h-4 text-green-500" />;
    if (percentage >= 60) return <Award className="w-4 h-4 text-blue-500" />;
    if (percentage >= 40) return <Target className="w-4 h-4 text-yellow-500" />;
    return <TrendingUp className="w-4 h-4 text-red-500" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'science': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'math': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'history': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'literature': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'general': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading quiz history...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="text-gray-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Quiz History
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You haven't completed any quizzes yet. Start taking quizzes to see your history here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-3">
              <History className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Quiz History
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track your quiz performance and see how you've improved over time
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <BookOpen size={18} />
                      <span>Quiz Details</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <div className="flex items-center justify-center space-x-2">
                      <Target size={18} />
                      <span>Score</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy size={18} />
                      <span>Performance</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock size={18} />
                      <span>Duration</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar size={18} />
                      <span>Completed</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((attempt, index) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {attempt.quiz.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(attempt.quiz.category)}`}>
                            {attempt.quiz.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {attempt.score}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {attempt.maxScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border font-semibold ${getScoreColor(attempt.percentageScore)}`}>
                        {getScoreIcon(attempt.percentageScore)}
                        <span>{attempt.percentageScore.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Clock size={16} />
                        <span className="font-medium">{attempt.formattedTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {new Date(attempt.completedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {history.map((attempt, index) => (
            <div
              key={attempt.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {attempt.quiz.title}
                      </h3>
                      <span className="text-indigo-100 text-sm">
                        {attempt.quiz.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-white opacity-60" size={20} />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-4">
                {/* Score Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="text-indigo-500" size={18} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Score</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {attempt.score}/{attempt.maxScore}
                    </div>
                  </div>
                </div>

                {/* Performance Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="text-indigo-500" size={18} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Performance</span>
                  </div>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-semibold ${getScoreColor(attempt.percentageScore)}`}>
                    {getScoreIcon(attempt.percentageScore)}
                    <span>{attempt.percentageScore.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Duration Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-indigo-500" size={18} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Duration</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    {attempt.formattedTime}
                  </span>
                </div>

                {/* Date Section */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-indigo-500" size={18} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Completed</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(attempt.completedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Summary */}
        {history.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {history.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Quizzes</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {((history.reduce((acc, curr) => acc + curr.percentageScore, 0) / history.length) || 0).toFixed(1)}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Average Score</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {history.filter(h => h.percentageScore >= 80).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Excellent Scores</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;