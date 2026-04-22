import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { deleteComponent, getMyComponents } from "@/services/componentsStore";
import { useToast } from "@/use-toast";
import "./DeveloperDashboard.css";

const PAGE_SIZE = 20;

const DeveloperDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await getMyComponents({ page: 1, limit: PAGE_SIZE });
      setItems(Array.isArray(payload?.components) ? payload.components : []);
    } catch (error) {
      toast({
        title: "Unable to load dashboard",
        description: error?.message || "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        void load();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const stats = useMemo(() => {
    const total = items.length;
    const avgRating = total
      ? (items.reduce((sum, item) => sum + Number(item.averageRating || 0), 0) / total).toFixed(1)
      : "0.0";
    const totalReviews = items.reduce((sum, item) => sum + Number(item.totalReviews || 0), 0);
    const totalViews = items.reduce((sum, item) => sum + Number(item.viewCount || 0), 0);
    return { total, avgRating, totalReviews, totalViews };
  }, [items]);

  const handleDelete = async (componentId, componentName) => {
    const confirmed = window.confirm(`Delete component \"${componentName}\"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingId(componentId);
    try {
      await deleteComponent(componentId);
      setItems((previous) => previous.filter((item) => item.id !== componentId));
      toast({
        title: "Component deleted",
        description: `${componentName} was removed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.message || "Unable to delete component.",
      });
    } finally {
      setIsDeletingId("");
    }
  };

  return (
    <Layout>
      <div className="layout-container developer-dashboard-page">
        <div className="developer-dashboard-header">
          <h1>Developer Dashboard</h1>
          <p>Manage your components, review ratings, and remove entries you own.</p>
        </div>

        <section className="developer-dashboard-stats" aria-label="Dashboard summary">
          <article>
            <h2>Total Components</h2>
            <strong>{stats.total}</strong>
          </article>
          <article>
            <h2>Average Rating</h2>
            <strong>{stats.avgRating}</strong>
          </article>
          <article>
            <h2>Total Reviews</h2>
            <strong>{stats.totalReviews}</strong>
          </article>
          <article>
            <h2>Total Views</h2>
            <strong>{stats.totalViews}</strong>
          </article>
        </section>

        {isLoading ? (
          <div className="developer-dashboard-state">Loading your components...</div>
        ) : items.length === 0 ? (
          <div className="developer-dashboard-state">No components yet. Add your first one from Add Component.</div>
        ) : (
          <div className="developer-dashboard-table-wrap">
            <table className="developer-dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col">Category</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Reviews</th>
                  <th scope="col">Views</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <span>{item.id}</span>
                    </td>
                    <td>{item.category || "-"}</td>
                    <td>{Number(item.averageRating || 0).toFixed(1)}</td>
                    <td>{Number(item.totalReviews || 0)}</td>
                    <td>{Number(item.viewCount || 0)}</td>
                    <td>
                      <div className="developer-dashboard-actions">
                        <Link to={`/component/${item.id}`}>View</Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={isDeletingId === item.id}
                        >
                          {isDeletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeveloperDashboard;
