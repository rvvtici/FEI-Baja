
import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/users/`;

export const registerUser = async (email, username, firstName, lastName, password) => {
  try {
    const response = await axios.post(
      `${API_URL}register/`,
      { email, username, first_name: firstName, last_name: lastName, password },
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
