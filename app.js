const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;

/* ---------------- tokens ---------------- */
const C = {
  bg: "#000000",
  surface: "#0A0C0F",
  raised: "#12161B",
  line: "#20262E",
  text: "#E9ECEF",
  muted: "#8B959F",
  gold: "#E0B252",
  danger: "#C25C5C"
};
const PALETTE = ["#1F9E8F", "#8C3049", "#C06B3E", "#3070A8", "#3E8A63", "#6155A8", "#A98C34", "#9C4F7C"];
const DEFAULT_SUBJECTS = [{
  name: "Mathematics",
  color: "#1F9E8F"
}, {
  name: "Accounting",
  color: "#8C3049"
}, {
  name: "Business Studies",
  color: "#C06B3E"
}, {
  name: "Geography",
  color: "#3070A8"
}, {
  name: "English Home Language",
  color: "#3E8A63"
}, {
  name: "Afrikaans",
  color: "#6155A8"
}, {
  name: "Life Orientation",
  color: "#A98C34"
}];
const CATS = [{
  id: "notes",
  label: "My notes",
  blank: "Your own PDFs live here. Upload a set and they're on every device you sign in from."
}, {
  id: "papers",
  label: "Papers & prelims",
  blank: "IEB papers, memos and other schools' prelims. Upload what you collect."
}, {
  id: "tips",
  label: "Tips & links",
  blank: ""
}];

/* which paper folders a subject gets */
const PAPER_SETS = [{
  match: ["math"],
  papers: ["P1", "P2"]
}, {
  match: ["account"],
  papers: ["P1", "P2"]
}, {
  match: ["english"],
  papers: ["P1", "P2"]
}, {
  match: ["afrikaans"],
  papers: ["P1", "P2"]
}, {
  match: ["geograph"],
  papers: ["P1", "P2"]
}];
const papersFor = name => {
  const n = (name || "").toLowerCase();
  const hit = PAPER_SETS.find(s => s.match.some(m => n.includes(m)));
  return hit ? hit.papers : [];
};
const SOURCES = [{
  name: "IEB Past Papers Library",
  href: "https://www.ieb.co.za/pages/pastiebpaperslibrary",
  note: "Official · last 5 years with marking guidelines · log in as guest"
}, {
  name: "Advantage Learn — Grade 12 past papers",
  href: "https://www.advantagelearn.com/grade-12-past-exam-papers/",
  note: "IEB and DBE papers with memos, free"
}, {
  name: "SA Papers — IEB",
  href: "https://www.sapapers.co.za/ieb",
  note: "Large IEB archive, 2011 onwards, by subject"
}, {
  name: "MyExamPapers — IEB Grade 12",
  href: "https://www.myexampapers.co.za/ieb/past-papers/grade-12/",
  note: "Papers and marking guidelines by year"
}, {
  name: "ExamSlayers — IEB library",
  href: "https://examslayers.co.za/past-papers/ieb",
  note: "Papers with memos, by subject and year"
}];
/* starter exam tips, shown until you write your own */
const STARTER_TIPS = [{
  match: ["math"],
  tips: ["Show every line of working. Method marks survive a wrong final answer — a bare answer earns nothing if it's wrong.", "Round only at the very end. Carry full calculator accuracy through the middle of a question.", "In Euclidean geometry, give the reason for every statement. The reason carries its own mark.", "For optimisation, write the variable, the constraint and the domain before you differentiate.", "If a question stalls you, leave a gap and move on. Cheap marks later are worth more than one stubborn question."]
}, {
  match: ["account"],
  tips: ["Read the adjustments list first and mark which statement and note each one lands in, before you write a single figure.", "Every figure that isn't given needs a workings line. Markers award method marks off your workings.", "For ratios: write the formula, substitute, then answer in the right unit — %, :1, days or times.", "Interpretation answers need figure + trend + comment. A number on its own rarely gets full marks.", "Internal control and ethics answers want a point plus a practical example of how it works in that business."]
}, {
  match: ["business"],
  tips: ["Plan your Section C headings before writing. Introduction, body, conclusion and structure all carry marks.", "Apply everything to the business in the case study. Generic textbook answers cap your marks.", "Use the exact terminology — name the theory (PESTLE, Porter, the eight functions), don't just describe it.", "Watch the verb. Discuss, evaluate and recommend all want more than a list.", "Give the number the question asks for. Six factors means six, and no marks for the seventh."]
}, {
  match: ["geograph"],
  tips: ["Answer in process chains: cause, then process, then effect. Single-word answers lose the explanation marks.", "Use located, named examples — South African ones where the question asks for them.", "Mapwork: write the formula, substitute, keep the units, round as instructed.", "Refer to the source, photo or map given. Quote grid references or feature names.", "Match answer length to the marks. A four-mark question wants four distinct points."]
}, {
  match: ["english"],
  tips: ["Comprehension: match your answer's length to the mark allocation, and always explain the effect, not just the device.", "Summary: own words, obey the word count, and only include points that answer the instruction given.", "Literature: answer the question actually asked. Embed short quotes and link technique to meaning.", "Writing: five minutes planning, five minutes editing. Both are worth more than the extra paragraph.", "Stick to the conventions of the format — a letter, a review and a speech each look different on the page."]
}, {
  match: ["afrikaans"],
  tips: ["Taalstruktuur is the most predictable section — drill direkte/indirekte rede, lydende vorm and ontkenning.", "Answer in full Afrikaans sentences and keep your tenses consistent throughout.", "For the novel or film study, know characters, themes and key moments with specific examples.", "Read the question stem carefully — noem, verduidelik and bespreek want different amounts of writing."]
}, {
  match: ["life orientation", "lo"],
  tips: ["Discursive essay: take a clear position, give both sides, back it with evidence, then conclude.", "Use current South African examples — recent events score better than vague generalities.", "Name the actual right, act or policy where one applies.", "Answer the number of points asked for, and give each one its own sentence."]
}];
let seedAttempted = false; // stops the starter subjects being created twice
const starterTipsFor = name => {
  const n = (name || "").toLowerCase();
  const hit = STARTER_TIPS.find(s => s.match.some(m => n.includes(m)));
  return hit ? hit.tips : [];
};
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const MAX_BYTES = 50 * 1024 * 1024;
const BUCKET = "shelf";

/* ---------------- supabase ---------------- */
const cfg = window.SHELF_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-PROJECT-ID");
const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
const fmtSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";

/* ---------------- icons ---------------- */
const I = (d, extra) => ({
  size = 18,
  style
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: style
}, d, extra);
const IcFile = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M14 3v5h5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M19 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9l6 6v11a1 1 0 0 1-1 1z"
})));
const IcOpen = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M14 4h6v6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20 4 10 14"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
})));
const IcPrint = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M7 8V3h10v5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M7 17H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M7 14h10v7H7z"
})));
const IcDown = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M12 3v13"
}), /*#__PURE__*/React.createElement("path", {
  d: "m7 12 5 5 5-5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 21h16"
})));
const IcTrash = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M4 6h16"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 6V4h6v2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M6 6l1 14h10l1-14"
})));
const IcSearch = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "m20 20-3.5-3.5"
})));
const IcPlus = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14"
})));
const IcBack = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "m14 6-6 6 6 6"
})));
const IcUp = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M12 20V7"
}), /*#__PURE__*/React.createElement("path", {
  d: "m7 12 5-5 5 5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 4h16"
})));
const IcX = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M6 6l12 12"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18"
})));
const IcCal = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "5",
  width: "18",
  height: "16",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 3v4M16 3v4M3 10h18"
})));
const IcBulb = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M9 18h6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10 21h4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"
})));
const IcLink = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"
})));

