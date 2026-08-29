"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db, functions } from "@/lib/firebase";
import { getDeviceRiskPayload } from "@/lib/device-identity";

export type PublicProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
  handle: string;
  status?: "active" | "warning" | "suspended" | "banned";
  warningCount?: number;
  lastWarningReason?: string;
  suspendedUntil?: any;
  suspensionReason?: string;
  bannedAt?: any;
  banReason?: string;
};

export type StaffRole = "super" | "admin" | "author" | "moderator";

type PublicAuthContextValue = {
  user: User | null;
  profile: PublicProfile | null;
  isStaff: boolean;
  staffRole: StaffRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  isDeviceBlocked: boolean;
  deviceBlockReason?: string;
  refreshProfile: () => Promise<PublicProfile | null>;
};

const PublicAuthContext = createContext<PublicAuthContextValue | undefined>(
  undefined,
);

const HANDLE_PATTERN = /^[a-z0-9_-]{3,20}$/;
const PROTECTED_BRAND_PATTERN = /^(official|real|the|team|weare|my)?(lap|arclapain)/;
export const TERMS_VERSION = "2026-08-25";
export const GUIDELINES_VERSION = "2026-08-25";

export type PublicHandleAvailability =
  | "available"
  | "taken"
  | "reserved"
  | "maintenance";

function getProvider(user: User) {
  return user.providerData[0]?.providerId || "password";
}

function getDisplayName(user: User) {
  const candidate = (
    user.displayName?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "L.A.P Reader"
  ).slice(0, 80);
  return candidate.length >= 2 ? candidate : "L.A.P Reader";
}

function toPublicProfile(data: Record<string, unknown>, user: User): PublicProfile {
  return {
    uid: user.uid,
    email: typeof data.email === "string" ? data.email : user.email || "",
    displayName:
      typeof data.displayName === "string" ? data.displayName : getDisplayName(user),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : user.photoURL || "",
    provider: typeof data.provider === "string" ? data.provider : getProvider(user),
    handle: typeof data.handle === "string" ? data.handle : "",
    status: typeof data.status === "string" ? (data.status as any) : "active",
    warningCount: typeof data.warningCount === "number" ? data.warningCount : 0,
    lastWarningReason: typeof data.lastWarningReason === "string" ? data.lastWarningReason : undefined,
    suspendedUntil: data.suspendedUntil,
    suspensionReason: typeof data.suspensionReason === "string" ? data.suspensionReason : undefined,
    bannedAt: data.bannedAt,
    banReason: typeof data.banReason === "string" ? data.banReason : undefined,
  };
}

export function normalizeHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "_");
}

export function validateHandle(value: string) {
  const handle = normalizeHandle(value);
  if (!HANDLE_PATTERN.test(handle)) {
    return "Use 3–20 lowercase letters, numbers, hyphens, or underscores.";
  }
  return "";
}

export function getHandleReservationKey(value: string) {
  return normalizeHandle(value).replace(/[-_0-9]+/g, "");
}

export function isReservedLAPHandle(value: string) {
  const normalized = normalizeHandle(value);
  const confusableKey = normalized
    .replace(/1/g, "l")
    .replace(/4/g, "a")
    .replace(/9/g, "p")
    .replace(/[-_0-9]+/g, "");
  return (
    PROTECTED_BRAND_PATTERN.test(getHandleReservationKey(normalized)) ||
    PROTECTED_BRAND_PATTERN.test(confusableKey)
  );
}

export async function checkPublicHandleAvailability(
  value: string,
  currentUserId?: string,
): Promise<PublicHandleAvailability> {
  const handle = normalizeHandle(value);
  if (validateHandle(handle)) return "taken";

  const configSnapshot = currentUserId
    ? await getDoc(doc(db, "handleConfig", "status"))
    : null;
  if (!configSnapshot?.exists() || configSnapshot.data().ready !== true) {
    return "maintenance";
  }

  const reservationKey = getHandleReservationKey(handle);
  const reservationSnapshot = currentUserId
    ? await getDoc(doc(db, "handleReservations", reservationKey))
    : null;

  if (
    reservationSnapshot?.exists() &&
    reservationSnapshot.data().ownerUid !== currentUserId
  ) {
    return "reserved";
  }

  if (!reservationSnapshot?.exists() && isReservedLAPHandle(handle)) {
    return "reserved";
  }

  const snapshot = await getDoc(doc(db, "handles", handle));
  return snapshot.exists() && snapshot.data().uid !== currentUserId
    ? "taken"
    : "available";
}

