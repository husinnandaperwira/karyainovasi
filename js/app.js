import { DIAGNOSTIC, CHALLENGES, state, getCh, setCh } from "./store.js";
import { saveProgress, saveDiagnosticResult } from "./dataService.js";
import { handleLogin, handleSignup, handleLogout, initAuth, handleForgotPassword, handleUpdatePassword, listenAuthChanges } from "./auth.js";
import { render } from "./views.js";

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "toggleInfo") {
    state.showInfo = !state.showInfo;
  } else if (action === "togglePwd") {
    const input = document.getElementById(el.dataset.target);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    el.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
    return;
  } else if (action === "switchAuthMode") {
    state.authMode = el.dataset.mode;
    state.authError = "";
    state.authInfo = "";
  } else if (action === "doForgotPassword") {
    const email = document.getElementById("authEmail").value;
    state.authLoading = true;
    render();
    handleForgotPassword(email).finally(() => {
      state.authLoading = false;
      render();
    });
    return;
  } else if (action === "doUpdatePassword") {
    const newPassword = document.getElementById("authNewPassword").value;
    state.authLoading = true;
    render();
    handleUpdatePassword(newPassword).finally(() => {
      state.authLoading = false;
      render();
    });
    return;
  } else if (action === "doLogin") {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    state.authLoading = true;
    render();
    handleLogin(email, password).finally(() => {
      state.authLoading = false;
      render();
    });
    return;
  } else if (action === "doSignup") {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    const fullName = document.getElementById("authName").value;
    const role = document.getElementById("authRole").value;
    const kelas = role === "siswa" ? document.getElementById("authKelas").value : null;
    state.authLoading = true;
    render();
    handleSignup(email, password, fullName, role, kelas).finally(() => {
      state.authLoading = false;
      render();
    });
    return;
  } else if (action === "logout") {
    handleLogout().then(render);
    return;
  } else if (action === "startDiagnostic") {
    state.view = "diagnostic";
    state.diagStep = 0;
    state.diagCorrect = 0;
    state.diagPicked = null;
    state.submitted = false;
  } else if (action === "pickDiag") {
    if (state.submitted) return;
    const idx = parseInt(el.dataset.idx);
    state.diagPicked = idx;
    state.submitted = true;
    if (idx === DIAGNOSTIC[state.diagStep].correct) state.diagCorrect++;
  } else if (action === "nextDiag") {
    if (state.diagStep + 1 < DIAGNOSTIC.length) {
      state.diagStep++;
      state.diagPicked = null;
      state.submitted = false;
    } else {
      const c = state.diagCorrect;
      state.assignedLevel = c >= 3 ? "lanjut" : c === 2 ? "menengah" : "pemula";
      state.view = "result";
      saveDiagnosticResult(state.assignedLevel, c);
    }
  } else if (action === "goTrack") {
    state.activeLevel = el.dataset.level;
    state.view = "track";
    state.openChallenge = null;
  } else if (action === "switchLevel") {
    state.activeLevel = el.dataset.level;
    state.openChallenge = null;
  } else if (action === "openChallenge") {
    const level = el.dataset.level,
      idx = parseInt(el.dataset.idx);
    state.openChallenge = { level, idx };
    state.pickedOption = null;
    state.submitted = false;
  } else if (action === "lockedNote") {
    // no-op, node terkunci
  } else if (action === "pickChallenge") {
    if (state.submitted) return;
    state.pickedOption = parseInt(el.dataset.idx);
  } else if (action === "submitChallenge") {
    const { level, idx } = state.openChallenge;
    const item = CHALLENGES[level].items[idx];
    const st = getCh(level, idx);
    const attempts = st.attempts + 1;
    state.submitted = true;
    if (state.pickedOption === item.correct) {
      setCh(level, idx, { completed: true, attempts });
    } else {
      const hintIdx = Math.min(attempts - 1, item.hints.length - 1);
      setCh(level, idx, { attempts, hintIdx });
    }
    saveProgress(level, idx, getCh(level, idx));
  } else if (action === "retryChallenge") {
    state.pickedOption = null;
    state.submitted = false;
  } else if (action === "closeChallenge") {
    state.openChallenge = null;
  }

  render();
});

render();
initAuth(render);
listenAuthChanges(render);
