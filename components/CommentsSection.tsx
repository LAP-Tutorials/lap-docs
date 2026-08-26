"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { createPortal } from "react-dom";
import { httpsCallable } from "firebase/functions";
import { Pin, ThumbsDown, ThumbsUp, Image as ImageIcon, X as CloseIcon, ZoomIn, Loader2, ChevronLeft, ChevronRight, Globe, Languages, Pencil, Trash2 } from "lucide-react";
import { db, functions, storage } from "@/lib/firebase";
import { usePublicAuth } from "@/lib/public-auth-context";
import {
  RiArrowRightLine,
  RiImageAddLine,
  RiCloseLine,
  RiFlagLine,
  RiZoomInLine,
  RiTranslate2,
  RiGlobalLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiAlertLine,
} from "react-icons/ri";
import MentionTextarea from "@/components/MentionTextarea";
import UserProfileModal, { type StaffProfile, type StaffRole } from "@/components/UserProfileModal";
import ReportModal, { type ReportTarget } from "@/components/ReportModal";
import {
  sanitizeAndCompressImage,
  uploadSanitizedCommentImage,
  uploadMultipleSanitizedImages,
  deleteCommentImageSafe,
  deleteMultipleCommentImagesSafe,
  type SanitizedImageResult,
  type CommentImageAttachment,
} from "@/lib/image-sanitizer";
import {
  SUPPORTED_LANGUAGES,
  getDefaultTargetLanguage,
  setSavedTargetLanguage,
  getAutoTranslatePreference,
  setAutoTranslatePreference,
  translateCommentText,
  getLanguageName,
  type TranslationResult,
} from "@/lib/translator";

type CommentRecord = {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorPhotoURL: string;
  content: string;
  imageUrl?: string;
  imageStoragePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  images?: CommentImageAttachment[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  edited: boolean;
  likeCount?: number;
  dislikeCount?: number;
  replyCount?: number;
  pinned?: boolean;
  pinnedAt?: Timestamp;
  pinnedBy?: string;
};

type ReplyRecord = {
  id: string;
  parentCommentId: string;
  articleId?: string;
  articleSlug?: string;
  articleTitle?: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorPhotoURL: string;
  content: string;
  imageUrl?: string;
  imageStoragePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  images?: CommentImageAttachment[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  edited: boolean;
};

type ReplyThread = {
  replies: ReplyRecord[];
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
};

type CommentSort = "recent" | "oldest" | "liked";

function hasCommentImages(item: {
  images?: CommentImageAttachment[];
  imageStoragePath?: string;
  imageUrl?: string;
}) {
  return Boolean(
    (item.images && item.images.length > 0) ||
      item.imageStoragePath ||
      item.imageUrl,
  );
}

type CommentReaction = "like" | "dislike";

type CommentsSectionProps = {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
};

const MAX_COMMENT_LENGTH = 2000;
const COMMENTS_PAGE_SIZE = 15;
const REPLIES_PAGE_SIZE = 5;

function sortCommentsWithPriority(
  commentsList: CommentRecord[],
  staffMap: Record<string, StaffProfile>,
  sortMode: CommentSort,
): CommentRecord[] {
  const pinned = commentsList.filter((c) => c.pinned);
  const nonPinned = commentsList.filter((c) => !c.pinned);
  const staffComments = nonPinned.filter((c) => Boolean(staffMap[c.authorId]));
  const regularComments = nonPinned.filter((c) => !staffMap[c.authorId]);

  const sortFn = (a: CommentRecord, b: CommentRecord) => {
    if (sortMode === "liked") {
      const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
      if (likeDiff !== 0) return likeDiff;
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    }
    if (sortMode === "oldest") {
      return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
    }
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  };

  staffComments.sort(sortFn);
  regularComments.sort(sortFn);

  return [...pinned, ...staffComments, ...regularComments];
}

function sortRepliesWithPriority(
  repliesList: ReplyRecord[],
  staffMap: Record<string, StaffProfile>,
): ReplyRecord[] {
  const staffReplies = repliesList.filter((r) => Boolean(staffMap[r.authorId]));
  const regularReplies = repliesList.filter((r) => !staffMap[r.authorId]);

  const sortFn = (a: ReplyRecord, b: ReplyRecord) =>
    (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);

  staffReplies.sort(sortFn);
  regularReplies.sort(sortFn);

  return [...staffReplies, ...regularReplies];
}

function callableErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message: string }).message)
      .replace(/^FirebaseError:\s*/i, "")
      .trim();
    if (message && !/^(internal|internal error)$/i.test(message)) return message;
  }
  return fallback;
}

function ReaderAvatar({
  name,
  photoURL,
  className = "h-12 w-12",
}: {
  name: string;
  photoURL?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white/10 font-semibold uppercase text-white/60 ${className}`}
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt={`${name}'s profile picture`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">{name.trim().charAt(0) || "?"}</span>
      )}
    </div>
  );
}

const STAFF_PRESENTATION: Record<
  StaffRole,
  {
    label: string;
    nameClassName: string;
    handleClassName: string;
  }
> = {
  super: {
    label: "Admin",
    nameClassName: "text-[#8a2ae3]",
    handleClassName: "text-[#8a2ae3]/70",
  },
  admin: {
    label: "Admin",
    nameClassName: "text-[#8a2ae3]",
    handleClassName: "text-[#8a2ae3]/70",
  },
  author: {
    label: "Author",
    nameClassName: "text-[#f3c969]",
    handleClassName: "text-[#f3c969]/70",
  },
  moderator: {
    label: "Moderator",
    nameClassName: "text-[#5eead4]",
    handleClassName: "text-[#5eead4]/70",
  },
};

function StaffIdentity({
  staff,
  handle,
}: {
  staff: StaffProfile;
  handle: string;
}) {
  const presentation = STAFF_PRESENTATION[staff.role];

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={`break-words font-semibold uppercase ${presentation.nameClassName}`}
        >
          {staff.name}
        </h3>
        <span
          className="inline-flex h-5 w-5 items-center justify-center"
          aria-label={`L.A.P ${presentation.label}`}
          title={`L.A.P ${presentation.label}`}
        >
          <Image
            src="/logos/LAP-Logo-Transparent.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
        </span>
      </div>
      <p
        className={`mt-1 break-words font-mono text-xs ${presentation.handleClassName}`}
      >
        @{handle}
      </p>
    </div>
  );
}

function MentionText({ content }: { content: string }) {
  const nodes: ReactNode[] = [];
  const mentionPattern = /(^|[^a-z0-9_.-])(@[a-z0-9_-]{3,20})(?![a-z0-9_-])/gi;
  let cursor = 0;

  for (const match of content.matchAll(mentionPattern)) {
    const matchIndex = match.index ?? 0;
    const prefix = match[1];
    const mention = match[2];
    const mentionIndex = matchIndex + prefix.length;

    if (mentionIndex > cursor) {
      nodes.push(content.slice(cursor, mentionIndex));
    }
    nodes.push(
      <span
        key={`${mentionIndex}-${mention}`}
        className="font-medium text-[#8a2ae3]"
      >
        {mention}
      </span>,
    );
    cursor = mentionIndex + mention.length;
  }

  if (cursor < content.length) {
    nodes.push(content.slice(cursor));
  }

  return <>{nodes}</>;
}

function getEntryImages(item: {
  images?: CommentImageAttachment[];
  imageUrl?: string;
  imageStoragePath?: string;
  imageWidth?: number;
  imageHeight?: number;
}): CommentImageAttachment[] {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images;
  }
  if (item.imageUrl) {
    return [
      {
        url: item.imageUrl,
        storagePath: item.imageStoragePath || "",
        width: item.imageWidth,
        height: item.imageHeight,
        alt: "Attachment",
      },
    ];
  }
  return [];
}

function LanguageDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selectedLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white transition-colors hover:text-[#8a2ae3] focus:outline-none"
        title="Choose target language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <RiGlobalLine className="text-sm text-[#8a2ae3] shrink-0" />
        <span>{selectedLang.name}</span>
        <RiArrowDownSLine
          className={`text-xs transition-transform duration-200 ${
            open ? "rotate-180 text-[#8a2ae3]" : "text-white/40"
          }`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-64 w-52 overflow-y-auto border border-white/20 bg-[#141414] py-1 shadow-2xl backdrop-blur-md focus:outline-none"
        >
          {SUPPORTED_LANGUAGES.map((l) => {
            const isSelected = l.code === value;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                  isSelected
                    ? "bg-[#8a2ae3] font-medium text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{l.name}</span>
                {l.nativeName && l.nativeName !== l.name ? (
                  <span
                    className={`text-[10px] ${
                      isSelected ? "text-white/70" : "text-white/40"
                    }`}
                  >
                    {l.nativeName}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ImageAttachmentPreviews({
  images,
  onRemove,
  maxCount = 4,
}: {
  images: SanitizedImageResult[];
  onRemove: (index: number) => void;
  maxCount?: number;
}) {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      {images.map((img, idx) => (
        <div
          key={`${img.fileName}-${idx}`}
          className="group relative flex items-center gap-2.5 border border-white/20 bg-white/[0.04] p-1.5 pr-2.5 text-xs font-mono"
        >
          <img
            src={img.previewUrl}
            alt={img.fileName}
            className="h-12 w-12 border border-white/15 object-cover"
          />
          <div className="min-w-0 max-w-[120px] sm:max-w-[160px]">
            <p className="truncate text-xs text-white/90">{img.fileName}</p>
            <p className="text-[10px] text-white/40">
              {(img.sizeBytes / 1024).toFixed(0)} KB · WebP
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="ml-1 flex h-5 w-5 items-center justify-center border border-white/20 text-white/70 transition-colors hover:bg-white hover:text-black"
            title="Remove image"
          >
            <RiCloseLine className="text-xs" />
          </button>
        </div>
      ))}
      <span className="font-mono text-[11px] text-white/40">
        {images.length}/{maxCount} {images.length === 1 ? "image" : "images"}
      </span>
    </div>
  );
}

function CommentImagesGrid({
  images,
  author,
  onOpenLightbox,
}: {
  images: CommentImageAttachment[];
  author: string;
  onOpenLightbox: (images: CommentImageAttachment[], index: number, author: string) => void;
}) {
  if (!images || images.length === 0) return null;
  const count = images.length;

  if (count === 1) {
    return (
      <div className="mt-3.5 max-w-lg">
        <button
          type="button"
          onClick={() => onOpenLightbox(images, 0, author)}
          className="group relative block overflow-hidden border border-white/20 bg-black/40 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2ae3]"
          title="Click to view full size"
        >
          <img
            src={images[0].url}
            alt={images[0].alt || "Comment image attachment"}
            loading="lazy"
            decoding="async"
            className="max-h-80 w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-black/30 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1.5 border border-white/20 bg-black/85 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-white">
              <RiZoomInLine className="text-sm text-[#8a2ae3]" />
              <span>Expand</span>
            </span>
          </div>
        </button>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="mt-3.5 grid max-w-xl grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.url + idx}
            type="button"
            onClick={() => onOpenLightbox(images, idx, author)}
            className="group relative block h-44 w-full overflow-hidden border border-white/20 bg-black/40 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2ae3] sm:h-52"
            title={`View image ${idx + 1} of 2`}
          >
            <img
              src={img.url}
              alt={img.alt || `Attachment ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-black/30 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1 border border-white/20 bg-black/85 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white">
                <RiZoomInLine className="text-xs text-[#8a2ae3]" />
                <span>Zoom</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="mt-3.5 grid max-w-xl grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.url + idx}
            type="button"
            onClick={() => onOpenLightbox(images, idx, author)}
            className="group relative block h-36 w-full overflow-hidden border border-white/20 bg-black/40 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2ae3] sm:h-44"
            title={`View image ${idx + 1} of 3`}
          >
            <img
              src={img.url}
              alt={img.alt || `Attachment ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-black/30 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1 border border-white/20 bg-black/85 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white">
                <RiZoomInLine className="text-xs text-[#8a2ae3]" />
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // 4 images: 2x2 grid
  return (
    <div className="mt-3.5 grid max-w-xl grid-cols-2 gap-2">
      {images.map((img, idx) => (
        <button
          key={img.url + idx}
          type="button"
          onClick={() => onOpenLightbox(images, idx, author)}
          className="group relative block h-36 w-full overflow-hidden border border-white/20 bg-black/40 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2ae3] sm:h-44"
          title={`View image ${idx + 1} of 4`}
        >
          <img
            src={img.url}
            alt={img.alt || `Attachment ${idx + 1}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-black/30 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1 border border-white/20 bg-black/85 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white">
              <RiZoomInLine className="text-xs text-[#8a2ae3]" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function CommentsSection({
  articleId,
  articleSlug,
  articleTitle,
}: CommentsSectionProps) {
  const {
    user,
    profile,
    isStaff,
    isAdmin,
    isLoading: authLoading,
    isSuspended,
    isBanned,
    deviceBlockReason,
  } = usePublicAuth();
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pinBusyId, setPinBusyId] = useState<string | null>(null);
  const [reactionBusyId, setReactionBusyId] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>("recent");
  const [reactions, setReactions] = useState<Record<string, CommentReaction>>(
    {},
  );
  const [replyThreads, setReplyThreads] = useState<Record<string, ReplyThread>>(
    {},
  );
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyBusyId, setReplyBusyId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);
  const [hasPinnedComment, setHasPinnedComment] = useState(false);
  const [error, setError] = useState("");
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>(
    {},
  );
  const [selectedUserModal, setSelectedUserModal] = useState<{
    userId: string;
    initialData?: {
      name?: string;
      handle?: string;
      photoURL?: string;
    };
    staffProfile?: StaffProfile;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  // Multi-image attachments state
  const [commentImages, setCommentImages] = useState<SanitizedImageResult[]>([]);
  const [commentImageProcessing, setCommentImageProcessing] = useState(false);
  const [commentImageError, setCommentImageError] = useState<string | null>(null);

  const [replyImages, setReplyImages] = useState<SanitizedImageResult[]>([]);
  const [replyImageProcessing, setReplyImageProcessing] = useState(false);
  const [replyImageError, setReplyImageError] = useState<string | null>(null);
  const commentImagesRef = useRef<SanitizedImageResult[]>([]);
  const replyImagesRef = useRef<SanitizedImageResult[]>([]);

  // Gallery Lightbox Modal state
  const [lightboxGallery, setLightboxGallery] = useState<{
    images: CommentImageAttachment[];
    currentIndex: number;
    author: string;
  } | null>(null);

  // Auto-Translation state
  const [targetLang, setTargetLang] = useState<string>(() => getDefaultTargetLanguage());
  const [autoTranslate, setAutoTranslate] = useState<boolean>(() => getAutoTranslatePreference());
  const [translations, setTranslations] = useState<
    Record<
      string,
      {
        translatedText: string;
        sourceLang: string;
        sourceLangName: string;
        isSameLanguage: boolean;
        isUnrecognizedLanguage?: boolean;
        showingOriginal?: boolean;
      }
    >
  >({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const translationsRef = useRef(translations);
  const translatingIdsRef = useRef(translatingIds);
  translationsRef.current = translations;
  translatingIdsRef.current = translatingIds;

  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const openProfileModal = (
    userId: string,
    initialData?: { name?: string; handle?: string; photoURL?: string },
    staff?: StaffProfile,
  ) => {
    setSelectedUserModal({
      userId,
      initialData,
      staffProfile: staff,
    });
  };

  const closeProfileModal = () => {
    setSelectedUserModal(null);
  };
  const commentCursor = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const pageIndexRef = useRef(0);
  const commentPages = useRef<
    Array<{
      comments: CommentRecord[];
      cursor: QueryDocumentSnapshot<DocumentData> | null;
      hasMore: boolean;
    }>
  >([]);
  const pinnedCommentId = useRef<string | null>(null);
  const requestSequence = useRef(0);
  const replyCursors = useRef<
    Record<string, QueryDocumentSnapshot<DocumentData> | null>
  >({});

  const loadComments = useCallback(
    async (reset: boolean) => {
      const requestId = ++requestSequence.current;
      if (reset) {
        commentCursor.current = null;
        pageIndexRef.current = 0;
        commentPages.current = [];
        setPageIndex(0);
        setLoading(true);
        setComments([]);
      } else {
        setLoadingMore(true);
      }
      setError("");

      try {
        let pinnedDoc: CommentRecord | null = null;
        if (reset) {
          try {
            const pinnedSnap = await getDocs(
              query(
                collection(db, "comments"),
                where("articleId", "==", articleId),
                where("status", "==", "visible"),
                where("pinned", "==", true),
                limit(1)
              )
            );
            if (!pinnedSnap.empty) {
              pinnedCommentId.current = pinnedSnap.docs[0].id;
              setHasPinnedComment(true);
              pinnedDoc = {
                id: pinnedSnap.docs[0].id,
                ...pinnedSnap.docs[0].data(),
              } as CommentRecord;
            } else {
              pinnedCommentId.current = null;
              setHasPinnedComment(false);
            }
          } catch (err) {
            pinnedCommentId.current = null;
            setHasPinnedComment(false);
            console.warn("Unable to load pinned comment:", err);
          }
        }

        const constraints: QueryConstraint[] = [
          where("articleId", "==", articleId),
          where("status", "==", "visible"),
        ];
        if (sort === "liked") {
          constraints.push(orderBy("likeCount", "desc"), orderBy("createdAt", "desc"));
        } else {
          constraints.push(orderBy("createdAt", sort === "oldest" ? "asc" : "desc"));
        }
        if (!reset && commentCursor.current) {
          constraints.push(startAfter(commentCursor.current));
        }
        constraints.push(limit(COMMENTS_PAGE_SIZE + 2));

        const snapshot = await getDocs(query(collection(db, "comments"), ...constraints));
        if (requestId !== requestSequence.current) return;

        const rawDocs = snapshot.docs;
        const filteredDocs = pinnedCommentId.current
          ? rawDocs.filter((d) => d.id !== pinnedCommentId.current)
          : rawDocs;
        const pageDocs = filteredDocs.slice(0, COMMENTS_PAGE_SIZE);
        const mappedComments = pageDocs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        })) as CommentRecord[];

        const page = reset && pinnedDoc ? [pinnedDoc, ...mappedComments] : mappedComments;

        commentCursor.current = filteredDocs.length > 0 ? pageDocs.at(-1) || null : null;
        const nextPage = {
          comments: page,
          cursor: commentCursor.current,
          hasMore:
            filteredDocs.length > COMMENTS_PAGE_SIZE ||
            rawDocs.length === COMMENTS_PAGE_SIZE + 2,
        };
        if (reset) {
          commentPages.current = [nextPage];
        } else {
          const nextIndex = pageIndexRef.current + 1;
          commentPages.current = [
            ...commentPages.current.slice(0, nextIndex),
            nextPage,
          ];
          pageIndexRef.current = nextIndex;
          setPageIndex(nextIndex);
        }
        setHasMoreComments(nextPage.hasMore);
        setComments(nextPage.comments);
      } catch (loadError) {
        console.error("Unable to load comments:", loadError);
        setError("Comments are temporarily unavailable.");
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [articleId, sort],
  );

  const fetchTotalCommentCount = useCallback(async () => {
    try {
      const coll = collection(db, "comments");
      const q = query(
        coll,
        where("articleId", "==", articleId),
        where("status", "==", "visible")
      );
      const snap = await getCountFromServer(q);
      setTotalCommentsCount(snap.data().count);
    } catch (err) {
      console.warn("Unable to fetch total comment count:", err);
    }
  }, [articleId]);

  useEffect(() => {
    void loadComments(true);
    void fetchTotalCommentCount();
  }, [loadComments, fetchTotalCommentCount]);

  const showPreviousPage = () => {
    const previousIndex = pageIndexRef.current - 1;
    const previousPage = commentPages.current[previousIndex];
    if (previousIndex < 0 || !previousPage) return;
    pageIndexRef.current = previousIndex;
    commentCursor.current = previousPage.cursor;
    setPageIndex(previousIndex);
    setComments(previousPage.comments);
    setHasMoreComments(previousPage.hasMore);
  };

  const showNextPage = () => {
    const nextIndex = pageIndexRef.current + 1;
    const cachedPage = commentPages.current[nextIndex];
    if (cachedPage) {
      pageIndexRef.current = nextIndex;
      commentCursor.current = cachedPage.cursor;
      setPageIndex(nextIndex);
      setComments(cachedPage.comments);
      setHasMoreComments(cachedPage.hasMore);
      return;
    }
    void loadComments(false);
  };

  const updateCurrentPage = (
    updater: (current: CommentRecord[]) => CommentRecord[],
  ) => {
    setComments((current) => {
      const next = updater(current);
      const cachedPage = commentPages.current[pageIndexRef.current];
      if (cachedPage) cachedPage.comments = next;
      return next;
    });
  };

  const updateReplyThread = (
    commentId: string,
    updater: (current: ReplyRecord[]) => ReplyRecord[],
  ) => {
    setReplyThreads((current) => {
      const thread = current[commentId];
      if (!thread) return current;
      return {
        ...current,
        [commentId]: { ...thread, replies: updater(thread.replies) },
      };
    });
  };

  const loadReplies = async (commentId: string, reset: boolean) => {
    if (reset) replyCursors.current[commentId] = null;
    setReplyThreads((current) => ({
      ...current,
      [commentId]: {
        replies: reset ? [] : current[commentId]?.replies || [],
        hasMore: current[commentId]?.hasMore || false,
        loaded: current[commentId]?.loaded || false,
        loading: true,
      },
    }));

    try {
      const constraints: QueryConstraint[] = [
        where("parentCommentId", "==", commentId),
        where("status", "==", "visible"),
        orderBy("createdAt", "asc"),
      ];
      if (!reset && replyCursors.current[commentId]) {
        constraints.push(startAfter(replyCursors.current[commentId]));
      }
      constraints.push(limit(REPLIES_PAGE_SIZE + 1));
      const snapshot = await getDocs(
        query(collection(db, "commentReplies"), ...constraints),
      );
      const pageDocs = snapshot.docs.slice(0, REPLIES_PAGE_SIZE);
      const page = pageDocs.map((replyDoc) => ({
        id: replyDoc.id,
        ...replyDoc.data(),
      })) as ReplyRecord[];
      replyCursors.current[commentId] = pageDocs.at(-1) || null;
      setReplyThreads((current) => ({
        ...current,
        [commentId]: {
          replies: reset
            ? page
            : [...(current[commentId]?.replies || []), ...page],
          hasMore: snapshot.docs.length > REPLIES_PAGE_SIZE,
          loaded: true,
          loading: false,
        },
      }));
    } catch (replyError) {
      console.error("Unable to load replies:", replyError);
      setReplyThreads((current) => ({
        ...current,
        [commentId]: {
          replies: current[commentId]?.replies || [],
          hasMore: false,
          loaded: true,
          loading: false,
        },
      }));
      setError("We could not load this reply thread.");
    }
  };

  const toggleReplies = (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);
    setExpandedReplies((current) => {
      const next = new Set(current);
      if (isExpanded) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
    if (!isExpanded && !replyThreads[commentId]?.loaded) {
      void loadReplies(commentId, true);
    }
  };

  useEffect(() => {
    if (!user) {
      setReactions({});
      return;
    }

    return onSnapshot(
      query(
        collection(db, "commentReactions", user.uid, "items"),
        where("articleId", "==", articleId),
      ),
      (snapshot) => {
        const next: Record<string, CommentReaction> = {};
        snapshot.docs.forEach((reactionDoc) => {
          const data = reactionDoc.data();
          if (data.type === "like" || data.type === "dislike") {
            next[reactionDoc.id] = data.type;
          }
        });
        setReactions(next);
      },
      (reactionError) => {
        console.error("Unable to load comment reactions:", reactionError);
      },
    );
  }, [articleId, user]);

  const shouldLoadStaffProfiles = !loading && (comments.length > 0 || Boolean(user));

  useEffect(() => {
    if (!shouldLoadStaffProfiles) return;

    let cancelled = false;
    const loadTrustedProfiles = async () => {
      try {
        const snapshot = await getDocs(collection(db, "publicAuthors"));
        if (cancelled) return;

        const nextProfiles: Record<string, StaffProfile> = {};
        snapshot.docs.forEach((authorDoc) => {
          const data = authorDoc.data();
          if (
            typeof data.name === "string" &&
            ["super", "admin", "author", "moderator"].includes(data.role)
          ) {
            nextProfiles[authorDoc.id] = {
              name: data.name,
              avatar: typeof data.avatar === "string" ? data.avatar : "",
              role: data.role as StaffRole,
            };
          }
        });
        setStaffProfiles(nextProfiles);
      } catch (lookupError) {
        console.error("Unable to load trusted comment badges:", lookupError);
      }
    };

    void loadTrustedProfiles();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadStaffProfiles]);

  const remaining = MAX_COMMENT_LENGTH - content.length;
  const authorName = useMemo(
    () =>
      profile?.displayName ||
      user?.displayName?.trim() ||
      user?.email?.split("@")[0] ||
      "L.A.P Reader",
    [profile?.displayName, user],
  );
  const currentStaffProfile = user ? staffProfiles[user.uid] : undefined;

  const handleSelectCommentImages = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxAllowed = 4 - commentImages.length;
    if (maxAllowed <= 0) {
      setCommentImageError("You can attach up to 4 images per comment.");
      if (e.target) e.target.value = "";
      return;
    }
    const toProcess = files.slice(0, maxAllowed);
    setCommentImageProcessing(true);
    setCommentImageError(null);
    const sanitizedList: SanitizedImageResult[] = [];
    try {
      for (const file of toProcess) {
        sanitizedList.push(await sanitizeAndCompressImage(file));
      }
      setCommentImages((prev) => [...prev, ...sanitizedList]);
    } catch (err: any) {
      sanitizedList.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setCommentImageError(err?.message || "Could not process image.");
    } finally {
      setCommentImageProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSelectReplyImages = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxAllowed = 4 - replyImages.length;
    if (maxAllowed <= 0) {
      setReplyImageError("You can attach up to 4 images per reply.");
      if (e.target) e.target.value = "";
      return;
    }
    const toProcess = files.slice(0, maxAllowed);
    setReplyImageProcessing(true);
    setReplyImageError(null);
    const sanitizedList: SanitizedImageResult[] = [];
    try {
      for (const file of toProcess) {
        sanitizedList.push(await sanitizeAndCompressImage(file));
      }
      setReplyImages((prev) => [...prev, ...sanitizedList]);
    } catch (err: any) {
      sanitizedList.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setReplyImageError(err?.message || "Could not process image.");
    } finally {
      setReplyImageProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleTargetLangChange = (newLang: string) => {
    setTargetLang(newLang);
    setSavedTargetLanguage(newLang);
    setTranslations({});
  };

  const handleToggleAutoTranslate = () => {
    const next = !autoTranslate;
    setAutoTranslate(next);
    setAutoTranslatePreference(next);
    if (!next) {
      setTranslations({});
    }
  };

  useEffect(() => {
    commentImagesRef.current = commentImages;
  }, [commentImages]);

  useEffect(() => {
    replyImagesRef.current = replyImages;
  }, [replyImages]);

  useEffect(
    () => () => {
      commentImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      replyImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    },
    [],
  );

  const removePendingCommentImage = (index: number) => {
    setCommentImages((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const removePendingReplyImage = (index: number) => {
    setReplyImages((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const toggleTranslation = async (id: string, text: string) => {
    const existing = translations[id];
    if (existing) {
      setTranslations((prev) => ({
        ...prev,
        [id]: {
          ...existing,
          showingOriginal: !existing.showingOriginal,
        },
      }));
      return;
    }

    if (translatingIds.has(id)) return;
    setTranslatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await translateCommentText(text, targetLang);
      setTranslations((prev) => ({
        ...prev,
        [id]: {
          translatedText: res.translatedText,
          sourceLang: res.detectedSourceLang,
          sourceLangName: res.sourceLangName,
          isSameLanguage: res.isSameLanguage,
          isUnrecognizedLanguage: res.isUnrecognizedLanguage,
          showingOriginal: false,
        },
      }));
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Language detection & translation pipeline
  useEffect(() => {
    if (!autoTranslate) return;
    const toCheck: Array<{ id: string; content: string }> = [];
    comments.forEach((c) => {
      if (c.content?.trim() && !translationsRef.current[c.id] && !translatingIdsRef.current.has(c.id)) {
        toCheck.push({ id: c.id, content: c.content });
      }
    });

    Object.values(replyThreads).forEach((thread) => {
      thread.replies.forEach((r) => {
        if (r.content?.trim() && !translationsRef.current[r.id] && !translatingIdsRef.current.has(r.id)) {
          toCheck.push({ id: r.id, content: r.content });
        }
      });
    });

    if (toCheck.length === 0) return;

    void Promise.all(
      toCheck.slice(0, 15).map(async ({ id, content }) => {
        try {
          const res = await translateCommentText(content, targetLang);
          setTranslations((prev) => ({
            ...prev,
            [id]: {
              translatedText: res.translatedText,
              sourceLang: res.detectedSourceLang,
              sourceLangName: res.sourceLangName,
              isSameLanguage: res.isSameLanguage,
              isUnrecognizedLanguage: res.isUnrecognizedLanguage,
              showingOriginal: false,
            },
          }));
        } catch {}
      }),
    );
  }, [autoTranslate, targetLang, comments, replyThreads]);

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (isBanned) {
      setError("Your account or browser installation is blocked from participating in comments.");
      return;
    }
    if (isSuspended) {
      setError("Your commenting privileges are currently suspended due to Community Guidelines violations.");
      return;
    }

    const trimmedContent = content.trim();
    if (
      !user ||
      !profile?.handle ||
      (!trimmedContent && commentImages.length === 0) ||
      trimmedContent.length > MAX_COMMENT_LENGTH
    ) return;

    setBusyId("new");
    setError("");
    let uploadedImages: CommentImageAttachment[] = [];
    try {
      if (commentImages.length > 0) {
        uploadedImages = await uploadMultipleSanitizedImages(
          storage,
          user.uid,
          commentImages,
        );
      }

      const createComment = httpsCallable(functions, "createComment");
      await createComment({
        articleId,
        content: trimmedContent,
        images: uploadedImages,
      });
      setContent("");
      commentImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setCommentImages([]);
      setCommentImageError(null);
      if (sort === "recent") {
        await loadComments(true);
      } else {
        setSort("recent");
      }
    } catch (submitError) {
      await deleteMultipleCommentImagesSafe(storage, uploadedImages);
      console.error("Unable to post comment:", submitError);
      setError(callableErrorMessage(submitError, "We could not post your comment. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const submitReply = async (comment: CommentRecord) => {
    if (isBanned) {
      setError("Your account or browser installation is blocked from participating in comments.");
      return;
    }
    if (isSuspended) {
      setError("Your commenting privileges are currently suspended.");
      return;
    }

    const trimmedContent = replyContent.trim();
    if (
      !user ||
      !profile?.handle ||
      (!trimmedContent && replyImages.length === 0) ||
      trimmedContent.length > MAX_COMMENT_LENGTH
    ) return;

    setReplyBusyId(comment.id);
    setError("");
    let uploadedImages: CommentImageAttachment[] = [];
    try {
      if (replyImages.length > 0) {
        uploadedImages = await uploadMultipleSanitizedImages(
          storage,
          user.uid,
          replyImages,
        );
      }

      const createReply = httpsCallable(functions, "createCommentReply");
      await createReply({
        parentCommentId: comment.id,
        content: trimmedContent,
        images: uploadedImages,
      });
      updateCurrentPage((current) =>
        current.map((item) =>
          item.id === comment.id
            ? { ...item, replyCount: (item.replyCount || 0) + 1 }
            : item,
        ),
      );
      setReplyContent("");
      replyImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setReplyImages([]);
      setReplyImageError(null);
      setReplyingToId(null);
      setExpandedReplies((current) => new Set(current).add(comment.id));
      await loadReplies(comment.id, true);
    } catch (replyError) {
      await deleteMultipleCommentImagesSafe(storage, uploadedImages);
      console.error("Unable to post reply:", replyError);
      setError(callableErrorMessage(replyError, "We could not post your reply. Please try again."));
    } finally {
      setReplyBusyId(null);
    }
  };

  const saveReplyEdit = async (commentId: string, reply: ReplyRecord) => {
    const trimmedContent = editingReplyContent.trim();
    if (trimmedContent.length > MAX_COMMENT_LENGTH) return;
    if (!trimmedContent && !hasCommentImages(reply)) return;
    const replyId = reply.id;
    setReplyBusyId(replyId);
    setError("");
    try {
      await updateDoc(doc(db, "commentReplies", replyId), {
        content: trimmedContent,
        updatedAt: serverTimestamp(),
        edited: true,
      });
      updateReplyThread(commentId, (current) =>
        current.map((reply) =>
          reply.id === replyId
            ? { ...reply, content: trimmedContent, edited: true }
            : reply,
        ),
      );
      setEditingReplyId(null);
      setEditingReplyContent("");
    } catch (replyError) {
      console.error("Unable to edit reply:", replyError);
      setError("We could not update your reply.");
    } finally {
      setReplyBusyId(null);
    }
  };

  const removeReply = async (commentId: string, reply: ReplyRecord) => {
    if (!window.confirm("Delete this reply permanently?")) return;
    const replyId = reply.id;
    setReplyBusyId(replyId);
    setError("");
    try {
      const pathsToDelete: string[] = [];
      if (reply.images) pathsToDelete.push(...reply.images.map((i) => i.storagePath));
      if (reply.imageStoragePath && !pathsToDelete.includes(reply.imageStoragePath)) {
        pathsToDelete.push(reply.imageStoragePath);
      }
      if (pathsToDelete.length > 0) {
        void deleteMultipleCommentImagesSafe(storage, pathsToDelete);
      }
      await deleteDoc(doc(db, "commentReplies", replyId));
      updateReplyThread(commentId, (current) =>
        current.filter((r) => r.id !== replyId),
      );
      updateCurrentPage((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replyCount: Math.max(0, (comment.replyCount || 0) - 1),
              }
            : comment,
        ),
      );
    } catch (replyError) {
      console.error("Unable to delete reply:", replyError);
      setError("We could not delete your reply.");
    } finally {
      setReplyBusyId(null);
    }
  };

  const reactToComment = async (
    commentId: string,
    reaction: CommentReaction,
  ) => {
    if (!user) return;
    setReactionBusyId(commentId);
    setError("");
    try {
      const react = httpsCallable<
        { commentId: string; reaction: CommentReaction },
        {
          commentId: string;
          reaction: CommentReaction | null;
          likeCount: number;
          dislikeCount: number;
        }
      >(functions, "reactToComment");
      const result = await react({ commentId, reaction });
      setReactions((current) => {
        const next = { ...current };
        if (result.data.reaction) {
          next[commentId] = result.data.reaction;
        } else {
          delete next[commentId];
        }
        return next;
      });
      updateCurrentPage((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likeCount: result.data.likeCount,
                dislikeCount: result.data.dislikeCount,
              }
            : comment,
        ),
      );
      if (sort === "liked") {
        await loadComments(true);
      }
    } catch (reactionError) {
      console.error("Unable to react to comment:", reactionError);
      setError("We could not save your reaction. Please try again.");
    } finally {
      setReactionBusyId(null);
    }
  };

  const saveEdit = async (comment: CommentRecord) => {
    const trimmedContent = editingContent.trim();
    if (trimmedContent.length > MAX_COMMENT_LENGTH) return;
    if (!trimmedContent && !hasCommentImages(comment)) return;
    const commentId = comment.id;
    setBusyId(commentId);
    setError("");
    try {
      await updateDoc(doc(db, "comments", commentId), {
        content: trimmedContent,
        updatedAt: serverTimestamp(),
        edited: true,
      });
      updateCurrentPage((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: trimmedContent, edited: true }
            : comment,
        ),
      );
      setEditingId(null);
      setEditingContent("");
    } catch (editError) {
      console.error("Unable to edit comment:", editError);
      setError("We could not update your comment.");
    } finally {
      setBusyId(null);
    }
  };

  const removeComment = async (comment: CommentRecord) => {
    if (!window.confirm("Delete this comment and all its replies permanently?")) return;
    const commentId = comment.id;
    setBusyId(commentId);
    setError("");
    try {
      const pathsToDelete: string[] = [];
      if (comment.images) pathsToDelete.push(...comment.images.map((i) => i.storagePath));
      if (comment.imageStoragePath && !pathsToDelete.includes(comment.imageStoragePath)) {
        pathsToDelete.push(comment.imageStoragePath);
      }
      if (pathsToDelete.length > 0) {
        void deleteMultipleCommentImagesSafe(storage, pathsToDelete);
      }

      // 1. Delete the parent comment directly (always permitted for the comment author)
      await deleteDoc(doc(db, "comments", commentId));

      // 2. Cascade delete child replies immediately on the client
      try {
        const repliesSnap = await getDocs(
          query(collection(db, "commentReplies"), where("parentCommentId", "==", commentId))
        );
        if (!repliesSnap.empty) {
          const batch = writeBatch(db);
          const replyPaths: string[] = [];
          repliesSnap.forEach((r) => {
            const rData = r.data();
            if (rData?.images) replyPaths.push(...rData.images.map((i: any) => i.storagePath));
            if (rData?.imageStoragePath) replyPaths.push(rData.imageStoragePath);
            batch.delete(r.ref);
          });
          if (replyPaths.length > 0) {
            void deleteMultipleCommentImagesSafe(storage, replyPaths);
          }
          await batch.commit();
        }
      } catch (cascadeError) {
        // Backend Cloud Function (removeRepliesWithComment) will clean up orphaned replies automatically
        console.warn("Child replies cleanup handled by backend function:", cascadeError);
      }

      updateCurrentPage((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
      setReplyThreads((current) => {
        const next = { ...current };
        delete next[commentId];
        return next;
      });
    } catch (deleteError) {
      console.error("Unable to delete comment:", deleteError);
      setError("We could not delete your comment.");
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePin = async (comment: CommentRecord) => {
    if (!user || !isAdmin || pinBusyId) return;
    const newPinned = !comment.pinned;
    setPinBusyId(comment.id);
    setError("");
    try {
      const togglePin = httpsCallable<{ commentId: string; pinned: boolean }>(
        functions,
        "togglePinComment"
      );
      await togglePin({ commentId: comment.id, pinned: newPinned });

      void loadComments(true);
    } catch (pinError: any) {
      console.error("Unable to toggle pinned comment:", pinError);
      setError(pinError?.message || "Could not update pinned comment.");
    } finally {
      setPinBusyId(null);
    }
  };

  const displayComments = useMemo(
    () => sortCommentsWithPriority(comments, staffProfiles, sort),
    [comments, staffProfiles, sort],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      Math.max(0, totalCommentsCount - (hasPinnedComment ? 1 : 0)) /
        COMMENTS_PAGE_SIZE,
    ),
  );

  return (
    <section
      id="comments"
      className="mb-20 mt-20 border-t border-white/30"
      aria-labelledby="comments-heading"
    >
      <header className="flex flex-col gap-5 border-b border-white/30 py-7 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2
            id="comments-heading"
            className="text-4xl font-semibold uppercase leading-none md:text-5xl"
          >
            Comments
          </h2>
          <span className="font-mono text-sm tabular-nums text-white/45">
            {totalCommentsCount} {totalCommentsCount === 1 ? "comment" : "comments"} · Page {pageIndex + 1} / {totalPages}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Translation Controls */}
          <div className="flex items-center gap-3 border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs font-mono">
            <LanguageDropdown
              value={targetLang}
              onChange={handleTargetLangChange}
            />
            <span className="text-white/20">|</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-white/60 hover:text-white">
              <button
                type="button"
                role="checkbox"
                aria-checked={autoTranslate}
                onClick={handleToggleAutoTranslate}
                className={`flex h-3.5 w-3.5 items-center justify-center border transition-colors ${
                  autoTranslate
                    ? "border-[#8a2ae3] bg-[#8a2ae3] text-white"
                    : "border-white/30 bg-transparent hover:border-white/60"
                }`}
              >
                {autoTranslate ? <RiCheckLine className="text-xs" /> : null}
              </button>
              <span onClick={handleToggleAutoTranslate}>Auto-translate</span>
            </label>
          </div>

          <nav aria-label="Sort comments" className="flex flex-wrap gap-x-5 gap-y-2">
            {(
              [
                ["recent", "Recent"],
                ["oldest", "Oldest"],
                ["liked", "Most liked"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                aria-pressed={sort === value}
                className={`border-b pb-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  sort === value
                    ? "border-[#8a2ae3] text-white"
                    : "border-transparent text-white/45 hover:border-white/40 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="border-b border-white/25 py-5 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      {/* Community Guidelines Warning Notice Banner */}
      {user && profile?.status === "warning" && !dismissedWarning ? (
        <div className="border border-amber-500/40 bg-amber-500/10 p-4 border-b flex items-start justify-between gap-3 my-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-semibold uppercase text-xs tracking-wider">
              <RiAlertLine className="text-base text-amber-400 shrink-0" />
              Community Guidelines Warning Notice
            </div>
            <p className="text-xs text-white/80 mt-1">
              You have received a formal warning regarding your recent activity {profile?.lastWarningReason ? `(${profile.lastWarningReason})` : ""}. Please review our standards to keep your account in good standing.
            </p>
            <Link href="/community-guidelines" className="text-xs text-amber-300 underline mt-1.5 inline-block">
              View Community Guidelines →
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setDismissedWarning(true)}
            className="text-white/40 hover:text-white text-xs uppercase font-mono px-2 py-1 border border-white/10 hover:bg-white/5"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Account / IP Ban Lockout Banner */}
      {isBanned ? (
        <div className="border border-red-500/50 bg-red-500/10 p-6 text-center space-y-2 border-b my-4">
          <div className="flex justify-center text-red-400">
            <RiAlertLine className="text-3xl" />
          </div>
          <h3 className="font-semibold text-lg text-red-200 uppercase tracking-wide">
            Participation Prohibited
          </h3>
          <p className="text-sm text-white/70 max-w-xl mx-auto">
            {profile?.banReason || deviceBlockReason || "This account or browser installation has been blocked from commenting for severe violations of our Community Guidelines."}
          </p>
          <Link
            href="/community-guidelines"
            className="text-xs text-red-300 underline inline-block mt-2"
          >
            Read Community Guidelines
          </Link>
        </div>
      ) : isSuspended ? (
        /* Temporary Suspension Banner */
        <div className="border border-orange-500/50 bg-orange-500/10 p-5 space-y-2 border-b my-4">
          <div className="flex items-center gap-2 text-orange-300 font-semibold uppercase text-xs tracking-wider">
            <RiAlertLine className="text-lg text-orange-400 shrink-0" />
            Commenting Privileges Suspended
          </div>
          <p className="text-xs text-white/80">
            Your commenting privileges are temporarily suspended until{" "}
            <strong className="text-white">
              {profile?.suspendedUntil?.toDate ? profile.suspendedUntil.toDate().toLocaleDateString() : "further notice"}
            </strong>{" "}
            due to Community Guidelines violations {profile?.suspensionReason ? `("${profile.suspensionReason}")` : ""}.
          </p>
          <Link
            href="/community-guidelines"
            className="text-xs text-orange-300 underline inline-block"
          >
            Read Community Guidelines
          </Link>
        </div>
      ) : !authLoading && !user ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 py-7">
          <p className="font-light text-white/70">
            Sign in to join the conversation and mention other readers.
          </p>
          <Link
            href="/account"
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2ae3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2ae3]"
          >
            Sign in to comment
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : !authLoading && user && !profile?.handle ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 py-7">
          <p className="font-light text-white/70">
            {isStaff
              ? "Set your team handle in the CMS before commenting."
              : "Choose your comment handle to participate in discussions."}
          </p>
          <Link
            href={isStaff ? "https://cms.lap.onl/admin/profile" : "/account"}
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2ae3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2ae3]"
          >
            {isStaff ? "Open CMS profile" : "Claim your handle"}
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {user && profile?.handle && !isBanned && !isSuspended ? (
        <form
          onSubmit={submitComment}
          className="flex gap-4 border-b border-white/30 py-7"
        >
          <ReaderAvatar
            name={authorName}
            photoURL={
              currentStaffProfile?.avatar ||
              profile.photoURL ||
              user.photoURL ||
              ""
            }
            className="h-10 w-10"
          />
          <div className="min-w-0 flex-1">
            {currentStaffProfile ? (
              <StaffIdentity staff={currentStaffProfile} handle={profile.handle} />
            ) : (
              <p className="break-words text-sm font-semibold uppercase">
                @{profile.handle}
              </p>
            )}
            <label htmlFor="new-comment" className="sr-only">
              Add a comment
            </label>
            <MentionTextarea
              id="new-comment"
              value={content}
              onChange={setContent}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (busyId !== "new" && (content.trim() || commentImages.length > 0)) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              placeholder="Write a comment or attach images…"
              className="mt-2 w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base leading-7 text-white outline-none transition-colors duration-300 placeholder:text-white/30 focus:border-[#8a2ae3] focus:ring-0"
            />

            {/* Hidden file input */}
            <input
              type="file"
              multiple
              ref={commentFileInputRef}
              onChange={handleSelectCommentImages}
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif"
              className="hidden"
            />

            {/* Image Preview Strip */}
            <ImageAttachmentPreviews
              images={commentImages}
              onRemove={removePendingCommentImage}
              maxCount={4}
            />

            {commentImageProcessing ? (
              <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[#8a2ae3]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Optimizing & converting images…</span>
              </div>
            ) : null}

            {commentImageError ? (
              <p className="mt-2 text-xs font-mono text-red-300">{commentImageError}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => commentFileInputRef.current?.click()}
                  disabled={busyId === "new" || commentImageProcessing || commentImages.length >= 4}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/50 transition-colors hover:text-white disabled:opacity-40"
                  title="Attach up to 4 images (JPEG, PNG, WebP, GIF, HEIC, AVIF)"
                >
                  <RiImageAddLine className="text-base text-[#8a2ae3]" />
                  <span>
                    {commentImages.length === 0
                      ? "Attach images"
                      : commentImages.length < 4
                      ? `Add image (${commentImages.length}/4)`
                      : "Max 4 images"}
                  </span>
                </button>

                <span
                  className={`font-mono text-xs tabular-nums ${
                    remaining < 100 ? "text-[#8a2ae3]" : "text-white/40"
                  }`}
                >
                  {content.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>

              <button
                disabled={
                  busyId === "new" ||
                  commentImageProcessing ||
                  (!content.trim() && commentImages.length === 0)
                }
                className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2ae3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2ae3] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
              >
                {busyId === "new" ? "Posting…" : "Post comment"}
                <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link
                href="/community-guidelines"
                target="_blank"
                className="text-[11px] text-white/40 hover:text-white transition-colors"
              >
                Please adhere to our <span className="underline text-[#8a2ae3]">Community Guidelines</span>
              </Link>
            </div>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div
          aria-label="Loading comments"
          className="flex animate-pulse gap-4 border-b border-white/20 py-7"
        >
          <div className="h-10 w-10 shrink-0 bg-white/15" />
          <div className="w-full space-y-3 pt-1">
            <div className="h-3 w-24 bg-white/15" />
            <div className="h-4 max-w-xl bg-white/10" />
          </div>
        </div>
      ) : null}

      {!loading && !error && displayComments.length === 0 ? (
        <p className="border-b border-white/30 py-8 text-white/50">
          Be the first to comment.
        </p>
      ) : null}

      <div>
        {displayComments.map((comment) => {
          const isOwner = user?.uid === comment.authorId;
          const isDeletedAuthor = comment.authorId === "deleted-user";
          const isEditing = editingId === comment.id;
          const date = comment.createdAt?.toDate();
          const staffProfile = staffProfiles[comment.authorId];
          const commentHandle =
            comment.authorHandle ||
            comment.authorName.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

          return (
            <article
              key={comment.id}
              className={`flex gap-4 border-b border-white/30 py-7 transition-colors duration-200 ${
                comment.pinned
                  ? "-mx-3 sm:-mx-5 rounded-sm border-l-2 border-l-[#8a2ae3] bg-[#8a2ae3]/[0.04] px-3 sm:px-5"
                  : ""
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  openProfileModal(
                    comment.authorId,
                    {
                      name: comment.authorName,
                      handle: commentHandle,
                      photoURL: comment.authorPhotoURL,
                    },
                    staffProfile,
                  )
                }
                className="flex shrink-0 cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                title={`View ${isDeletedAuthor ? "user" : commentHandle}'s profile`}
              >
                <ReaderAvatar
                  name={isDeletedAuthor ? "Deleted user" : staffProfile?.name || comment.authorName}
                  photoURL={
                    isDeletedAuthor
                      ? "/logos/LAP-Logo-Color.png"
                      : staffProfile?.avatar || comment.authorPhotoURL
                  }
                  className="h-10 w-10"
                />
              </button>
              <div className="min-w-0 flex-1">
                {comment.pinned ? (
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8a2ae3]">
                    <Pin className="h-3.5 w-3.5 fill-current" />
                    <span>Pinned by Admin</span>
                  </div>
                ) : null}
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        openProfileModal(
                          comment.authorId,
                          {
                            name: comment.authorName,
                            handle: commentHandle,
                            photoURL: comment.authorPhotoURL,
                          },
                          staffProfile,
                        )
                      }
                      className="cursor-pointer text-left transition-colors hover:text-[#8a2ae3] focus:outline-none"
                      title={`View ${isDeletedAuthor ? "user" : commentHandle}'s profile`}
                    >
                      {isDeletedAuthor ? (
                        <h3 className="break-words text-sm font-semibold uppercase text-white/55">
                          Deleted user
                        </h3>
                      ) : staffProfile ? (
                        <StaffIdentity staff={staffProfile} handle={commentHandle} />
                      ) : (
                        <h3 className="break-words text-sm font-semibold uppercase">
                          @{commentHandle}
                        </h3>
                      )}
                    </button>
                    <p className="mt-1 font-mono text-xs tabular-nums text-white/40">
                      {date
                        ? date.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Just now"}
                      {comment.edited ? " (edited)" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium uppercase">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(comment)}
                        disabled={pinBusyId === comment.id}
                        className={`inline-flex items-center gap-1 border-b pb-1 transition-colors duration-300 ${
                          comment.pinned
                            ? "border-[#8a2ae3] text-[#8a2ae3] hover:border-white hover:text-white"
                            : "border-white/40 text-white/60 hover:border-[#8a2ae3] hover:text-[#8a2ae3]"
                        } disabled:opacity-40`}
                        title={comment.pinned ? "Unpin comment" : "Pin comment to top"}
                      >
                        <Pin className={`h-3 w-3 ${comment.pinned ? "fill-current" : ""}`} />
                        {comment.pinned ? "Unpin" : "Pin"}
                      </button>
                    ) : null}
                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditingContent(comment.content);
                          }}
                          className="flex h-6 w-6 items-center justify-center border border-white/20 text-white/60 transition-colors hover:border-white hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#8a2ae3]"
                          title="Edit comment"
                          aria-label="Edit comment"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComment(comment)}
                          disabled={busyId === comment.id}
                          className="flex h-6 w-6 items-center justify-center border border-red-500/30 text-red-400/70 transition-colors hover:border-red-400 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-red-400 disabled:opacity-40"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : user && !isDeletedAuthor && !staffProfile && !staffProfiles[comment.authorId] ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            type: "comment",
                            reportedUserId: comment.authorId,
                            reportedUserHandle: commentHandle,
                            reportedUserName: comment.authorName,
                            commentId: comment.id,
                            commentContent: comment.content,
                            articleId,
                            articleTitle,
                            articleSlug,
                          })
                        }
                        className="flex h-6 w-6 items-center justify-center border border-white/15 text-white/40 transition-colors hover:border-red-400 hover:text-red-300"
                        title="Report comment"
                        aria-label="Report comment"
                      >
                        <RiFlagLine className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </header>

                {isEditing ? (
                  <div className="mt-3">
                    <MentionTextarea
                      value={editingContent}
                      onChange={setEditingContent}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={3}
                      className="w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base leading-7 outline-none transition-colors duration-300 focus:border-[#8a2ae3] focus:ring-0"
                    />
                    <div className="mt-3 flex justify-end gap-5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="border-b border-white/40 pb-1 text-sm font-medium uppercase transition-colors duration-300 hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(comment)}
                        disabled={
                          busyId === comment.id ||
                          (!editingContent.trim() && !hasCommentImages(comment))
                        }
                        className="group inline-flex items-center gap-2 text-sm font-semibold uppercase transition-colors duration-300 hover:text-[#8a2ae3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2ae3] disabled:opacity-40"
                      >
                        Save <RiArrowRightLine className="text-xl" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {comment.content?.trim() ? (
                      <div>
                        <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words font-light leading-7 text-white/80">
                          <MentionText
                            content={
                              translations[comment.id] &&
                              !translations[comment.id].showingOriginal
                                ? translations[comment.id].translatedText
                                : comment.content
                            }
                          />
                        </p>

                        {/* Translation status / toggle */}
                        <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px]">
                          {translatingIds.has(comment.id) ? (
                            <span className="inline-flex items-center gap-1 text-white/40">
                              <Loader2 className="h-3 w-3 animate-spin text-[#8a2ae3]" /> Translating…
                            </span>
                          ) : translations[comment.id]?.isUnrecognizedLanguage ? (
                            <div className="inline-flex flex-wrap items-center gap-1.5 text-amber-300/85">
                              <span>⚠️ Could not identify language · Needs review</span>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTranslations((prev) => {
                                    const next = { ...prev };
                                    delete next[comment.id];
                                    return next;
                                  });
                                  setTimeout(() => toggleTranslation(comment.id, comment.content), 50);
                                }}
                                className="underline hover:text-amber-200"
                              >
                                Retry
                              </button>
                            </div>
                          ) : translations[comment.id]?.isSameLanguage ? (
                            null
                          ) : translations[comment.id] ? (
                            <div className="inline-flex flex-wrap items-center gap-2 text-white/50">
                              <span>
                                Translated from <strong className="text-[#8a2ae3]">{translations[comment.id].sourceLangName}</strong>
                              </span>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => toggleTranslation(comment.id, comment.content)}
                                className="underline hover:text-white"
                              >
                                {translations[comment.id].showingOriginal
                                  ? "Show translation"
                                  : "Show original"}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleTranslation(comment.id, comment.content)}
                              className="inline-flex items-center gap-1 text-white/35 transition-colors hover:text-[#8a2ae3]"
                              title={`Translate to ${getLanguageName(targetLang)}`}
                            >
                              <RiTranslate2 className="text-xs" />
                              <span>Translate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Multi-Image Grid */}
                    <CommentImagesGrid
                      images={getEntryImages(comment)}
                      author={commentHandle}
                      onOpenLightbox={(imgs, idx, author) =>
                        setLightboxGallery({ images: imgs, currentIndex: idx, author })
                      }
                    />
                  </>
                )}

                <div
                  className="mt-4 flex items-center gap-5 font-mono text-xs tabular-nums text-white/45"
                  aria-label="Comment reactions"
                >
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => reactToComment(comment.id, "like")}
                        disabled={reactionBusyId === comment.id}
                        aria-pressed={reactions[comment.id] === "like"}
                        aria-label={`Like comment. ${comment.likeCount || 0} likes`}
                        className={`inline-flex items-center gap-2 transition-colors hover:text-white disabled:opacity-40 ${
                          reactions[comment.id] === "like"
                            ? "text-[#8a2ae3]"
                            : ""
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {comment.likeCount || 0}
                      </button>
                      <button
                        type="button"
                        onClick={() => reactToComment(comment.id, "dislike")}
                        disabled={reactionBusyId === comment.id}
                        aria-pressed={reactions[comment.id] === "dislike"}
                        aria-label={`Dislike comment. ${comment.dislikeCount || 0} dislikes`}
                        className={`inline-flex items-center gap-2 transition-colors hover:text-white disabled:opacity-40 ${
                          reactions[comment.id] === "dislike"
                            ? "text-[#8a2ae3]"
                            : ""
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {comment.dislikeCount || 0}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="inline-flex items-center gap-2"
                        aria-label={`${comment.likeCount || 0} likes`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {comment.likeCount || 0}
                      </span>
                      <span
                        className="inline-flex items-center gap-2"
                        aria-label={`${comment.dislikeCount || 0} dislikes`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {comment.dislikeCount || 0}
                      </span>
                    </>
                  )}
                  <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => toggleReplies(comment.id)}
                    className="border-b border-transparent pb-0.5 font-sans font-semibold uppercase tracking-wide transition-colors hover:border-white/40 hover:text-white"
                  >
                    {expandedReplies.has(comment.id) ? "Hide" : "Replies"} {comment.replyCount || 0}
                  </button>
                  {user && profile?.handle ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId((current) =>
                          current === comment.id ? null : comment.id,
                        );
                        setReplyContent("");
                        setReplyImages([]);
                        setReplyImageError(null);
                      }}
                      className="border-b border-transparent pb-0.5 font-sans font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3]"
                    >
                      Reply
                    </button>
                  ) : null}
                </div>

                {replyingToId === comment.id ? (
                  <div className="mt-5 border-l border-[#8a2ae3] pl-4">
                    <label htmlFor={`reply-${comment.id}`} className="sr-only">
                      {isDeletedAuthor
                        ? "Reply to Deleted user"
                        : `Reply to @${commentHandle}`}
                    </label>
                    <MentionTextarea
                      id={`reply-${comment.id}`}
                      value={replyContent}
                      onChange={setReplyContent}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          if (
                            replyBusyId !== comment.id &&
                            (replyContent.trim() || replyImages.length > 0)
                          ) {
                            void submitReply(comment);
                          }
                        }
                      }}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={2}
                      autoFocus
                      placeholder={`Reply to @${commentHandle}…`}
                      className="w-full resize-y border-0 border-b border-white/35 bg-transparent px-0 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-[#8a2ae3] focus:ring-0"
                    />

                    {/* Hidden file input for reply */}
                    <input
                      type="file"
                      multiple
                      ref={replyFileInputRef}
                      onChange={handleSelectReplyImages}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif"
                      className="hidden"
                    />

                    {/* Reply Image Preview Strip */}
                    <ImageAttachmentPreviews
                      images={replyImages}
                      onRemove={removePendingReplyImage}
                      maxCount={4}
                    />

                    {replyImageProcessing ? (
                      <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[#8a2ae3]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Optimizing & converting images…</span>
                      </div>
                    ) : null}

                    {replyImageError ? (
                      <p className="mt-2 text-xs font-mono text-red-300">{replyImageError}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => replyFileInputRef.current?.click()}
                          disabled={replyBusyId === comment.id || replyImageProcessing || replyImages.length >= 4}
                          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-white/50 transition-colors hover:text-white disabled:opacity-40"
                          title="Attach up to 4 images (JPEG, PNG, WebP, GIF, HEIC, AVIF)"
                        >
                          <RiImageAddLine className="text-sm text-[#8a2ae3]" />
                          <span>
                            {replyImages.length === 0
                              ? "Attach images"
                              : replyImages.length < 4
                              ? `Add image (${replyImages.length}/4)`
                              : "Max 4 images"}
                          </span>
                        </button>

                        <span className="font-mono text-[11px] tabular-nums text-white/35">
                          {replyContent.length}/{MAX_COMMENT_LENGTH}
                        </span>
                      </div>

                      <div className="flex gap-4 text-xs font-semibold uppercase">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyContent("");
                            setReplyImages([]);
                            setReplyImageError(null);
                          }}
                          className="text-white/50 transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReply(comment)}
                          disabled={
                            replyBusyId === comment.id ||
                            replyImageProcessing ||
                            (!replyContent.trim() && replyImages.length === 0)
                          }
                          className="text-[#8a2ae3] transition-colors hover:text-white disabled:opacity-35"
                        >
                          {replyBusyId === comment.id ? "Posting…" : "Post reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {expandedReplies.has(comment.id) ? (
                  <div className="mt-5 max-h-[34rem] overflow-y-auto border-l border-white/20 pl-4 sm:pl-6">
                    {replyThreads[comment.id]?.loading &&
                    !replyThreads[comment.id]?.replies.length ? (
                      <p className="py-4 text-sm text-white/40">Loading replies…</p>
                    ) : null}
                    {replyThreads[comment.id]?.loaded &&
                    !replyThreads[comment.id]?.replies.length ? (
                      <p className="py-4 text-sm text-white/40">No replies yet.</p>
                    ) : null}
                    {sortRepliesWithPriority(
                      replyThreads[comment.id]?.replies || [],
                      staffProfiles,
                    ).map((reply) => {
                      const replyStaff = staffProfiles[reply.authorId];
                      const replyHandle =
                        reply.authorHandle ||
                        reply.authorName
                          .toLowerCase()
                          .replace(/[^a-z0-9_]+/g, "_");
                      const replyDate = reply.createdAt?.toDate();
                      const isReplyOwner = user?.uid === reply.authorId;
                      const isDeletedReplyAuthor =
                        reply.authorId === "deleted-user";
                      const isReplyEditing = editingReplyId === reply.id;
                      return (
                        <article
                          key={reply.id}
                          className="flex gap-3 border-b border-white/15 py-5 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openProfileModal(
                                reply.authorId,
                                {
                                  name: reply.authorName,
                                  handle: replyHandle,
                                  photoURL: reply.authorPhotoURL,
                                },
                                replyStaff,
                              )
                            }
                            className="flex shrink-0 cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                            title={`View ${isDeletedReplyAuthor ? "user" : replyHandle}'s profile`}
                          >
                            <ReaderAvatar
                              name={
                                isDeletedReplyAuthor
                                  ? "Deleted user"
                                  : replyStaff?.name || reply.authorName
                              }
                              photoURL={
                                isDeletedReplyAuthor
                                  ? "/logos/LAP-Logo-Color.png"
                                  : replyStaff?.avatar || reply.authorPhotoURL
                              }
                              className="h-8 w-8"
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <header className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openProfileModal(
                                      reply.authorId,
                                      {
                                        name: reply.authorName,
                                        handle: replyHandle,
                                        photoURL: reply.authorPhotoURL,
                                      },
                                      replyStaff,
                                    )
                                  }
                                  className="cursor-pointer text-left transition-colors hover:text-[#8a2ae3] focus:outline-none"
                                  title={`View ${isDeletedReplyAuthor ? "user" : replyHandle}'s profile`}
                                >
                                  {isDeletedReplyAuthor ? (
                                    <h4 className="text-xs font-semibold uppercase text-white/55">
                                      Deleted user
                                    </h4>
                                  ) : replyStaff ? (
                                    <StaffIdentity
                                      staff={replyStaff}
                                      handle={replyHandle}
                                    />
                                  ) : (
                                    <h4 className="text-xs font-semibold uppercase">
                                      @{replyHandle}
                                    </h4>
                                  )}
                                </button>
                                <p className="mt-1 font-mono text-[10px] text-white/35">
                                  {replyDate
                                    ? replyDate.toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Just now"}
                                  {reply.edited ? " (edited)" : ""}
                                </p>
                              </div>
                              {isReplyOwner ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReplyId(reply.id);
                                      setEditingReplyContent(reply.content);
                                    }}
                                    className="flex h-5 w-5 items-center justify-center border border-white/20 text-white/50 transition-colors hover:border-white hover:text-white"
                                    title="Edit reply"
                                    aria-label="Edit reply"
                                  >
                                    <Pencil className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeReply(comment.id, reply)}
                                    disabled={replyBusyId === reply.id}
                                    className="flex h-5 w-5 items-center justify-center border border-red-500/30 text-red-400/60 transition-colors hover:border-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                                    title="Delete reply"
                                    aria-label="Delete reply"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ) : user && !isDeletedReplyAuthor && !replyStaff && !staffProfiles[reply.authorId] ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReportTarget({
                                      type: "reply",
                                      reportedUserId: reply.authorId,
                                      reportedUserHandle: replyHandle,
                                      reportedUserName: reply.authorName,
                                      commentId: reply.id,
                                      parentCommentId: comment.id,
                                      commentContent: reply.content,
                                      articleId,
                                      articleTitle,
                                      articleSlug,
                                    })
                                  }
                                  className="flex h-5 w-5 items-center justify-center border border-white/15 text-white/35 transition-colors hover:border-red-400 hover:text-red-300"
                                  title="Report reply"
                                  aria-label="Report reply"
                                >
                                  <RiFlagLine className="h-2.5 w-2.5" />
                                </button>
                              ) : null}
                            </header>
                            {isReplyEditing ? (
                              <div className="mt-3">
                                <MentionTextarea
                                  value={editingReplyContent}
                                  onChange={setEditingReplyContent}
                                  maxLength={MAX_COMMENT_LENGTH}
                                  rows={2}
                                  className="w-full resize-y border-0 border-b border-white/35 bg-transparent px-0 py-2 text-sm outline-none focus:border-[#8a2ae3] focus:ring-0"
                                />
                                <div className="mt-2 flex justify-end gap-4 text-[10px] font-semibold uppercase">
                                  <button
                                    type="button"
                                    onClick={() => setEditingReplyId(null)}
                                    className="text-white/45 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveReplyEdit(comment.id, reply)
                                    }
                                    disabled={
                                      replyBusyId === reply.id ||
                                      (!editingReplyContent.trim() &&
                                        !hasCommentImages(reply))
                                    }
                                    className="text-[#8a2ae3] hover:text-white disabled:opacity-35"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {reply.content?.trim() ? (
                                  <div>
                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm font-light leading-6 text-white/75">
                                      <MentionText
                                        content={
                                          translations[reply.id] &&
                                          !translations[reply.id].showingOriginal
                                            ? translations[reply.id].translatedText
                                            : reply.content
                                        }
                                      />
                                    </p>

                                    {/* Translation status / toggle */}
                                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px]">
                                      {translatingIds.has(reply.id) ? (
                                        <span className="inline-flex items-center gap-1 text-white/40">
                                          <Loader2 className="h-2.5 w-2.5 animate-spin text-[#8a2ae3]" /> Translating…
                                        </span>
                                      ) : translations[reply.id]?.isUnrecognizedLanguage ? (
                                        <div className="inline-flex flex-wrap items-center gap-1.5 text-amber-300/85">
                                          <span>⚠️ Could not identify language · Needs review</span>
                                          <span>·</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTranslations((prev) => {
                                                const next = { ...prev };
                                                delete next[reply.id];
                                                return next;
                                              });
                                              setTimeout(() => toggleTranslation(reply.id, reply.content), 50);
                                            }}
                                            className="underline hover:text-amber-200"
                                          >
                                            Retry
                                          </button>
                                        </div>
                                      ) : translations[reply.id]?.isSameLanguage ? (
                                        null
                                      ) : translations[reply.id] ? (
                                        <div className="inline-flex flex-wrap items-center gap-1.5 text-white/50">
                                          <span>
                                            Translated from <strong className="text-[#8a2ae3]">{translations[reply.id].sourceLangName}</strong>
                                          </span>
                                          <span>·</span>
                                          <button
                                            type="button"
                                            onClick={() => toggleTranslation(reply.id, reply.content)}
                                            className="underline hover:text-white"
                                          >
                                            {translations[reply.id].showingOriginal
                                              ? "Show translation"
                                              : "Show original"}
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleTranslation(reply.id, reply.content)}
                                          className="inline-flex items-center gap-1 text-white/35 transition-colors hover:text-[#8a2ae3]"
                                          title={`Translate to ${getLanguageName(targetLang)}`}
                                        >
                                          <RiTranslate2 className="text-[11px]" />
                                          <span>Translate</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : null}

                                {/* Multi-Image Grid for Replies */}
                                <CommentImagesGrid
                                  images={getEntryImages(reply)}
                                  author={replyHandle}
                                  onOpenLightbox={(imgs, idx, author) =>
                                    setLightboxGallery({ images: imgs, currentIndex: idx, author })
                                  }
                                />
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}
                    {replyThreads[comment.id]?.hasMore ? (
                      <button
                        type="button"
                        onClick={() => loadReplies(comment.id, false)}
                        disabled={replyThreads[comment.id]?.loading}
                        className="my-4 border-b border-white/30 pb-1 text-xs font-semibold uppercase text-white/55 transition-colors hover:border-[#8a2ae3] hover:text-white disabled:opacity-35"
                      >
                        {replyThreads[comment.id]?.loading
                          ? "Loading…"
                          : "Load more replies"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {pageIndex > 0 || hasMoreComments || totalPages > 1 ? (
        <nav
          aria-label="Comment pages"
          className="flex items-center justify-between border-b border-white/30 py-6"
        >
          <button
            type="button"
            onClick={showPreviousPage}
            disabled={pageIndex === 0 || loadingMore}
            className="border-b border-white/40 pb-1 text-sm font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3] disabled:cursor-wait disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs uppercase tracking-wide text-white/40">
            Page {pageIndex + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={showNextPage}
            disabled={!hasMoreComments || pageIndex + 1 >= totalPages || loadingMore}
            className="border-b border-white/40 pb-1 text-sm font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2ae3] hover:text-[#8a2ae3] disabled:cursor-wait disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Next"}
          </button>
        </nav>
      ) : null}

      <UserProfileModal
        isOpen={Boolean(selectedUserModal)}
        userId={selectedUserModal?.userId || null}
        initialData={selectedUserModal?.initialData}
        staffProfile={selectedUserModal?.staffProfile}
        onClose={closeProfileModal}
      />

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />

      {/* Fullscreen Gallery Lightbox Modal */}
      {lightboxGallery && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
          onKeyDown={(e) => {
            if (e.key === "Escape") setLightboxGallery(null);
            if (e.key === "ArrowLeft" && lightboxGallery.images.length > 1) {
              setLightboxGallery((prev) =>
                prev
                  ? {
                      ...prev,
                      currentIndex:
                        prev.currentIndex > 0
                          ? prev.currentIndex - 1
                          : prev.images.length - 1,
                    }
                  : null,
              );
            }
            if (e.key === "ArrowRight" && lightboxGallery.images.length > 1) {
              setLightboxGallery((prev) =>
                prev
                  ? {
                      ...prev,
                      currentIndex:
                        prev.currentIndex < prev.images.length - 1
                          ? prev.currentIndex + 1
                          : 0,
                    }
                  : null,
              );
            }
          }}
          tabIndex={-1}
        >
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            onClick={() => setLightboxGallery(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[90vh] max-w-5xl w-full flex-col border border-white/20 bg-[#0e0e10] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white/50">Attachment by</span>
                  <span className="font-mono text-xs font-semibold text-[#8a2ae3]">
                    @{lightboxGallery.author}
                  </span>
                </div>
                {lightboxGallery.images.length > 1 ? (
                  <span className="border border-white/20 bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-white/70">
                    {lightboxGallery.currentIndex + 1} of {lightboxGallery.images.length}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setLightboxGallery(null)}
                className="flex h-7 w-7 items-center justify-center border border-white/20 text-white/70 transition-colors hover:bg-white hover:text-black"
                aria-label="Close image preview"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-auto py-2">
              {lightboxGallery.images.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxGallery((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex:
                              prev.currentIndex > 0
                                ? prev.currentIndex - 1
                                : prev.images.length - 1,
                          }
                        : null,
                    )
                  }
                  className="absolute left-2 z-20 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:bg-white hover:text-black"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}

              <img
                src={lightboxGallery.images[lightboxGallery.currentIndex]?.url}
                alt={lightboxGallery.images[lightboxGallery.currentIndex]?.alt || "Attachment"}
                className="max-h-[72vh] w-auto max-w-full object-contain border border-white/10"
              />

              {lightboxGallery.images.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxGallery((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentIndex:
                              prev.currentIndex < prev.images.length - 1
                                ? prev.currentIndex + 1
                                : 0,
                          }
                        : null,
                    )
                  }
                  className="absolute right-2 z-20 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:bg-white hover:text-black"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
