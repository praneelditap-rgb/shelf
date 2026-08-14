const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;

/* ---------------- tokens ---------------- */
const C = {
  bg: "#0E1114",
  surface: "#161A1F",
  raised: "#1C222A",
  line: "#272E37",
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
  papers: ["P1", "P2", "P3"]
}, {
  match: ["afrikaans"],
  papers: ["P1", "P2", "P3"]
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
function SignIn({
  onSent,
  sent
}) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return setErr("Enter the email address you want to sign in with.");
    const allow = (cfg.ALLOWED_EMAILS || []).map(x => x.toLowerCase());
    if (allow.length && !allow.includes(e)) return setErr("That address isn't on the list for this shelf.");
    setBusy(true);
    setErr("");
    const {
      error
    } = await sb.auth.signInWithOtp({
      email: e,
      options: {
        emailRedirectTo: window.location.href
      }
    });
    setBusy(false);
    if (error) setErr(error.message);else onSent(e);
  };
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
  }, "Shelf")), /*#__PURE__*/React.createElement("h1", {
    className: "mt-6 text-2xl leading-tight",
    style: {
      fontFamily: DISPLAY,
      fontWeight: 700,
      letterSpacing: "-0.03em"
    }
  }, "Sign in to open your shelf."), sent ? /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-sm",
    style: {
      color: C.muted
    }
  }, "Check ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.text
    }
  }, sent), " for a sign-in link and open it on this device. The link works once and lasts about an hour.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: C.muted
    }
  }, "No password. We email you a link that signs you in."), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    onKeyDown: e => e.key === "Enter" && send(),
    placeholder: "your email",
    className: "mt-5 w-full rounded-md px-3 py-3 text-sm outline-none",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`,
      color: C.text
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    disabled: busy,
    className: "mt-3 w-full rounded-md px-3 py-3 text-sm disabled:opacity-50",
    style: {
      background: C.gold,
      color: "#171310"
    }
  }, busy ? "Sending…" : "Email me a link"), err && /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm",
    style: {
      color: "#EFC9C9"
    }
  }, err))));
}

/* ---------------- app ---------------- */
function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [sent, setSent] = useState("");
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
    } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
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
      const seeded = await sb.from("subjects").insert(DEFAULT_SUBJECTS).select();
      setSubjects(seeded.data || []);
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
  if (!session) return /*#__PURE__*/React.createElement(SignIn, {
    sent: sent,
    onSent: setSent
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
  const openFile = async f => {
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
      background: "rgba(14,17,20,0.92)",
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
  }, "Pick a subject to open its notes, past papers, other schools' prelims and tips."), /*#__PURE__*/React.createElement("div", {
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
    onOpen: openFile,
    onPrint: printFile,
    onDownload: downloadFile,
    onDelete: removeFile
  })))));
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
        color: on ? "#0E1114" : C.muted,
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
      color: "#0E1114"
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
  onOpen,
  onPrint,
  onDownload,
  onDelete
}) {
  const [confirm, setConfirm] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg px-3 py-3 flex items-center gap-3",
    style: {
      background: C.surface,
      border: `1px solid ${C.line}`
    }
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
  }), confirm ? /*#__PURE__*/React.createElement("button", {
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
  })));
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
  const tips = notes.filter(n => n.kind === "tip");
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
      color: "#0E1114"
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
      color: "#0E1114"
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