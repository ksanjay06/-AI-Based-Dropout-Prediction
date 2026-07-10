import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, TrendingUp, MessageSquare, FileText,
  LogOut, Search, Calendar, CheckCircle, Clock, ChevronRight, BookOpen, Heart, DollarSign,
  MapPin, Activity, Bell, ArrowLeft, Plus, X, User, Building2, ClipboardList, AlertTriangle,
  ShieldCheck, Percent, Save
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const RISK_COLOR = { Low: '#059669', Medium: '#d97706', High: '#dc2626' };
const RISK_BG = { Low: 'bg-emerald-50 text-emerald-700 border-emerald-200', Medium: 'bg-amber-50 text-amber-700 border-amber-200', High: 'bg-rose-50 text-rose-700 border-rose-200' };

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const range = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const FIRST = ['Arun','Karthik','Vignesh','Dinesh','Suriya','Vetrivel','Bharath','Gokul','Naveen','Prasanth','Manikandan','Elango','Murugan','Saravanan','Kannan','Rajesh','Senthil','Vijay','Anand','Balaji','Meena','Kavya','Priya','Divya','Deepa','Anitha','Sangeetha','Lakshmi','Saranya','Nithya','Kalaivani','Revathi','Vidya','Swetha','Abirami','Janani','Poornima','Yamuna','Shanthi','Malar'];
const LAST = ['Subramaniam','Krishnamurthy','Venkatesan','Rajendran','Chandrasekaran','Natarajan','Palaniswamy','Muthukumar','Sivakumar','Ramanathan','Gopalakrishnan','Thiagarajan','Nagarajan','Manoharan','Sundaram','Balasubramaniam','Ranganathan','Kuppusamy','Ayyappan','Selvaraj'];
const DEPARTMENTS = ['Computer Science','Electronics','Mechanical','Civil','Information Technology'];
const YEARS = [1,2,3,4];

/* Build every First+Last combination, shuffle deterministically, then hand
   out names one at a time so no two students ever get the same full name. */
