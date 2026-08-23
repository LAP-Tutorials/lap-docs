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
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type PublicProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
  handle: string;
};

export type StaffRole = "super" | "admin" | "manager" | "moderator";

type PublicAuthContextValue = {
  user: User | null;
  profile: PublicProfile | null;
  isStaff: boolean;
  staffRole: StaffRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<PublicProfile | null>;
};

const PublicAuthContext = createContext<PublicAuthContextValue | undefined>(
  undefined,
);

const HANDLE_PATTERN = /^[a-z0-9_-]{3,20}$/;
const PROTECTED_BRAND_PATTERN = /^(official|real|the|team|weare|my)?(lap|arclapain)/;

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

  const profile = {
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!currentHandle) {
      transaction.update(userRef, {
        handle,
        displayName: handle,
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
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setIsStaff(false);
        setStaffRole(null);
        setIsAdmin(false);
        try {
          const [existingProfile, staffSnapshot] = await Promise.all([
            getExistingPublicProfile(nextUser),
            getDoc(doc(db, "authors", nextUser.uid)),
          ]);
          const hasStaffDoc = staffSnapshot.exists();
          setIsStaff(hasStaffDoc);
          if (hasStaffDoc) {
            const role = (staffSnapshot.data()?.role as StaffRole) || null;
            setStaffRole(role);
            setIsAdmin(role === "admin" || role === "super");
          }
          setProfile(existingProfile ? await syncPublicUser(nextUser) : null);
        } catch (error) {
          console.error("Unable to sync public user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setIsStaff(false);
        setStaffRole(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({ user, profile, isStaff, staffRole, isAdmin, isLoading, refreshProfile }),
    [user, profile, isStaff, staffRole, isAdmin, isLoading, refreshProfile],
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
