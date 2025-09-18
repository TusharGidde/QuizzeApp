import api from "./apiConnector"; // <- axios instance with interceptor

export const getGlobalLeaderboard = async (category = 'all', timeframe = 'all') => {
    try {
        const response = await api.get("/leaderboard/global");
            console.log("Fetched global leaderboard:", response.data);
        return response.data;
    } catch (err) {
        throw new Error(err?.response?.data?.message || "Could not fetch global leaderboard");
    }   
}

export const getQuizLeaderboard = async (quizId) => {
    try {
        
        const response = await api.get(`/leaderboard/quiz/${quizId}`);
        console.log(`Fetched leaderboard for quiz ${quizId}:`, response.data);
        return response.data;

    }catch (err) {
        throw new Error(err?.response?.data?.message || `Could not fetch leaderboard for quiz ${quizId}`);
    }
}