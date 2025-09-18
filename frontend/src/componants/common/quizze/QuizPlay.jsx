import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startQuiz, submitQuiz } from "../../../services/QuizService";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const QuizPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const STORAGE_KEY = `quiz-${quizId}-state`;
  const SUBMIT_KEY = `quiz-${quizId}-pending-submit`;

  // ⏱️ Timer calculation
  const updateTimeLeft = useCallback(() => {
    if (!quizData || !startTime) return;
    const elapsed = Math.floor((Date.now() - new Date(startTime)) / 1000);
    const remaining = quizData.timeLimit * 60 - elapsed;
    setTimeLeft(remaining > 0 ? remaining : 0);
    if (remaining <= 0) {
      handleSubmit(); // auto-submit when time ends
    }
  }, [quizData, startTime]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setStartTime(parsed.startTime);
          setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        }

        const response = await startQuiz(quizId);
        if (response.success) {
          setQuizData(response.data);
          // if no saved startTime, use backend one
          if (!saved) {
            setStartTime(response.data.startTime);
          }
        } else {
          setError("Failed to load quiz.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (startTime) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, startTime, currentQuestionIndex })
      );
    }
  }, [answers, startTime, currentQuestionIndex]);

  // ⏳ Timer interval
  useEffect(() => {
    if (!quizData || !startTime) return;
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [quizData, startTime, updateTimeLeft]);

  // 📝 Handle answers
  const handleSingleChange = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleMultipleChange = (qId, option) => {
    setAnswers((prev) => {
      const current = prev[qId] || [];
      return current.includes(option)
        ? { ...prev, [qId]: current.filter((o) => o !== option) }
        : { ...prev, [qId]: [...current, option] };
    });
  };

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // 🚀 Submit quiz
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - new Date(startTime)) / 1000);
      const payload = { answers, startTime, timeTaken };

      const response = await submitQuiz(quizId, payload);
      console.log("Submit response:", response);
      if (response.success) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SUBMIT_KEY);
        navigate(`/quiz/${quizId}/result`, { state: { result: response.data } });

      } else {
        setError("Submission failed. Retrying later...");
        localStorage.setItem(SUBMIT_KEY, JSON.stringify(payload));
      }
    } catch (err) {
      setError("Network issue. Answers saved. Will retry...");
      localStorage.setItem(
        SUBMIT_KEY,
        JSON.stringify({ answers, startTime, timeTaken: Date.now() })
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 🔄 Retry pending submission on load
  useEffect(() => {
    const pending = localStorage.getItem(SUBMIT_KEY);
    if (pending) {
      (async () => {
        try {
          const payload = JSON.parse(pending);
          const response = await submitQuiz(quizId, payload);
          if (response.success) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(SUBMIT_KEY);
            navigate(`/quiz/${quizId}/result`, { state: { result: response.data } });
          }
        } catch {
          // keep retrying next reload
        }
      })();
    }
  }, [quizId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-primary-500" size={36} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-6">{error}</div>;
  }

  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const totalQuestions = quizData?.questions?.length || 0;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {quizData?.quiz?.title}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {quizData?.quiz?.description}
      </p>

      {/* Timer */}
      <div className="text-lg font-semibold text-center mb-6">
        ⏳ Time Left:{" "}
        <span className={timeLeft < 60 ? "text-red-500" : "text-green-600"}>
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{answeredQuestions}/{totalQuestions} answered</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Navigation Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {quizData?.questions?.map((_, index) => (
          <button
            key={index}
            onClick={() => goToQuestion(index)}
            className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
              index === currentQuestionIndex
                ? 'bg-primary-600 text-white'
                : answers[quizData.questions[index].id]
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {currentQuestion.questionType === "single" ? (
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    value={opt}
                    checked={answers[currentQuestion.id] === opt}
                    onChange={() => handleSingleChange(currentQuestion.id, opt)}
                    className="w-4 h-4 text-primary-600"
                  />
                ) : (
                  <input
                    type="checkbox"
                    value={opt}
                    checked={(answers[currentQuestion.id] || []).includes(opt)}
                    onChange={() => handleMultipleChange(currentQuestion.id, opt)}
                    className="w-4 h-4 text-primary-600"
                  />
                )}
                <span className="text-gray-700 dark:text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;