import { useEffect, useState, useMemo } from "react";
import { fetchAllQuizzes } from "../../services/QuizService"; // adjust path
import { Loader2, Filter, X } from "lucide-react";

const AllQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and search states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const response = await fetchAllQuizzes();
        if (response.success) {
          setQuizzes(response.data);
        } else {
          setError("Failed to load quizzes.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, []);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(quizzes.map(quiz => quiz.category))];
    return uniqueCategories.sort();
  }, [quizzes]);

  // Filter and search logic
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase()||
                           (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || quiz.category === selectedCategory;
      
      const matchesStatus = !selectedStatus || 
                           (selectedStatus === "active" && quiz.isActive) ||
                           (selectedStatus === "inactive" && !quiz.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [quizzes, selectedCategory, selectedStatus]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedStatus("");
  };

  const hasActiveFilters = selectedCategory || selectedStatus;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          All Quizzes
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredQuizzes.length} of {quizzes.length} quizzes
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        {/* <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search quizzes by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div> */}

        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {[selectedCategory, selectedStatus].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-500" size={36} />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
            {hasActiveFilters ? "No quizzes match your filters" : "No quizzes found"}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Clear filters to show all quizzes
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 font-semibold">Title</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold hidden md:table-cell">Description</th>
                <th className="px-4 py-4 font-semibold text-center">Questions</th>
                <th className="px-4 py-4 font-semibold">Time Limit</th>
                <th className="px-4 py-4 font-semibold">Created At</th>
                <th className="px-4 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map((quiz, idx) => (
                <tr
                  key={quiz.id}
                  className={`${
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  } hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150`}
                >
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-semibold">{quiz.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1">
                        {quiz.description && quiz.description.length > 50 
                          ? `${quiz.description.substring(0, 50)}...` 
                          : quiz.description || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                   bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {quiz.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell max-w-xs">
                    <div className="truncate" title={quiz.description}>
                      {quiz.description || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full
                                   bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                      {quiz.questionCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium">
                    {quiz.timeLimit ? `${quiz.timeLimit} min` : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    {quiz.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                     bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                     bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllQuizzes;