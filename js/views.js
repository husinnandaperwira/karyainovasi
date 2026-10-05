import {
  state,
  CHALLENGES,
  DIAGNOSTIC,
  STUDENTS,
  STRUGGLE,
  getCh,
  levelProgress,
  isUnlocked,
} from "./store.js";

export function render() {
  const app = document.getElementById("app");
  app.innerHTML =
    (state.user ? topbar() : "") + (state.showInfo ? infoPanel() : "") + body();
}

function topbar() {
  const name = state.profile
    ? state.profile.full_name || state.profile.role
    : "";
  return `
  <div class="topbar">
    <div class="brandmark">
      <div class="dot">CT</div>
      <div class="brand">CodeTrack<span>Karya Inovasi Pendidikan — PPG</span></div>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:12.5px; color:var(--text-muted);">${name} · ${state.profile ? state.profile.role : ""}</span>
      <button class="info-btn" data-action="toggleInfo" title="Info karya inovasi">i</button>
      <button class="btn-secondary" data-action="logout" style="padding:8px 14px; font-size:12.5px;">Keluar</button>
    </div>
  </div>`;
}

function infoPanel() {
  return `
  <div class="info-panel">
    <h3>Tentang Karya Inovasi Ini</h3>
    <p style="margin:0; font-size:13px; color:var(--text-muted);">CodeTrack dirancang berdasarkan hasil refleksi pengalaman belajar Pembelajaran Berdiferensiasi, Growth Mindset, dan Asesmen selama Program PPG, untuk menjawab tantangan nyata: kesenjangan kemampuan siswa yang lebar dalam satu kelas PPLG.</p>
    <div class="info-grid">
      <div class="info-card"><div class="eyebrow">Kebaruan</div><p>Memadukan jalur belajar adaptif dengan umpan balik bergaya growth mindset, dirancang khusus konteks SMK PPLG.</p></div>
      <div class="info-card"><div class="eyebrow">Kreativitas</div><p>Menggabungkan latar belakang developer dengan teori pedagogik yang dipelajari selama PPG.</p></div>
      <div class="info-card"><div class="eyebrow">Relevansi</div><p>Sesuai kurikulum produktif PPLG dan karakteristik siswa dengan kemampuan awal beragam.</p></div>
      <div class="info-card"><div class="eyebrow">Kebermanfaatan</div><p>Membantu guru memantau progres individual tanpa memeriksa manual satu per satu.</p></div>
      <div class="info-card"><div class="eyebrow">Efektivitas</div><p>Diuji cobakan terbatas pada kelas PPL — diukur dari penyelesaian latihan &amp; motivasi siswa.</p></div>
    </div>
  </div>`;
}

export function authView() {
  const mode = state.authMode;
  return `
  <div class="card auth-wrap">
    <div class="eyebrow">${mode === "login" ? "Masuk" : "Daftar Akun"}</div>
    <h2 style="margin:10px 0 18px; font-size:20px;">${mode === "login" ? "Masuk ke CodeTrack" : "Buat Akun Baru"}</h2>
    ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ""}
    ${
      mode === "signup"
        ? `
    <div class="auth-field"><label>Nama Lengkap</label><input id="authName" type="text" placeholder="Nama kamu" /></div>
    <div class="auth-field"><label>Daftar sebagai</label>
      <select id="authRole"><option value="siswa">Siswa</option><option value="guru">Guru</option></select>
    </div>`
        : ""
    }
    <div class="auth-field"><label>Email</label><input id="authEmail" type="email" placeholder="email@contoh.com" /></div>
    <div class="auth-field"><label>Password</label><input id="authPassword" type="password" placeholder="Minimal 6 karakter" /></div>
    <button class="btn-primary" style="width:100%;" data-action="${mode === "login" ? "doLogin" : "doSignup"}" ${state.authLoading ? "disabled" : ""}>
      ${state.authLoading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
    </button>
    <div class="auth-switch">
      ${mode === "login" ? `Belum punya akun? <a data-action="switchAuthMode" data-mode="signup">Daftar di sini</a>` : `Sudah punya akun? <a data-action="switchAuthMode" data-mode="login">Masuk di sini</a>`}
    </div>
  </div>`;
}

function body() {
  if (!state.user) return authView();
  if (state.role === "guru") return teacherView();
  if (state.view === "landing") return landingView();
  if (state.view === "diagnostic") return diagnosticView();
  if (state.view === "result") return resultView();
  if (state.view === "track") return trackView();
  return landingView();
}

function landingView() {
  return `
  <div class="hero">
    <div class="eyebrow">Platform Pembelajaran Adaptif</div>
    <h1>Belajar coding sesuai levelmu sendiri, bukan level rata-rata kelas.</h1>
    <p>CodeTrack memetakan kemampuan awalmu lewat tes penempatan singkat, lalu menyusun jalur belajar checkpoint demi checkpoint — lengkap dengan umpan balik yang membantumu belajar dari kesalahan, bukan takut padanya.</p>
    <button class="btn-primary" data-action="startDiagnostic">Mulai Tes Penempatan →</button>
  </div>
  <div class="feature-row">
    <div class="feature"><span class="icon">🎯</span><h4>Penempatan Otomatis</h4><p>Tiga soal singkat menentukan jalur belajar paling pas untukmu.</p></div>
    <div class="feature"><span class="icon">🧭</span><h4>Jalur Checkpoint</h4><p>Belajar bertahap lewat rangkaian tantangan yang saling terhubung.</p></div>
    <div class="feature"><span class="icon">🌱</span><h4>Umpan Balik Bertumbuh</h4><p>Salah jawaban bukan akhir — ada petunjuk bertahap yang menuntunmu.</p></div>
  </div>`;
}

function diagnosticView() {
  const total = DIAGNOSTIC.length;
  const q = DIAGNOSTIC[state.diagStep];
  const dots = DIAGNOSTIC.map((_, i) => {
    let cls = "diag-dot";
    if (i < state.diagStep) cls += " done";
    else if (i === state.diagStep) cls += " current";
    return `<div class="${cls}"></div>`;
  }).join("");

  const picked = state.diagPicked;
  const submitted = state.submitted;

  const opts = q.options
    .map((opt, i) => {
      let cls = "opt";
      if (submitted) {
        if (i === q.correct) cls += " correct";
        else if (i === picked) cls += " wrong";
        else cls += " disabled";
      }
      const letter = String.fromCharCode(65 + i);
      return `<button class="${cls}" data-action="pickDiag" data-idx="${i}" ${submitted ? "disabled" : ""}>
      <span class="letter">${letter}</span><span>${opt}</span>
    </button>`;
    })
    .join("");

  return `
  <div class="card">
    <div class="diag-step-label">Tes Penempatan · Soal ${state.diagStep + 1} dari ${total}</div>
    <div class="diag-progress">${dots}</div>
    <div class="codeblock">${q.code}</div>
    <div class="q-text">${q.q}</div>
    <div class="opt-list">${opts}</div>
    ${submitted ? `<div class="ch-actions"><button class="btn-primary" data-action="nextDiag">${state.diagStep + 1 < total ? "Lanjut Soal Berikutnya →" : "Lihat Hasil Penempatan →"}</button></div>` : ""}
  </div>`;
}

function resultView() {
  const level = state.assignedLevel;
  const info = CHALLENGES[level];
  const reasoning =
    level === "lanjut"
      ? "Kamu menjawab benar seluruh soal logika pemrograman, termasuk perulangan — jalur Lanjut akan langsung mengasah kemampuan fungsi, array, dan debugging."
      : level === "menengah"
        ? "Kamu sudah cukup kuat di variabel dan percabangan, namun masih perlu penguatan di perulangan dan array — jalur Menengah dirancang untuk itu."
        : "Kamu akan memulai dari dasar-dasar seperti variabel, operator, dan percabangan agar fondasi logikamu kuat sebelum lanjut ke materi yang lebih kompleks.";

  return `
  <div class="card level-${level}">
    <div class="result-badge">Hasil Penempatan</div>
    <h2 style="margin:0 0 10px; font-size:24px;">Kamu ditempatkan di jalur <span style="color:${info.color}">${info.label}</span></h2>
    <p style="color:var(--text-muted); font-size:13.5px; max-width:480px; margin-bottom:22px;">${reasoning}</p>
    <button class="btn-primary" data-action="goTrack" data-level="${level}">Mulai Belajar di Jalur ${info.label} →</button>
  </div>`;
}

