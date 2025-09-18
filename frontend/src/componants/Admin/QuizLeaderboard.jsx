// src/pages/QuizLeaderboard.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Medal, Award, Users, ArrowLeft, Loader2 } from "lucide-react";
import { getQuizLeaderboard } from "../../services/LeaderboardServices"; 
const QuizLeaderboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quizInfo, setQuizInfo] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace this with your actual API call
  const fetchQuizLeaderboard = async (quizId) => {
    try {
      const response = await getQuizLeaderboard(quizId);
      console.log("API response:", response);
      return response;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetchQuizLeaderboard(quizId);
        console.log("Leaderboard data:", response);
        
        if (response.success) {
          setQuizInfo(response.data.quiz);
          setLeaderboard(response.data.leaderboard);
          setUserRank(response.data.userRank);
        } else {
          setError("Failed to load leaderboard");
        }
      } catch (err) {
        setError("Something went wrong while loading leaderboard");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadLeaderboard();
    }
  }, [quizId]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={28} />;
      case 2:
        return <Medal className="text-gray-400" size={28} />;
      case 3:
        return <Award className="text-amber-600" size={28} />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
            {rank}
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/30 dark:to-gray-700/20 border-gray-300 dark:border-gray-600";
      case 3:
        return "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-300 dark:border-amber-600";
      default:
        return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-10">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Quizzes</span>
        </button>
        
        <div className="flex items-center space-x-3 mb-3">
          <Trophy className="text-yellow-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Leaderboard
          </h1>
        </div>
        
        {quizInfo && (
          <>
            <h2 className="text-xl text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              {quizInfo.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {quizInfo.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{quizInfo.totalQuestions} Questions</span>
              <span>•</span>
              <span>{quizInfo.timeLimit} Minutes</span>
              <span>•</span>
              <span>{leaderboard.length} Participants</span>
            </div>
          </>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No participants yet</h3>
            <p>Be the first to take this quiz and appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center space-x-2">
              <Trophy className="text-yellow-500" size={24} />
              <span>Top Performers</span>
            </h3>
            
            <div className="space-y-3">
              {leaderboard.map((participant, index) => (
                <div
                  key={`${participant.user_id}-${index}`}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${getRankBadgeColor(participant.rank)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center min-w-[48px]">
                      {getRankIcon(participant.rank)}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                        {participant.userName}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Rank #{participant.rank}
                        </span>
                        {participant.rank <= 3 && (
                          <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                            TOP {participant.rank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {parseFloat(participant.score).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      points
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User's rank if available */}
            {userRank && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Your Performance</h4>
                <p className="text-blue-700 dark:text-blue-400">
                  You ranked #{userRank.rank} with a score of {parseFloat(userRank.score).toFixed(1)} points
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizLeaderboard;