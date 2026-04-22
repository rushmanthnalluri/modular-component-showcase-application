import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  fetchSpringComponents,
  fetchSpringHealth,
  fetchSpringReviews,
  fetchSpringUsers,
} from "@/services/springService";
import "./SpringDemo.css";

const SpringDemo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({
    health: null,
    users: [],
    components: [],
    reviews: [],
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [health, users, components, reviews] = await Promise.all([
          fetchSpringHealth(),
          fetchSpringUsers(),
          fetchSpringComponents(),
          fetchSpringReviews(),
        ]);

        if (!active) {
          return;
        }

        setPayload({
          health,
          users: Array.isArray(users) ? users : [],
          components: Array.isArray(components) ? components : [],
          reviews: Array.isArray(reviews) ? reviews : [],
        });
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err?.message || "Failed to load Spring service data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Layout>
      <div className="spring-demo-page layout-container">
        <div className="spring-demo-header">
          <h1>Spring Service Demo</h1>
          <p>Live data fetched through the FastAPI gateway from the new Spring Boot microservice.</p>
        </div>

        {loading ? <p className="spring-demo-status">Loading Spring service data...</p> : null}
        {error ? <p className="spring-demo-error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <section className="spring-card">
              <h2>Health</h2>
              <pre>{JSON.stringify(payload.health, null, 2)}</pre>
            </section>

            <section className="spring-grid">
              <article className="spring-card">
                <h2>Users ({payload.users.length})</h2>
                <ul>
                  {payload.users.slice(0, 5).map((user) => (
                    <li key={user.userId}>{user.email} ({user.role})</li>
                  ))}
                </ul>
              </article>

              <article className="spring-card">
                <h2>Components ({payload.components.length})</h2>
                <ul>
                  {payload.components.slice(0, 5).map((component) => (
                    <li key={component.componentId}>{component.name}</li>
                  ))}
                </ul>
              </article>

              <article className="spring-card">
                <h2>Reviews ({payload.reviews.length})</h2>
                <ul>
                  {payload.reviews.slice(0, 5).map((review) => (
                    <li key={review.reviewId}>{review.comment}</li>
                  ))}
                </ul>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default SpringDemo;