/* ---------------- shared bits ---------------- */
function Eyebrow({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] uppercase",
    style: {
      fontFamily: MONO,
      color: C.muted,
      letterSpacing: "0.16em"
    }
  }, children);
}
function IconBtn({
  icon: Icon,
  onClick,
  title
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    title: title,
    "aria-label": title,
    className: "rounded-md p-2",
    style: {
      color: C.muted
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 16
  }));
}

/* ---------------- sign in ---------------- */
function Shell({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center px-5",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, ["#1F9E8F", "#8C3049", "#C06B3E"].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 4,
      height: 22,
      background: c,
      borderRadius: 1
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xl ml-1",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.02em"
    }
  }, "Shelf")), children));
}
function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = e => {
    const allow = (cfg.ALLOWED_EMAILS || []).map(x => x.toLowerCase());
    return !allow.length || allow.includes(e);
  };
  const signIn = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) return setErr("Enter your email and password.");
    if (!allowed(e)) return setErr("That address isn't on the list for this shelf.");
    setBusy(true);
    setErr("");
    setNote("");
    const {
      error
    } = await sb.auth.signInWithPassword({
      email: e,
      password
    });
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "Wrong email or password. If you've never set a password, use the link below." : error.message);
  };
  const resetPassword = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return setErr("Type your email first, then tap this again.");
    if (!allowed(e)) return setErr("That address isn't on the list for this shelf.");
    setBusy(true);
    setErr("");
    const {
      error
    } = await sb.auth.resetPasswordForEmail(e, {
      redirectTo: window.location.href
    });
    setBusy(false);
    if (error) setErr(error.message);else setNote("Check your email for a link. Open it and you'll be asked to choose a password.");
  };
  return /*#__PURE__*/React.createElement(Shell, null, /*#__PURE__*/React.createElement("h1", {
    className: "mt-6 text-2xl leading-tight",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.03em"
    }
  }, "Sign in to open your shelf."), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "email",
    autoComplete: "username",
    className: "mt-5 w-full rounded-md px-3 py-3 text-sm outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    onKeyDown: e => e.key === "Enter" && signIn(),
    placeholder: "password",
    autoComplete: "current-password",
    className: "mt-2 w-full rounded-md px-3 py-3 text-sm outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: signIn,
    disabled: busy,
    className: "mt-3 w-full rounded-md px-3 py-3 text-sm disabled:opacity-50",
    style: {
      background: C.gold,
      color: "#171310"
    }
  }, busy ? "…" : "Sign in"), /*#__PURE__*/React.createElement("button", {
    onClick: resetPassword,
    disabled: busy,
    className: "mt-3 w-full text-xs underline",
    style: {
      color: C.muted
    }
  }, "Set or reset my password"), note && /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: C.gold
    }
  }, note), err && /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: "#EFC9C9"
    }
  }, err));
}
function SetPassword({
  onDone
}) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (password.length < 8) return setErr("Use at least 8 characters.");
    setBusy(true);
    setErr("");
    const {
      error
    } = await sb.auth.updateUser({
      password
    });
    setBusy(false);
    if (error) setErr(error.message);else onDone();
  };
  return /*#__PURE__*/React.createElement(Shell, null, /*#__PURE__*/React.createElement("h1", {
    className: "mt-6 text-2xl leading-tight",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.03em"
    }
  }, "Choose a password."), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: C.muted
    }
  }, "This is what you'll type from now on, on every device."), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    onKeyDown: e => e.key === "Enter" && save(),
    placeholder: "new password",
    autoComplete: "new-password",
    className: "mt-5 w-full rounded-md px-3 py-3 text-sm outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: busy,
    className: "mt-3 w-full rounded-md px-3 py-3 text-sm disabled:opacity-50",
    style: {
      background: C.gold,
      color: "#171310"
    }
  }, busy ? "Saving…" : "Save password"), err && /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: "#EFC9C9"
    }
  }, err));
}

