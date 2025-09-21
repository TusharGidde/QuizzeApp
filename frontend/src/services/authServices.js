import api from "./apiConnector"; // <- axios instance with interceptor

export const login = async (formData) => {
  const { email, password } = formData;
  if (!email || !password) throw new Error("Email and password are required");

  try {
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.token);
    
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message || "Invalid email or password");
  }
};

export const signup = async (formData) => {
  const { name, email, password, confirmPassword } = formData;

  if (!name || !email || !password || !confirmPassword)
    throw new Error("All fields are required");

  if (password !== confirmPassword)
    throw new Error("Password and confirm password do not match");

  try {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    login({ email, password });
    localStorage.setItem("token", response.data.token); 
    
    return response.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || "Registration failed. Please try again."
    );
  }
};