function trackView() {
  const level = state.activeLevel || state.assignedLevel || "pemula";
  const info = CHALLENGES[level];
  const prog = levelProgress(level);

  const tabs = Object.keys(CHALLENGES)
    .map((k) => {
      const active = k === level;
      return `<button class="level-tab ${active ? "active-" + k : ""}" data-action="switchLevel" data-level="${k}">
      ${CHALLENGES[k].label}${state.assignedLevel === k ? '<span class="yours-tag">Level Kamu</span>' : ""}
    </button>`;
    })
    .join("");

  const nodes = info.items
    .map((item, idx) => {
      const st = getCh(level, idx);
      const unlocked = isUnlocked(level, idx);
      let cls = "track-node";
      if (!unlocked) cls += " locked";
      else if (st.completed) cls += " completed";
      else cls += " unlocked";
      if (
        state.openChallenge &&
        state.openChallenge.level === level &&
        state.openChallenge.idx === idx
      )
        cls += " current";

      const icon = st.completed ? "✓" : idx + 1;
      return `<div class="${cls}" style="--node-color:${info.color}; --node-glow:${info.glow};" data-action="${unlocked ? "openChallenge" : "lockedNote"}" data-level="${level}" data-idx="${idx}">
      <div class="node-circle">${icon}</div>
      <div class="node-label">${item.title}</div>
      <div class="node-num">Checkpoint ${idx + 1}</div>
    </div>`;
    })
    .join("");

  let panel = "";
  if (state.openChallenge && state.openChallenge.level === level) {
    panel = challengePanel(level, state.openChallenge.idx);
  }

  return `
  <div class="level-tabs">${tabs}</div>
  <div class="track-header">
    <div>
      <h2>Jalur ${info.label}</h2>
      <p>Selesaikan checkpoint secara berurutan untuk membuka tantangan berikutnya.</p>
    </div>
    <div class="progress-pill">Progres: <b>${prog.done}/${prog.total}</b> checkpoint</div>
  </div>
  <div class="track-wrap">
    <div class="track-line"></div>
    <div class="track-nodes">${nodes}</div>
  </div>
  ${panel}
  `;
}

function challengePanel(level, idx) {
  const info = CHALLENGES[level];
  const item = info.items[idx];
  const st = getCh(level, idx);
  const picked = state.pickedOption;
  const submitted = state.submitted;
  const isCorrect = submitted && picked === item.correct;
  const isWrong = submitted && picked !== item.correct;

  const opts = item.options
    .map((opt, i) => {
      let cls = "opt";
      if (isCorrect && i === item.correct) cls += " correct";
      if (isWrong) {
        if (i === picked) cls += " wrong";
        else cls += " disabled";
      }
      if (isCorrect && i !== item.correct) cls += " disabled";
      const letter = String.fromCharCode(65 + i);
      return `<button class="${cls}" data-action="pickChallenge" data-idx="${i}" ${submitted && !isWrong ? "disabled" : ""} ${isCorrect ? "disabled" : ""}>
      <span class="letter">${letter}</span><span>${opt}</span>
    </button>`;
    })
    .join("");

  let feedback = "";
  if (isWrong) {
    const hintIdx = Math.min(st.hintIdx, item.hints.length - 1);
    const hint =
      item.hints[hintIdx] ||
      "Diskusikan bersama teman satu kelompok atau tanyakan ke guru untuk petunjuk lebih lanjut.";
    feedback = `
    <div class="hint-box">
      <span class="hb-title">// belum berhasil — percobaan ke-${st.attempts}</span>
      ${hint}
    </div>
    <div class="ch-actions">
      <button class="btn-primary" data-action="retryChallenge" data-level="${level}" data-idx="${idx}">Coba Lagi</button>
    </div>`;
  } else if (isCorrect) {
    const nextIdx = idx + 1;
    const hasNext = nextIdx < info.items.length;
    feedback = `
    <div class="success-box">
      <span class="sb-title">✓ Berhasil!</span>
      <p>Logikamu tepat. ${st.attempts > 1 ? "Butuh beberapa percobaan, dan itu bagian normal dari proses belajar." : "Langsung tepat di percobaan pertama — mantap!"}</p>
    </div>
    <div class="ch-actions">
      ${hasNext ? `<button class="btn-primary" data-action="openChallenge" data-level="${level}" data-idx="${nextIdx}">Lanjut ke Checkpoint Berikutnya →</button>` : `<button class="btn-primary" data-action="closeChallenge">Jalur ${info.label} Selesai! Kembali ke Track</button>`}
      <button class="btn-secondary" data-action="closeChallenge">Tutup</button>
    </div>`;
  } else {
    feedback = `<div class="ch-actions"><button class="btn-primary" data-action="submitChallenge" ${picked === null ? "disabled" : ""}>Periksa Jawaban</button></div>`;
  }

  return `
  <div class="challenge-panel" style="--node-color:${info.color}">
    <div class="ch-eyebrow">Checkpoint ${idx + 1} · Jalur ${info.label}</div>
    <div class="ch-title">${item.title}</div>
    <div class="codeblock">${item.code}</div>
    <div class="q-text" style="font-size:15px;">${item.q}</div>
    <div class="opt-list">${opts}</div>
    ${feedback}
    <div class="ch-footer-note">Error adalah bagian dari proses belajar — bukan tanda kegagalan.</div>
  </div>`;
}

