import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

const DEVICE_ID_KEY = "lap_server_device_id_v1";
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{20,128}$/;

export type BrowserFingerprint = {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screen: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  touchPoints: number;
};

function browserName(userAgent: string) {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Browser";
}

export function collectBrowserFingerprint(): BrowserFingerprint {
  if (typeof window === "undefined") {
    return {
      userAgent: "server",
      platform: "server",
      language: "en",
      timezone: "UTC",
      screen: "0x0x0",
      hardwareConcurrency: 0,
      deviceMemory: 0,
      touchPoints: 0,
    };
  }
  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: { platform?: string };
  };
  return {
    userAgent: navigator.userAgent.slice(0, 300),
    platform: (navigatorWithMemory.userAgentData?.platform || navigator.platform || "unknown").slice(0, 80),
    language: (navigator.language || "unknown").slice(0, 30),
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown").slice(0, 80),
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigatorWithMemory.deviceMemory || 0,
    touchPoints: navigator.maxTouchPoints || 0,
  };
}

export function getDeviceLabel() {
  const fingerprint = collectBrowserFingerprint();
  return `${browserName(fingerprint.userAgent)} on ${fingerprint.platform}`.slice(0, 120);
}

export async function getOrCreateServerDeviceId() {
  if (typeof window === "undefined") throw new Error("Device identity is only available in the browser.");
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)?.trim() || "";
  if (DEVICE_ID_PATTERN.test(existing)) return existing;

  const issueIdentity = httpsCallable<void, { deviceId: string }>(functions, "issueDeviceIdentity");
  const result = await issueIdentity();
  if (!DEVICE_ID_PATTERN.test(result.data.deviceId)) {
    throw new Error("The server returned an invalid device identity.");
  }
  window.localStorage.setItem(DEVICE_ID_KEY, result.data.deviceId);
  return result.data.deviceId;
}

export async function getDeviceRiskPayload() {
  return {
    deviceId: await getOrCreateServerDeviceId(),
    deviceLabel: getDeviceLabel(),
    fingerprint: collectBrowserFingerprint(),
  };
}
