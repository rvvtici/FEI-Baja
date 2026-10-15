
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/users/";

export const registerUser = async (email, username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}register/`,
      { email, username, password },
      { withCredentials: true }
    );

    return response.data;
  } catch (e) {
    console.error("Erro no cadastro:", e.response?.data || e.message);
    throw e;
  }
};

export const loginUser = async (identifier, password) => {
  try {
    const response = await axios.post(
      `${API_URL}login/`,
      { identifier, password },
      { withCredentials: true }
    );

    return response.data;
  } catch (e) {
    console.error("Erro no login:", e.response?.data || e.message);
    throw e;
  }
};

export const logoutUser = async () => {
    try {
        const response = await axios.post(
        `${API_URL}logout/`, null,
        { withCredentials: true }
        );

        return response.data;
    } catch (e) {
        console.error("Erro no logout:", e.response?.data || e.message);
        throw e;
  }
};
