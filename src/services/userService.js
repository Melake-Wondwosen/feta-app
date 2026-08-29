import { API_URL } from "../config";

export async function getUsers(username, password) {
  const params = new URLSearchParams({
    action: "getUsers",
    username: username || "",
    password: password || "",
    t: String(Date.now()),
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Couldn't load users.");
  return data.users || [];
}

export async function saveUsers(users, username, password) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "saveUsers", username, password, users }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The server sent back something unreadable.");
  }

  if (!data.success) throw new Error(data.message || "The save was rejected.");
}