/* ---------------- app ---------------- */
function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [view, setView] = useState({
    subject: null,
    cat: "notes",
    paper: null
  });
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [firstPaper, setFirstPaper] = useState(localStorage.getItem("shelf:firstPaper") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const fileInput = useRef(null);
  useEffect(() => {
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getSession().then(({
      data
    }) => {
      setSession(data.session);
      setReady(true);
    });
    const {
      data: sub
    } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const load = useCallback(async () => {
    const [s, f, n] = await Promise.all([sb.from("subjects").select("*").order("created_at"), sb.from("files").select("*").order("created_at", {
      ascending: false
    }), sb.from("notes").select("*").order("created_at", {
      ascending: false
    })]);
    if (s.error || f.error || n.error) {
      setErr("Couldn't load your shelf. Refresh and try again.");
      return;
    }
    if (!s.data.length) {
      if (seedAttempted) return; // another load already seeded
      seedAttempted = true;
      await sb.from("subjects").insert(DEFAULT_SUBJECTS);
      const again = await sb.from("subjects").select("*").order("created_at");
      setSubjects(again.data || []);
    } else setSubjects(s.data);
    setFiles(f.data);
    setNotes(n.data);
  }, []);
  useEffect(() => {
    if (session) load();
  }, [session, load]);
  if (!ready) return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen",
    style: {
      background: C.bg
    }
  });
  if (!configured) return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center px-6 text-center",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm max-w-sm",
    style: {
      color: C.muted
    }
  }, "Open ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.gold,
      fontFamily: MONO
    }
  }, "config.js"), " and paste in your Supabase URL and anon key. The README walks through it."));
  if (!session) return /*#__PURE__*/React.createElement(SignIn, null);
  if (recovery) return /*#__PURE__*/React.createElement(SetPassword, {
    onDone: () => setRecovery(false)
  });
  const uid = session.user.id;
  const subject = subjects.find(s => s.id === view.subject) || null;

  /* ---- actions ---- */
  const upload = async list => {
    const chosen = Array.from(list).filter(f => f.size > 0);
    for (const f of chosen) {
      if (f.size > MAX_BYTES) {
        setErr(`${f.name} is over 50 MB, which Supabase won't accept. Split it by topic and upload again.`);
        continue;
      }
      setBusy(`Uploading ${f.name}`);
      const path = `${uid}/${crypto.randomUUID()}.pdf`;
      const up = await sb.storage.from(BUCKET).upload(path, f, {
        contentType: f.type || "application/pdf"
      });
      if (up.error) {
        setErr(`${f.name} didn't upload: ${up.error.message}`);
        setBusy(null);
        continue;
      }
      const row = {
        subject_id: view.subject,
        cat: view.cat,
        paper: view.paper || null,
        title: f.name.replace(/\.pdf$/i, ""),
        size: f.size,
        path
      };
      const ins = await sb.from("files").insert(row).select().single();
      if (ins.error) setErr(`${f.name} uploaded but wasn't listed. Refresh the page.`);else setFiles(prev => [ins.data, ...prev]);
      setBusy(null);
    }
  };
  const bytesFor = async file => {
    const {
      data,
      error
    } = await sb.storage.from(BUCKET).download(file.path);
    if (error) {
      setErr(`${file.title} couldn't be fetched.`);
      return null;
    }
    return await data.arrayBuffer();
  };
  const blobFor = async file => {
    setBusy(`Opening ${file.title}`);
    const {
      data,
      error
    } = await sb.storage.from(BUCKET).download(file.path);
    setBusy(null);
    if (error) {
      setErr(`${file.title} couldn't be fetched.`);
      return null;
    }
    return URL.createObjectURL(data);
  };
  const openFile = async (f, page) => {
    setViewing({
      file: f,
      page: page || 1
    });
    const when = new Date().toISOString();
    setFiles(prev => prev.map(x => x.id === f.id ? {
      ...x,
      opened_at: when
    } : x));
    sb.from("files").update({
      opened_at: when
    }).eq("id", f.id);
  };
  const openInBrowser = async f => {
    const u = await blobFor(f);
    if (u) window.open(u, "_blank");
  };
  const downloadFile = async f => {
    const u = await blobFor(f);
    if (!u) return;
    const a = document.createElement("a");
    a.href = u;
    a.download = `${f.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const printFile = async f => {
    const u = await blobFor(f);
    if (!u) return;
    const frame = document.createElement("iframe");
    Object.assign(frame.style, {
      position: "fixed",
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      border: 0
    });
    frame.src = u;
    frame.onload = () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch {
        window.open(u, "_blank");
      }
    };
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 60000);
  };
  const removeFile = async f => {
    setBusy(`Removing ${f.title}`);
    await sb.storage.from(BUCKET).remove([f.path]);
    const {
      error
    } = await sb.from("files").delete().eq("id", f.id);
    setBusy(null);
    if (error) setErr("That file wasn't removed. Try again.");else setFiles(prev => prev.filter(x => x.id !== f.id));
  };
  const addSubject = async () => {
    const name = newSubject.trim();
    if (!name) return;
    const color = PALETTE[subjects.length % PALETTE.length];
    const {
      data,
      error
    } = await sb.from("subjects").insert({
      name,
      color
    }).select().single();
    if (!error) {
      setSubjects(p => [...p, data]);
      setNewSubject("");
      setAdding(false);
    }
  };
  const addNote = async row => {
    const {
      data,
      error
    } = await sb.from("notes").insert(row).select().single();
    if (!error) setNotes(p => [data, ...p]);
  };
  const addBookmark = async (file, label, page) => {
    const {
      data,
      error
    } = await sb.from("notes").insert({
      subject_id: file.subject_id,
      file_id: file.id,
      kind: "bookmark",
      text: label,
      page: page || null
    }).select().single();
    if (!error) setNotes(p => [data, ...p]);
  };
  const delNote = async id => {
    const {
      error
    } = await sb.from("notes").delete().eq("id", id);
    if (!error) setNotes(p => p.filter(n => n.id !== id));
  };
  const counts = files.reduce((m, f) => (m[f.subject_id] = (m[f.subject_id] || 0) + 1, m), {});
  const results = query.trim() ? files.filter(f => f.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 40) : [];
  const daysLeft = firstPaper ? Math.ceil((new Date(firstPaper + "T08:00:00") - new Date()) / 86400000) : null;

  /* ---- render ---- */
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen w-full"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-20 no-print",
    style: {
      background: "rgba(0,0,0,0.92)",
      borderBottom: `1px solid ${C.line}`,
      backdropFilter: "blur(8px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-5xl px-4 py-3 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setView({
        subject: null,
        cat: "notes",
        paper: null
      });
      setQuery("");
    },
    className: "flex items-center gap-2 rounded"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex"
  }, ["#1F9E8F", "#8C3049", "#C06B3E"].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 4,
      height: 20,
      background: c,
      marginRight: 2,
      borderRadius: 1
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "text-lg",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.02em"
    }
  }, "Shelf")), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:flex items-center gap-2 rounded-md px-2 py-1.5",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcSearch, {
    size: 14,
    style: {
      color: C.muted
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search everything",
    className: "bg-transparent text-sm outline-none w-40",
    style: {
      color: C.text
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDateOpen(v => !v),
    className: "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: daysLeft != null ? C.gold : C.muted,
      fontFamily: MONO
    }
  }, /*#__PURE__*/React.createElement(IcCal, {
    size: 13
  }), daysLeft != null ? daysLeft >= 0 ? `${daysLeft} days` : "writing now" : "set date"), /*#__PURE__*/React.createElement("button", {
    onClick: () => sb.auth.signOut(),
    className: "text-xs rounded-md px-2 py-1.5",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, "out"))), dateOpen && /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-5xl px-4 pb-3 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: C.muted
    }
  }, "First paper"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: firstPaper,
    onChange: e => {
      setFirstPaper(e.target.value);
      localStorage.setItem("shelf:firstPaper", e.target.value);
    },
    className: "rounded-md px-2 py-1.5 text-sm outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "sm:hidden mx-auto max-w-5xl px-4 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 rounded-md px-2 py-2",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcSearch, {
    size: 14,
    style: {
      color: C.muted
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search everything",
    className: "bg-transparent text-sm outline-none w-full",
    style: {
      color: C.text
    }
  })))), (busy || err) && /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-5xl px-4 pt-3 no-print"
  }, busy && /*#__PURE__*/React.createElement("div", {
    className: "rounded-md px-3 py-2 text-sm",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.muted
    }
  }, busy, "\u2026"), err && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 rounded-md px-3 py-2 text-sm flex items-start gap-3",
    style: {
      background: "#241819",
      border: "1px solid #4A2A2C",
      color: "#EFC9C9"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex-1"
  }, err), /*#__PURE__*/React.createElement("button", {
    onClick: () => setErr(""),
    style: {
      color: "#EFC9C9"
    }
  }, /*#__PURE__*/React.createElement(IcX, {
    size: 14
  })))), /*#__PURE__*/React.createElement("main", {
    className: "mx-auto max-w-5xl px-4 pb-24 pt-6"
  }, query.trim() ? /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(Eyebrow, null, results.length, " match", results.length === 1 ? "" : "es"), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-2"
  }, results.map(f => /*#__PURE__*/React.createElement(FileRow, {
    key: f.id,
    file: f,
    subject: subjects.find(s => s.id === f.subject_id),
    showSubject: true,
    notes: notes,
    onAddBookmark: addBookmark,
    onDeleteNote: delNote,
    onOpen: openFile,
    onPrint: printFile,
    onDownload: downloadFile,
    onDelete: removeFile
  })), !results.length && /*#__PURE__*/React.createElement("p", {
    className: "text-sm",
    style: {
      color: C.muted
    }
  }, "Nothing with that name yet. Try a shorter word, or open the subject and upload it."))) : !subject ? /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(Eyebrow, null, "IEB \xB7 Grade 12 \xB7 finals"), /*#__PURE__*/React.createElement("h1", {
    className: "mt-3 text-3xl sm:text-4xl leading-tight",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.03em"
    }
  }, "Every paper, every note,", /*#__PURE__*/React.createElement("br", null), "on whatever screen is nearest."), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm max-w-xl",
    style: {
      color: C.muted
    }
  }, "Pick a subject to open its notes, past papers, other schools' prelims and tips."), files.filter(f => f.opened_at).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Back to"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex gap-2 overflow-x-auto pb-1"
  }, files.filter(f => f.opened_at).sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at)).slice(0, 4).map(f => {
    const s = subjects.find(x => x.id === f.subject_id);
    return /*#__PURE__*/React.createElement("button", {
      key: f.id,
      onClick: () => openFile(f),
      className: "shrink-0 max-w-[220px] text-left rounded-lg px-3 py-3",
      style: {
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${s?.color || C.gold}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "truncate text-sm"
    }, f.title), /*#__PURE__*/React.createElement("div", {
      className: "mt-0.5 text-xs truncate",
      style: {
        fontFamily: MONO,
        color: C.muted
      }
    }, s ? s.name : "", f.paper ? " · " + f.paper : ""));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 grid gap-3 sm:grid-cols-2"
  }, subjects.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    onClick: () => setView({
      subject: s.id,
      cat: "notes",
      paper: null
    }),
    className: "relative text-left rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute left-0 top-0 bottom-0",
    style: {
      width: 6,
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute left-1.5 top-2 bottom-2 opacity-40",
    style: {
      width: 2,
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "pl-6 pr-4 py-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 500,
      letterSpacing: "-0.02em"
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 text-xs",
    style: {
      fontFamily: MONO,
      color: C.muted
    }
  }, counts[s.id] || 0, " pdf", (counts[s.id] || 0) === 1 ? "" : "s")))), adding ? /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg p-4",
    style: {
      background: C.surface,
      border: `1px dashed ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: newSubject,
    onChange: e => setNewSubject(e.target.value),
    onKeyDown: e => e.key === "Enter" && addSubject(),
    placeholder: "Subject name",
    className: "w-full bg-transparent text-sm outline-none pb-2",
    style: {
      color: C.text,
      borderBottom: `1px solid ${C.line}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addSubject,
    className: "rounded-md px-3 py-2 text-sm",
    style: {
      background: C.gold,
      color: "#171310"
    }
  }, "Add subject"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setAdding(false);
      setNewSubject("");
    },
    className: "rounded-md px-3 py-2 text-sm",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`
    }
  }, "Cancel"))) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdding(true),
    className: "rounded-lg py-5 px-4 text-sm text-left",
    style: {
      border: `1px dashed ${C.line}`,
      color: C.muted
    }
  }, /*#__PURE__*/React.createElement(IcPlus, {
    size: 16,
    style: {
      display: "inline",
      marginRight: 8,
      verticalAlign: "-3px"
    }
  }), "Add a subject"))) : /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setView({
      subject: null,
      cat: "notes",
      paper: null
    }),
    className: "flex items-center gap-1 text-sm mb-5",
    style: {
      color: C.muted
    }
  }, /*#__PURE__*/React.createElement(IcBack, {
    size: 16
  }), " All subjects"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 34,
      background: subject.color,
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.02em"
    }
  }, subject.name)), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 flex gap-1 overflow-x-auto pb-1 no-print"
  }, CATS.map(c => {
    const active = view.cat === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setView({
        ...view,
        cat: c.id,
        paper: null
      }),
      className: "whitespace-nowrap rounded-md px-3 py-2 text-sm",
      style: {
        background: active ? C.raised : "transparent",
        color: active ? C.text : C.muted,
        border: `1px solid ${active ? subject.color : "transparent"}`
      }
    }, c.label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-5"
  }, view.cat === "tips" ? /*#__PURE__*/React.createElement(TipsPanel, {
    subject: subject,
    notes: notes.filter(n => n.subject_id === subject.id),
    onAdd: addNote,
    onDelete: delNote
  }) : /*#__PURE__*/React.createElement(FilesPanel, {
    subject: subject,
    cat: view.cat,
    fileInput: fileInput,
    onFiles: upload,
    paper: view.paper,
    setPaper: p => setView({
      ...view,
      paper: p
    }),
    files: files.filter(f => {
      if (f.subject_id !== subject.id) return false;
      const inTab = view.cat === "papers" ? f.cat === "papers" || f.cat === "prelims" : f.cat === view.cat;
      if (!inTab) return false;
      return view.paper ? f.paper === view.paper : true;
    }),
    notes: notes,
    onAddBookmark: addBookmark,
    onDeleteNote: delNote,
    onOpen: openFile,
    onPrint: printFile,
    onDownload: downloadFile,
    onDelete: removeFile
  })))), viewing && /*#__PURE__*/React.createElement(Viewer, {
    key: viewing.file.id,
    file: viewing.file,
    subject: subjects.find(s => s.id === viewing.file.subject_id),
    bookmarks: notes.filter(n => n.kind === "bookmark" && n.file_id === viewing.file.id),
    getBytes: bytesFor,
    onAddBookmark: addBookmark,
    onDeleteNote: delNote,
    onClose: () => setViewing(null)
  }));
}

