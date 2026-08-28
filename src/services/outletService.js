import { API_URL } from "../config";

import { getDeviceId } from "../services/deviceId";

export async function getOutlets(baId) {
  const deviceId = getDeviceId();
  const response = await fetch(
    `${API_URL}?action=getOutlets&baId=${baId}&deviceId=${deviceId}`
  );
  return response.json();
}

