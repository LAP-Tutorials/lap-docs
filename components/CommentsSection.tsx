"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePublicAuth } from "@/lib/public-auth-context";
import { RiArrowRightLine } from "react-icons/ri";

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
};

type CommentsSectionProps = {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
};

const MAX_COMMENT_LENGTH = 2000;

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

export default function CommentsSection({
  articleId,
  articleSlug,
  articleTitle,
}: CommentsSectionProps) {
  const { user, profile, isLoading: authLoading } = usePublicAuth();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const commentsQuery = query(
      collection(db, "comments"),
      where("articleId", "==", articleId),
      where("status", "==", "visible"),
      limit(200),
    );

    return onSnapshot(
      commentsQuery,
      (snapshot) => {
        const nextComments = snapshot.docs
          .map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          })) as CommentRecord[];
        nextComments.sort(
          (left, right) =>
            (right.createdAt?.toMillis() || 0) -
            (left.createdAt?.toMillis() || 0),
        );
        setComments(nextComments);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Unable to load comments:", snapshotError);
        setError("Comments are temporarily unavailable.");
        setLoading(false);
      },
    );
  }, [articleId]);

  const remaining = MAX_COMMENT_LENGTH - content.length;
  const authorName = useMemo(
    () =>
      profile?.displayName ||
      user?.displayName?.trim() ||
      user?.email?.split("@")[0] ||
      "L.A.P Reader",
    [profile?.displayName, user],
  );

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
      });
      setContent("");
    } catch (submitError) {
      console.error("Unable to post comment:", submitError);
      setError("We could not post your comment. Please try again.");
    } finally {
      setBusyId(null);
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
      className="mb-20 mt-24 border-t border-white/30"
      aria-labelledby="comments-heading"
    >
      <header className="grid gap-8 border-b border-white/30 py-10 md:grid-cols-[minmax(0,1fr)_24rem] md:items-end md:py-14">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-white/45">
            Discussion
          </p>
          <h2
            id="comments-heading"
            className="text-subtitle flex flex-wrap items-baseline gap-x-4 text-balance"
          >
            Comments
            <span className="font-mono text-[0.34em] font-normal tabular-nums text-[#8a2be2]">
              {String(comments.length).padStart(2, "0")}
            </span>
          </h2>
        </div>
        <p className="max-w-sm text-base font-light leading-7 text-white/60 md:justify-self-end">
          Comments are public. Keep personal information out and add something
          useful to the conversation.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="border-b border-white/25 py-5 text-sm text-red-200"
        >
          <span className="mr-4 font-mono text-red-400">—</span>
          {error}
        </p>
      ) : null}

      {!authLoading && !user ? (
        <div className="grid gap-5 border-b border-white/30 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h3 className="text-2xl font-semibold uppercase md:text-3xl">
              Have something to add?
            </h3>
            <p className="mt-2 font-light text-white/55">
              Create a reader account before joining the discussion.
            </p>
          </div>
          <Link
            href="/account"
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2]"
          >
            Sign in or create an account
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {!authLoading && user && !profile?.handle ? (
        <div className="grid gap-5 border-b border-white/30 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h3 className="text-2xl font-semibold uppercase md:text-3xl">
              Choose a handle first
            </h3>
            <p className="mt-2 font-light text-white/55">
              Your handle identifies you in comments.
            </p>
          </div>
          <Link
            href="/account"
            className="group inline-flex items-center gap-3 font-semibold uppercase transition-colors duration-300 hover:text-[#8a2be2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a2be2]"
          >
            Set your handle
            <RiArrowRightLine className="text-2xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}

      {user && profile?.handle ? (
        <form
          onSubmit={submitComment}
          className="grid gap-6 border-b border-white/30 py-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12"
        >
          <div>
            <ReaderAvatar
              name={authorName}
              photoURL={profile.photoURL || user.photoURL || ""}
              className="h-14 w-14"
            />
            <p className="mt-3 break-words font-semibold uppercase">@{profile.handle}</p>
          </div>
          <div>
            <label htmlFor="new-comment" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="new-comment"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              rows={5}
              placeholder="Add to the discussion…"
              className="w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-3 text-lg leading-8 text-white outline-none transition-colors duration-300 placeholder:text-white/30 focus:border-[#8a2be2] focus:ring-0"
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
              <span
                className={`font-mono text-xs tabular-nums ${
                  remaining < 100 ? "text-[#8a2be2]" : "text-white/40"
                }`}
              >
                {remaining} characters left
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
        <div aria-label="Loading comments">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="grid animate-pulse gap-6 border-b border-white/20 py-9 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12"
            >
              <div className="h-5 w-32 bg-white/15" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-white/10" />
                <div className="h-4 w-4/5 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !error && comments.length === 0 ? (
        <div className="grid min-h-56 items-center gap-5 border-b border-white/30 py-12 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
          <span className="font-mono text-6xl font-light tabular-nums text-white/10">
            00
          </span>
          <p className="max-w-xl text-2xl font-light leading-tight text-white/65 md:text-3xl">
            No comments yet. Start the conversation.
          </p>
        </div>
      ) : null}

      <div>
        {comments.map((comment) => {
          const isOwner = user?.uid === comment.authorId;
          const isEditing = editingId === comment.id;
          const date = comment.createdAt?.toDate();

          return (
            <article
              key={comment.id}
              className="grid gap-6 border-b border-white/30 py-9 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12"
            >
              <header>
                <div className="flex items-start gap-3 md:block">
                  <ReaderAvatar
                    name={comment.authorName}
                    photoURL={comment.authorPhotoURL}
                  />
                  <div className="min-w-0 md:mt-3">
                    <h3 className="break-words font-semibold uppercase">
                      @{comment.authorHandle || comment.authorName.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}
                    </h3>
                    <p className="mt-2 font-mono text-xs tabular-nums text-white/40 md:hidden">
                      {date ? date.toLocaleString() : "Just now"}
                      {comment.edited ? " · edited" : ""}
                    </p>
                  </div>
                  <p className="mt-2 hidden font-mono text-xs tabular-nums text-white/40 md:block">
                    {date ? date.toLocaleString() : "Just now"}
                    {comment.edited ? " · edited" : ""}
                  </p>
                </div>
                {isOwner ? (
                  <div className="mt-5 flex gap-4 text-xs font-medium uppercase">
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
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                    maxLength={MAX_COMMENT_LENGTH}
                    rows={4}
                    className="w-full resize-y border-0 border-b border-white/40 bg-transparent px-0 py-3 text-lg leading-8 outline-none transition-colors duration-300 focus:border-[#8a2be2] focus:ring-0"
                  />
                  <div className="mt-5 flex justify-end gap-5">
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
                <p className="max-w-3xl whitespace-pre-wrap break-words text-lg font-light leading-8 text-white/80">
                  {comment.content}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
