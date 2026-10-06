import { sb } from "./supabaseClient.js";
import { state } from "./store.js";
import { loadContent, loadMyProgress, loadTeacherData } from "./dataService.js";

export async function loadProfile(userId) {
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  state.profile = data;
  if (data) state.role = data.role;
}

async function loadRoleData() {
  await loadContent();
  if (state.role === "guru") {
    await loadTeacherData();
  } else {
    await loadMyProgress();
  }
}

export async function initAuth(render) {
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session) {
    state.user = session.user;
    await loadProfile(session.user.id);
    await loadRoleData();
  }
  render();
}

export async function handleSignup(email, password, fullName, role, kelas) {
  state.authError = "";
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, kelas } },
  });
  if (error) {
    state.authError = error.message;
    return;
  }
  state.user = data.user;
  if (data.user) await loadProfile(data.user.id);
  await loadRoleData();
}

export async function handleLogin(email, password) {
  state.authError = "";
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    state.authError = error.message;
    return;
  }
  state.user = data.user;
  await loadProfile(data.user.id);
  await loadRoleData();
}

export async function handleLogout() {
  await sb.auth.signOut();
  state.user = null;
  state.profile = null;
  state.view = "landing";
}
