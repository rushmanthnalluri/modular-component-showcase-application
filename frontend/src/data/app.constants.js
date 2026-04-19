const configuredAppName = String(
  import.meta.env.VITE_APP_NAME || "Modular Component Showcase Application"
).trim();

export const APP_INFO = {
  shortName: configuredAppName,
  fullName: configuredAppName,
  supportEmail: "rushmanth21@gmail.com",
  supportPhoneDisplay: "+91 99123 87093",
  supportPhoneRaw: "+919912387093",
  githubUrl: "https://github.com/rushmanthnalluri",
  githubHandle: "rushmanthnalluri",
  linkedInUrl: "https://www.linkedin.com/in/rushmanthnalluri/",
  linkedInHandle: "rushmanthnalluri",
};