/* ---------------- files ---------------- */
function FilesPanel({
  subject,
  cat,
  files,
  fileInput,
  onFiles,
  paper,
  setPaper,
  notes = [],
  onAddBookmark,
  onDeleteNote,
  onOpen,
  onPrint,
  onDownload,
  onDelete
}) {
  const [drag, setDrag] = useState(false);
  const meta = CATS.find(c => c.id === cat);
  const folders = papersFor(subject.name);
  return /*#__PURE__*/React.createElement("div", null, folders.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-5 flex gap-2 flex-wrap no-print"
  }, [null, ...folders].map(p => {
    const on = paper === p;
    return /*#__PURE__*/React.createElement("button", {
      key: p || "all",
      onClick: () => setPaper(p),
      className: "rounded-md px-3 py-1.5 text-xs",
      style: {
        fontFamily: MONO,
        background: on ? subject.color : "transparent",
        color: on ? "#000000" : C.muted,
        border: `1px solid ${on ? subject.color : C.line}`
      }
    }, p || "all");
  })), cat === "papers" && /*#__PURE__*/React.createElement("div", {
    className: "mb-5 rounded-lg overflow-hidden no-print",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-4"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Get papers from")), /*#__PURE__*/React.createElement("ul", {
    className: "mt-2 pb-2"
  }, SOURCES.map(s => /*#__PURE__*/React.createElement("li", {
    key: s.href
  }, /*#__PURE__*/React.createElement("a", {
    href: s.href,
    target: "_blank",
    rel: "noreferrer",
    className: "flex items-start gap-3 px-4 py-3",
    style: {
      borderTop: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcOpen, {
    size: 15,
    style: {
      color: subject.color,
      marginTop: 2,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-sm"
  }, s.name), /*#__PURE__*/React.createElement("span", {
    className: "block text-xs mt-0.5",
    style: {
      color: C.muted
    }
  }, s.note)))))), /*#__PURE__*/React.createElement("p", {
    className: "px-4 pb-4 text-xs",
    style: {
      color: "#5F6871"
    }
  }, "Download what you need there, then upload it below so it's on every device.")), /*#__PURE__*/React.createElement("div", {
    onDragOver: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: e => {
      e.preventDefault();
      setDrag(false);
      onFiles(e.dataTransfer.files);
    },
    className: "rounded-lg px-4 py-6 text-center no-print",
    style: {
      border: `1px dashed ${drag ? subject.color : "#2E3641"}`,
      background: drag ? C.raised : "transparent"
    }
  }, /*#__PURE__*/React.createElement(IcUp, {
    size: 18,
    style: {
      color: C.muted,
      margin: "0 auto"
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-sm",
    style: {
      color: C.muted
    }
  }, "Drop PDFs here, or"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileInput.current?.click(),
    className: "mt-2 rounded-md px-3 py-2 text-sm",
    style: {
      background: subject.color,
      color: "#000000"
    }
  }, "Choose files"), /*#__PURE__*/React.createElement("input", {
    ref: fileInput,
    type: "file",
    accept: "application/pdf",
    multiple: true,
    className: "hidden",
    onChange: e => {
      onFiles(e.target.files);
      e.target.value = "";
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-xs",
    style: {
      fontFamily: MONO,
      color: "#5F6871"
    }
  }, "up to 50 MB per pdf", paper ? ` · filing into ${paper}` : "")), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 space-y-2"
  }, files.map(f => /*#__PURE__*/React.createElement(FileRow, {
    key: f.id,
    file: f,
    subject: subject,
    bookmarks: notes.filter(n => n.kind === "bookmark" && n.file_id === f.id),
    onAddBookmark: onAddBookmark,
    onDeleteNote: onDeleteNote,
    onOpen: onOpen,
    onPrint: onPrint,
    onDownload: onDownload,
    onDelete: onDelete
  })), !files.length && /*#__PURE__*/React.createElement("p", {
    className: "text-sm py-6",
    style: {
      color: C.muted
    }
  }, meta.blank)));
}
function FileRow({
  file,
  subject,
  showSubject,
  bookmarks = [],
  onAddBookmark,
  onDeleteNote,
  onOpen,
  onPrint,
  onDownload,
  onDelete
}) {
  const [confirm, setConfirm] = useState(false);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [page, setPage] = useState("");
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg px-3 py-3",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: subject?.color || C.muted,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(IcFile, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "truncate text-sm"
  }, file.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-0.5",
    style: {
      fontFamily: MONO,
      color: C.muted
    }
  }, showSubject && subject ? subject.name + " · " : "", file.paper ? file.paper + " · " : "", fmtSize(file.size))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0 no-print"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: IcOpen,
    title: "Open",
    onClick: () => onOpen(file)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: IcPrint,
    title: "Print",
    onClick: () => onPrint(file)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: IcDown,
    title: "Download",
    onClick: () => onDownload(file)
  }), onAddBookmark && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(v => !v),
    title: "Bookmarks",
    className: "rounded-md px-2 py-1 text-xs",
    style: {
      color: bookmarks.length ? subject?.color || C.gold : C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, bookmarks.length ? `${bookmarks.length} ★` : "★"), confirm ? /*#__PURE__*/React.createElement("button", {
    onClick: () => onDelete(file),
    className: "rounded-md px-2 py-1 text-xs",
    style: {
      color: C.danger,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, "remove?") : /*#__PURE__*/React.createElement(IconBtn, {
    icon: IcTrash,
    title: "Remove",
    onClick: () => setConfirm(true)
  }))), open && onAddBookmark && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 pt-3 no-print",
    style: {
      borderTop: `1px solid ${C.line}`
    }
  }, bookmarks.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: "flex items-center gap-2 py-1.5 text-sm"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpen(file, b.page),
    className: "flex-1 text-left truncate underline",
    style: {
      color: C.text
    }
  }, b.text), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      fontFamily: MONO,
      color: C.muted
    }
  }, b.page ? "p" + b.page : ""), /*#__PURE__*/React.createElement("button", {
    onClick: () => onDeleteNote(b.id),
    style: {
      color: C.muted
    },
    "aria-label": "Delete bookmark"
  }, /*#__PURE__*/React.createElement(IcX, {
    size: 13
  })))), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: label,
    onChange: e => setLabel(e.target.value),
    placeholder: "e.g. Cash flow adjustments",
    className: "flex-1 min-w-0 rounded-md px-2 py-1.5 text-sm outline-none",
    style: {
      background: C.raised,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: page,
    onChange: e => setPage(e.target.value.replace(/\D/g, "")),
    placeholder: "pg",
    inputMode: "numeric",
    className: "w-14 rounded-md px-2 py-1.5 text-sm outline-none",
    style: {
      background: C.raised,
      border: `1px solid ${C.line}`,
      color: C.text,
      fontFamily: MONO
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (label.trim()) {
        onAddBookmark(file, label.trim(), Number(page) || null);
        setLabel("");
        setPage("");
      }
    },
    className: "rounded-md px-3 py-1.5 text-sm shrink-0",
    style: {
      background: subject?.color || C.gold,
      color: "#000000"
    }
  }, "Save"))));
}