function teacherView() {
  const avgProgress = Math.round(
    STUDENTS.reduce((a, s) => a + s.progress, 0) / STUDENTS.length,
  );
  const tuntas = STUDENTS.filter((s) => s.status === "tuntas").length;
  const tertahan = STUDENTS.filter((s) => s.status === "tertahan").length;

  const stat = `
  <div class="stat-strip">
    <div class="stat-box"><div class="stat-num">${avgProgress}%</div><div class="stat-label">Rata-rata progres kelas</div></div>
    <div class="stat-box"><div class="stat-num">${tuntas}/${STUDENTS.length}</div><div class="stat-label">Siswa tuntas jalur saat ini</div></div>
    <div class="stat-box"><div class="stat-num">${tertahan}</div><div class="stat-label">Siswa butuh pendampingan</div></div>
  </div>`;

  const students = STUDENTS.map((s) => {
    const info = CHALLENGES[s.level];
    const initials = s.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);
    const statusLabel =
      s.status === "tuntas"
        ? "Tuntas"
        : s.status === "berjalan"
          ? "Berjalan"
          : "Tertahan";
    return `
    <div class="student-card">
      <div class="avatar" style="background:${info.color}">${initials}</div>
      <div class="student-info">
        <div class="student-name">${s.name}
          <span class="badge badge-${s.level}" style="padding:2px 9px; border-radius:999px; font-size:10.5px; font-weight:700;">${info.label}</span>
          <span class="status-badge status-${s.status}">${statusLabel}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${s.progress}%; background:${info.color};"></div></div>
        <div class="student-note">${s.note}</div>
      </div>
    </div>`;
  }).join("");

  const struggle = STRUGGLE.map(
    (s) => `
    <div class="struggle-item">
      <div class="struggle-top"><span>${s.topic}</span><b>${s.pct}%</b></div>
      <div class="bar-track"><div class="bar-fill" style="width:${s.pct}%; background:var(--menengah);"></div></div>
    </div>`,
  ).join("");

  return `
  ${stat}
  <div class="dash-grid">
    <div>
      <div class="panel-title">Progres Siswa (Kelas X PPLG)</div>
      ${students}
    </div>
    <div class="card" style="padding:20px;">
      <div class="panel-title">Titik Kesulitan Umum</div>
      <p style="font-size:11.5px; color:var(--text-dim); margin:-6px 0 16px;">% siswa yang butuh lebih dari 2 percobaan</p>
      ${struggle}
    </div>
  </div>
  <div class="footer-note">Data pada dashboard ini adalah simulasi untuk keperluan demonstrasi karya inovasi.</div>
  `;
}
