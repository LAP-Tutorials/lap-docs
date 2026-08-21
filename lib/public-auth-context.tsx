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

type PublicAuthContextValue = {
  user: User | null;
  profile: PublicProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<PublicProfile | null>;
};

const PublicAuthContext = createContext<PublicAuthContextValue | undefined>(
  undefined,
);

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

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
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export function validateHandle(value: string) {
  const handle = normalizeHandle(value);
  if (!HANDLE_PATTERN.test(handle)) {
    return "Use 3–20 lowercase letters, numbers, or underscores.";
  }
  return "";
}

export async function checkPublicHandleAvailability(
  value: string,
  currentUserId?: string,
) {
  const handle = normalizeHandle(value);
  if (validateHandle(handle)) return false;

  const snapshot = await getDoc(doc(db, "handles", handle));
  return !snapshot.exists() || snapshot.data().uid === currentUserId;
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

  const userRef = doc(db, "users", user.uid);
  const handleRef = doc(db, "handles", handle);

  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const currentHandle =
      userSnapshot.exists() && typeof userSnapshot.data().handle === "string"
        ? userSnapshot.data().handle
        : "";
    const handleSnapshot = await transaction.get(handleRef);

    if (handleSnapshot.exists() && handleSnapshot.data().uid !== user.uid) {
      throw new Error("That handle is already taken.");
    }

    let previousHandleRef: ReturnType<typeof doc> | null = null;
    let previousHandleOwned = false;
    if (currentHandle && currentHandle !== handle) {
      previousHandleRef = doc(db, "handles", currentHandle);
      const previousHandleSnapshot = await transaction.get(previousHandleRef);
      previousHandleOwned =
        previousHandleSnapshot.exists() && previousHandleSnapshot.data().uid === user.uid;
    }

    if (!handleSnapshot.exists()) {
      transaction.set(handleRef, {
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    }
    if (previousHandleRef && previousHandleOwned) {
      transaction.delete(previousHandleRef);
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
    } else if (
      currentHandle !== handle ||
      userSnapshot.data().displayName !== handle
    ) {
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
        try {
          const existingProfile = await getExistingPublicProfile(nextUser);
          setProfile(existingProfile ? await syncPublicUser(nextUser) : null);
        } catch (error) {
          console.error("Unable to sync public user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({ user, profile, isLoading, refreshProfile }),
    [user, profile, isLoading, refreshProfile],
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