export async function getExistingPublicProfile(user: User) {
  const snapshot = await getDoc(doc(db, "users", user.uid));
  return snapshot.exists() ? toPublicProfile(snapshot.data(), user) : null;
}

export async function syncPublicUser(user: User): Promise<PublicProfile> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const existingHandle =
    snapshot.exists() && typeof snapshot.data().handle === "string"
      ? snapshot.data().handle
      : "";

  if (existingHandle && user.displayName !== existingHandle) {
    await updateProfile(user, { displayName: existingHandle });
  }

  const profile: Record<string, any> = {
    uid: user.uid,
    email: user.email || "",
    displayName: existingHandle || getDisplayName(user),
    photoURL: user.photoURL || "",
    provider: getProvider(user),
    updatedAt: serverTimestamp(),
  };

  if (snapshot.exists()) {
    const currentProfile = snapshot.data();
    const needsHandleMigration = typeof currentProfile.handle !== "string";
    const profileChanged =
      currentProfile.email !== profile.email ||
      currentProfile.displayName !== profile.displayName ||
      currentProfile.photoURL !== profile.photoURL ||
      currentProfile.provider !== profile.provider ||
      needsHandleMigration;

    if (profileChanged) {
      await updateDoc(userRef, {
        ...profile,
        ...(needsHandleMigration ? { handle: "" } : {}),
      });
    }

    return toPublicProfile(
      { ...currentProfile, ...profile, handle: currentProfile.handle || "" },
      user,
    );
  }

  throw new Error("Complete your reader profile before continuing.");
}

