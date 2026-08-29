"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getRedirectResult,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { auth, functions, storage } from "@/lib/firebase";
import { getDeviceRiskPayload } from "@/lib/device-identity";
import { sanitizeAndCompressImage } from "@/lib/image-sanitizer";
import {
  checkPublicHandleAvailability,
  claimPublicHandle,
  getExistingPublicProfile,
  normalizeHandle,
  syncPublicUser,
  usePublicAuth,
  validateHandle,
} from "@/lib/public-auth-context";
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiAlertLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGoogleFill,
  RiImageAddLine,
  RiShieldCheckLine,
  RiUser3Line,
} from "react-icons/ri";

const fieldClassName =
  "reader-auth-field w-full border-0 border-b border-white/40 bg-transparent px-0 py-3 text-lg text-white outline-none transition-colors duration-300 placeholder:text-white/25 focus:border-[#8a2ae3] focus:ring-0";

const primaryButtonClassName =
  "group inline-flex min-h-16 w-full items-center justify-between bg-white px-5 font-semibold uppercase text-black transition-colors duration-300 hover:bg-[#8a2ae3] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2ae3] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
const CMS_PROFILE_URL = "https://cms.lap.onl/admin/profile";
const GOOGLE_REDIRECT_MODE_KEY = "lap_google_redirect_mode";

function shouldUseGoogleRedirect() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

async function checkCurrentDevice() {
  const payload = await getDeviceRiskPayload();
  const checkRisk = httpsCallable<typeof payload, { blocked: boolean; reason?: string }>(
    functions,
    "checkDeviceRisk",
  );
  return (await checkRisk(payload)).data;
}

async function syncCurrentDevice() {
  const payload = await getDeviceRiskPayload();
  const syncRisk = httpsCallable<typeof payload, { blocked: boolean; reason?: string }>(
    functions,
    "syncUserRisk",
  );
  return (await syncRisk(payload)).data;
}

type HandleAvailability =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "reserved"
  | "maintenance"
  | "current"
  | "error";

function authErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String(error.code);
  }
  if (error instanceof Error && error.message) {
    if (error.message.includes("auth/user-disabled") || error.message.includes("user-disabled")) {
      return "auth/user-disabled";
    }
  }
  return "";
}

function friendlyAuthError(error: unknown) {
  const code = authErrorCode(error);

  switch (code) {
    case "auth/user-disabled":
      return "This account has been permanently banned due to Community Guidelines violations.";
    case "auth/email-already-in-use":
      return "An account already exists for this email.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/weak-password":
      return "Use a password with at least six characters.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    default:
      if (error instanceof Error) {
        if (error.message.includes("user-disabled") || error.message.includes("auth/user-disabled")) {
          return "This account has been permanently banned due to Community Guidelines violations.";
        }
        return error.message;
      }
      return "We could not complete that request. Please try again.";
  }
}

function handleAvailabilityMessage(status: HandleAvailability) {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "available":
      return "Handle available.";
    case "taken":
      return "That handle is already taken.";
    case "reserved":
      return "That handle is reserved for the L.A.P team.";
    case "maintenance":
      return "Handle setup is temporarily unavailable. Try again soon.";
    case "current":
      return "This is your current handle.";
    case "error":
      return "Could not check availability. Please try again.";
    default:
      return "3-20 lowercase letters, numbers, hyphens, or underscores.";
  }
}


