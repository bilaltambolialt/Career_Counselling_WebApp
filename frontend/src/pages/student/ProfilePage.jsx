import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, GraduationCap, FileText, Globe2, BookOpen,
  MapPin, Upload, CheckCircle, ChevronRight, Save,
  Trash2, Download, Plus, Loader2, AlertCircle, Building2, X,
  CalendarDays, Send, Clock, CheckCircle2, XCircle, Search, ChevronDown,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import {
  fetchStudentProfile, updateStudentProfile,
  fetchExamScores,
  fetchBranchNames,
  fetchCollegePreferences, addCollegePreference, removeCollegePreference,
  fetchDocuments, uploadDocument, deleteDocument,
} from '../../services/studentService.js';
import api from '../../utils/api.js';

// ── Constants ────────────────────────────────────────────────
const GENDERS      = ['Male', 'Female', 'Other', 'Prefer not to say'];
const CATEGORIES   = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];
const INCOME_OPTS  = [
  'Below ₹1 Lakh', '₹1 Lakh – ₹2.5 Lakh', '₹2.5 Lakh – ₹5 Lakh',
  '₹5 Lakh – ₹10 Lakh', '₹10 Lakh – ₹25 Lakh', 'Above ₹25 Lakh',
];
const FEE_RANGE_OPTS = [
  'Below ₹1 Lakh/year', '₹1 Lakh – ₹3 Lakh/year', '₹3 Lakh – ₹5 Lakh/year',
  '₹5 Lakh – ₹10 Lakh/year', '₹10 Lakh – ₹20 Lakh/year', 'Above ₹20 Lakh/year',
];
const BOARDS       = ['CBSE', 'ICSE', 'Maharashtra State Board', 'AP State Board', 'Telangana State Board', 'Karnataka PUC', 'Tamil Nadu HSC', 'UP Board', 'Other State Board', 'IB (International Baccalaureate)', 'Other'];
const STREAMS      = ['PCM', 'PCB', 'PCMB', 'PCM+PCB', 'Commerce', 'Arts', 'Other'];
const DIPLOMA_BOARDS = [
  'MSBTE (Maharashtra)',
  'BTEUP (Uttar Pradesh)',
  'Kerala Board of Technical Examinations',
  'Tamil Nadu State Board of Technical Education',
  'Karnataka Board of Technical Examinations (KBTE)',
  'RSBTE (Rajasthan)',
  'Gujarat Technological University (GTU)',
  'WBSCTE (West Bengal)',
  'AP State Board of Technical Education',
  'Telangana State Board of Technical Education',
  'Punjab State Board of Technical Education',
  'Haryana State Board of Technical Education',
  'Madhya Pradesh Board of Technical Education',
  'SBTE (Bihar)',
  'Other State Board of Technical Education',
  'Other',
];
const DOMAINS      = ['Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture', 'Pure Sciences', 'Commerce', 'Pharmacy', 'Agriculture'];
const DEGREE_TYPES = ['B.Tech / BE', 'MBBS', 'BDS', 'BA LLB / LLB', 'BBA', 'BSc', 'BArch', 'B.Pharm', 'BSc Agriculture', 'MBA', 'MD', 'MS', 'MDS', 'Other'];
const STATES       = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];
const DOC_TYPES = [
  { value: 'aadhaar',               label: 'Aadhaar Card' },
  { value: '10th_marksheet',        label: '10th Marksheet' },
  { value: '12th_marksheet',        label: '12th / HSC Marksheet' },
  { value: 'diploma_marksheet',     label: 'Diploma Marksheet' },
  { value: 'ews_certificate',       label: 'EWS Certificate' },
  { value: 'caste_certificate',     label: 'Caste Certificate' },
  { value: 'income_certificate',    label: 'Income Certificate' },
  { value: 'domicile_certificate',  label: 'Domicile Certificate' },
  { value: 'other',                 label: 'Other' },
];
const DOC_LABEL = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));
const EXAM_LABEL = {
  JEE_MAIN: 'JEE Main', JEE_ADVANCED: 'JEE Advanced',
  MHT_CET: 'MHT-CET', NEET_UG: 'NEET UG', NEET_PG: 'NEET PG', OTHER: 'Other',
};

const SECTIONS = [
  { id: 0, label: 'Basic Info',           icon: User },
  { id: 1, label: 'Academic Background',  icon: GraduationCap },
  { id: 2, label: 'Entrance Exams',       icon: FileText },
  { id: 3, label: 'Domain Preferences',   icon: Globe2 },
  { id: 4, label: 'Course Preferences',   icon: BookOpen },
  { id: 5, label: 'College Preferences',  icon: Building2 },
  { id: 6, label: 'Location Preferences', icon: MapPin },
  { id: 7, label: 'Documents',            icon: Upload },
  { id: 8, label: 'Request Session',      icon: CalendarDays },
];

