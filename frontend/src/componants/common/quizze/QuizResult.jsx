import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // We expect the result data to be passed via navigation state
  const result = location.state?.result;

  useEffect(() => {
    if (!result) {
      // If no result, redirect back to quizzes page
      navigate("/quizzes");
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div className="min-h-screen bg-richblack-900 text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-richblack-800 p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-primary-500 mb-6">
          Quiz Results
        </h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-10">
          <div className="bg-richblack-700 p-4 rounded-xl shadow">
            <p className="text-lg font-semibold">Score</p>
            <p className="text-2xl font-bold text-green-400">
              {result.score} / {result.maxScore}
            </p>
          </div>
          <div className="bg-richblack-700 p-4 rounded-xl shadow">
            <p className="text-lg font-semibold">Percentage</p>
            <p className="text-2xl font-bold text-yellow-400">
              {result.percentage}%
            </p>
          </div>
          <div className="bg-richblack-700 p-4 rounded-xl shadow">
            <p className="text-lg font-semibold">Time Taken</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Answers</h2>
          <div className="space-y-4">
            {result.results.map((q, index) => (
              <div
                key={q.questionId}
                className={`p-4 rounded-xl shadow ${
                  q.isCorrect
                    ? "bg-green-900/40 border border-green-600"
                    : "bg-red-900/40 border border-red-600"
                }`}
              >
                <p className="font-semibold mb-2">
                  Q{index + 1}: {q.question}
                </p>
                <p>
                  <span className="font-medium">Your Answer: </span>
                  <span
                    className={
                      q.isCorrect ? "text-green-400" : "text-red-400"
                    }
                  >
                    {q.userAnswer}
                  </span>
                </p>
                {!q.isCorrect && (
                  <p>
                    <span className="font-medium">Correct Answer: </span>
                    <span className="text-green-400">
                      {q.correctAnswer}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => navigate("/quizzes")}
            className="px-6 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 transition text-white font-semibold shadow"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
