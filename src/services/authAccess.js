const REGISTERED_USERS_KEY = "registeredUsers";

export function getAuthUser() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredUsers(users) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

export function registerUser({ fullName, email, phone, password, role }) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => String(user.email || "").toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const normalizedRole = role === "developer" ? "developer" : "user";

  const newUser = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role: normalizedRole,
    isVerifiedDeveloper: normalizedRole === "developer",
  };

  setStoredUsers([...users, newUser]);
  return newUser;
}

export function authenticateUser({ email, password }) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (item) =>
      String(item.email || "").toLowerCase() === normalizedEmail &&
      item.password === password
  );

  return user || null;
}

export function canAccessAddComponent(user) {
  if (!user) {
    return false;
  }

  const role = String(user.role || "").toLowerCase();
  const isVerifiedDeveloper = Boolean(user.isVerifiedDeveloper);
  return role === "admin" || role === "developer" || isVerifiedDeveloper;
}