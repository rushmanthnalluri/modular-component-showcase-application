import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  getUserDashboard,
  getUserComponents,
  getSubmissionHistory,
  getFavoriteComponents,
} from "@/services/dashboardService";
import { useAuth } from "@/hooks/useAuth";
import "./Dashboard.css";

export default function Dashboard() {
  const { isLoggedIn, authUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [components, setComponents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Please log in to view your dashboard");
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [isLoggedIn]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [dashData, compData, favData, histData] = await Promise.all([
        getUserDashboard(),
        getUserComponents(1, 10),
        getFavoriteComponents(),
        getSubmissionHistory(1, 20),
      ]);

      setDashboard(dashData);
      setComponents(compData.components || []);
      setFavorites(favData || []);
      setHistory(histData.history || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="layout-container dashboard-state">
          <h2>Access Denied</h2>
          <p>Please log in to view your dashboard.</p>
          <Link to="/login" className="btn-login">
            Log In
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="layout-container">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error && !dashboard) {
    return (
      <Layout>
        <div className="layout-container dashboard-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadDashboard} className="btn-retry">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="layout-container dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Welcome, {authUser?.fullName}!</h1>
            <p>Manage your components and track your contributions</p>
          </div>
          <Link to="/add-component" className="btn-add-component">
            + Add New Component
          </Link>
        </div>

        {/* Statistics Cards */}
        {dashboard && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>Components</h3>
                <p className="stat-value">{dashboard.stats.totalComponentsSubmitted}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👁️</div>
              <div className="stat-content">
                <h3>Total Views</h3>
                <p className="stat-value">{dashboard.stats.totalComponentsViewed}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>Avg Rating</h3>
                <p className="stat-value">{dashboard.stats.averageRating}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <h3>Reviews</h3>
                <p className="stat-value">{dashboard.stats.totalReviewsReceived}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === "components" ? "active" : ""}`}
            onClick={() => setActiveTab("components")}
          >
            📦 My Components
          </button>
          <button
            className={`tab ${activeTab === "favorites" ? "active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            ❤️ Favorites ({favorites.length})
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📝 History
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === "overview" && dashboard && (
            <div className="overview-section">
              {components.length > 0 ? (
                <>
                  <h2>Recent Components</h2>
                  <div className="components-grid">
                    {components.slice(0, 6).map((comp) => (
                      <Link
                        key={comp._id}
                        to={`/component/${comp.id}`}
                        className="component-card-mini"
                      >
                        <div className="card-image">
                          {comp.thumbnail ? (
                            <img src={comp.thumbnail} alt={comp.name} />
                          ) : (
                            <div className="placeholder">{comp.category}</div>
                          )}
                        </div>
                        <div className="card-info">
                          <h3>{comp.name}</h3>
                          <div className="card-meta">
                            <span className="views">👁️ {comp.viewCount}</span>
                            <span className="rating">⭐ {comp.averageRating?.toFixed(1) || "0"}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>You haven't submitted any components yet.</p>
                  <Link to="/add-component" className="btn-add-component">
                    Create Your First Component
                  </Link>
                </div>
              )}

              {dashboard.recentHistory && dashboard.recentHistory.length > 0 && (
                <>
                  <h2>Recent Activity</h2>
                  <div className="activity-list">
                    {dashboard.recentHistory.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="activity-item">
                        <span className="action-badge">{item.action.toUpperCase()}</span>
                        <div className="activity-details">
                          <p>{item.reason || "No description"}</p>
                          <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Components Tab */}
          {activeTab === "components" && (
            <div className="components-section">
              <h2>Your Components</h2>
              {components.length > 0 ? (
                <div className="components-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Views</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((comp) => (
                        <tr key={comp._id}>
                          <td className="comp-name">
                            <Link to={`/component/${comp.id}`}>{comp.name}</Link>
                          </td>
                          <td>{comp.category}</td>
                          <td className="center">{comp.viewCount}</td>
                          <td className="center">⭐ {comp.averageRating?.toFixed(1) || "0"}</td>
                          <td className="center">{comp.totalReviews || 0}</td>
                          <td className="actions">
                            <Link to={`/component/${comp.id}`} className="action-link">
                              View
                            </Link>
                            <Link to={`/edit-component/${comp.id}`} className="action-link edit">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>You haven't created any components yet.</p>
                  <Link to="/add-component" className="btn-add-component">
                    Create Your First Component
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="favorites-section">
              <h2>Favorite Components</h2>
              {favorites.length > 0 ? (
                <div className="components-grid">
                  {favorites.map((comp) => (
                    <Link
                      key={comp._id}
                      to={`/component/${comp.id}`}
                      className="component-card-mini"
                    >
                      <div className="card-image">
                        {comp.thumbnail ? (
                          <img src={comp.thumbnail} alt={comp.name} />
                        ) : (
                          <div className="placeholder">{comp.category}</div>
                        )}
                      </div>
                      <div className="card-info">
                        <h3>{comp.name}</h3>
                        <div className="card-meta">
                          <span className="views">👁️ {comp.viewCount}</span>
                          <span className="rating">⭐ {comp.averageRating?.toFixed(1) || "0"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You haven't favorited any components yet.</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="history-section">
              <h2>Submission History</h2>
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-header">
                        <span className={`status ${item.action}`}>{item.action}</span>
                        <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                      </div>
                      {item.reason && <p className="reason">{item.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No submission history yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
