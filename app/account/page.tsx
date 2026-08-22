"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
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
  RiGoogleFill,
  RiImageAddLine,
  RiUser3Line,
} from "react-icons/ri";

const fieldClassName =
  "reader-auth-field w-full border-0 border-b border-white/40 bg-transparent px-0 py-3 text-lg text-white outline-none transition-colors duration-300 placeholder:text-white/25 focus:border-[#8a2be2] focus:ring-0";

const primaryButtonClassName =
  "group inline-flex min-h-16 w-full items-center justify-between bg-white px-5 font-semibold uppercase text-black transition-colors duration-300 hover:bg-[#8a2be2] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
const CMS_PROFILE_URL = "https://lap-cms.vercel.app/admin/profile";

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
  return (
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : ""
  );
}

function friendlyAuthError(error: unknown) {
  const code = authErrorCode(error);

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/weak-password":
      return "Use a password with at least six characters.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    default:
      return error instanceof Error
        ? error.message
        : "We could not complete that request. Please try again.";
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
  const { user, profile, isStaff, isLoading, refreshProfile } = usePublicAuth();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [pendingPhotoURL, setPendingPhotoURL] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingHandle, setSavingHandle] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [handleAvailability, setHandleAvailability] =
    useState<HandleAvailability>("idle");

  useEffect(() => {
    setHandle(profile?.handle || "");
  }, [profile?.handle]);

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
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setPassword("");
        setConfirmPassword("");
        setMessage("Account created. Add your photo and handle to finish.");
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
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
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const isNewFirebaseUser = getAdditionalUserInfo(credential)?.isNewUser === true;

      if (mode === "signin" && isNewFirebaseUser) {
        await deleteUser(credential.user);
        setMode("register");
        setError("No account was found. Create an account with Google below.");
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
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then choose reset password.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Check your inbox for a password reset link.");
    } catch (nextError) {
      setError(friendlyAuthError(nextError));
    } finally {
      setBusy(false);
    }
  };

  const saveHandle = async (event: FormEvent) => {
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

      const savedHandle = await claimPublicHandle(user, normalizedHandle);
      await updateProfile(user, { displayName: savedHandle });
      await syncPublicUser(user);
      await refreshProfile();
      setHandle(savedHandle);
      setPendingPhotoURL("");
      setMessage(`Your account is ready as @${savedHandle}.`);
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
      const avatarRef = ref(storage, `users/${user.uid}/profile/avatar`);
      await uploadBytes(avatarRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600",
      });
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
      ? "text-[#8a2be2]"
      : handleAvailability === "taken" ||
          handleAvailability === "reserved" ||
          handleAvailability === "maintenance" ||
          handleAvailability === "error"
        ? "text-red-300"
        : "text-white/40";

  return (
    <main className="mx-auto min-h-[65vh] w-full max-w-3xl px-4 pb-24 pt-12 md:pt-16">
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
        {message ? (
          <p role="status" className="mb-7 border-l-2 border-[#8a2be2] py-1 pl-4 text-white/80">
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
                  className="group relative z-10 mt-5 inline-flex min-h-11 pointer-events-auto items-center gap-2 border-b border-white/40 pb-1 font-semibold uppercase transition-colors hover:border-[#8a2be2] hover:text-[#8a2be2]"
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
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border-b border-white/40 pb-1 text-sm font-medium uppercase transition-colors hover:border-[#8a2be2] hover:text-[#8a2be2]">
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
                  <form onSubmit={saveHandle}>
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
                  className="group inline-flex items-center gap-2 font-semibold uppercase transition-colors hover:text-[#8a2be2] disabled:opacity-35"
                >
                  {savingHandle ? "Saving…" : "Finish account"}
                  <RiArrowRightLine className="text-xl transition-transform group-hover:translate-x-1" />
                </button>
              </div>
                  </form>
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-2 border-b border-white/40 pb-1 font-medium uppercase transition-colors hover:border-[#8a2be2] hover:text-[#8a2be2]"
            >
              Sign out <RiArrowRightLine className="text-xl" />
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex gap-7 border-b border-white/25" role="tablist" aria-label="Reader account mode">
              {(["signin", "register"] as const).map((value) => {
                const selected = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setMode(value);
                      setConfirmPassword("");
                      setError("");
                      setMessage("");
                    }}
                    className={`-mb-px border-b-2 pb-3 font-semibold uppercase transition-colors ${
                      selected ? "border-[#8a2be2]" : "border-transparent text-white/45 hover:text-white"
                    }`}
                  >
                    {value === "signin" ? "Sign in" : "Create account"}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={busy}
              className="group flex min-h-16 w-full items-center justify-between border-y border-white/40 px-1 font-semibold uppercase transition-colors hover:text-[#8a2be2] disabled:opacity-40"
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className={fieldClassName}
                />
              </div>
              {mode === "register" ? (
                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium uppercase tracking-[0.16em] text-white/55">
                    Retype password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={fieldClassName}
                  />
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
                className="mt-6 border-b border-white/40 pb-1 text-sm font-medium uppercase text-white/60 hover:border-[#8a2be2] hover:text-white disabled:opacity-40"
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
