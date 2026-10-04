import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, X, Bookmark, BookmarkCheck, Trophy, MapPin,
  Star, SlidersHorizontal, ChevronDown, Loader2, Info,
  Building2, GraduationCap, Filter,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import api from '../../utils/api.js';

// ── Colour maps ───────────────────────────────────────────────────────────────
const FIELD_COLOR = {
  'Engineering':           { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  'Medical':               { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400'    },
  'Law':                   { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  'Management':            { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  'Architecture':          { bg: 'bg-pink-50',   text: 'text-pink-700',   dot: 'bg-pink-400'   },
  'Design / Architecture': { bg: 'bg-pink-50',   text: 'text-pink-700',   dot: 'bg-pink-400'   },
  'Pharmacy':              { bg: 'bg-teal-50',   text: 'text-teal-700',   dot: 'bg-teal-400'   },
  'Agriculture':           { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400'  },
  'Commerce':              { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  'Pure Sciences':         { bg: 'bg-cyan-50',   text: 'text-cyan-700',   dot: 'bg-cyan-400'   },
};
const getFieldStyle = f =>
  FIELD_COLOR[f] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };

const TYPE_STYLE = {
  'Government': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Private':    'bg-violet-50  text-violet-700  border-violet-100',
  'Deemed':     'bg-amber-50   text-amber-700   border-amber-100',
  'Autonomous': 'bg-sky-50     text-sky-700     border-sky-100',
};

// ── All India States + UTs ────────────────────────────────────────────────────
const ALL_INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Autonomous'];

const SORT_OPTIONS = [
  { value: 'rank_asc',   label: 'Rank (Best first)' },
  { value: 'rank_desc',  label: 'Rank (Worst first)' },
  { value: 'fees_asc',   label: 'Fees (Low to High)' },
  { value: 'fees_desc',  label: 'Fees (High to Low)' },
  { value: 'name_asc',   label: 'Name (A – Z)' },
];

const PAGE_SIZE = 12;

// ── Rank badge ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  if (!rank) return null;
  if (rank === 1) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
      <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" /> #1
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
      #{rank}
    </span>
  );
};

// ── College Card ──────────────────────────────────────────────────────────────
const CollegeCard = ({ entry, isBookmarked, onToggleBookmark, bookmarkLoading }) => {
  const fieldStyle = getFieldStyle(entry.field);
  const typeStyle  = TYPE_STYLE[entry.college_type] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className={`rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col ${
      entry.is_sponsored
        ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
        : 'bg-white border-gray-100 hover:border-indigo-100'
    }`}>
      {/* Card header — field colour stripe (amber for sponsored) */}
      <div className={`h-1.5 rounded-t-2xl ${entry.is_sponsored ? 'bg-amber-400' : fieldStyle.dot}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Sponsored dot badge — "S" */}
        {entry.is_sponsored && (
          <div className="flex items-center gap-1.5 mb-3">
            <span
              title="Sponsored"
              className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px] font-black leading-none shadow-sm"
            >
              S
            </span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-300" />
          </div>
        )}

        {/* Top row: rank + bookmark */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <RankBadge rank={entry.rank} />
          <button
            onClick={() => onToggleBookmark(entry)}
            disabled={bookmarkLoading === entry.id}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this college'}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isBookmarked
                ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'
            } disabled:opacity-40`}
          >
            {isBookmarked
              ? <BookmarkCheck className="w-4 h-4" />
              : <Bookmark className="w-4 h-4" />
            }
          </button>
        </div>

        {/* College name */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{entry.college_name}</h3>

        {/* Program */}
        <p className="text-xs text-indigo-600 font-medium mb-3 leading-snug">{entry.program}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${fieldStyle.bg} ${fieldStyle.text}`}>
            {entry.field}
          </span>
          {entry.college_type && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeStyle}`}>
              {entry.college_type}
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="space-y-1.5 text-xs text-gray-500 mb-3 flex-1">
          {(entry.location_city || entry.location_state) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
              {[entry.location_city, entry.location_state].filter(Boolean).join(', ')}
            </div>
          )}
          {entry.affiliation && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
              <span className="truncate">{entry.affiliation}</span>
            </div>
          )}
          {entry.annual_fees ? (
            <div className="flex items-center gap-1.5 font-semibold text-gray-700">
              <span className="text-gray-400">₹</span>
              {Number(entry.annual_fees).toLocaleString('en-IN')}
              <span className="font-normal text-gray-400">/ yr</span>
            </div>
          ) : (
            <div className="text-gray-300 text-[11px]">Fees not listed</div>
          )}
        </div>

        {/* Notable features */}
        {entry.notable_features && (
          <p className="text-[11px] text-indigo-400 italic leading-snug line-clamp-2 border-t border-gray-50 pt-2">
            {entry.notable_features}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Searchable Filter Select (for large lists like states) ───────────────────
const SearchableFilterSelect = ({ value, onChange, options, placeholder }) => {
  const [query, setQuery]   = useState('');
  const [open,  setOpen]    = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    !query || o.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 pl-3 pr-2 py-2 text-sm border rounded-xl focus:outline-none transition-colors cursor-pointer ${
          value
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
            : 'border-gray-200 bg-white text-gray-600'
        }`}
      >
        <span className="whitespace-nowrap">{value || placeholder || 'All States'}</span>
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="ml-1 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 ml-0.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search states…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${!value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500'}`}
            >
              All States
            </button>
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${value === s ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
              >
                {s}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Filter Select ─────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors cursor-pointer ${
        value
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      <option value="">{placeholder ?? label}</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExploreCollegesPage = () => {
  const [allEntries,     setAllEntries]     = useState([]);
  const [bookmarkedIds,  setBookmarkedIds]  = useState(new Set()); // Set of top_college_ids
  const [bookmarkMap,    setBookmarkMap]    = useState({});        // top_college_id -> bookmark.id
  const [loading,        setLoading]        = useState(true);
  const [bookmarkLoading,setBookmarkLoading]= useState(null);      // entry.id being toggled
  const [error,          setError]          = useState('');
  const [tab,            setTab]            = useState('all');     // 'all' | 'bookmarks'

  // Filters
  const [search,      setSearch]      = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterProg,  setFilterProg]  = useState('');
  const [filterType,  setFilterType]  = useState('');
  const [filterState, setFilterState] = useState('');
  const [sortBy,      setSortBy]      = useState('rank_asc');
  const [page,        setPage]        = useState(1);

  // Load colleges + bookmarks in parallel
  useEffect(() => {
    Promise.allSettled([
      api.get('/student/explore/colleges'),
      api.get('/student/explore/bookmarks'),
    ]).then(([colRes, bmRes]) => {
      if (colRes.status === 'fulfilled') setAllEntries(colRes.value.data.data ?? []);
      else setError('Failed to load colleges.');

      if (bmRes.status === 'fulfilled') {
        const bms = bmRes.value.data.data ?? [];
        setBookmarkedIds(new Set(bms.map(b => b.top_college_id)));
        const map = {};
        bms.forEach(b => { map[b.top_college_id] = b.id; });
        setBookmarkMap(map);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Derived filter options
  const fieldOptions = useMemo(() => [...new Set(allEntries.map(e => e.field))].sort(), [allEntries]);

  const programOptions = useMemo(() => {
    const src = filterField ? allEntries.filter(e => e.field === filterField) : allEntries;
    return [...new Set(src.map(e => e.program))].sort();
  }, [allEntries, filterField]);

  // States: always show full India list (not just what's in data)
  const stateOptions = ALL_INDIA_STATES;

  // Types: always include all four types regardless of what's in data
  const typeOptions = COLLEGE_TYPES;

  // When field filter changes, reset program filter
  const handleFieldChange = (val) => { setFilterField(val); setFilterProg(''); setPage(1); };

  // Sort helper — sponsored always first, then apply selected sort within each group
  const sortEntries = (arr) => {
    return [...arr].sort((a, b) => {
      // Sponsored pinned to top regardless of other sort
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      switch (sortBy) {
        case 'rank_asc':
          if (a.rank == null && b.rank == null) return 0;
          if (a.rank == null) return 1;
          if (b.rank == null) return -1;
          return a.rank - b.rank;
        case 'rank_desc':
          if (a.rank == null && b.rank == null) return 0;
          if (a.rank == null) return -1;
          if (b.rank == null) return 1;
          return b.rank - a.rank;
        case 'fees_asc':
          return (a.annual_fees ?? Infinity) - (b.annual_fees ?? Infinity);
        case 'fees_desc':
          return (b.annual_fees ?? -1) - (a.annual_fees ?? -1);
        case 'name_asc':
          return a.college_name.localeCompare(b.college_name);
        default:
          return 0;
      }
    });
  };

  // Filtered + sorted entries for "All" tab
  const filteredAll = useMemo(() => {
    let src = allEntries;
    if (filterField) src = src.filter(e => e.field === filterField);
    if (filterProg)  src = src.filter(e => e.program === filterProg);
    if (filterType)  src = src.filter(e => e.college_type === filterType);
    if (filterState) src = src.filter(e => e.location_state === filterState);
    if (search.trim()) {
      const q = search.toLowerCase();
      src = src.filter(e =>
        e.college_name.toLowerCase().includes(q) ||
        e.program.toLowerCase().includes(q) ||
        (e.affiliation ?? '').toLowerCase().includes(q),
      );
    }
    return sortEntries(src);
  }, [allEntries, filterField, filterProg, filterType, filterState, search, sortBy]);

  // Bookmarked entries (not filtered, but sorted)
  const bookmarkedEntries = useMemo(() =>
    sortEntries(allEntries.filter(e => bookmarkedIds.has(e.id))),
    [allEntries, bookmarkedIds, sortBy],
  );

  // Pagination (applies to current tab)
  const activeList  = tab === 'all' ? filteredAll : bookmarkedEntries;
  const totalPages  = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageEntries = activeList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters/tab change
  useEffect(() => { setPage(1); }, [filterField, filterProg, filterType, filterState, search, sortBy, tab]);

  // Active filter count (for badge)
  const activeFilters = [filterField, filterProg, filterType, filterState].filter(Boolean).length;

  // Bookmark toggle
  const handleToggleBookmark = async (entry) => {
    setBookmarkLoading(entry.id);
    try {
      if (bookmarkedIds.has(entry.id)) {
        await api.delete(`/student/explore/bookmarks/${entry.id}`);
        setBookmarkedIds(prev => { const s = new Set(prev); s.delete(entry.id); return s; });
        setBookmarkMap(prev => { const m = { ...prev }; delete m[entry.id]; return m; });
      } else {
        const res = await api.post('/student/explore/bookmarks', { top_college_id: entry.id });
        setBookmarkedIds(prev => new Set([...prev, entry.id]));
        setBookmarkMap(prev => ({ ...prev, [entry.id]: res.data.data.id }));
      }
    } catch {
      // silently ignore — UI stays consistent
    } finally {
      setBookmarkLoading(null);
    }
  };

  const clearFilters = () => {
    setFilterField(''); setFilterProg('');
    setFilterType(''); setFilterState('');
    setSearch('');
  };

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore Colleges</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Browse top colleges, filter by program or type, and bookmark ones you're interested in.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'all',       label: 'All Colleges',  count: filteredAll.length },
          { key: 'bookmarks', label: 'My Bookmarks',  count: bookmarkedEntries.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.key === 'bookmarks' && <BookmarkCheck className="w-3.5 h-3.5" />}
            {t.label}
            {!loading && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters (shown on All tab only) */}
      {tab === 'all' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          {/* Search row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by college name, program or affiliation…"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <FilterSelect
              label="Sort"
              value={sortBy}
              onChange={v => setSortBy(v || 'rank_asc')}
              options={SORT_OPTIONS}
              placeholder="Sort by…"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            <FilterSelect
              label="Field"
              value={filterField}
              onChange={handleFieldChange}
              options={fieldOptions}
              placeholder="All Fields"
            />

            <FilterSelect
              label="Program"
              value={filterProg}
              onChange={v => { setFilterProg(v); setPage(1); }}
              options={programOptions}
              placeholder="All Programs"
            />

            <FilterSelect
              label="Type"
              value={filterType}
              onChange={v => { setFilterType(v); setPage(1); }}
              options={typeOptions}
              placeholder="All Types"
            />

            <SearchableFilterSelect
              value={filterState}
              onChange={v => { setFilterState(v); setPage(1); }}
              options={stateOptions}
              placeholder="All States"
            />

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <X className="w-3 h-3" /> Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Loading colleges…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : tab === 'bookmarks' && bookmarkedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <BookmarkCheck className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold">No bookmarks yet</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
            Click the bookmark icon on any college card to save it here for quick access.
          </p>
        </div>
      ) : pageEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <GraduationCap className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold">No colleges match your filters</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-indigo-600 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Result count */}
          <p className="text-xs text-gray-400 mb-4">
            {tab === 'all'
              ? `Showing ${pageEntries.length} of ${filteredAll.length} entries`
              : `${bookmarkedEntries.length} bookmarked college${bookmarkedEntries.length !== 1 ? 's' : ''}`
            }
            {activeFilters > 0 && tab === 'all' && (
              <span className="ml-2 text-indigo-500 font-medium">
                — {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
              </span>
            )}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {pageEntries.map(entry => (
              <CollegeCard
                key={entry.id}
                entry={entry}
                isBookmarked={bookmarkedIds.has(entry.id)}
                onToggleBookmark={handleToggleBookmark}
                bookmarkLoading={bookmarkLoading}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '…'
                    ? <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                    : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`w-9 h-9 text-sm rounded-xl border font-medium transition-colors ${
                          safePage === item
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
};

export default ExploreCollegesPage;
