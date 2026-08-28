// utils/deviceId.js
export function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = "DEV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}