import React, { useState, useEffect } from 'react';
import { 
  Trophy, Medal, Award, Crown, Target, Brain, Clock, 
  TrendingUp, Users, Filter, ChevronDown 
} from 'lucide-react';
import { getGlobalLeaderboard } from '../services/LeaderboardServices';

const LeaderBoard = () => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getGlobalLeaderboard();
        setLeaderboardData(data.data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getPerformanceColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    if (percent >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (isLoading || !leaderboardData?.leaderboard) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy className="w-16 h-16 text-purple-500 animate-bounce" />
          <p className="text-gray-400 mt-4">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">Quiz Leaderboard</h1>
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-gray-300 text-lg">Compete, Learn, and Rise to the Top!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-purple-500 hover:border-purple-400 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Players</p>
                <p className="text-3xl font-bold text-white">{leaderboardData?.leaderboard?.length || 0}</p>
              </div>
              <Users className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-purple-500 hover:border-purple-400 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Score</p>
                <p className="text-3xl font-bold text-white">
                  {(
                    leaderboardData?.leaderboard?.reduce(
                      (acc, user) => acc + parseFloat(user.averagePercentage),
                      0
                    ) / (leaderboardData?.leaderboard?.length || 1)
                  ).toFixed(1)}%
                </p>
              </div>
              <Target className="w-10 h-10 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-purple-500 hover:border-purple-400 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Quizzes</p>
                <p className="text-3xl font-bold text-white">
                  {leaderboardData?.leaderboard?.reduce((acc, user) => acc + user.quizzesCompleted, 0) || 0}
                </p>
              </div>
              <Brain className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        {/* <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 font-semibold">Filters:</span>
            </div>
            
            <div className="relative">
              <select 
                className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg appearance-none pr-10 hover:bg-gray-600 transition-colors"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="science">Science</option>
                <option value="math">Mathematics</option>
                <option value="history">History</option>
              </select>
              <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select 
                className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg appearance-none pr-10 hover:bg-gray-600 transition-colors"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div> */}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Quizzes</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Total Points</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboardData?.leaderboard?.map((user, index) => (
                  <tr 
                    key={user.userId} 
                    className="hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(index + 1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.userName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-900 text-blue-200">
                        {user.quizzesCompleted}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">
                      {user.totalAttempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getPerformanceColor(user.averagePercentage)}`} />
                        <span className={`font-bold text-lg ${getPerformanceColor(user.averagePercentage)}`}>
                          {parseFloat(user.averagePercentage).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-white font-semibold">{user.totalScore}</div>
                      <div className="text-gray-400 text-sm">/ {user.totalMaxScore}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{formatDate(user.lastAttemptAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-gray-400 text-sm">
            Showing {leaderboardData?.leaderboard?.length || 0} of {leaderboardData?.leaderboard?.length || 0} players
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
              1
            </button>
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;
