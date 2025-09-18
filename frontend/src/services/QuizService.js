import api from "./apiConnector"; // <- axios instance with interceptor

export const fetchAllQuizzes = async () => {
    try{
        const response = await api.get("/quizzes");
        return response.data;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not fetch quizzes");
    }
}

export const getCategories = async () => {
    try{
        const responce = await api.get("/quizzes/categories");
        console.log("Fetched categories:", responce.data);
        return responce.data;

    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not fetch categories");
    }
}


//creating a quizze
export const createQuizze = async (quizData) => {
    try{
        const responce = await api.post("/quizzes" , quizData);
        console.log("Created quiz:", responce.data);
        return responce.data;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not create quiz");
    }
}

//import questions via CSV
// import questions via CSV
export const importQuestions = async (quizId, file) => {
  try {
    const formData = new FormData();
    formData.append("csvFile", file); 

    const response = await api.post(
      `/admin/questions/import/${quizId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    console.log("Imported questions:", response.data);
    return response.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || "Could not import questions"
    );
  }
};


//get quize by id

export const fetchQuizById  = async (quizId) => {
    try{
        const response = await api.get(`/quizzes/${quizId}`);
        console.log("Fetched quiz:", response.data);
        return response.data;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not fetch quiz");
    }
}

export const startQuiz = async (quizId) => {
    try{
        const response = await api.post(`/quizzes/${quizId}/start`);
        console.log("Started quiz:", response.data);
        return response.data;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not start quiz");
    }
}

//submit quiz answers
export const submitQuiz = async (quizId, payload) => {
    try{
        const res = await api.post(`/quizzes/${quizId}/submit`, payload);
        return res.data; // { success, data }
        console.log("Submitted quiz:", res.data);
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not submit quiz");
    }
};