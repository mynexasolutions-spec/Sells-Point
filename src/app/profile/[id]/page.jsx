"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Star, MapPin, CalendarDays, Package, Pencil, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage({ params }) {
  const { id } = params;
  const {
    hydrated,
    getUserById,
    listings,
    currentUser,
    reviewsByUser,
    fetchReviewsForUser,
    submitReview,
  } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const user = getUserById(id);
  const reviews = reviewsByUser[id] || [];

  useEffect(() => {
    if (id) fetchReviewsForUser(id);
  }, [id, fetchReviewsForUser]);

  if (!hydrated) {
    return (
      <div className="page-container">
        <div className="card mb-8 flex items-center gap-4 p-8">
          <div className="skeleton h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-5 w-1/3 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
          </div>
      </div>
    </div>
  );
}

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink-500">
        User not found.
      </div>
    );
  }

  const userListings = listings.filter((l) => l.sellerId === id && l.status === "active");
  const soldCount = listings.filter((l) => l.sellerId === id && l.status === "sold").length;
  const canReview = currentUser && currentUser.id !== user.id;
  const memberSince = new Date(user.joinedAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
  });

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    setReviewSubmitting(true);
    try {
      const result = await submitReview(user.id, reviewRating, reviewComment);
      if (!result.success) {
        setReviewError(result.error || "Unable to submit review.");
        return;
      }
      setReviewComment("");
      setReviewSuccess("Review saved.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card mb-8 flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:p-8 sm:text-left">
        <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover shadow-soft" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-2xl font-bold text-ink-900">{user.name}</h1>
            {user.verified && (
              <span className="badge-brand">
                <ShieldCheck size={12} /> Verified
              </span>
            )}
            {user.isAdmin && <span className="badge bg-ink-900 text-white">Admin</span>}
            {currentUser?.id === user.id && (
              <button
                onClick={() => setIsEditModalOpen(true)}
            className="btn-ghost min-h-11 !px-3 !py-1 text-sm"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>
          <p className="mt-2 max-w-lg text-sm text-ink-500">{user.bio || "No bio yet."}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-ink-500 sm:justify-start">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {user.rating?.toFixed(1)} ({user.ratingCount} ratings)
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {user.location}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Member since {memberSince}
            </span>
            <span className="flex items-center gap-1">
              <Package size={14} /> {soldCount} sold
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold text-ink-900">
        Active Listings ({userListings.length})
      </h2>
      {userListings.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">No active listings right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {userListings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Reviews</h2>
            <div className="mt-3 flex items-center gap-2">
              <Star size={20} className="fill-amber-400 text-amber-400" />
              <span className="font-display text-2xl font-bold text-ink-900">{user.rating?.toFixed(1)}</span>
              <span className="text-sm text-ink-500">({user.ratingCount} ratings)</span>
            </div>
            {canReview && (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="rounded-lg p-1 text-amber-400 hover:bg-amber-50"
                      aria-label={`${value} star rating`}
                    >
                      <Star
                        size={20}
                        className={value <= reviewRating ? "fill-amber-400" : "fill-transparent"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                  placeholder="Share your experience with this seller..."
                  className="input-field resize-none"
                />
                {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                {reviewSuccess && <p className="text-sm text-brand-600">{reviewSuccess}</p>}
                {!currentUser?.verified && (
                  <p className="text-sm text-amber-700">A verified account is required before leaving a review.</p>
                )}
                <button
                  type="submit"
                  disabled={reviewSubmitting || !currentUser?.verified}
                  className="btn-primary w-full"
                >
                  <Send size={16} /> {reviewSubmitting ? "Saving..." : "Save Review"}
                </button>
              </form>
            )}
            {!currentUser && (
              <p className="mt-4 text-sm text-ink-500">Sign in to leave a review.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-400">
              No reviews yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const reviewer = getUserById(review.reviewerId);
                return (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={reviewer?.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-ink-900">{reviewer?.name || "Sells Point user"}</p>
                          <div className="flex items-center gap-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={14}
                                className={index < review.rating ? "fill-amber-400" : "fill-transparent"}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-1 text-sm leading-6 text-ink-600">{review.comment}</p>
                        )}
                        <p className="mt-1 text-xs text-ink-400">
                          {new Date(review.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
}
