const API_URL =
  "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

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