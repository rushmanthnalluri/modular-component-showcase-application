import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import StarRating from "@/components/common/StarRating";
import { fetchReviewsFeed } from "@/services/componentEngagementService";
import { useToast } from "@/use-toast";
import "./Reviews.css";

const Reviews = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const items = await fetchReviewsFeed();
        if (active) {
          setReviews(items);
        }
      } catch {
        if (active) {
          toast({
            title: "Unable to load reviews",
            description: "The review feed is not available right now.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [toast]);

  return (
    <Layout>
      <div className="layout-container reviews-page">
        <h1>Latest Reviews</h1>
        <p>Community feedback across all components.</p>

        {isLoading ? (
          <div className="reviews-state">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article className="reviews-item" key={review._id || `${review.componentId}-${review.createdAt}`}>
                <div className="reviews-item-head">
                  <strong>{review.title || "Review"}</strong>
                  <StarRating rating={review.rating} className="reviews-item-rating" />
                </div>
                <p>{review.comment || "No comment provided."}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="reviews-state reviews-state--empty">
            <strong>Be the first to review a component.</strong>
            <span>Once the community starts sharing feedback, the latest ratings will appear here.</span>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reviews;
