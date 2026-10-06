export let CHALLENGES = {};
export let DIAGNOSTIC = [];
export let STUDENTS = [];
export let STRUGGLE = [];

export function setChallenges(val) {
  CHALLENGES = val;
}
export function setDiagnostic(val) {
  DIAGNOSTIC = val;
}
export function setStudents(val) {
  STUDENTS = val;
}
export function setStruggle(val) {
  STRUGGLE = val;
}

export const LEVEL_META = {
  pemula: {
    label: "Pemula",
    color: "var(--pemula)",
    glow: "rgba(79,191,174,0.25)",
  },
  menengah: {
    label: "Menengah",
    color: "var(--menengah)",
    glow: "rgba(232,162,60,0.25)",
  },
  lanjut: {
    label: "Lanjut",
    color: "var(--lanjut)",
    glow: "rgba(185,140,224,0.25)",
  },
};

export let state = {
  user: null,
  profile: null,
  authMode: "login",
  authError: "",
  authInfo: "",
  authLoading: false,
  role: "siswa",
  view: "landing",
  showInfo: false,
  diagStep: 0,
  diagCorrect: 0,
  diagPicked: null,
  assignedLevel: null,
  activeLevel: null,
  openChallenge: null,
  challengeState: {},
  pickedOption: null,
  submitted: false,
};

export function key(level, idx) {
  return level + "-" + idx;
}

export function getCh(level, idx) {
  return (
    state.challengeState[key(level, idx)] || {
      completed: false,
      attempts: 0,
      hintIdx: -1,
    }
  );
}

export function setCh(level, idx, patch) {
  const k = key(level, idx);
  state.challengeState[k] = { ...getCh(level, idx), ...patch };
}

export function levelProgress(level) {
  const items = CHALLENGES[level].items;
  let done = 0;
  items.forEach((_, i) => {
    if (getCh(level, i).completed) done++;
  });
  return { done, total: items.length };
}

export function isUnlocked(level, idx) {
  if (idx === 0) return true;
  return getCh(level, idx - 1).completed;
}
