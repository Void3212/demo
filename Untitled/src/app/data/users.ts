export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage: string | null;
  role: UserRole;
  createdAt: string;
}

const USERS_STORAGE_KEY = "chillingan_users";
const AUTH_USER_STORAGE_KEY = "chillingan_current_user";

const DEFAULT_ADMIN_USER: User = {
  id: "admin-0001",
  name: "Chillingan Admin",
  email: "admin@chillingan.com",
  password: "admin123",
  phone: "0000000000",
  address: "Chillingan HQ",
  profileImage: null,
  role: "admin",
  createdAt: new Date().toISOString(),
};

function readUsers(): User[] {
  if (typeof window === "undefined") {
    return [DEFAULT_ADMIN_USER];
  }

  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN_USER]));
    return [DEFAULT_ADMIN_USER];
  }

  try {
    const parsed = JSON.parse(raw) as User[];
    if (!Array.isArray(parsed) || parsed.some((user) => typeof user !== "object")) {
      throw new Error("Invalid user data");
    }
    return parsed;
  } catch {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN_USER]));
    return [DEFAULT_ADMIN_USER];
  }
}

function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
  return readUsers();
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function setCurrentUser(user: User) {
  if (typeof window === "undefined") return;

  const authUser = {
    ...user,
    profileImage: null,
  };

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser));
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage: string | null;
}

export function registerUser(input: RegisterInput): User {
  const users = readUsers();
  const existing = users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    phone: input.phone.trim(),
    address: input.address.trim(),
    profileImage: input.profileImage,
    role: "customer",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function updateUser(updated: User): User {
  const users = readUsers();
  const updatedUsers = users.map((user) => (user.id === updated.id ? updated : user));
  if (!updatedUsers.some((user) => user.id === updated.id)) {
    updatedUsers.push(updated);
  }

  writeUsers(updatedUsers);

  const current = getCurrentUser();
  if (current?.id === updated.id) {
    setCurrentUser(updated);
  }

  return updated;
}

export function loginUser(email: string, password: string): User {
  const users = readUsers();
  const match = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (!match || match.password !== password) {
    throw new Error("Invalid email or password.");
  }

  setCurrentUser(match);
  return match;
}
