import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getTutorialPosts } from "@/services/contentService";
import "./Tutorials.css";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSimpleMarkdown(source) {
  const safe = escapeHtml(source);

  return String(safe)
    .replace(/^###\s(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^-\s(.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<h\d|<li|<\/p>)(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
}

export default function Tutorials() {
  const { authUser } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let active = true;
    getTutorialPosts().then((rows) => {
      if (active) {
        setPosts(rows);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const isAdmin = String(authUser?.role || "").toLowerCase() === "admin";

  return (
    <Layout>
      <div className="layout-container tutorials-page">
        <header>
          <h1>Markdown Tutorials & Blog</h1>
          <p>Guides, patterns, and release notes for component builders.</p>
          {isAdmin ? (
            <Link className="tutorial-manage-link" to="/tutorials/manage">
              Manage Tutorials
            </Link>
          ) : null}
        </header>

        <div className="tutorials-readable-list">
          {posts.map((post) => (
            <article key={post.slug} className="tutorial-readable-item">
              <h2>{post.title}</h2>
              {post.summary ? <p className="tutorial-summary">{post.summary}</p> : null}
              <div
                className="tutorial-body"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(post.markdown || "") }}
              />
            </article>
          ))}
          {posts.length === 0 ? (
            <article className="tutorial-readable-item">
              <h2>No Tutorials Available</h2>
              <p>Tutorial content will appear here once published.</p>
            </article>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