const COLLEGE_CATEGORIES = [
  { key: 'dream',  label: 'Dream',  color: 'purple', badge: 'bg-purple-100 text-purple-700', header: 'bg-purple-50 border-purple-200' },
  { key: 'target', label: 'Target', color: 'indigo',  badge: 'bg-indigo-100 text-indigo-700',  header: 'bg-indigo-50 border-indigo-200' },
  { key: 'safe',   label: 'Safe',   color: 'emerald', badge: 'bg-emerald-100 text-emerald-700', header: 'bg-emerald-50 border-emerald-200' },
];

// ── Searchable college picker for preferences ─────────────────
const CollegeSearchSelect = ({ options, value, onChange, disabled }) => {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref               = useRef(null);

  const selected = options.find(c => c.id === value);
  const filtered = query.trim()
    ? options.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        className={`flex items-center justify-between w-full px-3 py-2.5 text-sm border rounded-xl bg-white cursor-pointer transition
          ${disabled ? 'border-gray-100 text-gray-400 cursor-not-allowed bg-gray-50' : 'border-gray-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-300'}`}
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? `${selected.name}${selected.location ? ` — ${selected.location}` : ''}` : 'Search and select a college…'}
        </span>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {value && !disabled && (
            <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 hover:text-red-500 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type college name or city…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No colleges found</li>
            ) : filtered.map(c => (
              <li key={c.id}
                onClick={() => { onChange(c.id); setQuery(''); setOpen(false); }}
                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 flex items-start gap-2"
              >
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.location && <p className="text-xs text-gray-400 truncate">{c.location}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Shared input className ────────────────────────────────────
const ic = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:bg-gray-50 disabled:text-gray-400';

// ── Section wrapper ───────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h2 className="text-base font-semibold text-gray-800 mb-5">{title}</h2>
    {children}
  </div>
);

// ── Field row helpers ─────────────────────────────────────────
const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && <span className="text-xs text-gray-400 ml-1.5 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

// ── Toggle (Yes / No) ─────────────────────────────────────────
const Toggle = ({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) => (
  <div className="flex gap-2">
    {[true, false].map((v) => (
      <button
        key={String(v)}
        type="button"
        onClick={() => onChange(v)}
        className={`px-4 py-2 text-sm rounded-xl border font-medium transition ${
          value === v
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
        }`}
      >
        {v ? yesLabel : noLabel}
      </button>
    ))}
  </div>
);

// ── Save button row ───────────────────────────────────────────
const SaveRow = ({ saving, onSave, success, error }) => (
  <div className="pt-4 border-t border-gray-100 space-y-3">
    {success && (
      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
        {success}
      </p>
    )}
    {error && (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
        {error}
      </p>
    )}
    <div className="flex justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving…' : 'Save Section'}
      </button>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [active,  setActive]  = useState(0);
  const [loading, setLoading] = useState(true);

  // Profile form state (all sections merged)
  const [form, setForm] = useState({
    // S1
    phone: '', dob: '', gender: '', minority_status: false,
    state: '', annual_family_income: '', category: '',
    parent_mobile: '', college_fee_range: '',
    // S2 — qualifier toggle
    qualification_type: '12th',
    // S2 — 12th fields
    board_12th: '', stream_12th: '', percentage_12th: '',
    pcm_percentage: '', pcb_percentage: '',
    // S2 — Diploma/Polytechnic fields
    diploma_board: '', diploma_branch: '', diploma_percentage: '',
    diploma_year_of_passing: '',
    // S2 — common
    is_drop_year: false, num_attempts: 1,
    // S4
    domains_of_interest: [],
    // S5
    preferred_degree_type: '', preferred_branches: ['', '', ''],
    // S6
    preferred_states: [], preferred_cities: '',
    only_government_colleges: false, private_allowed: true,
    deemed_universities_allowed: true, autonomous_allowed: true,
    // legacy (kept for compat)
    city: '', preferred_location: '', preferred_branch: '', exam_type: '',
  });

  // Section-level read-only info
  const [examList,       setExamList]       = useState([]);
  const [documents,      setDocuments]      = useState([]);
  const [branchOptions,  setBranchOptions]  = useState([]);
  const [collegePrefList, setCollegePrefList] = useState([]);
  const [collegeOptions,  setCollegeOptions]  = useState([]);
  const [addSelections,   setAddSelections]   = useState({ dream: '', target: '', safe: '' });
  const [collegePrefErrors, setCollegePrefErrors] = useState({ dream: '', target: '', safe: '' });
  const [addingPref,      setAddingPref]      = useState(null); // category being added

  // Per-section save state
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  // Document upload state
  const [docType,     setDocType]     = useState('');
  const [docFile,     setDocFile]     = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadMsg,   setUploadMsg]   = useState({ ok: '', err: '' });
  const [deletingDoc, setDeletingDoc] = useState(null);

  // Session request state (section 8)
  const [sessionReqData,    setSessionReqData]    = useState(null);   // { counselor, request }
  const [sessionReqMessage, setSessionReqMessage] = useState('');
  const [sessionReqSaving,  setSessionReqSaving]  = useState(false);
  const [sessionReqMsg,     setSessionReqMsg]      = useState({ ok: '', err: '' });

  // ── Load all data on mount ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, examRes, docRes, branchRes, collegePrefRes, collegeOptRes, sessionReqRes] =
          await Promise.allSettled([
            fetchStudentProfile(),
            fetchExamScores(),
            fetchDocuments(),
            fetchBranchNames(),
            fetchCollegePreferences(),
            api.get('/colleges'),
            api.get('/student/sessions/request'),
          ]);

        if (profRes.status === 'fulfilled') {
          const p = profRes.value.data.data;
          setForm((f) => ({
            ...f,
            phone:              p.phone              ?? '',
            dob:                p.dob                ?? '',
            gender:             p.gender             ?? '',
            minority_status:    p.minority_status    ?? false,
            state:              p.state              ?? '',
            annual_family_income: p.annual_family_income ?? '',
            category:           p.category           ?? '',
            parent_mobile:      p.parent_mobile      ?? '',
            college_fee_range:  p.college_fee_range  ?? '',
            qualification_type: p.qualification_type  ?? '12th',
            board_12th:         p.board_12th         ?? '',
            stream_12th:        p.stream_12th        ?? '',
            percentage_12th:    p.percentage_12th    ?? '',
            pcm_percentage:     p.pcm_percentage     ?? '',
            pcb_percentage:     p.pcb_percentage     ?? '',
            diploma_board:           p.diploma_board           ?? '',
            diploma_branch:          p.diploma_branch          ?? '',
            diploma_percentage:      p.diploma_percentage      ?? '',
            diploma_year_of_passing: p.diploma_year_of_passing ?? '',
            is_drop_year:       p.is_drop_year       ?? false,
            num_attempts:       p.num_attempts       ?? 1,
            domains_of_interest:p.domains_of_interest ?? [],
            preferred_degree_type: p.preferred_degree_type ?? '',
            preferred_branches: Array.isArray(p.preferred_branches) && p.preferred_branches.length
              ? [...p.preferred_branches.map((b) => b.name ?? ''), ...['', '', '']].slice(0, 3)
              : ['', '', ''],
            preferred_states:   p.preferred_states   ?? [],
            preferred_cities:   p.preferred_cities   ?? '',
            only_government_colleges: p.only_government_colleges ?? false,
            private_allowed:          p.private_allowed          ?? true,
            deemed_universities_allowed: p.deemed_universities_allowed ?? true,
            autonomous_allowed:          p.autonomous_allowed          ?? true,
            // legacy
            city: p.city ?? '', preferred_location: p.preferred_location ?? '',
            preferred_branch: p.preferred_branch ?? '', exam_type: p.exam_type ?? '',
          }));
        }

        if (examRes.status === 'fulfilled') {
          setExamList(examRes.value.data.data ?? []);
        }
        if (docRes.status === 'fulfilled') {
          setDocuments(docRes.value.data.data ?? []);
        }
        if (branchRes.status === 'fulfilled') {
          setBranchOptions(branchRes.value.data.data ?? []);
        }
        if (collegePrefRes.status === 'fulfilled') {
          setCollegePrefList(collegePrefRes.value.data.data ?? []);
        }
        if (collegeOptRes.status === 'fulfilled') {
          setCollegeOptions(collegeOptRes.value.data.data ?? []);
        }
        if (sessionReqRes.status === 'fulfilled') {
          setSessionReqData(sessionReqRes.value.data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Field helpers ───────────────────────────────────────────
  const set = (field) => (e) => {
    let val = e?.target !== undefined ? e.target.value : e;
    if (field === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, [field]: val }));
    setSuccess(''); setError('');
  };

  const toggleDomain = (domain) => {
    setForm((f) => ({
      ...f,
      domains_of_interest: f.domains_of_interest.includes(domain)
        ? f.domains_of_interest.filter((d) => d !== domain)
        : [...f.domains_of_interest, domain],
    }));
    setSuccess(''); setError('');
  };

  const toggleState = (state) => {
    setForm((f) => ({
      ...f,
      preferred_states: f.preferred_states.includes(state)
        ? f.preferred_states.filter((s) => s !== state)
        : [...f.preferred_states, state],
    }));
    setSuccess(''); setError('');
  };

  const setBranch = (idx, val) => {
    setForm((f) => {
      const arr = [...f.preferred_branches];
      arr[idx] = val;
      return { ...f, preferred_branches: arr };
    });
    setSuccess(''); setError('');
  };

  // ── Session request handler ─────────────────────────────────
  const handleSessionRequest = async () => {
    setSessionReqSaving(true);
    setSessionReqMsg({ ok: '', err: '' });
    try {
      await api.post('/student/sessions/request', { message: sessionReqMessage.trim() || undefined });
      const res = await api.get('/student/sessions/request');
      setSessionReqData(res.data.data);
      setSessionReqMessage('');
      setSessionReqMsg({ ok: 'Session request submitted! Your counselor will assign a slot soon.', err: '' });
    } catch (err) {
      setSessionReqMsg({ ok: '', err: err.response?.data?.message ?? 'Failed to submit request.' });
    } finally {
      setSessionReqSaving(false);
    }
  };

  // ── Save section ────────────────────────────────────────────
  const saveSection = async (payload) => {
    setSaving(true); setSuccess(''); setError('');
    try {
      await updateStudentProfile(payload);
      setSuccess('Saved successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Section-specific save payloads ──────────────────────────
  const saveS1 = () => saveSection({
    phone: form.phone, dob: form.dob, gender: form.gender,
    minority_status: form.minority_status, state: form.state,
    annual_family_income: form.annual_family_income,
    category: form.category || null,
    parent_mobile: form.parent_mobile || null,
    college_fee_range: form.college_fee_range || null,
  });

  const saveS2 = () => {
    const isDiploma = form.qualification_type === 'Diploma';
    saveSection({
      qualification_type: form.qualification_type,
      // 12th fields — null out when diploma selected
      board_12th:      !isDiploma ? form.board_12th  : null,
      stream_12th:     !isDiploma ? form.stream_12th : null,
      percentage_12th: !isDiploma && form.percentage_12th ? parseFloat(form.percentage_12th) : null,
      pcm_percentage:  !isDiploma && form.pcm_percentage  ? parseFloat(form.pcm_percentage)  : null,
      pcb_percentage:  !isDiploma && form.pcb_percentage  ? parseFloat(form.pcb_percentage)  : null,
      // Diploma fields — null out when 12th selected
      diploma_board:           isDiploma ? form.diploma_board  : null,
      diploma_branch:          isDiploma ? form.diploma_branch : null,
      diploma_percentage:      isDiploma && form.diploma_percentage      ? parseFloat(form.diploma_percentage)      : null,
      diploma_year_of_passing: isDiploma && form.diploma_year_of_passing ? parseInt(form.diploma_year_of_passing) : null,
      // Common
      is_drop_year: form.is_drop_year,
      num_attempts: parseInt(form.num_attempts) || 1,
    });
  };

  const saveS4 = () => saveSection({ domains_of_interest: form.domains_of_interest });

  const saveS5 = () => {
    const branches = form.preferred_branches
      .map((name, i) => ({ rank: i + 1, name: name.trim() }))
      .filter((b) => b.name);
    saveSection({ preferred_degree_type: form.preferred_degree_type, preferred_branches: branches });
  };

  const saveS6 = () => saveSection({
    preferred_states: form.preferred_states,
    preferred_cities: form.preferred_cities,
    only_government_colleges: form.only_government_colleges,
    private_allowed: form.private_allowed,
    deemed_universities_allowed: form.deemed_universities_allowed,
    autonomous_allowed: form.autonomous_allowed,
  });

  // ── Document upload ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!docFile || !docType) return;
    setUploading(true); setUploadMsg({ ok: '', err: '' });
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('doc_type', docType);
      const res = await uploadDocument(fd);
      setDocuments((d) => [res.data.data, ...d]);
      setDocFile(null); setDocType('');
      if (fileRef.current) fileRef.current.value = '';
      setUploadMsg({ ok: 'Document uploaded successfully.', err: '' });
    } catch (err) {
      setUploadMsg({ ok: '', err: err?.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    setDeletingDoc(id);
    try {
      await deleteDocument(id);
      setDocuments((d) => d.filter((doc) => doc.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingDoc(null);
    }
  };

  // ── College preference handlers ──────────────────────────────
  const handleAddCollegePref = async (category) => {
    const selectedId = addSelections[category];
    if (!selectedId) return;
    setAddingPref(category);
    setCollegePrefErrors((e) => ({ ...e, [category]: '' }));
    try {
      const res = await addCollegePreference({ college_id: selectedId, category });
      setCollegePrefList((prev) => [...prev, res.data.data]);
      setAddSelections((prev) => ({ ...prev, [category]: '' }));
    } catch (err) {
      setCollegePrefErrors((e) => ({
        ...e,
        [category]: err?.response?.data?.message ?? 'Failed to add college.',
      }));
    } finally {
      setAddingPref(null);
    }
  };

  const handleRemoveCollegePref = async (id) => {
    try {
      await removeCollegePreference(id);
      setCollegePrefList((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  };

  // ── Mandatory document check ─────────────────────────────────
  const academicDocType  = form.qualification_type === 'Diploma' ? 'diploma_marksheet' : '12th_marksheet';
  const academicDocLabel = form.qualification_type === 'Diploma' ? 'Diploma Marksheet' : '12th / HSC Marksheet';
  const hasAadhaar  = documents.some((d) => d.doc_type === 'aadhaar');
  const has10th     = documents.some((d) => d.doc_type === '10th_marksheet');
  const hasAcademic = documents.some((d) => d.doc_type === academicDocType);

  // ── Completion per section ──────────────────────────────────
  const complete = {
    0: !!(form.gender && form.dob && form.state),
    1: form.qualification_type === 'Diploma'
      ? !!(form.diploma_board && form.diploma_branch && form.diploma_percentage)
      : !!(form.board_12th && form.stream_12th && form.percentage_12th),
    2: examList.length > 0,
    3: form.domains_of_interest.length > 0,
    4: !!form.preferred_degree_type,
    5: collegePrefList.length > 0,
    6: form.preferred_states.length > 0,
    7: hasAadhaar && has10th && hasAcademic,
  };
  const totalComplete = Object.values(complete).filter(Boolean).length;
  const progressPct   = Math.round((totalComplete / 8) * 100);

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardShell sidebar={<StudentSidebar />}>
        <div className="p-6 max-w-5xl mx-auto space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Profile Builder</h1>
            <span className="text-sm font-medium text-gray-500">{progressPct}% complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

          {/* Mobile section nav — horizontal scrollable pills */}
          <div className="lg:hidden w-full">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActive(id); setSuccess(''); setError(''); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    active === id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  {complete[id] && (
                    <CheckCircle className="w-3 h-3 shrink-0 opacity-80" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop left nav — vertical sidebar */}
          <nav className="hidden lg:block w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActive(id); setSuccess(''); setError(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition mb-0.5 ${
                  active === id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {complete[id]
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 min-w-0">

            {/* ══ Section 1: Basic Info ══ */}
            {active === 0 && (
              <SectionCard title="Basic Student Details">
                <div className="space-y-4">
                  {/* Read-only: Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name">
                      <input value={user?.name ?? ''} disabled className={ic} />
                    </Field>
                    <Field label="Email ID">
                      <input value={user?.email ?? ''} disabled className={ic} />
                    </Field>
                  </div>

                  {/* Phone + DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Mobile Number">
                      <input
                        type="tel" value={form.phone}
                        onChange={set('phone')} placeholder="e.g. 9876543210"
                        maxLength={10} inputMode="numeric" pattern="[0-9]{10}"
                        className={ic}
                      />
                    </Field>
                    <Field label="Date of Birth">
                      <input type="date" value={form.dob} onChange={set('dob')} className={ic} />
                    </Field>
                  </div>

                  {/* Gender + Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Gender">
                      <select value={form.gender} onChange={set('gender')} className={ic}>
                        <option value="">Select gender</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                    <Field label="Category (Caste / Reservation)">
                      <select value={form.category} onChange={set('category')} className={ic}>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>

                  {/* Minority + State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Minority Status">
                      <Toggle
                        value={form.minority_status}
                        onChange={(v) => { setForm((f) => ({ ...f, minority_status: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                    <Field label="State of Domicile">
                      <select value={form.state} onChange={set('state')} className={ic}>
                        <option value="">Select state</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>

                  {/* Income */}
                  <Field label="Annual Family Income">
                    <select value={form.annual_family_income} onChange={set('annual_family_income')} className={ic}>
                      <option value="">Select income range</option>
                      {INCOME_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>

                  {/* Parent Mobile + College Fee Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Parent / Guardian Mobile">
                      <input
                        type="tel"
                        value={form.parent_mobile}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm((f) => ({ ...f, parent_mobile: v }));
                          setSuccess(''); setError('');
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={ic}
                      />
                    </Field>
                    <Field label="College Fee Range (per year)">
                      <select value={form.college_fee_range} onChange={set('college_fee_range')} className={ic}>
                        <option value="">Select fee range</option>
                        {FEE_RANGE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                  </div>

                  <SaveRow saving={saving} onSave={saveS1} success={success} error={error} />
                </div>
              </SectionCard>
            )}

            {/* ══ Section 2: Academic Background ══ */}
            {active === 1 && (
              <SectionCard title="Academic Background">
                <div className="space-y-5">

                  {/* ── Qualification type toggle ── */}
                  <Field label="Qualification Type" required hint="Select what you completed before pursuing higher education">
                    <div className="flex gap-2 mt-1">
                      {[
                        { value: '12th', label: '12th / HSC / Intermediate' },
                        { value: 'Diploma', label: 'Diploma / Polytechnic' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setForm((f) => ({ ...f, qualification_type: value })); setSuccess(''); setError(''); }}
                          className={`flex-1 py-2 px-3 text-sm rounded-xl border font-medium transition ${
                            form.qualification_type === value
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* ── 12th / HSC fields ── */}
                  {form.qualification_type === '12th' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="12th Board" required>
                          <select value={form.board_12th} onChange={set('board_12th')} className={ic}>
                            <option value="">Select board</option>
                            {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </Field>
                        <Field label="12th Stream" required>
                          <select value={form.stream_12th} onChange={set('stream_12th')} className={ic}>
                            <option value="">Select stream</option>
                            {STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </Field>
                      </div>

                      <Field label="12th Overall Percentage (%)" required>
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={form.percentage_12th} onChange={set('percentage_12th')}
                          placeholder="e.g. 87.60" className={ic}
                        />
                      </Field>

                      {['PCM', 'PCMB', 'PCM+PCB'].includes(form.stream_12th) && (
                        <Field label="PCM Aggregate (%)" hint="(Physics + Chemistry + Maths)">
                          <input
                            type="number" min="0" max="100" step="0.01"
                            value={form.pcm_percentage} onChange={set('pcm_percentage')}
                            placeholder="e.g. 91.33" className={ic}
                          />
                        </Field>
                      )}
                      {['PCB', 'PCMB', 'PCM+PCB'].includes(form.stream_12th) && (
                        <Field label="PCB Aggregate (%)" hint="(Physics + Chemistry + Biology)">
                          <input
                            type="number" min="0" max="100" step="0.01"
                            value={form.pcb_percentage} onChange={set('pcb_percentage')}
                            placeholder="e.g. 89.00" className={ic}
                          />
                        </Field>
                      )}
                    </>
                  )}

                  {/* ── Diploma / Polytechnic fields ── */}
                  {form.qualification_type === 'Diploma' && (
                    <>
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
                        Fill in your Diploma / Polytechnic details. 12th fields are not required for diploma holders.
                      </div>

                      <Field label="Diploma Board / University" required>
                        <select value={form.diploma_board} onChange={set('diploma_board')} className={ic}>
                          <option value="">Select board / university</option>
                          {DIPLOMA_BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </Field>

                      <Field label="Diploma Branch / Specialization" required hint="e.g. Computer Engineering, Mechanical, Electronics">
                        <input
                          type="text"
                          value={form.diploma_branch} onChange={set('diploma_branch')}
                          placeholder="e.g. Computer Engineering"
                          className={ic}
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Diploma Overall %" required>
                          <input
                            type="number" min="0" max="100" step="0.01"
                            value={form.diploma_percentage} onChange={set('diploma_percentage')}
                            placeholder="e.g. 82.50" className={ic}
                          />
                        </Field>
                        <Field label="Year of Passing" hint="(optional)">
                          <input
                            type="number" min="2000" max={new Date().getFullYear()}
                            value={form.diploma_year_of_passing} onChange={set('diploma_year_of_passing')}
                            placeholder={`e.g. ${new Date().getFullYear() - 1}`} className={ic}
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {/* ── Common: Drop Year ── */}
                  <div className="border-t border-gray-100 pt-4">
                    <Field label="Drop / Gap Year?">
                      <Toggle
                        value={form.is_drop_year}
                        onChange={(v) => { setForm((f) => ({ ...f, is_drop_year: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                  </div>

                  {form.is_drop_year && (
                    <Field label="Number of Attempts">
                      <input
                        type="number" min="1" max="5"
                        value={form.num_attempts} onChange={set('num_attempts')}
                        className={`${ic} w-32`}
                      />
                    </Field>
                  )}

                  <SaveRow saving={saving} onSave={saveS2} success={success} error={error} />
                </div>
              </SectionCard>
            )}

            {/* ══ Section 3: Entrance Exams (summary + link) ══ */}
            {active === 2 && (
              <SectionCard title="Entrance Exam Details">
                {examList.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-4">No exam scores added yet.</p>
                    <button
                      onClick={() => navigate('/student/scores')}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Exam Scores
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {examList.map((e) => (
                        <div key={e.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {EXAM_LABEL[e.exam_type] ?? e.exam_type}
                              <span className="ml-2 text-xs font-normal text-gray-400">{e.attempt_year}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {e.percentile != null && `Percentile: ${e.percentile}`}
                              {e.rank       != null && `  Rank: ${e.rank}`}
                              {e.score      != null && `  Score: ${e.score}`}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            {e.attempt_number ? `Attempt ${e.attempt_number}` : 'Added'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate('/student/scores')}
                      className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                    >
                      Manage all exam scores
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ══ Section 4: Domain Preferences ══ */}
            {active === 3 && (
              <SectionCard title="Domain Selection">
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Select all domains you are interested in pursuing.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DOMAINS.map((d) => {
                      const checked = form.domains_of_interest.includes(d);
                      return (
                        <label
                          key={d}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-sm ${
                            checked
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDomain(d)}
                            className="accent-indigo-600"
                          />
                          {d}
                        </label>
                      );
                    })}
                  </div>
                  <SaveRow saving={saving} onSave={saveS4} success={success} error={error} />
                </div>
              </SectionCard>
            )}

            {/* ══ Section 5: Course Preferences ══ */}
            {active === 4 && (
              <SectionCard title="Course Preferences">
                <div className="space-y-4">
                  <Field label="Preferred Degree Type" required>
                    <select value={form.preferred_degree_type} onChange={set('preferred_degree_type')} className={ic}>
                      <option value="">Select degree type</option>
                      {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Preferred Branch / Specialization
                      <span className="text-xs text-gray-400 font-normal ml-1.5">(rank your top 3)</span>
                    </label>
                    {branchOptions.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                        No branches found. Ask your admin to seed college & branch data.
                      </p>
                    )}
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-xs font-medium text-gray-500 text-right">
                            {i === 0 ? '1st choice' : i === 1 ? '2nd choice' : '3rd choice'}
                          </span>
                          <select
                            value={form.preferred_branches[i] ?? ''}
                            onChange={(e) => setBranch(i, e.target.value)}
                            className={ic}
                          >
                            <option value="">{i === 0 ? 'Select branch' : 'Optional'}</option>
                            {branchOptions
                              .filter((b) => b === form.preferred_branches[i] || !form.preferred_branches.includes(b))
                              .map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <SaveRow saving={saving} onSave={saveS5} success={success} error={error} />
                </div>
              </SectionCard>
            )}

            {/* ══ Section 5: College Preferences ══ */}
            {active === 5 && (
              <SectionCard title="College Preferences">
                <p className="text-sm text-gray-500 mb-5">
                  Shortlist up to 5 colleges in each category. Colleges added here will appear in your report with personalised admission recommendations.
                </p>
                <div className="space-y-4">
                  {(() => {
                    const addedIds = new Set(collegePrefList.map((p) => p.college_id));
                    const availableOptions = collegeOptions.filter((c) => !addedIds.has(c.id));
                    return COLLEGE_CATEGORIES.map(({ key, label, badge, header }) => {
                      const categoryList = collegePrefList.filter((p) => p.category === key);
                      const atLimit = categoryList.length >= 5;
                      return (
                        <div key={key} className={`rounded-2xl border ${header}`}>
                          {/* Card header */}
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm font-semibold text-gray-700">{label} Colleges</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
                              {categoryList.length} / 5
                            </span>
                          </div>

                          {/* College list */}
                          {categoryList.length > 0 && (
                            <div className="px-4 pb-3 space-y-2">
                              {categoryList.map((pref) => (
                                <div key={pref.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{pref.college_name}</p>
                                    {pref.college_location && (
                                      <p className="text-xs text-gray-400 truncate">{pref.college_location}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCollegePref(pref.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                                    title="Remove"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add row */}
                          {!atLimit && (
                            <div className="px-4 pb-4 space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 min-w-0">
                                  <CollegeSearchSelect
                                    options={availableOptions}
                                    value={addSelections[key]}
                                    onChange={(v) => setAddSelections((prev) => ({ ...prev, [key]: v }))}
                                    disabled={availableOptions.length === 0}
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={!addSelections[key] || addingPref === key}
                                  onClick={() => handleAddCollegePref(key)}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 sm:w-auto w-full"
                                >
                                  {addingPref === key
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Plus className="w-3.5 h-3.5" />}
                                  Add
                                </button>
                              </div>
                              {collegePrefErrors[key] && (
                                <p className="text-xs text-red-600">{collegePrefErrors[key]}</p>
                              )}
                            </div>
                          )}
                          {atLimit && (
                            <p className="px-4 pb-3 text-xs text-gray-400">
                              Maximum 5 colleges reached. Remove one to add another.
                            </p>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {collegePrefList.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No colleges added yet. Add at least one to complete this section.
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ══ Section 6: Location Preferences ══ */}
            {active === 6 && (
              <SectionCard title="Location Preferences">
                <div className="space-y-5">
                  {/* Preferred States */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred State(s)
                      <span className="text-xs text-gray-400 font-normal ml-1.5">(select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                      {STATES.map((s) => {
                        const checked = form.preferred_states.includes(s);
                        return (
                          <label
                            key={s}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition ${
                              checked
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-medium'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                            }`}
                          >
                            <input
                              type="checkbox" checked={checked}
                              onChange={() => toggleState(s)} className="accent-indigo-600"
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Cities */}
                  <Field label="Preferred City / Cities" hint="(optional, comma-separated)">
                    <input
                      type="text" value={form.preferred_cities}
                      onChange={set('preferred_cities')}
                      placeholder="e.g. Pune, Mumbai, Hyderabad" className={ic}
                    />
                  </Field>

                  {/* College type preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Government Colleges Only">
                      <Toggle
                        value={form.only_government_colleges}
                        onChange={(v) => { setForm((f) => ({ ...f, only_government_colleges: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                    <Field label="Private Colleges">
                      <Toggle
                        value={form.private_allowed}
                        onChange={(v) => { setForm((f) => ({ ...f, private_allowed: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                    <Field label="Deemed Universities">
                      <Toggle
                        value={form.deemed_universities_allowed}
                        onChange={(v) => { setForm((f) => ({ ...f, deemed_universities_allowed: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                    <Field label="Autonomous Colleges">
                      <Toggle
                        value={form.autonomous_allowed}
                        onChange={(v) => { setForm((f) => ({ ...f, autonomous_allowed: v })); setSuccess(''); setError(''); }}
                      />
                    </Field>
                  </div>

                  <SaveRow saving={saving} onSave={saveS6} success={success} error={error} />
                </div>
              </SectionCard>
            )}

            {/* ══ Section 8: Documents ══ */}
            {active === 7 && (
              <SectionCard title="Document Upload">
                <div className="space-y-5">

                  {/* ── Mandatory documents checklist ── */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Required Documents
                    </p>
                    <div className="space-y-2">
                      {[
                        { type: 'aadhaar',        label: 'Aadhaar Card',    ok: hasAadhaar },
                        { type: '10th_marksheet', label: '10th Marksheet',  ok: has10th },
                        { type: academicDocType,  label: academicDocLabel,  ok: hasAcademic },
                      ].map(({ type, label, ok }) => (
                        <div
                          key={type}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                            ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          {ok
                            ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span className={`text-sm font-medium flex-1 ${ok ? 'text-emerald-800' : 'text-amber-800'}`}>
                            {label}
                          </span>
                          <span className={`text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {ok ? 'Uploaded' : 'Required'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Other documents (EWS / Caste / Income / Domicile certificates) are optional.
                    </p>
                  </div>

                  {/* ── Upload form ── */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload a Document</p>
                    <p className="text-xs text-gray-400">Accepted: PDF, JPG, PNG · Max 5 MB per file.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Document Type">
                        <select value={docType} onChange={(e) => { setDocType(e.target.value); setUploadMsg({ ok: '', err: '' }); }} className={ic}>
                          <option value="">Select type</option>
                          {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </Field>
                      <Field label="File">
                        <input
                          ref={fileRef} type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { setDocFile(e.target.files[0] || null); setUploadMsg({ ok: '', err: '' }); }}
                          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </Field>
                    </div>

                    {uploadMsg.ok && <p className="text-sm text-emerald-700">{uploadMsg.ok}</p>}
                    {uploadMsg.err && <p className="text-sm text-red-600">{uploadMsg.err}</p>}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!docFile || !docType || uploading}
                        onClick={handleUpload}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading…' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  {/* ── Uploaded documents list ── */}
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded Documents</p>
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                          <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-400">
                              {DOC_LABEL[doc.doc_type] ?? doc.doc_type}
                              {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                            </p>
                          </div>
                          {doc.signed_url && (
                            <a
                              href={doc.signed_url} target="_blank" rel="noreferrer"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            disabled={deletingDoc === doc.id}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-40"
                          >
                            {deletingDoc === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length === 0 && !uploading && (
                    <p className="text-center text-sm text-gray-400 py-2">No documents uploaded yet.</p>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ── Section 8: Request Session ── */}
            {active === 8 && (
              <SectionCard title="Request a Counseling Session">
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  Not sure which stream or career path to choose? Request a one-on-one session
                  with your assigned counselor for personalised guidance.
                </p>

                {/* No counselor assigned */}
                {!sessionReqData?.counselor && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">No counselor assigned yet</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Please contact your institution admin to get a counselor assigned to your account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Counselor assigned */}
                {sessionReqData?.counselor && (
                  <div className="space-y-5">
                    {/* Counselor info */}
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                          {sessionReqData.counselor.name?.[0]?.toUpperCase() ?? 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sessionReqData.counselor.name}</p>
                        <p className="text-xs text-gray-500">{sessionReqData.counselor.email}</p>
                      </div>
                    </div>

                    {/* Current request status */}
                    {sessionReqData.request && (
                      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                        sessionReqData.request.status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200'
                          : sessionReqData.request.status === 'accepted'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        {sessionReqData.request.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                        {sessionReqData.request.status === 'accepted' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
                        {sessionReqData.request.status === 'declined' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                        <div>
                          {sessionReqData.request.status === 'pending' && (
                            <>
                              <p className="text-sm font-semibold text-yellow-800">Request Pending</p>
                              <p className="text-xs text-yellow-700 mt-0.5">
                                Your request is waiting for a response. Your counselor will assign a slot soon.
                              </p>
                            </>
                          )}
                          {sessionReqData.request.status === 'accepted' && (
                            <>
                              <p className="text-sm font-semibold text-green-800">Request Accepted!</p>
                              <p className="text-xs text-green-700 mt-0.5">
                                Your counselor has scheduled a session. Check your{' '}
                                <button
                                  onClick={() => navigate('/student/sessions')}
                                  className="underline font-medium hover:text-green-900"
                                >Sessions page</button> for details.
                              </p>
                            </>
                          )}
                          {sessionReqData.request.status === 'declined' && (
                            <>
                              <p className="text-sm font-semibold text-red-700">Request Declined</p>
                              <p className="text-xs text-red-600 mt-0.5">
                                Your counselor couldn't accommodate this request. You can submit a new request below.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Request form — show only if no pending request */}
                    {sessionReqData.request?.status !== 'pending' && (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            What do you need help with?{' '}
                            <span className="text-xs text-gray-400 font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={sessionReqMessage}
                            onChange={(e) => setSessionReqMessage(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="e.g. I'm unsure whether to pick Engineering or Medical, and need guidance on stream selection…"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                          <p className="text-xs text-gray-400 mt-1 text-right">{sessionReqMessage.length}/500</p>
                        </div>

                        {sessionReqMsg.ok && (
                          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                            {sessionReqMsg.ok}
                          </p>
                        )}
                        {sessionReqMsg.err && (
                          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                            {sessionReqMsg.err}
                          </p>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={sessionReqSaving}
                            onClick={handleSessionRequest}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
                          >
                            {sessionReqSaving
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Send className="w-4 h-4" />}
                            {sessionReqSaving ? 'Sending…' : 'Request Session'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            )}

          </div>{/* end right panel */}
        </div>{/* end layout */}
      </div>
    </DashboardShell>
  );
};

export default ProfilePage;
