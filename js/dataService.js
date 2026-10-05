import { sb } from "./supabaseClient.js";
import {
  state,
  key,
  LEVEL_META,
  setChallenges,
  setDiagnostic,
  setStudents,
  setStruggle,
  CHALLENGES,
} from "./store.js";

export async function loadContent() {
  const { data: chRows } = await sb
    .from("challenges")
    .select("*")
    .order("level")
    .order("order_index");
  const { data: diagRows } = await sb
    .from("diagnostic_questions")
    .select("*")
    .order("order_index");
  const grouped = { pemula: [], menengah: [], lanjut: [] };
  (chRows || []).forEach((r) => {
    grouped[r.level].push({
      title: r.title,
      code: r.code_snippet,
      q: r.question,
      options: r.options,
      correct: r.correct_index,
      hints: r.hints || [],
    });
  });
  const challenges = {};
  Object.keys(LEVEL_META).forEach((k) => {
    challenges[k] = { ...LEVEL_META[k], key: k, items: grouped[k] };
  });
  setChallenges(challenges);
  setDiagnostic(
    (diagRows || []).map((r) => ({
      code: r.code_snippet,
      q: r.question,
      options: r.options,
      correct: r.correct_index,
    })),
  );
}

export async function loadMyProgress() {
  if (!state.user) return;
  const { data: prog } = await sb
    .from("student_progress")
    .select("*")
    .eq("user_id", state.user.id);
  state.challengeState = {};
  (prog || []).forEach((p) => {
    state.challengeState[key(p.level, p.challenge_idx)] = {
      completed: p.completed,
      attempts: p.attempts,
      hintIdx: p.hint_idx,
    };
  });
  const { data: dres } = await sb
    .from("diagnostic_results")
    .select("*")
    .eq("user_id", state.user.id)
    .maybeSingle();
  if (dres) {
    state.assignedLevel = dres.assigned_level;
    state.view = "result";
  }
}

export async function saveProgress(level, idx, patch) {
  if (!state.user) return;
  await sb.from("student_progress").upsert(
    {
      user_id: state.user.id,
      level,
      challenge_idx: idx,
      completed: patch.completed ?? false,
      attempts: patch.attempts ?? 0,
      hint_idx: patch.hintIdx ?? -1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,level,challenge_idx" },
  );
}

export async function saveDiagnosticResult(level, score) {
  if (!state.user) return;
  await sb
    .from("diagnostic_results")
    .upsert(
      { user_id: state.user.id, assigned_level: level, score },
      { onConflict: "user_id" },
    );
}

export async function loadTeacherData() {
  const { data: profs } = await sb
    .from("profiles")
    .select("*")
    .eq("role", "siswa");
  const { data: allProg } = await sb.from("student_progress").select("*");
  const { data: allDiag } = await sb.from("diagnostic_results").select("*");
  const students = (profs || []).map((p) => {
    const dres = (allDiag || []).find((d) => d.user_id === p.id);
    const level = dres ? dres.assigned_level : "pemula";
    const items = (CHALLENGES[level] && CHALLENGES[level].items) || [];
    const myProg = (allProg || []).filter(
      (pr) => pr.user_id === p.id && pr.level === level,
    );
    const done = myProg.filter((pr) => pr.completed).length;
    const progress = items.length ? Math.round((done / items.length) * 100) : 0;
    const attArr = myProg.map((pr) => pr.attempts).filter((a) => a > 0);
    const attempts = attArr.length
      ? attArr.reduce((a, b) => a + b, 0) / attArr.length
      : 0;
    const stuck = myProg.some((pr) => !pr.completed && pr.attempts >= 3);
    const status =
      progress === 100 ? "tuntas" : stuck ? "tertahan" : "berjalan";
    const note =
      status === "tuntas"
        ? "Menyelesaikan seluruh checkpoint pada jalurnya."
        : status === "tertahan"
          ? "Butuh pendampingan, beberapa percobaan belum berhasil."
          : "Progres berjalan normal.";
    return {
      name: p.full_name || "Siswa",
      level,
      progress,
      attempts,
      status,
      note,
    };
  });
  setStudents(students);

  const sm = {};
  (allProg || []).forEach((pr) => {
    const info = CHALLENGES[pr.level];
    const item = info && info.items[pr.challenge_idx];
    if (!item) return;
    sm[item.title] = sm[item.title] || { total: 0, struggled: 0 };
    sm[item.title].total++;
    if (pr.attempts > 2) sm[item.title].struggled++;
  });
  setStruggle(
    Object.keys(sm)
      .map((topic) => ({
        topic,
        pct: Math.round((sm[topic].struggled / sm[topic].total) * 100),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4),
  );
}