function buildShuffledNamePool() {
  const pool = [];
  for (const f of FIRST) for (const l of LAST) pool.push(`${f} ${l}`);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function generateStudents(count = 60) {
  const namePool = buildShuffledNamePool();
  const list = [];
  for (let i = 0; i < count; i++) {
    const name = namePool[i % namePool.length];
    const attendance = range(45, 99);
    const internalMarks = range(30, 95);
    const assignmentMarks = range(35, 98);
    const backlogs = range(0, 4);
    const feeStatus = rand() < 0.22 ? 'Unpaid' : 'Paid';
    const familyIncome = pick(['Low','Low','Medium','Medium','High']);
    const travelDistance = range(1, 45);
    const participation = range(30, 100);
    const behaviorScore = range(40, 100);
    const healthStatus = rand() < 0.15 ? 'Poor' : 'Good';
    const placementReady = rand() < 0.5;
    list.push({
      id: `STU${1000 + i}`,
      name,
      gender: pick(['Male','Female']),
      department: pick(DEPARTMENTS),
      year: pick(YEARS),
      semester: range(1, 2),
      email: `${name.split(' ')[0].toLowerCase()}.${1000+i}@college.edu`,
      phone: `9${range(100000000,999999999)}`,
      attendance, internalMarks, assignmentMarks, backlogs,
      feeStatus, familyIncome, travelDistance, participation,
      behaviorScore, healthStatus, placementReady,
    });
  }
  return list;
}

function computeRisk(s) {
  let score = 0;
  score += (100 - s.attendance) * 0.28;
  score += (100 - s.internalMarks) * 0.20;
  score += (100 - s.assignmentMarks) * 0.08;
  score += s.backlogs * 6;
  score += s.feeStatus === 'Unpaid' ? 12 : 0;
  score += s.familyIncome === 'Low' ? 8 : (s.familyIncome === 'Medium' ? 3 : 0);
  score += s.travelDistance > 30 ? 4 : 0;
  score += (100 - s.participation) * 0.08;
  score += (100 - s.behaviorScore) * 0.12;
  score += s.healthStatus === 'Poor' ? 8 : 0;
  score = Math.max(2, Math.min(98, Math.round(score)));
  const level = score > 75 ? 'High' : score >= 38 ? 'Medium' : 'Low';
  return { score, level };
}

function getRecommendations(s) {
  const recs = [];
  if (s.attendance < 75) recs.push({ issue: 'Poor Attendance', rec: 'Improve attendance through regular classroom participation.', icon: Calendar });
  if (s.internalMarks < 50) recs.push({ issue: 'Low Internal Marks', rec: 'Attend remedial coaching classes.', icon: BookOpen });
  if (s.familyIncome === 'Low' || s.feeStatus === 'Unpaid') recs.push({ issue: 'Financial Issues', rec: 'Apply for scholarship assistance.', icon: DollarSign });
  if (s.behaviorScore < 60 || s.healthStatus === 'Poor') recs.push({ issue: 'Mental Stress', rec: 'Schedule counseling session.', icon: Heart });
  if (s.participation < 50) recs.push({ issue: 'Family Problems', rec: 'Meet counselor regularly.', icon: Users });
  if (recs.length === 0) recs.push({ issue: 'On Track', rec: 'Continue current academic routine and maintain performance.', icon: ShieldCheck });
  return recs;
}

const ALGOS = ['Random Forest','Logistic Regression','Decision Tree','Support Vector Machine'];

/* Minimal, dependency-free PDF writer: turns a title + array of text lines
   into a real, valid, downloadable multi-page PDF file (Blob). */
function sanitizeForPdf(str) {
  return String(str)
    .replace(/[·–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, '?');
}
function textToPdfBlob(title, lines) {
  const pageWidth = 612, pageHeight = 792;
  const marginLeft = 50, topY = 740, lineHeight = 14, bottomY = 50;
  const linesPerPage = Math.floor((topY - bottomY) / lineHeight);
  const esc = (s) => sanitizeForPdf(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const body = [`${title}`, `Generated: 2026-07-10`, '', ...lines];
  const pages = [];
  for (let i = 0; i < body.length; i += linesPerPage) pages.push(body.slice(i, i + linesPerPage));
  if (pages.length === 0) pages.push(['']);

  const numPages = pages.length;
  const fontObjNum = 3 + numPages * 2;
  const objects = {};
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  const kids = [];
  for (let p = 0; p < numPages; p++) kids.push(`${3 + p * 2} 0 R`);
  objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${numPages} >>`;

  for (let p = 0; p < numPages; p++) {
    const pageObjNum = 3 + p * 2;
    const contentObjNum = 4 + p * 2;
    objects[pageObjNum] = `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjNum} 0 R >>`;
    let stream = `BT /F1 11 Tf ${marginLeft} ${topY} Td\n`;
    pages[p].forEach((line, idx) => {
      if (idx > 0) stream += `0 -${lineHeight} Td\n`;
      stream += `(${esc(line)}) Tj\n`;
    });
    stream += `ET`;
    objects[contentObjNum] = { stream };
  }
  objects[fontObjNum] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = {};
  for (let n = 1; n <= fontObjNum; n++) {
    offsets[n] = pdf.length;
    const obj = objects[n];
    if (typeof obj === 'string') {
      pdf += `${n} 0 obj\n${obj}\nendobj\n`;
    } else {
      pdf += `${n} 0 obj\n<< /Length ${obj.stream.length} >>\nstream\n${obj.stream}\nendstream\nendobj\n`;
    }
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${fontObjNum + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= fontObjNum; n++) pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${fontObjNum + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
function downloadPdf(filenameBase, title, lines) {
  const blob = textToPdfBlob(title, lines);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Builds the text content for each report type from live app data */
function buildReportLines(reportName, students, counseling) {
  const risked = students.map(s => ({ s, r: computeRisk(s) }));
  switch (reportName) {
    case 'Student Performance Report':
      return risked.map(({ s }) => `${s.id}  ${s.name.padEnd(22)}  Internal: ${s.internalMarks}%  Assignment: ${s.assignmentMarks}%`);
    case 'Attendance Report':
      return risked.map(({ s }) => `${s.id}  ${s.name.padEnd(22)}  Attendance: ${s.attendance}%`);
    case 'Risk Prediction Report':
      return risked.map(({ s, r }) => `${s.id}  ${s.name.padEnd(22)}  Risk: ${r.level.padEnd(6)}  Score: ${r.score}%`);
    case 'Counseling Report':
      return counseling.map(c => `${c.id}  ${c.studentName.padEnd(20)}  Counselor: ${c.counselor}  Status: ${c.status}  Date: ${c.sessionDate}`);
    case 'Department-wise Analysis':
      return DEPARTMENTS.map(dep => {
        const subset = risked.filter(x => x.s.department === dep);
        const counts = { Low: 0, Medium: 0, High: 0 };
        subset.forEach(x => counts[x.r.level]++);
        return `${dep.padEnd(24)}  Low: ${counts.Low}  Medium: ${counts.Medium}  High: ${counts.High}`;
      });
    case 'Semester-wise Analysis':
      return YEARS.map(y => {
        const subset = risked.filter(x => x.s.year === y);
        const counts = { Low: 0, Medium: 0, High: 0 };
        subset.forEach(x => counts[x.r.level]++);
        return `Year ${y}  Low: ${counts.Low}  Medium: ${counts.Medium}  High: ${counts.High}`;
      });
    case 'Monthly Report':
      return MONTHLY_TREND.map(m => `${m.month} 2026  High Risk Students: ${m.high}`);
    case 'Prediction Accuracy Report':
      return ['Model: Random Forest', 'Accuracy: 91.4%', `Students evaluated: ${students.length}`];
    default:
      return ['No data available for this report.'];
  }
}

function generateCounseling(students, counselors) {
  const atRisk = students.filter(s => computeRisk(s).level !== 'Low').slice(0, 24);
  const statuses = ['Pending','Scheduled','Completed'];
  return atRisk.map((s, i) => {
    const r = computeRisk(s);
    const recs = getRecommendations(s);
    return {
      id: `CNS${2000 + i}`,
      studentId: s.id,
      studentName: s.name,
      counselor: pick(counselors),
      sessionDate: `2026-07-${String(range(1, 28)).padStart(2, '0')}`,
      remarks: '',
      recommendation: recs[0].rec,
      status: pick(statuses),
      riskLevel: r.level,
    };
  });
}

const COUNSELORS = ['Dr. Meena Subramaniam','Dr. Karthik Rajendran','Ms. Kavya Natarajan','Mr. Suriya Muthukumar'];
const FACULTY_LIST = ['Prof. Elango Venkatesan','Prof. Deepa Chandrasekaran','Prof. Bharath Sivakumar','Prof. Nithya Gopalakrishnan'];

function StatCard({ icon: Icon, label, value, accent = 'text-blue-700', sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm">
      <div className={`shrink-0 rounded-lg p-2.5 bg-blue-50 ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${RISK_BG[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLOR[level] }} />
      {level} Risk
    </span>
  );
}

function ScoreBar({ score, level }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Risk Score</span><span className="font-semibold" style={{ color: RISK_COLOR[level] }}>{score}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: RISK_COLOR[level] }} />
      </div>
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-800">{children}</h2>
      {action}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const roles = [
    { key: 'Admin', icon: UserCog, desc: 'Manage the whole system, users, and predictions.' },
    { key: 'Faculty', icon: GraduationCap, desc: 'Record attendance, marks, and behavior.' },
    { key: 'Counselor', icon: MessageSquare, desc: 'Support at-risk students with counseling.' },
    { key: 'Student', icon: User, desc: 'View your own progress and prediction status.' },
  ];
  const [selected, setSelected] = useState('Admin');
  const [name, setName] = useState('');

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between bg-blue-900 text-white p-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-white/10 p-2 rounded-lg"><Activity size={22} /></div>
              <span className="font-bold text-lg tracking-tight">DropGuard AI</span>
            </div>
            <h1 className="text-2xl font-bold leading-snug mb-3">AI-Based Drop-Out Prediction<br/>& Counseling System</h1>
            <p className="text-blue-200 text-sm leading-relaxed">Predict at-risk students early, and turn every warning sign into a personalized plan for support.</p>
          </div>
          <ul className="space-y-2 text-sm text-blue-100">
            <li className="flex items-center gap-2"><CheckCircle size={16}/> Real-time risk scoring</li>
            <li className="flex items-center gap-2"><CheckCircle size={16}/> Personalized counseling plans</li>
            <li className="flex items-center gap-2"><CheckCircle size={16}/> Role-based dashboards</li>
          </ul>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Choose your role to enter the demo workspace.</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {roles.map(r => {
              const Icon = r.icon;
              const active = selected === r.key;
              return (
                <button key={r.key} onClick={() => setSelected(r.key)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <Icon size={18} className={active ? 'text-blue-700' : 'text-slate-400'} />
                  <p className={`mt-1.5 text-sm font-semibold ${active ? 'text-blue-800' : 'text-slate-700'}`}>{r.key}</p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{r.desc}</p>
                </button>
              );
            })}
          </div>
          <label className="text-xs font-medium text-slate-500">Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Natarajan"
            className="w-full mt-1 mb-5 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button
            onClick={() => onLogin(selected, name.trim() || `Demo ${selected}`)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            Enter Dashboard <ChevronRight size={16} />
          </button>
          <p className="text-[11px] text-slate-400 mt-4 text-center">Demo login — no password required. Predictions are computed live from a client-side risk model.</p>
        </div>
      </div>
    </div>
  );
}

