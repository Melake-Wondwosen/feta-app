const API_URL =
  "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

import { getDeviceId } from "../services/deviceId";

export async function getOutlets(baId) {
  const deviceId = getDeviceId();
  const response = await fetch(
    `${API_URL}?action=getOutlets&baId=${baId}&deviceId=${deviceId}`
  );
  return response.json();
}