export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isStaff,
    isLoading,
    isSuspended,
    isBanned,
    isDeviceBlocked,
    deviceBlockReason,
    refreshProfile,
  } = usePublicAuth();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showGuidelinesStep, setShowGuidelinesStep] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [handle, setHandle] = useState("");
  const [pendingPhotoURL, setPendingPhotoURL] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingHandle, setSavingHandle] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const googleSignInStartedRef = useRef(false);
  const [handleAvailability, setHandleAvailability] =
    useState<HandleAvailability>("idle");

  useEffect(() => {
    setHandle(profile?.handle || "");
  }, [profile?.handle]);

  useEffect(() => {
    let cancelled = false;

    const completeGoogleRedirect = async () => {
      const pendingMode = window.sessionStorage.getItem(GOOGLE_REDIRECT_MODE_KEY);

      try {
        const credential = await getRedirectResult(auth);
        if (!credential || cancelled) return;

        window.sessionStorage.removeItem(GOOGLE_REDIRECT_MODE_KEY);
        setBusy(true);
        setError("");
        setMessage("");

        const redirectMode = pendingMode === "register" ? "register" : "signin";
        const isNewFirebaseUser = getAdditionalUserInfo(credential)?.isNewUser === true;

        if (redirectMode === "signin" && isNewFirebaseUser) {
          await deleteUser(credential.user);
          if (!cancelled) {
            setMode("register");
            setError("No account was found. Create an account with Google below.");
          }
          return;
        }

        const syncedRisk = await syncCurrentDevice();
        if (syncedRisk.blocked) {
          if (isNewFirebaseUser) {
            await deleteUser(credential.user).catch(() => undefined);
          }
          await signOut(auth).catch(() => undefined);
          if (!cancelled) {
            setError(
              syncedRisk.reason ||
                "This browser installation has been blocked due to Community Guidelines violations.",
            );
          }
          return;
        }

        const existingProfile = await getExistingPublicProfile(credential.user);
        if (existingProfile) {
          await syncPublicUser(credential.user);
          await refreshProfile();
        }

        if (!cancelled) {
          if (redirectMode === "register") {
            setMessage(
              existingProfile?.handle
                ? `Your account already exists as @${existingProfile.handle}.`
                : "Account created. Add your photo and handle to finish.",
            );
          } else {
            setMessage(
              existingProfile
                ? "Signed in."
                : "Welcome back. Finish your photo and handle to continue.",
            );
          }
        }
      } catch (nextError) {
        window.sessionStorage.removeItem(GOOGLE_REDIRECT_MODE_KEY);
        if (!cancelled) setError(friendlyAuthError(nextError));
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    void completeGoogleRedirect();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (!isStaff || profile?.handle) return;
    setMessage((current) =>
      current.includes("Finish your photo and handle") ? "" : current,
    );
  }, [isStaff, profile?.handle]);

  useEffect(() => {
    const shouldCheck = Boolean(user);
    if (!shouldCheck) {
      setHandleAvailability("idle");
      return;
    }

    const normalizedHandle = normalizeHandle(handle);
    if (profile?.handle && normalizedHandle === profile.handle) {
      setHandleAvailability("current");
      return;
    }
    if (validateHandle(normalizedHandle)) {
      setHandleAvailability("invalid");
      return;
    }

    setHandleAvailability("checking");
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const availability = await checkPublicHandleAvailability(
          normalizedHandle,
          user?.uid,
        );
        if (!cancelled) {
          setHandleAvailability(availability);
        }
      } catch {
        if (!cancelled) setHandleAvailability("error");
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [handle, profile?.handle, user]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && !acceptedTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to create your account.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const deviceRisk = await checkCurrentDevice();
      // Registration is denied before creating an Auth record. Existing users
      // may authenticate so syncUserRisk can distinguish a blocked reader from
      // a vetted staff account, which is handled by the separate team controls.
      if (mode === "register" && (deviceRisk.blocked || isDeviceBlocked)) {
        setError(deviceRisk.reason || deviceBlockReason || "This browser installation has been blocked due to Community Guidelines violations.");
        return;
      }

      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const syncedRisk = await syncCurrentDevice();
        if (syncedRisk.blocked) {
          await deleteUser(credential.user).catch(() => undefined);
          await signOut(auth).catch(() => undefined);
          throw new Error(syncedRisk.reason || "This browser installation is blocked.");
        }
        setPassword("");
        setConfirmPassword("");
        setMessage("Account created. Add your photo and handle to finish.");
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const syncedRisk = await syncCurrentDevice();
        if (syncedRisk.blocked) {
          await signOut(auth).catch(() => undefined);
          throw new Error(syncedRisk.reason || "This browser installation is blocked.");
        }
        const existingProfile = await getExistingPublicProfile(credential.user);
        if (existingProfile) {
          await syncPublicUser(credential.user);
          await refreshProfile();
          setMessage("Signed in.");
        } else {
          setMessage("Welcome back. Finish your photo and handle to continue.");
        }
      }
    } catch (nextError) {
      const code = authErrorCode(nextError);
      if (
        mode === "signin" &&
        ["auth/invalid-credential", "auth/user-not-found"].includes(code)
      ) {
        setMode("register");
        setPassword("");
        setError("No matching account was found. Create an account below.");
        return;
      }
      if (mode === "register" && code === "auth/email-already-in-use") {
        setMode("signin");
        setConfirmPassword("");
        setError("That account already exists. Sign in instead.");
        return;
      }
      setError(friendlyAuthError(nextError));
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (googleSignInStartedRef.current) return;
    if (mode === "register" && !acceptedTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy before creating an account with Google.");
      return;
    }
    googleSignInStartedRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const deviceRisk = await checkCurrentDevice();
      if (mode === "register" && (deviceRisk.blocked || isDeviceBlocked)) {
        setError(deviceRisk.reason || deviceBlockReason || "This browser installation has been blocked due to Community Guidelines violations.");
        return;
      }

      const provider = new GoogleAuthProvider();
      if (shouldUseGoogleRedirect()) {
        window.sessionStorage.setItem(GOOGLE_REDIRECT_MODE_KEY, mode);
        await signInWithRedirect(auth, provider);
        return;
      }

      const credential = await signInWithPopup(auth, provider);
      const isNewFirebaseUser = getAdditionalUserInfo(credential)?.isNewUser === true;

      if (mode === "signin" && isNewFirebaseUser) {
        await deleteUser(credential.user);
        setMode("register");
        setError("No account was found. Create an account with Google below.");
        return;
      }

      const syncedRisk = await syncCurrentDevice();
      if (syncedRisk.blocked) {
        if (isNewFirebaseUser) {
          await deleteUser(credential.user).catch(() => undefined);
        }
        await signOut(auth).catch(() => undefined);
        setError(syncedRisk.reason || "This browser installation has been blocked due to Community Guidelines violations.");
        return;
      }

      if (mode === "register") {
        const existingProfile = await getExistingPublicProfile(credential.user);
        if (existingProfile?.handle) {
          await syncPublicUser(credential.user);
          await refreshProfile();
          setMessage(`Your account already exists as @${existingProfile.handle}.`);
        } else {
          setMessage("Account created. Add your photo and handle to finish.");
        }
      } else {
        const existingProfile = await getExistingPublicProfile(credential.user);
        if (existingProfile) {
          await syncPublicUser(credential.user);
          await refreshProfile();
          setMessage("Signed in.");
        } else {
          setMessage("Welcome back. Finish your photo and handle to continue.");
        }
      }
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      googleSignInStartedRef.current = false;
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email first, then choose reset password.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setMessage("If an eligible account exists for that email, a password reset link will arrive shortly.");
    } catch (nextError) {
      console.warn("Password reset request was not accepted:", authErrorCode(nextError));
      setMessage("If an eligible account exists for that email, a password reset link will arrive shortly.");
    } finally {
      setBusy(false);
    }
  };

  const selectAccountMode = (value: "signin" | "register") => {
    setMode(value);
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  const proceedToGuidelines = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (profile?.handle) {
      setError("Handles cannot be changed after account setup.");
      return;
    }
    const normalizedHandle = normalizeHandle(handle);
    const validationError = validateHandle(normalizedHandle);
    if (validationError) {
      setError(validationError);
      return;
    }
    const currentPhotoURL =
      pendingPhotoURL || profile?.photoURL || user.photoURL || "";
    if (!profile?.handle && !currentPhotoURL) {
      setError("Add a profile picture before finishing your account.");
      return;
    }

    setSavingHandle(true);
    setError("");
    setMessage("");
    try {
      const availability = await checkPublicHandleAvailability(
        normalizedHandle,
        user.uid,
      );
      if (availability !== "available") {
        setHandleAvailability(availability);
        throw new Error(
          availability === "reserved"
            ? "That handle is reserved for the L.A.P team."
            : availability === "maintenance"
              ? "Handle setup is temporarily unavailable. Please try again soon."
              : "That handle is already taken.",
        );
      }
      setShowGuidelinesStep(true);
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setSavingHandle(false);
    }
  };

  const finalizeAccountWithGuidelines = async () => {
    if (!user) return;
    if (!acceptedTerms || !acceptedGuidelines) {
      setError("Please accept the Terms and Community Guidelines to finish joining.");
      return;
    }
    const normalizedHandle = normalizeHandle(handle);
    setSavingHandle(true);
    setError("");
    setMessage("");
    try {
      const syncedRisk = await syncCurrentDevice();
      if (syncedRisk.blocked) {
        await signOut(auth).catch(() => undefined);
        throw new Error(syncedRisk.reason || "This browser installation is blocked.");
      }
      const savedHandle = await claimPublicHandle(user, normalizedHandle);
      await updateProfile(user, { displayName: savedHandle });
      await syncPublicUser(user);
      await syncCurrentDevice();
      await refreshProfile();
      setHandle(savedHandle);
      setPendingPhotoURL("");
      setMessage(`Your account is ready as @${savedHandle}. Welcome!`);
      router.push("/");
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setSavingHandle(false);
    }
  };

  const uploadProfilePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!user || !file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile pictures must be 5 MB or smaller.");
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setMessage("");
    try {
      const sanitized = await sanitizeAndCompressImage(file);
      const avatarRef = ref(storage, `users/${user.uid}/profile/avatar`);
      try {
        await uploadBytes(avatarRef, sanitized.blob, {
          contentType: sanitized.contentType,
          cacheControl: "public,max-age=300",
        });
      } finally {
        URL.revokeObjectURL(sanitized.previewUrl);
      }
      const downloadURL = await getDownloadURL(avatarRef);
      const versionedURL = `${downloadURL}${downloadURL.includes("?") ? "&" : "?"}v=${Date.now()}`;
      await updateProfile(user, { photoURL: versionedURL });
      setPendingPhotoURL(versionedURL);
      if (profile) {
        await syncPublicUser(user);
        await refreshProfile();
        setPendingPhotoURL("");
        setMessage("Profile picture updated.");
      } else {
        setMessage("Profile picture added. Choose your handle to finish.");
      }
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeAccount = async () => {
    if (!user || deletingAccount) return;
    if (isStaff) {
      setError("Staff accounts can only be deleted from the CMS.");
      return;
    }

    const confirmation = window.prompt(
      "This permanently deletes your account and profile. Your comments will remain as Deleted user, and your article bylines and votes will remain. Type DELETE to continue.",
    );
    if (confirmation === null) return;
    if (confirmation !== "DELETE") {
      setError("Account deletion cancelled. Type DELETE exactly to confirm.");
      return;
    }

    setDeletingAccount(true);
    setError("");
    setMessage("");
    try {
      const deleteOwnAccount = httpsCallable<
        { confirmation: "DELETE" },
        { deleted: boolean }
      >(functions, "deleteOwnAccount");
      await deleteOwnAccount({ confirmation: "DELETE" });
      await signOut(auth).catch(() => undefined);
      router.push("/");
      router.refresh();
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto min-h-[65vh] w-full max-w-3xl px-4 py-14">
        <div className="h-10 w-56 animate-pulse bg-white/10" />
      </main>
    );
  }

  const photoURL = pendingPhotoURL || profile?.photoURL || user?.photoURL || "";
  const displayName = profile?.displayName || user?.displayName || user?.email || "Reader";
  const handleStatusClassName =
    handleAvailability === "available" || handleAvailability === "current"
      ? "text-[#8a2ae3]"
      : handleAvailability === "taken" ||
          handleAvailability === "reserved" ||
          handleAvailability === "maintenance" ||
          handleAvailability === "error"
        ? "text-red-300"
        : "text-white/40";

  return (
    <main className="reader-auth-shell relative z-[60] isolate mx-auto min-h-[65vh] w-full max-w-3xl px-4 pb-24 pt-12 md:pt-16">
      <header className="border-b border-white/30 pb-7">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/45">
          Reader account
        </p>
        <h1 className="mt-3 text-5xl font-semibold uppercase leading-none md:text-7xl">
          {user
            ? profile?.handle
              ? "Your account"
              : isStaff
                ? "Team account"
                : "Complete your account"
            : "Account"}
        </h1>
        <p className="mt-4 text-white/55">
          {user
            ? profile?.handle
              ? "Change your profile picture. Your handle is permanent."
              : isStaff
                ? "Your team profile and comment handle are managed in the CMS."
                : "Add your profile picture and choose an available handle."
            : "Sign in to leave a comment."}
        </p>
      </header>

      <section className="py-8">
        {/* Account / device lockout notice */}
        {isBanned || isDeviceBlocked ? (
          <div className="mb-8 border border-red-500/50 bg-red-500/10 p-6 text-center space-y-3">
            <RiAlertLine className="mx-auto text-4xl text-red-400" />
            <h2 className="text-xl font-bold uppercase tracking-wide text-red-200">
              Access Forbidden
            </h2>
            <p className="text-sm text-white/80 max-w-md mx-auto leading-relaxed">
              {profile?.banReason || deviceBlockReason || "This account or browser installation has been blocked due to violations of our Community Guidelines."}
            </p>
            <div>
              <Link
                href="/community-guidelines"
                className="text-xs text-red-300 hover:text-white underline inline-block mt-2"
              >
                Read Community Guidelines →
              </Link>
            </div>
          </div>
        ) : isSuspended ? (
          /* Commenting Suspension Notice */
          <div className="mb-8 border border-orange-500/50 bg-orange-500/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-orange-300 font-bold uppercase text-xs tracking-wider">
              <RiAlertLine className="text-lg text-orange-400" />
              Commenting Privileges Suspended
            </div>
            <p className="text-xs text-white/80">
              Your commenting privileges are currently suspended until{" "}
              <strong className="text-white">
                {profile?.suspendedUntil?.toDate ? profile.suspendedUntil.toDate().toLocaleDateString() : "further notice"}
              </strong>{" "}
              {profile?.suspensionReason ? `due to: "${profile.suspensionReason}"` : "due to Community Guidelines violations"}.
            </p>
          </div>
        ) : profile?.status === "warning" ? (
          /* Formal Warning Notice */
          <div className="mb-8 border border-amber-500/40 bg-amber-500/10 p-4 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase text-xs tracking-wider">
              <RiAlertLine className="text-base text-amber-400" />
              Active Warning on Account
            </div>
            <p className="text-xs text-white/80">
              A formal warning was issued to this account {profile?.lastWarningReason ? `(${profile.lastWarningReason})` : ""}. Please review our standards to keep your account in good standing.
            </p>
            <Link href="/community-guidelines" className="text-xs text-amber-300 underline inline-block mt-1">
              View Community Guidelines →
            </Link>
          </div>
        ) : null}

        {message ? (
          <p role="status" className="mb-7 border-l-2 border-[#8a2ae3] py-1 pl-4 text-white/80">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mb-7 border-l-2 border-red-400 py-1 pl-4 text-red-200">
            {error}
          </p>
        ) : null}

        {user ? (
          <div className="space-y-9">
            {isStaff && !profile?.handle ? (
              <div className="border-b border-white/25 pb-8">
                <p className="text-white/65">
                  Your comment profile will be created automatically from your
                  CMS team profile.
                </p>
                <a
                  href={CMS_PROFILE_URL}
                  className="group relative z-10 mt-5 inline-flex min-h-11 pointer-events-auto items-center gap-2 border-b border-white/40 pb-1 font-semibold uppercase transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3]"
                >
                  Open CMS profile
                  <RiArrowRightLine className="text-xl transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-5 border-b border-white/25 pb-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-white/10">
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoURL}
                    alt={`${displayName}'s profile picture`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <RiUser3Line className="text-3xl text-white/45" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">
                  {profile?.handle ? `@${profile.handle}` : displayName}
                </h2>
                <p className="mt-1 truncate text-sm text-white/45">{user.email}</p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border-b border-white/40 pb-1 text-sm font-medium uppercase transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3]">
                  <RiImageAddLine className="text-lg" />
                  {uploadingPhoto
                    ? "Uploading…"
                    : photoURL
                      ? "Change picture"
                      : "Add picture"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadProfilePhoto}
                    disabled={uploadingPhoto}
                    className="sr-only"
                  />
                </label>
              </div>
                </div>

                {!profile?.handle ? (
                  showGuidelinesStep ? (
                    <div className="space-y-6 border border-[#8a2ae3]/40 bg-[#8a2ae3]/10 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8a2ae3]/30 text-[#8a2ae3]">
                          <RiShieldCheckLine className="text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white uppercase tracking-wide">Community Guidelines Commitment</h3>
                          <p className="text-xs text-white/70">
                            Joining as <strong className="text-[#8a2ae3]">@{normalizeHandle(handle)}</strong>
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 leading-relaxed">
                        To maintain a welcoming, respectful, and technical space for everyone, all members agree to our core community standards:
                      </p>

                      <div className="space-y-3 text-xs text-gray-300">
                        <div className="flex items-start gap-2.5">
                          <span className="text-[#8a2ae3] font-bold">✓</span>
                          <span><strong>Be Respectful:</strong> No harassment, hate speech, bullying, or personal attacks. Disagree with ideas, not individuals.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="text-[#8a2ae3] font-bold">✓</span>
                          <span><strong>Constructive & Relevant:</strong> Keep comments on topic, provide helpful technical insights, and support beginners.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="text-[#8a2ae3] font-bold">✓</span>
                          <span><strong>No Spam or Scams:</strong> No automated posting, unsolicited self-promotion, affiliate farming, or deceptive links.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="text-[#8a2ae3] font-bold">✓</span>
                          <span><strong>Authentic Identity:</strong> No impersonation of staff, authors, or other readers.</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href="/community-guidelines"
                          target="_blank"
                          className="text-xs text-[#8a2ae3] underline hover:text-white"
                        >
                          Read our complete Community Guidelines &rarr;
                        </Link>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer select-none border-t border-white/15 pt-4 text-xs text-white/90">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-[#8a2ae3] focus:ring-[#8a2ae3]"
                        />
                        <span>
                          I have read and accept the <Link href="/terms-of-service" target="_blank" className="underline">Terms of Service</Link> and <Link href="/privacy-policy" target="_blank" className="underline">Privacy Policy</Link>.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-white/90">
                        <input
                          type="checkbox"
                          checked={acceptedGuidelines}
                          onChange={(e) => setAcceptedGuidelines(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-[#8a2ae3] focus:ring-[#8a2ae3]"
                        />
                        <span>
                          I have read and agree to follow the <strong>Community Guidelines</strong>.
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowGuidelinesStep(false)}
                          disabled={savingHandle}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-white/50 hover:text-white"
                        >
                          <RiArrowLeftLine className="text-base" /> Change Handle
                        </button>

                        <button
                          type="button"
                          onClick={finalizeAccountWithGuidelines}
                          disabled={savingHandle || !acceptedTerms || !acceptedGuidelines}
                          className="group inline-flex items-center gap-2 bg-[#8a2ae3] px-6 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-[#9d3df0] disabled:opacity-40"
                        >
                          <span>{savingHandle ? "Joining…" : "Agree & Join Community"}</span>
                          <RiArrowRightLine className="text-base transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={proceedToGuidelines}>
                      <label htmlFor="handle" className="text-sm font-medium uppercase tracking-[0.18em] text-white/55">
                        Handle
                      </label>
                      <div className="relative">
                        <span className="absolute bottom-3 left-0 text-lg text-white/40">@</span>
                        <input
                          id="handle"
                          value={handle}
                          onChange={(event) =>
                            setHandle(
                              event.target.value
                                .toLowerCase()
                                .replace(/^@+/, "")
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_-]/g, "")
                                .slice(0, 20),
                            )
                          }
                          minLength={3}
                          maxLength={20}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className={`${fieldClassName} pl-6`}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                        <p aria-live="polite" className={`text-sm ${handleStatusClassName}`}>
                          {handleAvailabilityMessage(handleAvailability)}
                        </p>
                        <button
                          disabled={
                            savingHandle ||
                            handleAvailability !== "available" ||
                            !photoURL
                          }
                          className="group inline-flex items-center gap-2 font-semibold uppercase transition-colors hover:text-[#8a2ae3] disabled:opacity-35"
                        >
                          {savingHandle ? "Checking…" : "Continue to Guidelines"}
                          <RiArrowRightLine className="text-xl transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </form>
                  )
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-2 border-b border-white/40 pb-1 font-medium uppercase transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3]"
            >
              Sign out <RiArrowRightLine className="text-xl" />
            </button>

            <div className="border-t border-white/20 pt-8">
              <h2 className="text-lg font-semibold uppercase">Delete account</h2>
              {isStaff ? (
                <>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                    Team accounts can only be deleted from the CMS.
                  </p>
                  <a
                    href={CMS_PROFILE_URL}
                    className="mt-5 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm font-semibold uppercase transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3]"
                  >
                    Open CMS profile
                    <RiArrowRightLine className="text-xl" aria-hidden="true" />
                  </a>
                </>
              ) : (
                <>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                    Your profile and sign-in will be permanently removed. Articles,
                    comments, replies, and their vote totals will stay published.
                  </p>
                  <button
                    type="button"
                    onClick={removeAccount}
                    disabled={deletingAccount}
                    className="mt-5 inline-flex items-center gap-2 border-b border-red-400/60 pb-1 text-sm font-semibold uppercase text-red-300 transition-colors hover:border-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RiDeleteBinLine className="text-lg" aria-hidden="true" />
                    {deletingAccount ? "Deleting…" : "Delete my account"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : isBanned || isDeviceBlocked ? null : (
          <div>
            <div className="relative z-10 mb-8 flex gap-7 border-b border-white/25" role="tablist" aria-label="Reader account mode">
              {(["signin", "register"] as const).map((value) => {
                const selected = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => selectAccountMode(value)}
                    onTouchEnd={(event) => {
                      event.preventDefault();
                      selectAccountMode(value);
                    }}
                    className={`relative z-10 touch-manipulation -mb-px border-b-2 pb-3 font-semibold uppercase transition-colors ${
                      selected ? "border-[#8a2ae3]" : "border-transparent text-white/45 hover:text-white"
                    }`}
                  >
                    {value === "signin" ? "Sign in" : "Create account"}
                  </button>
                );
              })}
            </div>

            {mode === "register" ? (
              <div className="mb-6 border border-white/15 bg-white/[0.03] p-4">
                <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-white/80">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-[#8a2ae3] focus:ring-[#8a2ae3]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms-of-service" target="_blank" className="text-white underline hover:text-[#8a2ae3]">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" target="_blank" className="text-white underline hover:text-[#8a2ae3]">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
              </div>
            ) : null}

            <button
              type="button"
              onClick={signInWithGoogle}
              onTouchEnd={(event) => {
                event.preventDefault();
                void signInWithGoogle();
              }}
              disabled={busy}
              className="group relative z-10 flex min-h-16 w-full touch-manipulation items-center justify-between border-y border-white/40 px-1 font-semibold uppercase transition-colors hover:text-[#8a2ae3] disabled:opacity-40"
            >
              <span className="flex items-center gap-3">
                <RiGoogleFill className="text-xl" />
                {mode === "register" ? "Create with Google" : "Continue with Google"}
              </span>
              <RiArrowRightLine className="text-xl transition-transform group-hover:translate-x-1" />
            </button>

            <p className="my-7 text-sm font-medium uppercase tracking-[0.18em] text-white/35">Or use email</p>

            <form onSubmit={submitEmail} className="space-y-6">
              <div>
                <label htmlFor="email" className="text-sm font-medium uppercase tracking-[0.16em] text-white/55">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className={fieldClassName}
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium uppercase tracking-[0.16em] text-white/55">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className={`${fieldClassName} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-[#8a2ae3]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <RiEyeOffLine className="text-xl" />
                    ) : (
                      <RiEyeLine className="text-xl" />
                    )}
                  </button>
                </div>
              </div>
              {mode === "register" ? (
                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium uppercase tracking-[0.16em] text-white/55">
                    Retype password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={`${fieldClassName} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-[#8a2ae3]"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <RiEyeOffLine className="text-xl" />
                      ) : (
                        <RiEyeLine className="text-xl" />
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
              <button
                disabled={busy}
                className={primaryButtonClassName}
              >
                <span>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</span>
                <RiArrowRightLine className="text-xl transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {mode === "signin" ? (
              <button
                type="button"
                onClick={resetPassword}
                disabled={busy}
                className="mt-6 border-b border-white/40 pb-1 text-sm font-medium uppercase text-white/60 hover:border-[#8a2ae3] hover:text-white disabled:opacity-40"
              >
                Reset password
              </button>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
