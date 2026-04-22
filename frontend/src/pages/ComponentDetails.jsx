import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CodeBlock from "@/components/common/CodeBlock";
import StarRating from "@/components/common/StarRating";
import ComponentPlayground from "@/components/search/ComponentPlayground";
import ResponsivePreview from "@/components/search/ResponsivePreview";

import Layout from "@/components/layout/Layout";

import { deleteComponent, fetchComponentById, getShowcaseDemo } from "@/services/componentsStore";
import { subscribeToAuthUser } from "@/services/authAccess";
import {
  createComponentDiscussion,
  createComponentReview,
  getComponentRatings,
  listComponentDiscussions,
  listComponentReviews,
  markReviewHelpful,
  moderateComponentDiscussion,
  submitComponentRating,
} from "@/services/componentEngagementService";
import { useToast } from "@/use-toast";
import "./ComponentDetails.css";

function parseDemoControlValue(control, rawValue) {
  if (rawValue === null) {
    return control.defaultValue;
  }

  if (control.type === "checkbox") {
    return rawValue === "true";
  }

  if (control.type === "number" || control.type === "range") {
    const parsed = Number(rawValue);
    const fallback = Number(control.defaultValue);
    const resolvedValue = Number.isFinite(parsed) ? parsed : fallback;
    const minimum = Number(control.min);
    const maximum = Number(control.max);

    if (Number.isFinite(minimum) && resolvedValue < minimum) {
      return minimum;
    }

    if (Number.isFinite(maximum) && resolvedValue > maximum) {
      return maximum;
    }

    return resolvedValue;
  }

  return rawValue;
}

function serializeDemoControlValue(control, value) {
  if (control.type === "checkbox") {
    return value ? "true" : "false";
  }

  if (control.type === "number" || control.type === "range") {
    const numericValue = Number(value);
    return String(Number.isFinite(numericValue) ? numericValue : Number(control.defaultValue));
  }

  return String(value ?? "");
}

function readDemoValuesFromSearchParams(controls, searchParams) {
  return controls.reduce((accumulator, control) => {
    accumulator[control.id] = parseDemoControlValue(
      control,
      searchParams.get(`demo_${control.id}`)
    );
    return accumulator;
  }, {});
}

function areObjectsEqual(leftObject, rightObject) {
  const keySet = new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]);

  for (const key of keySet) {
    if (leftObject[key] !== rightObject[key]) {
      return false;
    }
  }

  return true;
}

function toPascalIdentifier(value) {
  const normalized = String(value || "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join("");

  return normalized || "ComponentDemo";
}

function formatGeneratedValue(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value ?? null);
}

function buildGeneratedDemoCode(componentName, controls, values) {
  const componentIdentifier = toPascalIdentifier(componentName);
  const configIdentifier = `${componentIdentifier}Props`;
  const configLines = controls.map((control) => {
    const resolvedValue = Object.prototype.hasOwnProperty.call(values, control.id)
      ? values[control.id]
      : control.defaultValue;
    return `  ${control.id}: ${formatGeneratedValue(resolvedValue)},`;
  });

  return `const ${configIdentifier} = {
${configLines.join("\n")}
};

export default function Example() {
  return <${componentIdentifier} {...${configIdentifier}} />;
}`;
}

const ComponentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState("jsx");
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ratingsSummary, setRatingsSummary] = useState({ average: 0, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);
  const { toast } = useToast();

  useEffect(() => subscribeToAuthUser(setAuthUser), []);

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      setIsLoading(true);
      const component = await fetchComponentById(id);

      if (isMounted) {
        setItem(component);
        setIsLoading(false);
      }
    };

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadEngagement = async () => {
      if (!item?.id) {
        setRatingsSummary({ average: 0, total: 0 });
        setReviews([]);
        setDiscussions([]);
        setEngagementLoading(false);
        return;
      }

      setEngagementLoading(true);
      try {
        const [ratingData, reviewData, discussionData] = await Promise.all([
          getComponentRatings(item.id),
          listComponentReviews(item.id, { sort: "helpful", page: 1, limit: 8 }),
          listComponentDiscussions(item.id),
        ]);

        if (!active) {
          return;
        }

        setRatingsSummary({ average: ratingData.average, total: ratingData.total });
        setReviews(reviewData.reviews);
        setDiscussions(discussionData);
      } catch (error) {
        if (active) {
          const isMissingComponent = String(error?.message || "")
            .toLowerCase()
            .includes("component not found");
          if (isMissingComponent) {
            setRatingsSummary({ average: 0, total: 0 });
            setReviews([]);
            setDiscussions([]);
            return;
          }
          toast({
            title: "Engagement data unavailable",
            description: "Some ratings, reviews, or discussions could not be loaded.",
          });
        }
      } finally {
        if (active) {
          setEngagementLoading(false);
        }
      }
    };

    loadEngagement();
    return () => {
      active = false;
    };
  }, [item?.id, toast]);

  const demoDefinition = useMemo(() => getShowcaseDemo(item?.id || ""), [item?.id]);
  const demoControls = useMemo(() => demoDefinition?.controls ?? [], [demoDefinition]);
  const hasGeneratedTab = demoControls.length > 0;
  const hasCssCode = Boolean(item?.code?.css);
  const demoValues = useMemo(() => {
    if (!hasGeneratedTab) {
      return {};
    }
    return readDemoValuesFromSearchParams(demoControls, searchParams);
  }, [demoControls, hasGeneratedTab, searchParams]);
  const tabOrder = useMemo(() => {
    const tabs = ["jsx"];
    if (hasCssCode) {
      tabs.push("css");
    }
    if (hasGeneratedTab) {
      tabs.push("generated");
    }
    return tabs;
  }, [hasCssCode, hasGeneratedTab]);
  const activeTab = useMemo(() => {
    if (selectedTab === "generated" && !hasGeneratedTab) {
      return "jsx";
    }
    if (selectedTab === "css" && !hasCssCode) {
      return "jsx";
    }
    return selectedTab;
  }, [hasCssCode, hasGeneratedTab, selectedTab]);

  const generatedDemoCode = useMemo(() => {
    if (!item || !hasGeneratedTab) {
      return "// Generated code is available for interactive demos.";
    }

    return buildGeneratedDemoCode(item.name, demoControls, demoValues);
  }, [demoControls, demoValues, hasGeneratedTab, item]);

  const previewModeLabel = hasGeneratedTab ? "Interactive Demo" : "Code Preview";
  const activeTabId = `component-tab-${activeTab}`;
  const activePanelId = `component-panel-${activeTab}`;
  const previewSources = useMemo(
    () => [item?.screenshot, item?.thumbnail].filter(Boolean),
    [item?.screenshot, item?.thumbnail]
  );

  const handleDemoValuesChange = useCallback((nextValues) => {
    if (!hasGeneratedTab) {
      return;
    }

    if (areObjectsEqual(demoValues, nextValues)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    for (const key of [...nextParams.keys()]) {
      if (key.startsWith("demo_")) {
        nextParams.delete(key);
      }
    }

    demoControls.forEach((control) => {
      const serializedValue = serializeDemoControlValue(control, nextValues[control.id]);
      const serializedDefault = serializeDemoControlValue(control, control.defaultValue);

      if (serializedValue !== serializedDefault) {
        nextParams.set(`demo_${control.id}`, serializedValue);
      }
    });

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [demoControls, demoValues, hasGeneratedTab, searchParams, setSearchParams]);

  const handleTabKeyDown = (event, currentTab) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % tabOrder.length
        : (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    setSelectedTab(tabOrder[nextIndex]);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteComponent(item.id);
      navigate("/", { replace: true });
    } catch {
      setIsDeleting(false);
    }
  };

  const canDelete = Boolean(
    authUser && item && (authUser.id === item.createdBy || authUser.role === "admin")
  );
  const canModerateDiscussion = String(authUser?.role || "").toLowerCase() === "admin";

  const refreshEngagement = async () => {
    if (!item?.id) {
      return;
    }

    const [ratingData, reviewData, discussionData] = await Promise.all([
      getComponentRatings(item.id),
      listComponentReviews(item.id, { sort: "helpful", page: 1, limit: 8 }),
      listComponentDiscussions(item.id),
    ]);
    setRatingsSummary({ average: ratingData.average, total: ratingData.total });
    setReviews(reviewData.reviews);
    setDiscussions(discussionData);
  };

  const handleSubmitRating = async () => {
    if (!authUser) {
      toast({ title: "Login required", description: "Sign in to submit a rating." });
      return;
    }

    setIsSubmittingRating(true);
    try {
      await submitComponentRating(item.id, ratingInput);
      await refreshEngagement();
      toast({ title: "Rating saved", description: "Your rating has been recorded." });
    } catch {
      toast({ title: "Rating failed", description: "Unable to save your rating." });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!authUser) {
      toast({ title: "Login required", description: "Sign in to submit a review." });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createComponentReview(item.id, {
        rating: ratingInput,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewTitle("");
      setReviewComment("");
      await refreshEngagement();
      toast({ title: "Review posted", description: "Your review is now visible." });
    } catch {
      toast({ title: "Review failed", description: "Unable to post your review." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitDiscussion = async (event) => {
    event.preventDefault();
    if (!authUser) {
      toast({ title: "Login required", description: "Sign in to join discussion." });
      return;
    }

    setIsSubmittingDiscussion(true);
    try {
      await createComponentDiscussion(item.id, { message: discussionMessage });
      setDiscussionMessage("");
      await refreshEngagement();
      toast({ title: "Discussion posted", description: "Message added to thread." });
    } catch {
      toast({ title: "Discussion failed", description: "Unable to post message." });
    } finally {
      setIsSubmittingDiscussion(false);
    }
  };

  const handleHelpfulVote = async (reviewId, helpful) => {
    if (!authUser) {
      toast({ title: "Login required", description: "Sign in to vote on reviews." });
      return;
    }

    try {
      await markReviewHelpful(item.id, reviewId, helpful);
      await refreshEngagement();
    } catch {
      toast({ title: "Vote failed", description: "Unable to register your vote." });
    }
  };

  const handleDiscussionStatus = async (discussionId, status) => {
    try {
      await moderateComponentDiscussion(item.id, discussionId, status);
      await refreshEngagement();
    } catch {
      toast({ title: "Update failed", description: "Unable to update discussion status." });
    }
  };

  const useCaseText = item?.useCase || `Use this ${item?.name || "component"} in ${item?.category || "UI"} workflows where configurable behavior and reusable styling are required.`;
  const accessibilityText = item?.accessibilityNotes || "Keyboard interaction, ARIA labels, and visible focus states should be validated for this component before production rollout.";
  const responsiveText = item?.responsiveNotes || "This component supports responsive rendering and should be tested across small, medium, and large viewport breakpoints.";

  if (!item) {
    if (isLoading) {
      return (
        <Layout>
          <div className="layout-container details-state">
            <h2>Loading component...</h2>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="layout-container details-state">
          <h2>Component not found</h2>
          <p>The component you are looking for does not exist.</p>
          <Link className="back-btn" to="/">
            Go back home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="layout-container details-page">
        <Link to="/" className="back-btn">
          Back to Components
        </Link>

        <div className="details-head">
          <h1>{item.name}</h1>
          <span className="component-tag">{item.category}</span>
          <span
            className={hasGeneratedTab ? "component-mode-badge component-mode-badge--interactive" : "component-mode-badge"}
          >
            {previewModeLabel}
          </span>
          {canDelete && (
            <button
              type="button"
              className="component-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Component"}
            </button>
          )}
        </div>
        <p className="details-desc">{item.description}</p>

        <div className="details-grid">
          <div className="preview-box">
            <div className="preview-head">
              <span>Live Interactive Demo</span>
            </div>
            <div className={hasGeneratedTab ? "preview-body preview-body--playground" : "preview-body"}>
              <ResponsivePreview>
                <ComponentPlayground
                  key={item.id}
                  definition={demoDefinition}
                  controls={demoControls}
                  componentName={item.name}
                  fallbackSources={previewSources}
                  values={demoValues}
                  onValuesChange={handleDemoValuesChange}
                />
              </ResponsivePreview>
            </div>
          </div>

          <div className="code-pane">
            <div className="code-tabs" role="tablist" aria-label="Component source code tabs">
                <button
                  type="button"
                  className={activeTab === "jsx" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setSelectedTab("jsx")}
                aria-label="Show JSX code tab"
                role="tab"
                id="component-tab-jsx"
                aria-selected={activeTab === "jsx"}
                aria-controls="component-panel-jsx"
                tabIndex={activeTab === "jsx" ? 0 : -1}
                onKeyDown={(event) => handleTabKeyDown(event, "jsx")}
              >
                JSX
              </button>
              {hasCssCode ? (
                <button
                  type="button"
                  className={activeTab === "css" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setSelectedTab("css")}
                  aria-label="Show CSS code tab"
                  role="tab"
                  id="component-tab-css"
                  aria-selected={activeTab === "css"}
                  aria-controls="component-panel-css"
                  tabIndex={activeTab === "css" ? 0 : -1}
                  onKeyDown={(event) => handleTabKeyDown(event, "css")}
                >
                  CSS
                </button>
              ) : null}
              {hasGeneratedTab ? (
                <button
                  type="button"
                  className={activeTab === "generated" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setSelectedTab("generated")}
                  aria-label="Show generated code tab"
                  role="tab"
                  id="component-tab-generated"
                  aria-selected={activeTab === "generated"}
                  aria-controls="component-panel-generated"
                  tabIndex={activeTab === "generated" ? 0 : -1}
                  onKeyDown={(event) => handleTabKeyDown(event, "generated")}
                >
                  Generated
                </button>
              ) : null}
            </div>

            <div role="tabpanel" id={activePanelId} aria-labelledby={activeTabId}>
              {activeTab === "jsx" ? (
                <>
                  {/* Declarative tab rendering: active state decides which code block is shown. */}
                  <CodeBlock code={item.code.jsx} language="jsx" />
                </>
              ) : activeTab === "css" ? (
                <CodeBlock code={item.code.css || ""} language="css" />
              ) : (
                <CodeBlock code={generatedDemoCode} language="jsx" />
              )}
            </div>
          </div>
        </div>

        <section className="details-notes" aria-label="Component documentation notes">
          <h2>Documentation Notes</h2>
          <div className="details-notes-grid">
            <article>
              <h3>Use Case</h3>
              <p>{useCaseText}</p>
            </article>
            <article>
              <h3>Accessibility Notes</h3>
              <p>{accessibilityText}</p>
            </article>
            <article>
              <h3>Responsive Behavior</h3>
              <p>{responsiveText}</p>
            </article>
          </div>
        </section>

        <section className="details-engagement" aria-label="Component engagement">
          <h2>Ratings, Reviews, and Discussion</h2>

          <div className="details-engagement-summary">
            <div className="details-engagement-summary-rating">
              <span className="details-summary-label">Average Rating</span>
              <div className="details-summary-rating-row">
                <StarRating rating={ratingsSummary.average} showValue={false} className="details-rating" />
                <strong className="details-summary-value">{Number(ratingsSummary.average || 0).toFixed(1)}</strong>
              </div>
            </div>
            <div className="details-engagement-summary-metric">
              <span className="details-summary-label">Total Ratings</span>
              <strong className="details-summary-value">{Number(ratingsSummary.total || 0)}</strong>
            </div>
            <div className="details-engagement-summary-metric">
              <span className="details-summary-label">Total Reviews</span>
              <strong className="details-summary-value">{reviews.length}</strong>
            </div>
            <div className="details-engagement-summary-metric">
              <span className="details-summary-label">Discussion Threads</span>
              <strong className="details-summary-value">{discussions.length}</strong>
            </div>
          </div>

          <div className="details-engagement-actions">
            <label>Your rating</label>
            <div className="details-rating-picker" role="radiogroup" aria-label="Select your rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= ratingInput ? "details-rating-star active" : "details-rating-star"}
                  onClick={() => setRatingInput(value)}
                  role="radio"
                  aria-checked={value === ratingInput}
                  aria-label={`Rate ${value} out of 5`}
                >
                  ★
                </button>
              ))}
              <span className="details-rating-value">{ratingInput} / 5</span>
            </div>
            <button
              type="button"
              className="filter-btn"
              onClick={handleSubmitRating}
              disabled={isSubmittingRating || engagementLoading}
            >
              {isSubmittingRating ? "Saving..." : "Submit Rating"}
            </button>
          </div>

          <div className="details-engagement-grid">
            <article className="details-engagement-card">
              <h3>Post Review</h3>
              <form onSubmit={handleSubmitReview} className="details-engagement-form">
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Review title"
                  maxLength={80}
                />
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Share your experience"
                  rows={4}
                  required
                />
                <button type="submit" className="filter-btn active" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Posting..." : "Post Review"}
                </button>
              </form>

              <div className="details-engagement-list">
                {reviews.map((review) => (
                  <div className="details-engagement-item" key={review._id || review.id}>
                    <strong>{review.title || "Review"}</strong>
                    <p>{review.comment}</p>
                    <div className="details-engagement-item-meta">
                      <StarRating rating={review.rating} className="details-rating" />
                      <span>Helpful: {Number(review.helpful || 0)}</span>
                      <span>Unhelpful: {Number(review.unhelpful || 0)}</span>
                    </div>
                    <div className="details-engagement-item-actions">
                      <button type="button" onClick={() => handleHelpfulVote(review._id || review.id, true)}>
                        Helpful
                      </button>
                      <button type="button" onClick={() => handleHelpfulVote(review._id || review.id, false)}>
                        Unhelpful
                      </button>
                    </div>
                  </div>
                ))}
                {!engagementLoading && reviews.length === 0 ? (
                  <div className="details-empty-state">
                    <strong>Be the first to review this component.</strong>
                    <span>Your feedback helps other builders decide what to try next.</span>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="details-engagement-card">
              <h3>Discussion</h3>
              <form onSubmit={handleSubmitDiscussion} className="details-engagement-form">
                <textarea
                  value={discussionMessage}
                  onChange={(event) => setDiscussionMessage(event.target.value)}
                  placeholder="Ask a question or add implementation notes"
                  rows={4}
                  required
                />
                <button type="submit" className="filter-btn active" disabled={isSubmittingDiscussion}>
                  {isSubmittingDiscussion ? "Posting..." : "Post Message"}
                </button>
              </form>

              <div className="details-engagement-list">
                {discussions.map((discussion) => (
                  <div className="details-engagement-item" key={discussion._id || discussion.id}>
                    <p>{discussion.message}</p>
                    <div className="details-engagement-item-meta">
                      <span>Status: {discussion.status || "active"}</span>
                    </div>
                    {canModerateDiscussion ? (
                      <div className="details-engagement-item-actions">
                        <button
                          type="button"
                          onClick={() => handleDiscussionStatus(discussion._id || discussion.id, "active")}
                        >
                          Set Active
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDiscussionStatus(discussion._id || discussion.id, "hidden")}
                        >
                          Hide
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {!engagementLoading && discussions.length === 0 ? (
                  <div className="details-empty-state">
                    <strong>Start the discussion.</strong>
                    <span>Share implementation notes, questions, or ideas for improvement.</span>
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </div>

    </Layout>
  );
};

export default ComponentDetail;
