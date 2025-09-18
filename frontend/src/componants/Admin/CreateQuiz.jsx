// src/components/admin/CreateQuiz.jsx
import React, { useState } from "react";
import { createQuizze, importQuestions } from "../../services/QuizService";

const CreateQuiz = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "easy",
    timeLimit: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdQuiz, setCreatedQuiz] = useState(null);

  // File state
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setCreatedQuiz(null);

    try {
      const data = await createQuizze(formData); // already parsed JSON
      console.log("Created quiz:", data);

      if (data.success) {
        setMessage("✅ Quiz created successfully!");
        setCreatedQuiz(data.data); // store quiz details (id, title, etc.)
        setFormData({
          title: "",
          description: "",
          category: "",
          difficulty: "easy",
          timeLimit: ""
        });
      } else {
        setMessage(data.message || "❌ Failed to create quiz");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "❌ Error creating quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadResponse({ error: "Please select a CSV file first." });
      return;
    }
    if (!createdQuiz?.id) {
      setUploadResponse({ error: "Quiz ID not found. Please create a quiz first." });
      return;
    }

    setUploading(true);
    setUploadResponse(null);

    try {
      // ✅ Pass csvFile directly (service builds FormData)
      const data = await importQuestions(createdQuiz.id, csvFile);

      setUploadResponse(data);
      setCsvFile(null);
    } catch (error) {
      console.error(error);
      setUploadResponse({ error: error.message || "Error uploading questions." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center">📘 Create New Quiz</h2>

      {/* Create Quiz Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Quiz Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
          required
        />

        <textarea
          name="description"
          placeholder="Quiz Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
          required
        />

        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <input
          type="number"
          name="timeLimit"
          placeholder="Time Limit (minutes)"
          value={formData.timeLimit}
          onChange={handleChange}
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          {loading ? "⏳ Creating..." : "Create Quiz"}
        </button>
      </form>

      {message && <p className="mt-4 text-center font-semibold">{message}</p>}

      {/* Show Upload Section if quiz created */}
      {createdQuiz && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-900 rounded shadow">
          <h3 className="text-xl font-bold mb-4">
            📤 Import Questions for: {createdQuiz.title}
          </h3>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mb-4 border p-2 rounded m-2"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            {uploading ? "⏳ Uploading..." : "Upload CSV"}
          </button>

          {uploadResponse && (
            <div className="mt-4 p-3 border rounded bg-gray-50 dark:bg-gray-800">
              {uploadResponse.error ? (
                <p className="text-red-500">{uploadResponse.error}</p>
              ) : (
                <>
                  <p className="text-green-600 font-semibold">
                    {uploadResponse.message}
                  </p>
                  <ul className="list-disc ml-6 mt-2">
                    {uploadResponse.data?.results?.map((q) => (
                      <li key={q.questionId}>
                        Line {q.line}: {q.question}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateQuiz;
