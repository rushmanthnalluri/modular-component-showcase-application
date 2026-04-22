import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/services/userProfileService";
import { useToast } from "@/use-toast";
import "./UserDashboard.css";

const emptySocialLinks = { github: "", twitter: "", portfolio: "" };
const emptyEmailPreferences = { newComponents: true, reviewComments: true, newsletters: false };
const MAX_AVATAR_FILE_BYTES = 1_500_000;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

const UserDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    socialLinks: emptySocialLinks,
    emailPreferences: emptyEmailPreferences,
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUserProfile();
      if (!user) {
        throw new Error("Unable to load profile.");
      }

      setForm({
        fullName: String(user.fullName || ""),
        email: String(user.email || ""),
        phone: String(user.phone || ""),
        bio: String(user.bio || ""),
        avatarUrl: String(user.avatarUrl || ""),
        socialLinks: {
          github: String(user.socialLinks?.github || ""),
          twitter: String(user.socialLinks?.twitter || ""),
          portfolio: String(user.socialLinks?.portfolio || ""),
        },
        emailPreferences: {
          newComponents:
            user.emailPreferences?.newComponents === undefined
              ? true
              : Boolean(user.emailPreferences?.newComponents),
          reviewComments:
            user.emailPreferences?.reviewComments === undefined
              ? true
              : Boolean(user.emailPreferences?.reviewComments),
          newsletters: Boolean(user.emailPreferences?.newsletters),
        },
      });
      setAvatarFileName("");
    } catch (error) {
      toast({
        title: "Unable to load profile",
        description: error?.message || "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(String(file.type || "").toLowerCase())) {
      toast({
        title: "Unsupported avatar format",
        description: "Please upload PNG, JPG, WEBP, or GIF image files.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      toast({
        title: "Avatar image too large",
        description: "Please upload an image smaller than 1.5 MB.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: String(reader.result || "") }));
      setAvatarFileName(file.name);
    };
    reader.onerror = () => {
      toast({
        title: "Avatar upload failed",
        description: "Could not read the selected image. Please try another file.",
      });
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name.startsWith("socialLinks.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [key]: value,
        },
      }));
      return;
    }

    if (name.startsWith("emailPreferences.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        emailPreferences: {
          ...prev.emailPreferences,
          [key]: type === "checkbox" ? checked : Boolean(value),
        },
      }));
      return;
    }

    if (name === "phone") {
      setForm((prev) => ({
        ...prev,
        phone: value.replace(/\D/g, "").slice(0, 15),
      }));
      return;
    }

    if (name === "email") {
      setForm((prev) => ({
        ...prev,
        email: value.trim().toLowerCase(),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUserProfile({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        socialLinks: form.socialLinks,
        emailPreferences: form.emailPreferences,
      });

      if (updatedUser) {
        setForm((prev) => ({
          ...prev,
          fullName: String(updatedUser.fullName || ""),
          email: String(updatedUser.email || ""),
          phone: String(updatedUser.phone || ""),
          bio: String(updatedUser.bio || ""),
          avatarUrl: String(updatedUser.avatarUrl || ""),
        }));
      }

      setAvatarFileName("");
      toast({
        title: "Profile updated",
        description: "Your profile was saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to save profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="layout-container user-dashboard-page">
        <div className="user-dashboard-header">
          <h1>User Dashboard</h1>
          <p>View and update your profile settings.</p>
        </div>

        {isLoading ? (
          <div className="user-dashboard-state">Loading your profile...</div>
        ) : (
          <form className="user-dashboard-form" onSubmit={handleSubmit}>
            <div className="user-dashboard-grid">
              <div className="user-dashboard-field">
                <label htmlFor="user-full-name">Full Name</label>
                <input
                  id="user-full-name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="user-dashboard-field">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="user-dashboard-field">
                <label htmlFor="user-phone">Phone</label>
                <input
                  id="user-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone"
                />
              </div>
            </div>

            <div className="user-dashboard-field">
              <label htmlFor="user-bio">Bio</label>
              <textarea
                id="user-bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={500}
                placeholder="Tell us about yourself"
              />
            </div>

            <div className="user-dashboard-profile-grid">
              <div className="user-dashboard-field user-dashboard-avatar-field">
                <div className="user-dashboard-avatar-preview" aria-live="polite">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Current avatar preview" />
                  ) : (
                    <div className="user-dashboard-avatar-placeholder">{(form.fullName || "U").slice(0, 1).toUpperCase()}</div>
                  )}
                </div>
                <label htmlFor="user-avatar-file" className="user-dashboard-upload-label">
                  Upload avatar image
                </label>
                <input
                  id="user-avatar-file"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  className="user-dashboard-file"
                />
                {avatarFileName ? <small className="user-dashboard-note">Selected: {avatarFileName}</small> : null}
                <small className="user-dashboard-note">Upload PNG, JPG, WEBP, or GIF up to 1.5 MB. A new image replaces the current profile photo.</small>
              </div>

              <div className="user-dashboard-social-grid">
                <div className="user-dashboard-field">
                  <label htmlFor="user-github">GitHub URL</label>
                  <input
                    id="user-github"
                    type="url"
                    name="socialLinks.github"
                    value={form.socialLinks.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="user-dashboard-field">
                  <label htmlFor="user-twitter">Twitter URL</label>
                  <input
                    id="user-twitter"
                    type="url"
                    name="socialLinks.twitter"
                    value={form.socialLinks.twitter}
                    onChange={handleChange}
                    placeholder="https://x.com/username"
                  />
                </div>
                <div className="user-dashboard-field">
                  <label htmlFor="user-portfolio">Portfolio URL</label>
                  <input
                    id="user-portfolio"
                    type="url"
                    name="socialLinks.portfolio"
                    value={form.socialLinks.portfolio}
                    onChange={handleChange}
                    placeholder="https://portfolio.example.com"
                  />
                </div>
              </div>
            </div>

            <div className="user-dashboard-checkboxes">
              <label htmlFor="user-pref-new-components">
                <input
                  id="user-pref-new-components"
                  type="checkbox"
                  name="emailPreferences.newComponents"
                  checked={form.emailPreferences.newComponents}
                  onChange={handleChange}
                />
                Email me about new components
              </label>
              <label htmlFor="user-pref-review-comments">
                <input
                  id="user-pref-review-comments"
                  type="checkbox"
                  name="emailPreferences.reviewComments"
                  checked={form.emailPreferences.reviewComments}
                  onChange={handleChange}
                />
                Email me about review comments
              </label>
              <label htmlFor="user-pref-newsletters">
                <input
                  id="user-pref-newsletters"
                  type="checkbox"
                  name="emailPreferences.newsletters"
                  checked={form.emailPreferences.newsletters}
                  onChange={handleChange}
                />
                Subscribe to newsletter
              </label>
            </div>

            <div className="user-dashboard-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
