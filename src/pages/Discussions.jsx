import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchDiscussionsFeed } from "@/services/componentEngagementService";
import { useToast } from "@/use-toast";
import "./Discussions.css";

const Discussions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const discussions = await fetchDiscussionsFeed();
        if (active) {
          setItems(discussions);
        }
      } catch {
        if (active) {
          toast({
            title: "Unable to load discussions",
            description: "Please try again later.",
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
      <div className="layout-container discussions-page">
        <h1>Discussions</h1>
        <p>Recent discussion threads from component pages.</p>

        {isLoading ? (
          <div className="discussions-state">Loading discussions...</div>
        ) : items.length > 0 ? (
          <div className="discussions-list">
            {items.map((discussion) => (
              <article className="discussions-item" key={discussion._id || `${discussion.componentId}-${discussion.createdAt}`}>
                <p>{discussion.message || "No message"}</p>
                <span>Status: {discussion.status || "active"}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="discussions-state">No discussions yet.</div>
        )}
      </div>
    </Layout>
  );
};

export default Discussions;
