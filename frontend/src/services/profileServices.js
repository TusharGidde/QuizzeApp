import api from "./apiConnector"
export const Profile = async () => {
    try{
        const response = await api.get("/auth/profile");
        console.log("Fetched profile:", response.data);
        return response.data;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not fetch profile");
    }
}

export const getHistory = async () => {
    try{
        const response = await api.get("/users/history");
        console.log("Fetched history:", response.data);
        return response;
    }catch(err){
        throw new Error(err?.response?.data?.message || "Could not fetch history");
    }
}