"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { httpsCallable } from "firebase/functions";
import {
  RiAlertLine,
  RiCloseLine,
  RiFlagLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { functions } from "@/lib/firebase";
import { usePublicAuth } from "@/lib/public-auth-context";

export interface ReportTarget {
  type: "user" | "comment" | "reply";
  reportedUserId: string;
  reportedUserHandle: string;
  reportedUserName?: string;
  commentId?: string;
  parentCommentId?: string;
  commentContent?: string;
  articleId?: string;
  articleTitle?: string;
  articleSlug?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ReportTarget | null;
}

const REPORT_REASONS = [
  {
    id: "harassment",
    label: "Harassment, Bullying, or Threats",
    description: "Targeted insults, personal attacks, intimidation, or persistent abuse.",
  },
  {
    id: "spam",
    label: "Spam, Advertising, or Scams",
    description: "Repetitive messages, affiliate links, crypto schemes, or deceptive links.",
  },
  {
    id: "hate_speech",
    label: "Hate Speech or Discrimination",
    description: "Attacking or dehumanizing based on race, religion, gender, identity, etc.",
  },
  {
    id: "inappropriate",
    label: "Inappropriate or Explicit Content",
    description: "Sexually explicit content, NSFW images, gore, or malicious files.",
  },
  {
    id: "impersonation",
    label: "Impersonation or False Identity",
    description: "Pretending to be L.A.P staff, an author, or another reader.",
  },
  {
    id: "other",
    label: "Other Policy Violation",
    description: "Another violation of our Community Guidelines or Terms of Service.",
  },
] as const;

export default function ReportModal({
  isOpen,
  onClose,
  target,
}: ReportModalProps) {
  const { user } = usePublicAuth();
  const [selectedReason, setSelectedReason] = useState<string>("harassment");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to submit a report.");
      return;
    }

    if (user.uid === target.reportedUserId) {
      setError("You cannot report your own account or comments.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const submitReport = httpsCallable<
        { type: ReportTarget["type"]; targetId: string; reason: string; details: string },
        { reportId: string }
      >(functions, "submitReport");
      await submitReport({
        reason: selectedReason,
        type: target.type,
        targetId: target.type === "user" ? target.reportedUserId : target.commentId || "",
        details: details.trim(),
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit report:", err);
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError("");
    setDetails("");
    setSelectedReason("harassment");
    onClose();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
      tabIndex={-1}
    >
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg border border-white/20 bg-[#0e0e10] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <RiFlagLine className="text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide">
                Report {target.type === "user" ? "User Profile" : target.type === "reply" ? "Reply" : "Comment"}
              </h2>
              <p className="text-xs text-white/50">
                Reporting @<span className="text-[#8a2ae3]">{target.reportedUserHandle}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center border border-white/20 text-white/70 transition-colors hover:bg-white hover:text-black"
            aria-label="Close modal"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <RiShieldCheckLine className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold">Report Received</h3>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
              Thank you for helping keep our community safe. Our moderation team has been notified and
              will review the content against our Community Guidelines.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="bg-white px-6 py-2.5 text-xs font-semibold uppercase text-black hover:bg-[#8a2ae3] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error ? (
              <div className="flex items-start gap-2 border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                <RiAlertLine className="text-base shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}

            {target.commentContent ? (
              <div className="border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70">
                <p className="font-mono text-[10px] uppercase text-white/40 mb-1">Content snippet:</p>
                <p className="italic line-clamp-3">&ldquo;{target.commentContent}&rdquo;</p>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                Reason for report
              </label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-start gap-3 border p-2.5 cursor-pointer transition-colors ${
                      selectedReason === reason.id
                        ? "border-[#8a2ae3] bg-[#8a2ae3]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="mt-0.5 h-3.5 w-3.5 text-[#8a2ae3] focus:ring-[#8a2ae3]"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-white">{reason.label}</p>
                      <p className="text-[11px] text-white/50 mt-0.5">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="reportDetails" className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                id="reportDetails"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Explain why this content violates our rules..."
                className="w-full resize-none border border-white/20 bg-transparent p-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#8a2ae3] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs">
              <Link
                href="/community-guidelines"
                target="_blank"
                className="text-[#8a2ae3] underline hover:text-white"
              >
                Community Guidelines &rarr;
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 font-semibold uppercase text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 px-4 py-2 font-semibold uppercase text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