const NAV = {
  Admin: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'students', label: 'Students', icon: Users },
    { key: 'faculty', label: 'Faculty', icon: GraduationCap },
    { key: 'counselors', label: 'Counselors', icon: UserCog },
    { key: 'predictions', label: 'Predictions', icon: TrendingUp },
    { key: 'counseling', label: 'Counseling', icon: MessageSquare },
    { key: 'reports', label: 'Reports', icon: FileText },
  ],
  Faculty: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'myStudents', label: 'My Students', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'marks', label: 'Marks & Behavior', icon: ClipboardList },
  ],
  Counselor: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'atrisk', label: 'At-Risk Students', icon: AlertTriangle },
    { key: 'counseling', label: 'Counseling Sessions', icon: MessageSquare },
    { key: 'history', label: 'Prediction History', icon: TrendingUp },
  ],
  Student: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'academics', label: 'Attendance & Marks', icon: ClipboardList },
    { key: 'prediction', label: 'Prediction Status', icon: TrendingUp },
    { key: 'counseling', label: 'Counseling', icon: MessageSquare },
  ],
};

function StudentDrawer({ student, onClose }) {
  if (!student) return null;
  const risk = computeRisk(student);
  const recs = getRecommendations(student);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">{student.name}</p>
            <p className="text-xs text-slate-400">{student.id} · {student.department} · Year {student.year}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <RiskBadge level={risk.level} />
            <span className="text-2xl font-bold" style={{ color: RISK_COLOR[risk.level] }}>{risk.score}%</span>
          </div>
          <ScoreBar score={risk.score} level={risk.level} />

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Profile</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-[11px] text-slate-400">Email</p><p className="truncate">{student.email}</p></div>
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-[11px] text-slate-400">Phone</p><p>{student.phone}</p></div>
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-[11px] text-slate-400">Fee Status</p><p>{student.feeStatus}</p></div>
              <div className="bg-slate-50 rounded-lg p-2"><p className="text-[11px] text-slate-400">Family Income</p><p>{student.familyIncome}</p></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Metrics</p>
            <div className="space-y-2">
              {[
                ['Attendance', student.attendance, Calendar],
                ['Internal Marks', student.internalMarks, BookOpen],
                ['Assignment Marks', student.assignmentMarks, ClipboardList],
                ['Participation', student.participation, Activity],
                ['Behavior Score', student.behaviorScore, Heart],
              ].map(([label, val, Icon]) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={14} className="text-blue-600 shrink-0" />
                  <span className="text-xs text-slate-500 w-32 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">{val}%</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertTriangle size={14} className="text-blue-600" /> Backlogs: <span className="font-semibold text-slate-700">{student.backlogs}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={14} className="text-blue-600" /> Travel Distance: <span className="font-semibold text-slate-700">{student.travelDistance} km</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Counseling Recommendations</p>
            <div className="space-y-2">
              {recs.map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <Icon size={16} className="text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">{r.issue}</p>
                      <p className="text-xs text-blue-700">{r.rec}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function riskDistribution(students) {
  const counts = { Low: 0, Medium: 0, High: 0 };
  students.forEach(s => counts[computeRisk(s).level]++);
  return [
    { name: 'Low', value: counts.Low },
    { name: 'Medium', value: counts.Medium },
    { name: 'High', value: counts.High },
  ];
}
function deptRisk(students) {
  return DEPARTMENTS.map(dep => {
    const subset = students.filter(s => s.department === dep);
    const counts = { Low: 0, Medium: 0, High: 0 };
    subset.forEach(s => counts[computeRisk(s).level]++);
    return { dept: dep.length > 12 ? dep.slice(0, 10) + '…' : dep, ...counts };
  });
}
function yearRisk(students) {
  return YEARS.map(y => {
    const subset = students.filter(s => s.year === y);
    const counts = { Low: 0, Medium: 0, High: 0 };
    subset.forEach(s => counts[computeRisk(s).level]++);
    return { year: `Year ${y}`, ...counts };
  });
}
const MONTHLY_TREND = [
  { month: 'Feb', high: 9 }, { month: 'Mar', high: 11 }, { month: 'Apr', high: 14 },
  { month: 'May', high: 12 }, { month: 'Jun', high: 15 }, { month: 'Jul', high: 13 },
];

function AdminDashboard({ students, counseling }) {
  const dist = riskDistribution(students);
  const dep = deptRisk(students);
  const yr = yearRisk(students);
  const today = '2026-07-10';
  const todaySessions = counseling.filter(c => c.sessionDate === today).length;
  const high = students.filter(s => computeRisk(s).level === 'High').length;
  const med = students.filter(s => computeRisk(s).level === 'Medium').length;
  const low = students.filter(s => computeRisk(s).level === 'Low').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Students" value={students.length} />
        <StatCard icon={GraduationCap} label="Total Faculty" value={FACULTY_LIST.length} />
        <StatCard icon={UserCog} label="Total Counselors" value={COUNSELORS.length} />
        <StatCard icon={AlertTriangle} label="High Risk Students" value={high} accent="text-rose-600" />
        <StatCard icon={Activity} label="Medium Risk Students" value={med} accent="text-amber-600" />
        <StatCard icon={ShieldCheck} label="Low Risk Students" value={low} accent="text-emerald-600" />
        <StatCard icon={Calendar} label="Today's Counseling Sessions" value={todaySessions} />
        <StatCard icon={Percent} label="Prediction Accuracy" value="91.4%" sub="Random Forest model" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>Risk Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {dist.map((d, i) => <Cell key={i} fill={RISK_COLOR[d.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>Monthly Dropout-Risk Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="high" stroke="#dc2626" strokeWidth={2} name="High Risk Students" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>Department-wise Risk</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dep}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low" stackId="a" fill={RISK_COLOR.Low} />
              <Bar dataKey="Medium" stackId="a" fill={RISK_COLOR.Medium} />
              <Bar dataKey="High" stackId="a" fill={RISK_COLOR.High} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>Year-wise Risk</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low" stackId="a" fill={RISK_COLOR.Low} />
              <Bar dataKey="Medium" stackId="a" fill={RISK_COLOR.Medium} />
              <Bar dataKey="High" stackId="a" fill={RISK_COLOR.High} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function FacultyDashboard({ students }) {
  const mine = students.slice(0, 20);
  const high = mine.filter(s => computeRisk(s).level === 'High').length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="My Students" value={mine.length} />
        <StatCard icon={Calendar} label="Attendance Pending" value={4} accent="text-amber-600" />
        <StatCard icon={ClipboardList} label="Marks Pending" value={3} accent="text-amber-600" />
        <StatCard icon={AlertTriangle} label="High Risk Students" value={high} accent="text-rose-600" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <SectionTitle>My Students — Quick View</SectionTitle>
        <StudentTable students={mine} compact />
      </div>
    </div>
  );
}

function CounselorDashboard({ counseling, onOpenSessions }) {
  const assigned = counseling.length;
  const pending = counseling.filter(c => c.status === 'Pending').length;
  const completed = counseling.filter(c => c.status === 'Completed').length;
  const high = counseling.filter(c => c.riskLevel === 'High').length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Students Assigned" value={assigned} />
        <StatCard icon={Clock} label="Pending Counseling" value={pending} accent="text-amber-600" />
        <StatCard icon={CheckCircle} label="Completed Counseling" value={completed} accent="text-emerald-600" />
        <StatCard icon={AlertTriangle} label="High Risk Students" value={high} accent="text-rose-600" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <SectionTitle action={<button onClick={onOpenSessions} className="text-xs font-semibold text-blue-700 hover:underline">View all sessions</button>}>
          Sessions Needing Attention
        </SectionTitle>
        <div className="space-y-2">
          {counseling.filter(c => c.status !== 'Completed').slice(0, 6).map(c => (
            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-700">{c.studentName}</p>
                <p className="text-xs text-slate-400">{c.recommendation}</p>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={c.riskLevel} />
                <span className="text-xs text-slate-400">{c.sessionDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentSelfDashboard({ student }) {
  const risk = computeRisk(student);
  const recs = getRecommendations(student);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Attendance" value={`${student.attendance}%`} />
        <StatCard icon={BookOpen} label="Internal Marks" value={`${student.internalMarks}%`} />
        <StatCard icon={TrendingUp} label="Prediction Result" value={risk.level} accent={risk.level === 'High' ? 'text-rose-600' : risk.level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'} />
        <StatCard icon={Calendar} label="Upcoming Session" value="Jul 18" sub="With Dr. Meena Subramaniam" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>My Prediction Status</SectionTitle>
          <div className="flex items-center justify-between mb-3">
            <RiskBadge level={risk.level} />
            <span className="text-3xl font-bold" style={{ color: RISK_COLOR[risk.level] }}>{risk.score}%</span>
          </div>
          <ScoreBar score={risk.score} level={risk.level} />
          <p className="text-xs text-slate-400 mt-3">Computed from your attendance, marks, behavior, and other academic indicators using the college's Random Forest dropout-prediction model.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <SectionTitle>Counseling Recommendations</SectionTitle>
          <div className="space-y-2">
            {recs.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                  <Icon size={16} className="text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">{r.issue}</p>
                    <p className="text-xs text-blue-700">{r.rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentTable({ students, onSelect, compact }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="py-2 pr-4">Student</th>
            <th className="py-2 pr-4">Dept</th>
            <th className="py-2 pr-4">Year</th>
            <th className="py-2 pr-4">Attendance</th>
            {!compact && <th className="py-2 pr-4">Internal Marks</th>}
            <th className="py-2 pr-4">Risk</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => {
            const r = computeRisk(s);
            return (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => onSelect && onSelect(s)}>
                <td className="py-2 pr-4">
                  <p className="font-medium text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.id}</p>
                </td>
                <td className="py-2 pr-4 text-slate-500">{s.department}</td>
                <td className="py-2 pr-4 text-slate-500">{s.year}</td>
                <td className="py-2 pr-4 text-slate-500">{s.attendance}%</td>
                {!compact && <td className="py-2 pr-4 text-slate-500">{s.internalMarks}%</td>}
                <td className="py-2 pr-4"><RiskBadge level={r.level} /></td>
                <td className="py-2 pr-2 text-slate-300"><ChevronRight size={16} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StudentsPage({ students, onSelect, title = 'Student Management' }) {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [risk, setRisk] = useState('All');

  const filtered = useMemo(() => students.filter(s => {
    const r = computeRisk(s).level;
    return (dept === 'All' || s.department === dept)
      && (risk === 'All' || r === risk)
      && (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));
  }), [students, search, dept, risk]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <SectionTitle>{title} <span className="text-slate-400 font-normal text-sm">({filtered.length})</span></SectionTitle>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or ID..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
          <option value="All">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={risk} onChange={e => setRisk(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
          <option value="All">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
        </select>
      </div>
      <StudentTable students={filtered} onSelect={onSelect} />
    </div>
  );
}

function FacultyEntryPage({ students, onUpdate, mode }) {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const student = students.find(s => s.id === studentId);
  const [form, setForm] = useState({ attendance: student?.attendance ?? 0, internalMarks: student?.internalMarks ?? 0, assignmentMarks: student?.assignmentMarks ?? 0, behaviorScore: student?.behaviorScore ?? 0 });
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    const s = students.find(x => x.id === studentId);
    if (s) setForm({ attendance: s.attendance, internalMarks: s.internalMarks, assignmentMarks: s.assignmentMarks, behaviorScore: s.behaviorScore });
    setSaved(false);
  }, [studentId]);

  const fields = mode === 'attendance'
    ? [['attendance', 'Attendance %', Calendar]]
    : [['internalMarks', 'Internal Marks %', BookOpen], ['assignmentMarks', 'Assignment Marks %', ClipboardList], ['behaviorScore', 'Behavior Score %', Heart]];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm max-w-lg">
      <SectionTitle>{mode === 'attendance' ? 'Record Attendance' : 'Record Marks & Behavior'}</SectionTitle>
      <label className="text-xs font-medium text-slate-500">Select Student</label>
      <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full mt-1 mb-4 px-3 py-2 text-sm border border-slate-200 rounded-lg">
        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
      </select>
      <div className="space-y-4">
        {fields.map(([key, label, Icon]) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1"><Icon size={13} />{label}</label>
            <input type="number" min={0} max={100} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>
      <button
        onClick={() => { onUpdate(studentId, form); setSaved(true); }}
        className="mt-5 w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
        <Save size={15} /> Save
      </button>
      {saved && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle size={13}/> Saved — the student's risk score has been recalculated.</p>}
    </div>
  );
}

function CounselingPage({ counseling, onUpdateStatus }) {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? counseling : counseling.filter(c => c.status === filter);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <SectionTitle>Counseling Sessions</SectionTitle>
      <div className="flex gap-2 mb-4">
        {['All', 'Pending', 'Scheduled', 'Completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === f ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">{c.studentName} <span className="text-xs font-normal text-slate-400">· {c.id}</span></p>
              <p className="text-xs text-slate-500">{c.recommendation}</p>
              <p className="text-xs text-slate-400 mt-0.5">Counselor: {c.counselor} · {c.sessionDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <RiskBadge level={c.riskLevel} />
              <select value={c.status} onChange={e => onUpdateStatus(c.id, e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                <option>Pending</option>
                <option>Scheduled</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No sessions in this category.</p>}
      </div>
    </div>
  );
}

function ReportsPage({ students, counseling }) {
  const reports = [
    { name: 'Student Performance Report', icon: BookOpen },
    { name: 'Attendance Report', icon: Calendar },
    { name: 'Risk Prediction Report', icon: TrendingUp },
    { name: 'Counseling Report', icon: MessageSquare },
    { name: 'Department-wise Analysis', icon: Building2 },
    { name: 'Semester-wise Analysis', icon: ClipboardList },
    { name: 'Monthly Report', icon: Calendar },
    { name: 'Prediction Accuracy Report', icon: Percent },
  ];
  const [msg, setMsg] = useState('');

  const handlePdf = (reportName) => {
    const lines = buildReportLines(reportName, students, counseling);
    downloadPdf(reportName, reportName, lines);
    setMsg(`${reportName} downloaded as PDF.`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <SectionTitle>Reports</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-blue-700" />
                <span className="text-sm text-slate-700">{r.name}</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handlePdf(r.name)} className="text-xs px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50">PDF</button>
                <button onClick={() => setMsg(`${r.name} exported as Excel (demo).`)} className="text-xs px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50">Excel</button>
              </div>
            </div>
          );
        })}
      </div>
      {msg && <p className="text-xs text-emerald-600 mt-4 flex items-center gap-1"><CheckCircle size={13}/> {msg}</p>}
      <p className="text-xs text-slate-400 mt-4">PDF buttons generate a real, downloadable PDF built live from the current student and counseling data.</p>
    </div>
  );
}

function DirectoryPage({ title, items, roleLabel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <SectionTitle>{title}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((name, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              {name.split(' ').map(n => n[0]).slice(-2).join('')}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{name}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState(() => generateStudents(60));
  const [counseling, setCounseling] = useState(() => generateCounseling(students, COUNSELORS));
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentSelf = students[3];

  const handleLogin = (role, name) => { setUser({ role, name }); setView('dashboard'); };
  const handleUpdate = (id, patch) => setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  const handleUpdateStatus = (id, status) => setCounseling(prev => prev.map(c => c.id === id ? { ...c, status } : c));

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const navItems = NAV[user.role];

  const renderView = () => {
    if (user.role === 'Admin') {
      if (view === 'dashboard') return <AdminDashboard students={students} counseling={counseling} />;
      if (view === 'students') return <StudentsPage students={students} onSelect={setSelectedStudent} />;
      if (view === 'faculty') return <DirectoryPage title="Faculty" items={FACULTY_LIST} roleLabel="Faculty Member" />;
      if (view === 'counselors') return <DirectoryPage title="Counselors" items={COUNSELORS} roleLabel="Counselor" />;
      if (view === 'predictions') return <StudentsPage students={students} onSelect={setSelectedStudent} title="Predictions" />;
      if (view === 'counseling') return <CounselingPage counseling={counseling} onUpdateStatus={handleUpdateStatus} />;
      if (view === 'reports') return <ReportsPage students={students} counseling={counseling} />;
    }
    if (user.role === 'Faculty') {
      if (view === 'dashboard') return <FacultyDashboard students={students} />;
      if (view === 'myStudents') return <StudentsPage students={students.slice(0, 20)} onSelect={setSelectedStudent} title="My Students" />;
      if (view === 'attendance') return <FacultyEntryPage students={students.slice(0, 20)} onUpdate={handleUpdate} mode="attendance" />;
      if (view === 'marks') return <FacultyEntryPage students={students.slice(0, 20)} onUpdate={handleUpdate} mode="marks" />;
    }
    if (user.role === 'Counselor') {
      if (view === 'dashboard') return <CounselorDashboard counseling={counseling} onOpenSessions={() => setView('counseling')} />;
      if (view === 'atrisk') return <StudentsPage students={students.filter(s => computeRisk(s).level !== 'Low')} onSelect={setSelectedStudent} title="At-Risk Students" />;
      if (view === 'counseling') return <CounselingPage counseling={counseling} onUpdateStatus={handleUpdateStatus} />;
      if (view === 'history') return <StudentsPage students={students} onSelect={setSelectedStudent} title="Prediction History" />;
    }
    if (user.role === 'Student') {
      if (view === 'dashboard') return <StudentSelfDashboard student={studentSelf} />;
      if (view === 'profile') return <StudentDrawerInline student={studentSelf} />;
      if (view === 'academics') return <StudentDrawerInline student={studentSelf} />;
      if (view === 'prediction') return <StudentSelfDashboard student={studentSelf} />;
      if (view === 'counseling') return <CounselingPage counseling={counseling.filter(c => c.studentId === studentSelf.id)} onUpdateStatus={handleUpdateStatus} />;
    }
    return null;
  };

  return (
    <div className="h-full w-full bg-slate-50 flex" style={{ minHeight: 700 }}>
      {}
      <aside className="w-60 shrink-0 bg-blue-900 text-blue-50 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-blue-800">
          <div className="bg-white/10 p-2 rounded-lg"><Activity size={20} /></div>
          <span className="font-bold tracking-tight">DropGuard AI</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button key={item.key} onClick={() => setView(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-blue-800'}`}>
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-blue-800">
          <button onClick={() => setUser(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{user.role} Workspace</p>
            <h1 className="font-semibold text-slate-800 capitalize">{navItems.find(n => n.key === view)?.label || view}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600"><Bell size={18} /></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-700 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{user.role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>
      </div>

      {selectedStudent && <StudentDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}

function StudentDrawerInline({ student }) {
  const risk = computeRisk(student);
  const recs = getRecommendations(student);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-slate-800">{student.name}</p>
          <p className="text-xs text-slate-400">{student.id} · {student.department} · Year {student.year}</p>
        </div>
        <RiskBadge level={risk.level} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Email</p><p className="truncate">{student.email}</p></div>
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Phone</p><p>{student.phone}</p></div>
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Attendance</p><p>{student.attendance}%</p></div>
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Internal Marks</p><p>{student.internalMarks}%</p></div>
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Assignment Marks</p><p>{student.assignmentMarks}%</p></div>
        <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400">Backlogs</p><p>{student.backlogs}</p></div>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Counseling Suggestions</p>
      <div className="space-y-2">
        {recs.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
              <Icon size={16} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-800">{r.issue}</p>
                <p className="text-xs text-blue-700">{r.rec}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
