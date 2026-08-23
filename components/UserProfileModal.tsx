"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import {
  RiCalendarLine,
  RiChat3Line,
  RiCloseLine,
  RiGithubFill,
  RiGlobeLine,
  RiMapPinLine,
  RiReplyLine,
  RiShieldUserLine,
  RiTwitterFill,
  RiUser3Line,
  RiYoutubeFill,
} from "react-icons/ri";
import { db } from "@/lib/firebase";

export type StaffRole = "super" | "admin" | "manager" | "moderator";

export type StaffProfile = {
  name: string;
  avatar: string;
  role: StaffRole;
};

interface UserProfileModalProps {
  userId: string | null;
  initialData?: {
    name?: string;
    handle?: string;
    photoURL?: string;
  };
  staffProfile?: StaffProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface LoadedProfile {
  displayName: string;
  handle: string;
  photoURL: string;
  createdAt?: Timestamp;
  provider?: string;
  bio?: string;
  city?: string;
  job?: string;
  socials?: Record<string, string>;
  role?: StaffRole;
  commentsCount: number;
  repliesCount: number;
  joinedDate?: Date | null;
}

const ROLE_DISPLAY: Record<
  StaffRole,
  { label: string; badgeClass: string }
> = {
  super: {
    label: "Super Admin",
    badgeClass: "border-[#8a2ae3]/50 text-[#c084fc] bg-[#8a2ae3]/15",
  },
  admin: {
    label: "Admin",
    badgeClass: "border-[#8a2ae3]/50 text-[#c084fc] bg-[#8a2ae3]/15",
  },
  manager: {
    label: "Author",
    badgeClass: "border-[#f3c969]/50 text-[#f3c969] bg-[#f3c969]/15",
  },
  moderator: {
    label: "Moderator",
    badgeClass: "border-[#5eead4]/50 text-[#5eead4] bg-[#5eead4]/15",
  },
};

function extractBioString(source: unknown): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  if (typeof source === "object" && source !== null) {
    const obj = source as Record<string, unknown>;
    if (typeof obj.summary === "string" && obj.summary.trim()) return obj.summary;
    if (typeof obj.body === "string" && obj.body.trim()) return obj.body;
    if (typeof obj.bio === "string" && obj.bio.trim()) return obj.bio;
  }
  return "";
}

function parseAnyDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (typeof value.toDate === "function") {
    try {
      const d = value.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
  }

  if (typeof value === "object" && value !== null) {
    const sec = value.seconds ?? value._seconds;
    if (typeof sec === "number") {
      return new Date(sec * 1000);
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function getAuthorDate(author: any): Date | null {
  if (!author) return null;
  const fields = [
    "createdAt",
    "created_at",
    "date",
    "joinedDate",
    "joined_date",
    "joinedAt",
    "joined_at",
    "timestamp",
    "updatedAt",
    "updated_at",
  ];
  for (const field of fields) {
    if (author[field] !== undefined && author[field] !== null) {
      const parsed = parseAnyDate(author[field]);
      if (parsed) return parsed;
    }
  }
  return null;
}

export default function UserProfileModal({
  userId,
  initialData,
  staffProfile,
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      return;
    }

    if (userId === "deleted-user") {
      setProfile({
        displayName: "Deleted User",
        handle: "deleted_user",
        photoURL: "/logos/LAP-Logo-Color.png",
        commentsCount: 0,
        repliesCount: 0,
      });
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const authorRef = doc(db, "authors", userId);
        const commentsRef = collection(db, "comments");
        const repliesRef = collection(db, "commentReplies");

        const [
          userSnap,
          authorSnap,
          commentsCountSnap,
          repliesCountSnap,
        ] = await Promise.all([
          getDoc(userRef).catch(() => null),
          getDoc(authorRef).catch(() => null),
          getCountFromServer(
            query(
              commentsRef,
              where("authorId", "==", userId),
              where("status", "==", "visible"),
            ),
          ).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(
            query(
              repliesRef,
              where("authorId", "==", userId),
              where("status", "==", "visible"),
            ),
          ).catch(() => ({ data: () => ({ count: 0 }) })),
        ]);

        if (!isMounted) return;

        const userData = userSnap?.data();
        const authorData = authorSnap?.data();

        const role =
          staffProfile?.role ||
          (authorData?.role as StaffRole | undefined);

        const bioString = extractBioString(
          authorData?.biography || authorData?.bio,
        );

        const authDate = role ? getAuthorDate(authorData) : null;
        const userDate = parseAnyDate(userData?.createdAt || userData?.updatedAt);
        const effectiveJoinedDate = role
          ? authDate || userDate
          : userDate || authDate;

        const loaded: LoadedProfile = {
          displayName:
            authorData?.name ||
            userData?.displayName ||
            initialData?.name ||
            "Reader",
          handle:
            authorData?.handle ||
            userData?.handle ||
            initialData?.handle ||
            "",
          photoURL:
            authorData?.avatar ||
            userData?.photoURL ||
            initialData?.photoURL ||
            "",
          createdAt:
            authorData?.createdAt ||
            authorData?.created_at ||
            (role ? undefined : userData?.createdAt),
          provider: userData?.provider,
          joinedDate: effectiveJoinedDate,
          bio: bioString,
          city: authorData?.city,
          job: authorData?.job,
          socials: authorData?.socials,
          role,
          commentsCount: commentsCountSnap.data().count,
          repliesCount: repliesCountSnap.data().count,
        };

        setProfile(loaded);
      } catch (err) {
        console.warn("Error loading user profile details:", err);
        if (isMounted) {
          setProfile({
            displayName: initialData?.name || "Reader",
            handle: initialData?.handle || "",
            photoURL: initialData?.photoURL || "",
            role: staffProfile?.role,
            commentsCount: 0,
            repliesCount: 0,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, initialData, staffProfile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !userId) return null;

  const roleMeta = profile?.role ? ROLE_DISPLAY[profile.role] : null;
  const isDeleted = userId === "deleted-user";

  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden border border-white/20 bg-[#0d0d0f] p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] transition-all sm:p-7">
        {/* Subtle top ambient purple glow line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#8a2ae3] to-transparent opacity-80" />

        {/* Header Row: Avatar + Info on left, Close button on right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center overflow-hidden border border-white/25 bg-white/10 shadow-lg">
              {profile?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || "User avatar"}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-bold uppercase text-white/60">
                  {profile?.displayName?.charAt(0) || "?"}
                </span>
              )}
            </div>

            {/* Name, Handle & Role Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3
                  id="user-profile-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-white truncate"
                >
                  {loading ? "Loading…" : profile?.displayName}
                </h3>
                {profile?.role ? (
                  <span
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
                    title={`L.A.P ${roleMeta?.label}`}
                  >
                    <Image
                      src="/logos/LAP-Logo-Transparent.png"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                ) : null}
              </div>

              {profile?.handle ? (
                <p className="font-mono text-xs sm:text-sm text-[#8a2ae3] truncate font-medium">
                  @{profile.handle}
                </p>
              ) : (
                <p className="text-xs italic text-white/40">
                  No handle claimed
                </p>
              )}

              {/* Role badge */}
              <div className="mt-1.5">
                {roleMeta ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider border ${roleMeta.badgeClass}`}
                  >
                    <RiShieldUserLine className="text-xs" />
                    <span>{roleMeta.label}</span>
                  </span>
                ) : isDeleted ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider border border-white/15 text-white/40 bg-white/5">
                    Deleted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider border border-white/20 text-white/70 bg-white/5">
                    Reader
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 bg-white/5 text-white/60 transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* Bio if available */}
        {profile?.bio ? (
          <p className="mt-4 border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed font-light text-white/80">
            {profile.bio}
          </p>
        ) : null}

        {/* Job / City */}
        {(profile?.job || profile?.city) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50 font-mono">
            {profile.job && (
              <span className="flex items-center gap-1.5">
                <RiUser3Line className="text-white/35" />
                {profile.job}
              </span>
            )}
            {profile.city && (
              <span className="flex items-center gap-1.5">
                <RiMapPinLine className="text-white/35" />
                {profile.city}
              </span>
            )}
          </div>
        )}

        {/* Stats Section: Modern Dual Cards */}
        <div className="my-5 grid grid-cols-2 gap-3">
          <div className="border border-white/10 bg-white/[0.02] p-4 text-center transition-colors hover:border-white/20">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/45 mb-1">
              <RiChat3Line className="text-[#8a2ae3] text-sm" />
              <span>Comments</span>
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white">
              {loading ? "…" : profile?.commentsCount ?? 0}
            </span>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-4 text-center transition-colors hover:border-white/20">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/45 mb-1">
              <RiReplyLine className="text-[#8a2ae3] text-sm" />
              <span>Replies</span>
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white">
              {loading ? "…" : profile?.repliesCount ?? 0}
            </span>
          </div>
        </div>

        {/* Footer: Member Since & Social links */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-white/40">
            <RiCalendarLine className="text-white/35 text-sm" />
            <span>
              {profile?.role
                ? profile?.joinedDate
                  ? `Team Member since ${profile.joinedDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}`
                  : "L.A.P Team Member"
                : profile?.joinedDate
                ? `Member since ${profile.joinedDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}`
                : "Community Member"}
            </span>
          </div>

          {profile?.socials && Object.keys(profile.socials).length > 0 ? (
            <div className="flex items-center gap-3 text-base text-white/60">
              {profile.socials.twitter && (
                <a
                  href={profile.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[#8a2ae3]"
                  title="Twitter / X"
                >
                  <RiTwitterFill />
                </a>
              )}
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white"
                  title="GitHub"
                >
                  <RiGithubFill />
                </a>
              )}
              {profile.socials.youtube && (
                <a
                  href={profile.socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-red-400"
                  title="YouTube"
                >
                  <RiYoutubeFill />
                </a>
              )}
              {profile.socials.website && (
                <a
                  href={profile.socials.website}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[#8a2ae3]"
                  title="Website"
                >
                  <RiGlobeLine />
                </a>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
