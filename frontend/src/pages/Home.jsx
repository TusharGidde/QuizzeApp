import React from "react";
import { Link } from "react-router-dom";
import { Trophy, PlayCircle, Brain } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-6">
      {/* Hero Section */}
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
          Welcome to <span className="text-indigo-600 dark:text-indigo-400">QuizzeApp</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
          Challenge yourself with fun and interactive quizzes. 
          Compete with friends, climb the leaderboard, and boost your knowledge!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/quizzes"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            <PlayCircle className="w-5 h-5" />
            Browse Quizzes
          </Link>
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition shadow-lg"
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition">
          <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Fun Quizzes</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Explore quizzes across different categories and topics.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition">
          <Trophy className="w-10 h-10 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Leaderboard</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Compete with others and showcase your knowledge on the leaderboard.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition">
          <PlayCircle className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Instant Play</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Start a quiz instantly and track your progress as you go.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