/* ---------------- tips + links ---------------- */
function TipsPanel({
  subject,
  notes,
  onAdd,
  onDelete
}) {
  const [tip, setTip] = useState("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const tips = notes.filter(n => n.kind === "tip"); // bookmarks live on the file rows
  const links = notes.filter(n => n.kind === "link");
  return /*#__PURE__*/React.createElement("div", {
    className: "grid gap-6 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Exam tips"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 rounded-lg p-3 no-print",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: tip,
    onChange: e => setTip(e.target.value),
    rows: 3,
    placeholder: "What does the examiner actually want in this section?",
    className: "w-full bg-transparent text-sm outline-none resize-none",
    style: {
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (tip.trim()) {
        onAdd({
          subject_id: subject.id,
          kind: "tip",
          text: tip.trim()
        });
        setTip("");
      }
    },
    className: "rounded-md px-3 py-1.5 text-sm",
    style: {
      background: subject.color,
      color: "#000000"
    }
  }, "Save tip"))), starterTipsFor(subject.name).length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "mt-3 space-y-2"
  }, starterTipsFor(subject.name).map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "rounded-lg px-3 py-3 flex gap-3 text-sm",
    style: {
      background: "transparent",
      border: `1px dashed ${C.line}`,
      color: C.muted
    }
  }, /*#__PURE__*/React.createElement(IcBulb, {
    size: 16,
    style: {
      color: subject.color,
      flexShrink: 0,
      marginTop: 2,
      opacity: 0.7
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "flex-1"
  }, t)))), /*#__PURE__*/React.createElement("ul", {
    className: "mt-3 space-y-2"
  }, tips.map(t => /*#__PURE__*/React.createElement("li", {
    key: t.id,
    className: "rounded-lg px-3 py-3 flex gap-3 text-sm",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcBulb, {
    size: 16,
    style: {
      color: subject.color,
      flexShrink: 0,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 whitespace-pre-wrap"
  }, t.text), /*#__PURE__*/React.createElement("button", {
    className: "no-print",
    onClick: () => onDelete(t.id),
    style: {
      color: C.muted
    },
    "aria-label": "Delete tip"
  }, /*#__PURE__*/React.createElement(IcX, {
    size: 14
  })))), !tips.length && /*#__PURE__*/React.createElement("p", {
    className: "text-xs",
    style: {
      color: "#5F6871"
    }
  }, "The dashed ones above are built in. Anything you add below sits with them."))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Links"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 rounded-lg p-3 space-y-2 no-print",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: label,
    onChange: e => setLabel(e.target.value),
    placeholder: "Name, e.g. school past paper drive",
    className: "w-full bg-transparent text-sm outline-none pb-2",
    style: {
      color: C.text,
      borderBottom: `1px solid ${C.line}`
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: url,
    onChange: e => setUrl(e.target.value),
    placeholder: "Paste the link",
    className: "w-full bg-transparent text-sm outline-none pb-2",
    style: {
      color: C.text,
      borderBottom: `1px solid ${C.line}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const u = url.trim();
      if (!u) return;
      const href = /^https?:\/\//i.test(u) ? u : "https://" + u;
      onAdd({
        subject_id: subject.id,
        kind: "link",
        text: label.trim() || href,
        href
      });
      setLabel("");
      setUrl("");
    },
    className: "rounded-md px-3 py-1.5 text-sm",
    style: {
      background: subject.color,
      color: "#000000"
    }
  }, "Save link"))), /*#__PURE__*/React.createElement("ul", {
    className: "mt-3 space-y-2"
  }, links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l.id,
    className: "rounded-lg px-3 py-3 flex items-center gap-3 text-sm",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcLink, {
    size: 16,
    style: {
      color: subject.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: l.href,
    target: "_blank",
    rel: "noreferrer",
    className: "flex-1 truncate underline",
    style: {
      color: C.text
    }
  }, l.text), /*#__PURE__*/React.createElement("button", {
    className: "no-print",
    onClick: () => onDelete(l.id),
    style: {
      color: C.muted
    },
    "aria-label": "Delete link"
  }, /*#__PURE__*/React.createElement(IcX, {
    size: 14
  })))), !links.length && /*#__PURE__*/React.createElement("p", {
    className: "text-sm",
    style: {
      color: C.muted
    }
  }, "Nothing saved. Paste the drive or site you pull papers from."))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));

/* ================= annotating viewer ================= */

const PEN_COLORS = ["#E0B252", "#E85B5B", "#4EA1E8", "#5FC98A", "#FFFFFF"];
const MAX_IMG_PX = 1400;
const IcPen = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M12 20h9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"
})));
const IcHi = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M4 20h16"
}), /*#__PURE__*/React.createElement("path", {
  d: "m9 16 8.5-8.5a2 2 0 0 0-3-3L6 13v3z"
})));
const IcErase = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M4 20h10"
}), /*#__PURE__*/React.createElement("path", {
  d: "m14 4 6 6-8 8H8l-4-4z"
})));
const IcNote = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M5 4h14v11l-4 5H5z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M15 20v-5h4"
})));
const IcImg = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "16",
  rx: "2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "10",
  r: "1.6"
}), /*#__PURE__*/React.createElement("path", {
  d: "m4 18 5-5 4 4 3-3 4 4"
})));
const IcUndo = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M4 9h11a5 5 0 0 1 0 10h-4"
}), /*#__PURE__*/React.createElement("path", {
  d: "m8 5-4 4 4 4"
})));
const IcLeft = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "m14 6-6 6 6 6"
})));
const IcRight = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "m10 6 6 6-6 6"
})));
const IcClose = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M6 6l12 12"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18"
})));
const IcSaveAs = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M12 3v11"
}), /*#__PURE__*/React.createElement("path", {
  d: "m8 10 4 4 4-4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 21h16"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 17v4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20 17v4"
})));
const blankPage = () => ({
  strokes: [],
  notes: [],
  images: []
});
function scaleImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, MAX_IMG_PX / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve({
          src: c.toDataURL("image/jpeg", 0.82),
          ratio: c.height / c.width
        });
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("bad file"));
    reader.readAsDataURL(file);
  });
}

/* draw one page's annotations onto a 2d context sized w x h */
function paint(ctx, w, h, data, imgCache) {
  (data.images || []).forEach(im => {
    const el = imgCache[im.src];
    if (el && el.complete) ctx.drawImage(el, im.x * w, im.y * h, im.w * w, im.w * w * im.ratio);
  });
  (data.strokes || []).forEach(s => {
    if (!s.pts || s.pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = s.alpha ?? 1;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0] * w, s.pts[0][1] * h);
    for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0] * w, s.pts[i][1] * h);
    ctx.stroke();
    ctx.restore();
  });
  (data.notes || []).forEach(n => {
    const fs = Math.max(12, w * 0.022);
    ctx.save();
    ctx.font = `${fs}px 'Inter Tight', system-ui, sans-serif`;
    const words = String(n.text).split(/\s+/);
    const maxW = w * 0.3;
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    const padding = fs * 0.5;
    const boxW = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width))) + padding * 2;
    const boxH = lines.length * fs * 1.35 + padding * 2;
    const x = n.x * w,
      y = n.y * h;
    ctx.fillStyle = "rgba(255, 232, 168, 0.94)";
    ctx.strokeStyle = "rgba(120, 90, 20, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, boxW, boxH, 6) : ctx.rect(x, y, boxW, boxH);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#241D08";
    lines.forEach((l, i) => ctx.fillText(l, x + padding, y + padding + fs * (i + 0.85)));
    ctx.restore();
  });
}
function Viewer({
  file,
  subject,
  bookmarks,
  getBytes,
  onClose,
  onAddBookmark,
  onDeleteNote
}) {
  const [doc, setDoc] = useState(null);
  const [bytes, setBytes] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [ann, setAnn] = useState({});
  const [status, setStatus] = useState("Loading…");
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null);
  const [showTools, setShowTools] = useState(true);
  const [fingerDraws, setFingerDraws] = useState(false);
  const baseRef = useRef(null);
  const overRef = useRef(null);
  const wrapRef = useRef(null);
  const imgInput = useRef(null);
  const drawing = useRef(null);
  const undoStack = useRef([]);
  const penSeen = useRef(false);
  const active = useRef(new Set());
  const saveTimer = useRef(null);
  const imgCache = useRef({});
  const renderTask = useRef(null);
  const pageData = ann[pageNum] || blankPage();

  /* ---- load pdf + saved annotations ---- */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const buf = await getBytes(file);
        if (dead || !buf) return;
        setBytes(buf);
        const pdf = await window.pdfjsLib.getDocument({
          data: buf.slice(0)
        }).promise;
        if (dead) return;
        setDoc(pdf);
        setStatus("");
        const {
          data
        } = await sb.from("annotations").select("*").eq("file_id", file.id);
        if (dead) return;
        const map = {};
        (data || []).forEach(r => {
          map[r.page] = r.data || blankPage();
        });
        setAnn(map);
        Object.values(map).forEach(p => (p.images || []).forEach(im => cacheImg(im.src)));
      } catch (e) {
        setStatus("This PDF couldn't be opened here. Try Download instead.");
      }
    })();
    return () => {
      dead = true;
    };
  }, [file.id]);
  const cacheImg = src => {
    if (imgCache.current[src]) return imgCache.current[src];
    const el = new Image();
    el.onload = () => redraw();
    el.src = src;
    imgCache.current[src] = el;
    return el;
  };

  /* ---- render the pdf page ---- */
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNum);
      if (cancelled) return;
      const wrapW = (wrapRef.current?.clientWidth || 900) - 8;
      const raw = page.getViewport({
        scale: 1
      });
      const scale = wrapW / raw.width * zoom;
      const vp = page.getViewport({
        scale
      });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = baseRef.current,
        over = overRef.current;
      [base, over].forEach(c => {
        c.width = Math.floor(vp.width * dpr);
        c.height = Math.floor(vp.height * dpr);
        c.style.width = Math.floor(vp.width) + "px";
        c.style.height = Math.floor(vp.height) + "px";
      });
      const ctx = base.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vp.width, vp.height);
      if (renderTask.current) {
        try {
          renderTask.current.cancel();
        } catch {}
      }
      renderTask.current = page.render({
        canvasContext: ctx,
        viewport: vp
      });
      try {
        await renderTask.current.promise;
      } catch {}
      redraw();
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNum, zoom]);
  const redraw = () => {
    const over = overRef.current;
    if (!over) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = over.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = over.width / dpr,
      h = over.height / dpr;
    ctx.clearRect(0, 0, w, h);
    paint(ctx, w, h, ann[pageNum] || blankPage(), imgCache.current);
    const live = drawing.current;
    if (live && live.pts.length > 1) paint(ctx, w, h, {
      strokes: [live]
    }, {});
  };
  useEffect(redraw, [ann, pageNum]);

  /* ---- persist ---- */
  const commit = (nextPage, {
    skipUndo
  } = {}) => {
    if (!skipUndo) {
      undoStack.current.push(JSON.stringify(ann[pageNum] || blankPage()));
      if (undoStack.current.length > 40) undoStack.current.shift();
    }
    const next = {
      ...ann,
      [pageNum]: nextPage
    };
    setAnn(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(pageNum, nextPage), 700);
  };
  const save = async (page, data) => {
    setSaving(true);
    const {
      error
    } = await sb.from("annotations").upsert({
      file_id: file.id,
      page,
      data
    }, {
      onConflict: "file_id,page"
    });
    setSaving(false);
    if (error) setStatus("Your last mark didn't save. Check your connection.");
  };
  const undo = () => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    const data = JSON.parse(prev);
    setAnn(a => ({
      ...a,
      [pageNum]: data
    }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(pageNum, data), 400);
  };

  /* ---- pointer ---- */
  const norm = e => {
    const r = overRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  const hitTest = pt => {
    const data = ann[pageNum] || blankPage();
    const [x, y] = pt;
    for (let i = (data.notes || []).length - 1; i >= 0; i--) {
      const n = data.notes[i];
      if (x > n.x - 0.01 && x < n.x + 0.33 && y > n.y - 0.01 && y < n.y + 0.09) return {
        kind: "notes",
        i
      };
    }
    for (let i = (data.images || []).length - 1; i >= 0; i--) {
      const im = data.images[i];
      if (x > im.x && x < im.x + im.w && y > im.y && y < im.y + im.w * im.ratio * 1.4) return {
        kind: "images",
        i
      };
    }
    for (let i = (data.strokes || []).length - 1; i >= 0; i--) {
      const s = data.strokes[i];
      if ((s.pts || []).some(p => Math.abs(p[0] - x) < 0.02 && Math.abs(p[1] - y) < 0.02)) return {
        kind: "strokes",
        i
      };
    }
    return null;
  };
  const onDown = e => {
    active.current.add(e.pointerId);
    if (e.pointerType === "pen") penSeen.current = true;

    // more than one finger down: that's a pinch or a pan, never a stroke
    if (active.current.size > 1) {
      drawing.current = null;
      redraw();
      return;
    }
    if (e.pointerType === "touch") {
      if (penSeen.current) return; // palm rejection once a stylus is in use
      if (!fingerDraws) return; // finger scrolls and zooms by default
    }
    const pt = norm(e);
    if (tool === "erase") {
      const hit = hitTest(pt);
      if (hit) {
        const data = JSON.parse(JSON.stringify(ann[pageNum] || blankPage()));
        data[hit.kind].splice(hit.i, 1);
        commit(data);
      }
      return;
    }
    if (tool === "note") {
      setNoteDraft({
        x: pt[0],
        y: pt[1],
        text: ""
      });
      return;
    }
    if (tool === "image") {
      imgInput.current.dataset.x = pt[0];
      imgInput.current.dataset.y = pt[1];
      imgInput.current.click();
      return;
    }
    overRef.current.setPointerCapture(e.pointerId);
    drawing.current = tool === "highlight" ? {
      pts: [pt],
      color,
      width: 0.028,
      alpha: 0.35
    } : {
      pts: [pt],
      color,
      width: 0.004,
      alpha: 1
    };
  };
  const onMove = e => {
    if (active.current.size > 1) {
      drawing.current = null;
      return;
    }
    if (!drawing.current) return;
    drawing.current.pts.push(norm(e));
    redraw();
  };
  const onUp = e => {
    if (e && e.pointerId != null) active.current.delete(e.pointerId);
    const s = drawing.current;
    drawing.current = null;
    if (!s || s.pts.length < 2) {
      redraw();
      return;
    }
    const data = JSON.parse(JSON.stringify(ann[pageNum] || blankPage()));
    data.strokes.push(s);
    commit(data);
  };
  const addNote = () => {
    if (!noteDraft || !noteDraft.text.trim()) {
      setNoteDraft(null);
      return;
    }
    const data = JSON.parse(JSON.stringify(ann[pageNum] || blankPage()));
    data.notes.push({
      x: noteDraft.x,
      y: noteDraft.y,
      text: noteDraft.text.trim()
    });
    commit(data);
    setNoteDraft(null);
  };
  const addImage = async f => {
    if (!f) return;
    try {
      const {
        src,
        ratio
      } = await scaleImage(f);
      cacheImg(src);
      const data = JSON.parse(JSON.stringify(ann[pageNum] || blankPage()));
      data.images.push({
        x: Number(imgInput.current.dataset.x || 0.3),
        y: Number(imgInput.current.dataset.y || 0.3),
        w: 0.35,
        ratio,
        src
      });
      commit(data);
    } catch {
      setStatus("That image couldn't be added.");
    }
  };

  /* ---- export a flattened copy ---- */
  const exportFlat = async () => {
    if (!bytes) return;
    setStatus("Building your copy…");
    try {
      const {
        PDFDocument
      } = window.PDFLib;
      const pdf = await PDFDocument.load(bytes.slice(0));
      const pages = pdf.getPages();
      for (const [pageStr, data] of Object.entries(ann)) {
        const idx = Number(pageStr) - 1;
        const page = pages[idx];
        if (!page) continue;
        if (!(data.strokes?.length || data.notes?.length || data.images?.length)) continue;
        const {
          width,
          height
        } = page.getSize();
        const c = document.createElement("canvas");
        const scale = 2;
        c.width = Math.round(width * scale);
        c.height = Math.round(height * scale);
        const ctx = c.getContext("2d");
        ctx.scale(scale, scale);
        await Promise.all((data.images || []).map(im => new Promise(res => {
          const el = cacheImg(im.src);
          if (el.complete) return res();
          el.onload = () => res();
          el.onerror = () => res();
        })));
        paint(ctx, width, height, data, imgCache.current);
        const png = await pdf.embedPng(c.toDataURL("image/png"));
        page.drawImage(png, {
          x: 0,
          y: 0,
          width,
          height
        });
      }
      const out = await pdf.save();
      const url = URL.createObjectURL(new Blob([out], {
        type: "application/pdf"
      }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.title} (annotated).pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("");
    } catch {
      setStatus("Couldn't build the annotated copy.");
    }
  };
  const TOOLS = [{
    id: "pen",
    icon: IcPen,
    label: "Pen"
  }, {
    id: "highlight",
    icon: IcHi,
    label: "Highlighter"
  }, {
    id: "note",
    icon: IcNote,
    label: "Note"
  }, {
    id: "image",
    icon: IcImg,
    label: "Image"
  }, {
    id: "erase",
    icon: IcErase,
    label: "Erase"
  }];
  const accent = subject?.color || C.gold;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex flex-col",
    style: {
      background: C.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 shrink-0",
    style: {
      borderBottom: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "rounded-md p-2",
    style: {
      color: C.muted
    },
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement(IcClose, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "truncate text-sm"
  }, file.title), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      fontFamily: MONO,
      color: C.muted
    }
  }, doc ? `${pageNum} / ${doc.numPages}` : status || "…", saving ? " · saving" : "")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(2))),
    className: "rounded-md px-2 py-1 text-xs",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoom(z => Math.min(3, +(z + 0.2).toFixed(2))),
    className: "rounded-md px-2 py-1 text-xs",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, "+"), /*#__PURE__*/React.createElement("button", {
    onClick: exportFlat,
    title: "Save a copy with your notes",
    className: "rounded-md p-2",
    style: {
      color: C.muted
    }
  }, /*#__PURE__*/React.createElement(IcSaveAs, {
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "flex-1 overflow-auto flex justify-center p-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative",
    style: {
      height: "fit-content"
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: baseRef,
    className: "block rounded",
    style: {
      background: "#FFFFFF"
    }
  }), /*#__PURE__*/React.createElement("canvas", {
    ref: overRef,
    className: "absolute left-0 top-0",
    style: {
      touchAction: fingerDraws ? "none" : "pan-x pan-y pinch-zoom",
      cursor: tool === "erase" ? "cell" : "crosshair"
    },
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp
  }), noteDraft && /*#__PURE__*/React.createElement("div", {
    className: "absolute",
    style: {
      left: `${noteDraft.x * 100}%`,
      top: `${noteDraft.y * 100}%`,
      width: "34%"
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    autoFocus: true,
    rows: 3,
    value: noteDraft.text,
    onChange: e => setNoteDraft({
      ...noteDraft,
      text: e.target.value
    }),
    onBlur: addNote,
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addNote();
      }
    },
    placeholder: "type your note",
    className: "w-full rounded-md p-2 text-sm outline-none resize-none",
    style: {
      background: "#FFE8A8",
      color: "#241D08",
      border: "1px solid rgba(120,90,20,.5)"
    }
  })))), /*#__PURE__*/React.createElement("input", {
    ref: imgInput,
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: e => {
      addImage(e.target.files[0]);
      e.target.value = "";
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "shrink-0",
    style: {
      borderTop: `1px solid ${C.line}`
    }
  }, showTools && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 overflow-x-auto"
  }, TOOLS.map(t => {
    const on = tool === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => setTool(t.id),
      title: t.label,
      className: "rounded-md p-2 shrink-0",
      style: {
        color: on ? "#000000" : C.muted,
        background: on ? accent : "transparent",
        border: `1px solid ${on ? accent : C.line}`
      }
    }, /*#__PURE__*/React.createElement(t.icon, {
      size: 18
    }));
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 24,
      background: C.line
    }
  }), PEN_COLORS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setColor(c),
    "aria-label": "Colour " + c,
    className: "rounded-full shrink-0",
    style: {
      width: 22,
      height: 22,
      background: c,
      border: color === c ? `2px solid ${C.text}` : `1px solid ${C.line}`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 24,
      background: C.line
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: undo,
    title: "Undo",
    className: "rounded-md p-2 shrink-0",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement(IcUndo, {
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFingerDraws(v => !v),
    title: "What your finger does",
    className: "rounded-md px-2 py-2 text-xs shrink-0",
    style: {
      fontFamily: MONO,
      whiteSpace: "nowrap",
      color: fingerDraws ? "#000000" : C.muted,
      background: fingerDraws ? accent : "transparent",
      border: `1px solid ${fingerDraws ? accent : C.line}`
    }
  }, fingerDraws ? "finger draws" : "finger zooms")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-2",
    style: {
      borderTop: `1px solid ${C.line}`
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPageNum(p => Math.max(1, p - 1)),
    className: "rounded-md p-2",
    style: {
      color: C.muted
    },
    "aria-label": "Previous page"
  }, /*#__PURE__*/React.createElement(IcLeft, {
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPageNum(p => Math.min(doc?.numPages || 1, p + 1)),
    className: "rounded-md p-2",
    style: {
      color: C.muted
    },
    "aria-label": "Next page"
  }, /*#__PURE__*/React.createElement(IcRight, {
    size: 18
  })), /*#__PURE__*/React.createElement("select", {
    value: pageNum,
    onChange: e => setPageNum(Number(e.target.value)),
    className: "rounded-md px-2 py-1.5 text-xs outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text,
      fontFamily: MONO
    }
  }, Array.from({
    length: doc?.numPages || 1
  }, (_, i) => i + 1).map(p => /*#__PURE__*/React.createElement("option", {
    key: p,
    value: p
  }, `page ${p}`))), bookmarks.length > 0 && /*#__PURE__*/React.createElement("select", {
    value: "",
    onChange: e => e.target.value && setPageNum(Number(e.target.value)),
    className: "rounded-md px-2 py-1.5 text-xs outline-none min-w-0 flex-1",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.muted,
      fontFamily: MONO
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "bookmarks"), bookmarks.filter(b => b.page).map(b => /*#__PURE__*/React.createElement("option", {
    key: b.id,
    value: b.page
  }, b.text))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onAddBookmark(file, `Page ${pageNum}`, pageNum),
    className: "ml-auto rounded-md px-2 py-1.5 text-xs shrink-0",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, "\u2605 here"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowTools(v => !v),
    className: "rounded-md px-2 py-1.5 text-xs shrink-0",
    style: {
      color: C.muted,
      border: `1px solid ${C.line}`,
      fontFamily: MONO
    }
  }, showTools ? "hide" : "tools"))));
}