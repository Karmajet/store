"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  user: { name: string };
}

export default function ReviewSection({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${slug}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews);
        setAvgRating(data.avgRating);
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, body }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setSubmitting(false);
      return;
    }

    const newReview = await res.json();
    setReviews((prev) => [newReview, ...prev]);
    setAvgRating(
      (reviews.reduce((s, r) => s + r.rating, 0) + rating) / (reviews.length + 1)
    );
    setShowForm(false);
    setRating(0);
    setTitle("");
    setBody("");
    setSubmitting(false);
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm text-gray-500">
                {avgRating.toFixed(1)} ({reviews.length} review
                {reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
        {session && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rating
            </label>
            <StarRating rating={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Review
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell others what you think..."
              className={inputClass}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 && !showForm ? (
        <p className="text-sm text-gray-500">
          No reviews yet.{" "}
          {session ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-black underline"
            >
              Be the first
            </button>
          ) : (
            "Sign in to leave a review."
          )}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} readonly size="sm" />
                  {review.title && (
                    <span className="font-medium text-gray-900">
                      {review.title}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.body && (
                <p className="text-sm text-gray-600">{review.body}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                by {review.user.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
