import { useEffect, useState } from "react";
import { createDiscussion, fetchDiscussions, updateDiscussionStatus } from "@/services/discussionService";
import "./DiscussionThread.css";

function buildTree(items) {
  const map = new Map(items.map((item) => [item._id, { ...item, children: [] }]));
  const roots = [];

  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

export default function DiscussionThread({ componentId, isAuthenticated, currentUser }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchDiscussions(componentId).then((rows) => {
      if (active) {
        setItems(rows);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [componentId]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || posting) {
      return;
    }

    setPosting(true);
    try {
      const created = await createDiscussion(componentId, trimmed);
      setItems((prev) => [created, ...prev]);
      setMessage("");
    } finally {
      setPosting(false);
    }
  }

  async function handleReplySubmit(parentId) {
    const trimmed = replyText.trim();
    if (!trimmed || posting) {
      return;
    }

    setPosting(true);
    try {
      const created = await createDiscussion(componentId, trimmed, parentId);
      setItems((prev) => [created, ...prev]);
      setReplyText("");
      setReplyTo("");
    } finally {
      setPosting(false);
    }
  }

  async function handleHide(itemId) {
    await updateDiscussionStatus(componentId, itemId, "hidden");
    setItems((prev) => prev.filter((entry) => entry._id !== itemId));
  }

  const tree = buildTree(items);

  function canModerate(item) {
    if (!currentUser) return false;
    const isAdmin = String(currentUser.role || "").toLowerCase() === "admin";
    const isOwner = String(currentUser.id || "") === String(item.userId?._id || item.userId || "");
    return isAdmin || isOwner;
  }

  function renderNode(item, depth = 0) {
    return (
      <article className="discussion-item" key={item._id} style={{ marginLeft: `${Math.min(depth * 18, 54)}px` }}>
        <header>
          <strong>{item.userId?.fullName || "Community Member"}</strong>
          <time>{new Date(item.createdAt).toLocaleString()}</time>
        </header>
        <p>{item.message}</p>
        <div className="discussion-actions">
          {isAuthenticated ? (
            <button type="button" onClick={() => setReplyTo(replyTo === item._id ? "" : item._id)}>
              {replyTo === item._id ? "Cancel Reply" : "Reply"}
            </button>
          ) : null}
          {canModerate(item) ? (
            <button type="button" className="danger" onClick={() => handleHide(item._id)}>
              Hide
            </button>
          ) : null}
        </div>
        {replyTo === item._id ? (
          <div className="reply-box">
            <textarea
              rows={2}
              maxLength={4000}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Write a reply..."
            />
            <button type="button" onClick={() => handleReplySubmit(item._id)} disabled={!replyText.trim() || posting}>
              Post Reply
            </button>
          </div>
        ) : null}
        {item.children?.map((child) => renderNode(child, depth + 1))}
      </article>
    );
  }

  return (
    <section className="discussion-wrap" aria-label="Component discussion">
      <div className="discussion-head">
        <h3>Discussion Thread</h3>
        <span>{items.length} messages</span>
      </div>

      {isAuthenticated ? (
        <form className="discussion-form" onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Share feedback, ideas, or usage tips..."
          />
          <button type="submit" disabled={posting || !message.trim()}>
            {posting ? "Posting..." : "Post Message"}
          </button>
        </form>
      ) : (
        <p className="discussion-signin">Sign in to join the discussion.</p>
      )}

      {loading ? (
        <p className="discussion-empty">Loading discussion...</p>
      ) : items.length === 0 ? (
        <p className="discussion-empty">No messages yet. Start the thread.</p>
      ) : (
        <div className="discussion-list">{tree.map((item) => renderNode(item))}</div>
      )}
    </section>
  );
}