export async function claimPublicHandle(user: User, value: string) {
  const handle = normalizeHandle(value);
  const validationError = validateHandle(handle);
  if (validationError) throw new Error(validationError);

  const availability = await checkPublicHandleAvailability(handle, user.uid);
  if (availability === "reserved") {
    throw new Error("That handle is reserved for the L.A.P team.");
  }
  if (availability === "taken") {
    throw new Error("That handle is already taken.");
  }
  if (availability === "maintenance") {
    throw new Error("Handle setup is temporarily unavailable. Please try again soon.");
  }

  const userRef = doc(db, "users", user.uid);
  const handleRef = doc(db, "handles", handle);

  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const currentHandle =
      userSnapshot.exists() && typeof userSnapshot.data().handle === "string"
        ? userSnapshot.data().handle
        : "";
    const handleSnapshot = await transaction.get(handleRef);

    if (currentHandle && currentHandle !== handle) {
      throw new Error("Handles cannot be changed after account setup.");
    }

    if (handleSnapshot.exists() && handleSnapshot.data().uid !== user.uid) {
      throw new Error("That handle is already taken.");
    }

    if (!handleSnapshot.exists()) {
      transaction.set(handleRef, {
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    }
    if (!userSnapshot.exists()) {
      transaction.set(userRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: handle,
        photoURL: user.photoURL || "",
        provider: getProvider(user),
        handle,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_VERSION,
        guidelinesAcceptedAt: serverTimestamp(),
        guidelinesVersion: GUIDELINES_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!currentHandle) {
      transaction.update(userRef, {
        handle,
        displayName: handle,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_VERSION,
        guidelinesAcceptedAt: serverTimestamp(),
        guidelinesVersion: GUIDELINES_VERSION,
        updatedAt: serverTimestamp(),
      });
    }

    return handle;
  });
}

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);
  const [deviceBlockReason, setDeviceBlockReason] = useState("");

  useEffect(() => {
    document.documentElement.dataset.lapHydrated = "true";
    try {
      window.sessionStorage.removeItem("lap_hydration_recovery_v1");
    } catch {
      // Storage can be unavailable in private browsing; hydration still succeeded.
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return null;
    }
    const snapshot = await getDoc(doc(db, "users", currentUser.uid));
    if (!snapshot.exists()) return null;
    const nextProfile = toPublicProfile(snapshot.data(), currentUser);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        setIsStaff(false);
        setStaffRole(null);
        setIsAdmin(false);
        try {
          const payload = await getDeviceRiskPayload();
          const syncRisk = httpsCallable<
            typeof payload,
            {
              blocked: boolean;
              reason?: string;
              riskFlagged?: boolean;
              riskReason?: string;
              staffBypass?: boolean;
            }
          >(functions, "syncUserRisk");
          const [existingProfile, staffSnapshot] = await Promise.all([
            getExistingPublicProfile(nextUser),
            getDoc(doc(db, "authors", nextUser.uid)),
          ]);
          // New accounts are linked to the browser by the onboarding flow after
          // its post-auth checks. This avoids leaving orphan device records when
          // a user accidentally creates an account while trying to sign in.
          const riskResult = existingProfile || staffSnapshot.exists()
            ? await syncRisk(payload)
            : { data: { blocked: false } };
          if (!active) return;
          const rawStaffRole = staffSnapshot.data()?.role;
          const hasStaffDoc =
            staffSnapshot.exists() &&
            ["super", "admin", "author", "moderator"].includes(rawStaffRole);
          setIsStaff(hasStaffDoc);
          if (hasStaffDoc) {
            const role = rawStaffRole as StaffRole;
            setStaffRole(role);
            setIsAdmin(role === "admin" || role === "super");
            // Reader device bans do not lock vetted team accounts out of the
            // site. Staff compromise and offboarding use the team controls;
            // the server still records matching risk signals for review.
            setIsDeviceBlocked(false);
            setDeviceBlockReason("");
          }

          if (riskResult.data.blocked && !hasStaffDoc) {
            setIsDeviceBlocked(true);
            setDeviceBlockReason(riskResult.data.reason || "This browser installation is blocked.");
            setUser(null);
            setProfile(null);
            await auth.signOut();
            return;
          }

          const syncedProfile = existingProfile ? await syncPublicUser(nextUser) : null;
          if (!active) return;
          const staffData = hasStaffDoc ? staffSnapshot.data() : undefined;
          const staffHandle =
            typeof staffData?.handle === "string"
              ? staffData.handle.trim().toLowerCase().replace(/^@+/, "")
              : "";
          const staffProfile: PublicProfile | null = staffHandle
            ? {
                uid: nextUser.uid,
                email: nextUser.email || "",
                displayName:
                  (typeof staffData?.name === "string" && staffData.name) ||
                  syncedProfile?.displayName ||
                  staffHandle,
                photoURL:
                  (typeof staffData?.avatar === "string" && staffData.avatar) ||
                  syncedProfile?.photoURL ||
                  nextUser.photoURL ||
                  "",
                provider: getProvider(nextUser),
                handle: staffHandle,
                status: syncedProfile?.status || "active",
                warningCount: syncedProfile?.warningCount,
                lastWarningReason: syncedProfile?.lastWarningReason,
                suspendedUntil: syncedProfile?.suspendedUntil,
                suspensionReason: syncedProfile?.suspensionReason,
                bannedAt: syncedProfile?.bannedAt,
                banReason: syncedProfile?.banReason,
              }
            : null;
          setUser(nextUser);
          setProfile(
            syncedProfile?.handle
              ? syncedProfile
              : staffProfile || syncedProfile,
          );
        } catch (error) {
          console.error("Unable to sync public user profile:", error);
          setUser(null);
          setProfile(null);
          setDeviceBlockReason("We could not verify this browser installation. Please reconnect and try again.");
          await auth.signOut().catch(() => undefined);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsStaff(false);
        setStaffRole(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isBanned = useMemo(() => {
    return Boolean(profile?.status === "banned" || profile?.bannedAt || isDeviceBlocked);
  }, [profile?.status, profile?.bannedAt, isDeviceBlocked]);

  const isSuspended = useMemo(() => {
    if (!profile?.suspendedUntil) return false;
    let suspendTime = 0;
    if (typeof profile.suspendedUntil?.toMillis === "function") {
      suspendTime = profile.suspendedUntil.toMillis();
    } else if (profile.suspendedUntil?.seconds) {
      suspendTime = profile.suspendedUntil.seconds * 1000;
    } else if (typeof profile.suspendedUntil === "string" || typeof profile.suspendedUntil === "number") {
      suspendTime = new Date(profile.suspendedUntil).getTime();
    }
    return suspendTime > Date.now();
  }, [profile?.suspendedUntil]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isStaff,
      staffRole,
      isAdmin,
      isLoading,
      isSuspended,
      isBanned,
      isDeviceBlocked,
      deviceBlockReason,
      refreshProfile,
    }),
    [
      user,
      profile,
      isStaff,
      staffRole,
      isAdmin,
      isLoading,
      isSuspended,
      isBanned,
      isDeviceBlocked,
      deviceBlockReason,
      refreshProfile,
    ],
  );

  return (
    <PublicAuthContext.Provider value={value}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (!context) {
    throw new Error("usePublicAuth must be used inside PublicAuthProvider");
  }
  return context;
}
