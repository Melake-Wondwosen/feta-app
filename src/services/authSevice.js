import { API_URL } from "../config";

export async function loginUser(
  username,
  password
) {

  const response =
    await fetch(
      `${API_URL}?action=login&username=${username}&password=${password}`
    );

  return response.json();
}