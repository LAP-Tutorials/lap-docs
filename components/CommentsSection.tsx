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
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { db, functions } from "@/lib/firebase";
import { usePublicAuth } from "@/lib/public-auth-context";
import { RiArrowRightLine } from "react-icons/ri";
import MentionTextarea from "@/components/MentionTextarea";

type CommentRecord = {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorPhotoURL: string;
  content: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  edited: boolean;
  likeCount?: number;
  dislikeCount?: number;
  replyCount?: number;
};

type ReplyRecord = {
  id: string;
  parentCommentId: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorPhotoURL: string;
  content: string;
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
type CommentReaction = "like" | "dislike";

type CommentsSectionProps = {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
};

type StaffRole = "super" | "admin" | "manager" | "moderator";

type StaffProfile = {
  name: string;
  avatar: string;
  role: StaffRole;
};

const MAX_COMMENT_LENGTH = 2000;
const COMMENTS_PAGE_SIZE = 15;
const REPLIES_PAGE_SIZE = 5;

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
    nameClassName: "text-[#c084fc]",
    handleClassName: "text-[#c084fc]/70",
  },
  admin: {
    label: "Admin",
    nameClassName: "text-[#c084fc]",
    handleClassName: "text-[#c084fc]/70",
  },
  manager: {
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
        className="font-medium text-[#c084fc]"
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

export default function CommentsSection({
  articleId,
  articleSlug,
  articleTitle,
}: CommentsSectionProps) {
  const { user, profile, isStaff, isLoading: authLoading } = usePublicAuth();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
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
  const [error, setError] = useState("");
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>(
    {},
  );
  const commentCursor = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const pageIndexRef = useRef(0);
  const commentPages = useRef<
    Array<{
      comments: CommentRecord[];
      cursor: QueryDocumentSnapshot<DocumentData> | null;
      hasMore: boolean;
    }>
  >([]);
  const countsReady = useRef(false);
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
        if (sort === "liked" && !countsReady.current) {
          const ensureCounts = httpsCallable(functions, "ensureCommentCounts");
          await ensureCounts({});
          countsReady.current = true;
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
        constraints.push(limit(COMMENTS_PAGE_SIZE + 1));

        const snapshot = await getDocs(query(collection(db, "comments"), ...constraints));
        if (requestId !== requestSequence.current) return;
        const pageDocs = snapshot.docs.slice(0, COMMENTS_PAGE_SIZE);
        const page = pageDocs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        })) as CommentRecord[];
        commentCursor.current = pageDocs.at(-1) || null;
        const nextPage = {
          comments: page,
          cursor: commentCursor.current,
          hasMore: snapshot.docs.length > COMMENTS_PAGE_SIZE,
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

  useEffect(() => {
    void loadComments(true);
  }, [loadComments]);

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
        const snapshot = await getDocs(collection(db, "authors"));
        if (cancelled) return;

        const nextProfiles: Record<string, StaffProfile> = {};
        snapshot.docs.forEach((authorDoc) => {
          const data = authorDoc.data();
          if (
            typeof data.name === "string" &&
            ["super", "admin", "manager", "moderator"].includes(data.role)
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

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (
      !user ||
      !profile?.handle ||
      !trimmedContent ||
      trimmedContent.length > MAX_COMMENT_LENGTH
    ) return;

    setBusyId("new");
    setError("");
    try {
      await addDoc(collection(db, "comments"), {
        articleId,
        articleSlug,
        articleTitle,
        authorId: user.uid,
        authorName,
        authorHandle: profile.handle,
        authorPhotoURL: profile.photoURL || user.photoURL || "",
        content: trimmedContent,
        status: "visible",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        edited: false,
        likeCount: 0,
        dislikeCount: 0,
        replyCount: 0,
      });
      setContent("");
      if (sort === "recent") {
        await loadComments(true);
      } else {
        setSort("recent");
      }
    } catch (submitError) {
      console.error("Unable to post comment:", submitError);
      setError("We could not post your comment. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const submitReply = async (comment: CommentRecord) => {
    const trimmedContent = replyContent.trim();
    if (
      !user ||
      !profile?.handle ||
      !trimmedContent ||
      trimmedContent.length > MAX_COMMENT_LENGTH
    ) return;

    setReplyBusyId(comment.id);
    setError("");
    try {
      await addDoc(collection(db, "commentReplies"), {
        parentCommentId: comment.id,
        articleId,
        articleSlug,
        articleTitle,
        authorId: user.uid,
        authorName,
        authorHandle: profile.handle,
        authorPhotoURL: profile.photoURL || user.photoURL || "",
        content: trimmedContent,
        status: "visible",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        edited: false,
      });
      updateCurrentPage((current) =>
        current.map((item) =>
          item.id === comment.id
            ? { ...item, replyCount: (item.replyCount || 0) + 1 }
            : item,
        ),
      );
      setReplyContent("");
      setReplyingToId(null);
      setExpandedReplies((current) => new Set(current).add(comment.id));
      await loadReplies(comment.id, true);
    } catch (replyError) {
      console.error("Unable to post reply:", replyError);
      setError("We could not post your reply. Please try again.");
    } finally {
      setReplyBusyId(null);
    }
  };

  const saveReplyEdit = async (commentId: string, replyId: string) => {
    const trimmedContent = editingReplyContent.trim();
    if (!trimmedContent || trimmedContent.length > MAX_COMMENT_LENGTH) return;
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

  const removeReply = async (commentId: string, replyId: string) => {
    if (!window.confirm("Delete this reply permanently?")) return;
    setReplyBusyId(replyId);
    setError("");
    try {
      await deleteDoc(doc(db, "commentReplies", replyId));
      updateReplyThread(commentId, (current) =>
        current.filter((reply) => reply.id !== replyId),
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

  const saveEdit = async (commentId: string) => {
    const trimmedContent = editingContent.trim();
    if (!trimmedContent || trimmedContent.length > MAX_COMMENT_LENGTH) return;
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

  const removeComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    setBusyId(commentId);
    setError("");
    try {
      await deleteDoc(doc(db, "comments", commentId));
      updateCurrentPage((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
    } catch (deleteError) {
      console.error("Unable to delete comment:", deleteError);
      setError("We could not delete your comment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      id="comments"
      className="mb-20 mt-20 border-t border-white/30"
      aria-labelledby="comments-heading"
    >
      <header className="flex flex-col gap-5 border-b border-white/30 py-7 md:flex-row md:items-end md:justify-between">
        <div className="flex items-baseline gap-4">
          <h2
            id="comments-heading"
            className="text-4xl font-semibold uppercase leading-none md:text-5xl"
          >
            Comments
          </h2>
          <span className="font-mono text-sm tabular-nums text-white/45">
            Page {pageIndex + 1}
          </span>
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
                  ? "border-[#8a2be2] text-white"
                  : "border-transparent text-white/45 hover:border-white/40 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {error ? (
        <p
          role="alert"
          className="border-b border-white/25 py-5 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      {!authLoading && !user ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 py-6">
          <p className="text-white/60">Sign in to leave a comment.</p>
          <Link
            href="/account"
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2]"
          >
            Sign in
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {!authLoading && user && !profile?.handle ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 py-6">
          <p className="text-white/60">
            {isStaff
              ? "Finish your CMS team profile before commenting."
              : "Choose a handle before commenting."}
          </p>
          <Link
            href="/account"
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2]"
          >
            {isStaff ? "Open account" : "Set your handle"}
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {user && profile?.handle ? (
        <form
          onSubmit={submitComment}
          className="flex gap-4 border-b border-white/30 py-6"
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
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              placeholder="Write a comment…"
              className="mt-2 w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base leading-7 text-white outline-none transition-colors duration-300 placeholder:text-white/30 focus:border-[#8a2be2] focus:ring-0"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <span
                className={`font-mono text-xs tabular-nums ${
                  remaining < 100 ? "text-[#8a2be2]" : "text-white/40"
                }`}
              >
                {content.length}/{MAX_COMMENT_LENGTH}
              </span>
              <button
                disabled={busyId === "new" || !content.trim()}
                className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
              >
                {busyId === "new" ? "Posting…" : "Post comment"}
                <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
              </button>
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

      {!loading && !error && comments.length === 0 ? (
        <p className="border-b border-white/30 py-8 text-white/50">
          No comments yet.
        </p>
      ) : null}

      <div>
        {comments.map((comment) => {
          const isOwner = user?.uid === comment.authorId;
          const isEditing = editingId === comment.id;
          const date = comment.createdAt?.toDate();
          const staffProfile = staffProfiles[comment.authorId];
          const commentHandle =
            comment.authorHandle ||
            comment.authorName.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

          return (
            <article
              key={comment.id}
              className="flex gap-4 border-b border-white/30 py-7"
            >
              <ReaderAvatar
                name={staffProfile?.name || comment.authorName}
                photoURL={staffProfile?.avatar || comment.authorPhotoURL}
                className="h-10 w-10"
              />
              <div className="min-w-0 flex-1">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {staffProfile ? (
                      <StaffIdentity staff={staffProfile} handle={commentHandle} />
                    ) : (
                      <h3 className="break-words text-sm font-semibold uppercase">
                        @{commentHandle}
                      </h3>
                    )}
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
                  {isOwner ? (
                    <div className="flex gap-4 text-xs font-medium uppercase">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingContent(comment.content);
                        }}
                        className="border-b border-white/40 pb-1 transition-colors duration-300 hover:border-[#8a2be2] hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeComment(comment.id)}
                        disabled={busyId === comment.id}
                        className="border-b border-white/40 pb-1 text-white/60 transition-colors duration-300 hover:border-red-400 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </header>

                {isEditing ? (
                  <div className="mt-3">
                  <MentionTextarea
                    value={editingContent}
                    onChange={setEditingContent}
                    maxLength={MAX_COMMENT_LENGTH}
                    rows={3}
                    className="w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base leading-7 outline-none transition-colors duration-300 focus:border-[#8a2be2] focus:ring-0"
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
                      onClick={() => saveEdit(comment.id)}
                      disabled={busyId === comment.id || !editingContent.trim()}
                      className="group inline-flex items-center gap-2 text-sm font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2] disabled:opacity-40"
                    >
                      Save <RiArrowRightLine className="text-xl" />
                    </button>
                  </div>
                  </div>
                ) : (
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words font-light leading-7 text-white/80">
                    <MentionText content={comment.content} />
                  </p>
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
                            ? "text-[#c084fc]"
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
                            ? "text-[#c084fc]"
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
                      }}
                      className="border-b border-transparent pb-0.5 font-sans font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2be2] hover:text-[#c084fc]"
                    >
                      Reply
                    </button>
                  ) : null}
                </div>

                {replyingToId === comment.id ? (
                  <div className="mt-5 border-l border-[#8a2be2] pl-4">
                    <label htmlFor={`reply-${comment.id}`} className="sr-only">
                      Reply to @{commentHandle}
                    </label>
                    <MentionTextarea
                      id={`reply-${comment.id}`}
                      value={replyContent}
                      onChange={setReplyContent}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={2}
                      autoFocus
                      placeholder={`Reply to @${commentHandle}…`}
                      className="w-full resize-y border-0 border-b border-white/35 bg-transparent px-0 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-[#8a2be2] focus:ring-0"
                    />
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="font-mono text-[11px] tabular-nums text-white/35">
                        {replyContent.length}/{MAX_COMMENT_LENGTH}
                      </span>
                      <div className="flex gap-4 text-xs font-semibold uppercase">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyContent("");
                          }}
                          className="text-white/50 transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReply(comment)}
                          disabled={
                            replyBusyId === comment.id || !replyContent.trim()
                          }
                          className="text-[#c084fc] transition-colors hover:text-white disabled:opacity-35"
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
                    {replyThreads[comment.id]?.replies.map((reply) => {
                      const replyStaff = staffProfiles[reply.authorId];
                      const replyHandle =
                        reply.authorHandle ||
                        reply.authorName
                          .toLowerCase()
                          .replace(/[^a-z0-9_]+/g, "_");
                      const replyDate = reply.createdAt?.toDate();
                      const isReplyOwner = user?.uid === reply.authorId;
                      const isReplyEditing = editingReplyId === reply.id;
                      return (
                        <article
                          key={reply.id}
                          className="flex gap-3 border-b border-white/15 py-5 last:border-b-0"
                        >
                          <ReaderAvatar
                            name={replyStaff?.name || reply.authorName}
                            photoURL={replyStaff?.avatar || reply.authorPhotoURL}
                            className="h-8 w-8"
                          />
                          <div className="min-w-0 flex-1">
                            <header className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                {replyStaff ? (
                                  <StaffIdentity
                                    staff={replyStaff}
                                    handle={replyHandle}
                                  />
                                ) : (
                                  <h4 className="text-xs font-semibold uppercase">
                                    @{replyHandle}
                                  </h4>
                                )}
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
                                <div className="flex gap-3 text-[10px] font-semibold uppercase text-white/45">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReplyId(reply.id);
                                      setEditingReplyContent(reply.content);
                                    }}
                                    className="transition-colors hover:text-white"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeReply(comment.id, reply.id)}
                                    disabled={replyBusyId === reply.id}
                                    className="transition-colors hover:text-red-300 disabled:opacity-40"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </header>
                            {isReplyEditing ? (
                              <div className="mt-3">
                                <MentionTextarea
                                  value={editingReplyContent}
                                  onChange={setEditingReplyContent}
                                  maxLength={MAX_COMMENT_LENGTH}
                                  rows={2}
                                  className="w-full resize-y border-0 border-b border-white/35 bg-transparent px-0 py-2 text-sm outline-none focus:border-[#8a2be2] focus:ring-0"
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
                                      saveReplyEdit(comment.id, reply.id)
                                    }
                                    disabled={
                                      replyBusyId === reply.id ||
                                      !editingReplyContent.trim()
                                    }
                                    className="text-[#c084fc] hover:text-white disabled:opacity-35"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-3 whitespace-pre-wrap break-words text-sm font-light leading-6 text-white/75">
                                <MentionText content={reply.content} />
                              </p>
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
                        className="my-4 border-b border-white/30 pb-1 text-xs font-semibold uppercase text-white/55 transition-colors hover:border-[#8a2be2] hover:text-white disabled:opacity-35"
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

      {pageIndex > 0 || hasMoreComments ? (
        <nav
          aria-label="Comment pages"
          className="flex items-center justify-between border-b border-white/30 py-6"
        >
          <button
            type="button"
            onClick={showPreviousPage}
            disabled={pageIndex === 0 || loadingMore}
            className="border-b border-white/40 pb-1 text-sm font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2be2] hover:text-[#c084fc] disabled:cursor-wait disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs uppercase tracking-wide text-white/40">
            Page {pageIndex + 1}
          </span>
          <button
            type="button"
            onClick={showNextPage}
            disabled={!hasMoreComments || loadingMore}
            className="border-b border-white/40 pb-1 text-sm font-semibold uppercase tracking-wide transition-colors hover:border-[#8a2be2] hover:text-[#c084fc] disabled:cursor-wait disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Next"}
          </button>
        </nav>
      ) : null}
    </section>
  );
}
