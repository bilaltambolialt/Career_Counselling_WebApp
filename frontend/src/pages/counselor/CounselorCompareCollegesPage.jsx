import { useState, useEffect, useRef, useMemo } from 'react';
import {
  GitCompareArrows, Search, X, Trophy, MapPin,
  IndianRupee, ChevronDown, Loader2, Info, Star, BookOpen,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import CounselorSidebar from '../../components/layout/CounselorSidebar.jsx';
import api from '../../utils/api.js';

const FIELD_COLOR = {
  'Engineering':           { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'   },
  'Medical':               { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100'    },
  'Law':                   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  'Management':            { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  'Design / Architecture': { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-100'   },
  'Architecture':          { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-100'   },
  'Pharmacy':              { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-100'   },
  'Agriculture':           { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100'  },
  'Commerce':              { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
  'Pure Sciences':         { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-100'   },
};
const getFieldStyle = (field) =>
  FIELD_COLOR[field] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };

const TYPE_BADGE = {
  'Government': 'bg-emerald-50 text-emerald-700',
  'Private':    'bg-violet-50 text-violet-700',
  'Deemed':     'bg-amber-50 text-amber-700',
  'Autonomous': 'bg-sky-50 text-sky-700',
};

// ── Rank Badge ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  if (!rank) return <span className="text-gray-300 text-xs">—</span>;
  if (rank === 1) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
      <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" /> #1
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
      #{rank}
    </span>
  );
};

// ── Searchable Multi-Select ───────────────────────────────────────────────────
const MultiSelector = ({
  allNames, selected, onChange, disabled,
  itemLabel = 'item', searchPlaceholder = 'Type to search…',
  disabledPlaceholder = 'Unavailable…',
  emptyPlaceholder = 'Search and select…',
}) => {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    query.trim()
      ? allNames.filter(n => n.toLowerCase().includes(query.toLowerCase()))
      : allNames,
    [allNames, query],
  );

  const toggle = (name) =>
    onChange(selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name]);

  const removeAll = () => { onChange([]); setQuery(''); };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border rounded-xl text-sm text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
          disabled
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
            : 'border-gray-200 hover:border-indigo-300'
        }`}
      >
        <span className="flex-1 min-w-0">
          {selected.length === 0
            ? <span className={disabled ? 'text-gray-300' : 'text-gray-400'}>
                {disabled ? disabledPlaceholder : emptyPlaceholder}
              </span>
            : <span className="text-gray-700 font-medium">
                {selected.length} {itemLabel}{selected.length > 1 ? 's' : ''} selected
              </span>
          }
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-gray-200' : 'text-gray-400'}`} />
      </button>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map(name => (
            <span key={name}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              {name}
              <button onClick={() => toggle(name)} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selected.length > 1 && (
            <button onClick={removeAll}
              className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">No results found</p>
            ) : (
              filtered.map(name => {
                const isSelected = selected.includes(name);
                return (
                  <button key={name} type="button" onClick={() => toggle(name)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </span>
                    <span className="flex-1 leading-snug">{name}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-400">{filtered.length} of {allNames.length} {itemLabel}s</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Comparison Table ──────────────────────────────────────────────────────────
const ComparisonTable = ({ field, program, entries }) => {
  const style = getFieldStyle(field);
  return (
    <div className={`rounded-2xl border ${style.border} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-5 py-3 ${style.bg}`}>
        <Trophy className={`w-4 h-4 ${style.text}`} />
        <span className={`text-sm font-bold ${style.text}`}>{field}</span>
        <span className={`text-sm ${style.text} opacity-60`}>·</span>
        <span className={`text-sm font-medium ${style.text} opacity-80`}>{program}</span>
        <span className={`ml-auto text-xs font-medium ${style.text} opacity-60`}>
          {entries.length} college{entries.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Rank</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fees / yr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((e, i) => (
              <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                <td className="px-5 py-3"><RankBadge rank={e.rank} /></td>
                <td className="px-5 py-3 max-w-xs">
                  <p className="font-semibold text-gray-900 leading-snug">{e.college_name}</p>
                  {e.affiliation && <p className="text-xs text-gray-400 mt-0.5">{e.affiliation}</p>}
                  {e.notable_features && (
                    <p className="text-xs text-indigo-500 mt-0.5 italic leading-snug line-clamp-2">{e.notable_features}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  {e.college_type
                    ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[e.college_type] ?? 'bg-gray-100 text-gray-600'}`}>{e.college_type}</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">
                  {(e.location_city || e.location_state)
                    ? <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {[e.location_city, e.location_state].filter(Boolean).join(', ')}
                      </span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-xs text-gray-700">
                  {e.annual_fees
                    ? `₹${Number(e.annual_fees).toLocaleString('en-IN')}`
                    : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CounselorCompareCollegesPage = () => {
  const [allEntries,       setAllEntries]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState([]);  // multi-select programs
  const [selected,         setSelected]         = useState([]);  // selected college names

  useEffect(() => {
    api.get('/counselor/top-colleges')
      .then(r => setAllEntries(r.data.data ?? []))
      .catch(() => setError('Failed to load college data.'))
      .finally(() => setLoading(false));
  }, []);

  // Unique (field, program) pairs grouped by field
  const programsByField = useMemo(() => {
    const map = {};
    allEntries.forEach(e => {
      if (!map[e.field]) map[e.field] = new Set();
      map[e.field].add(e.program);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([field, progs]) => ({ field, programs: [...progs].sort() }));
  }, [allEntries]);

  // Flat sorted list of all unique program names for the multi-select
  const allProgramNames = useMemo(() =>
    programsByField.flatMap(({ programs }) => programs).sort((a, b) => a.localeCompare(b)),
    [programsByField],
  );

  // When programs change, reset selected colleges
  const handleProgramsChange = (programs) => {
    setSelectedPrograms(programs);
    setSelected([]);
  };

  // Colleges that have entries for ANY selected program
  const availableNames = useMemo(() => {
    if (!selectedPrograms.length) return [];
    const names = [...new Set(
      allEntries
        .filter(e => selectedPrograms.includes(e.program))
        .map(e => e.college_name),
    )];
    return names.sort((a, b) => a.localeCompare(b));
  }, [allEntries, selectedPrograms]);

  // Entries matching any selected program AND any selected college, sorted by rank
  const filteredEntries = useMemo(() => {
    if (!selectedPrograms.length || !selected.length) return [];
    return allEntries
      .filter(e => selectedPrograms.includes(e.program) && selected.includes(e.college_name))
      .sort((a, b) => {
        if (a.rank == null && b.rank == null) return 0;
        if (a.rank == null) return 1;
        if (b.rank == null) return -1;
        return a.rank - b.rank;
      });
  }, [allEntries, selectedPrograms, selected]);

  // Group filtered entries by program for rendering separate ComparisonTables
  const entriesByProgram = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach(e => {
      if (!map.has(e.program)) map.set(e.program, []);
      map.get(e.program).push(e);
    });
    return [...map.entries()]; // [[program, entries[]], ...]
  }, [filteredEntries]);

  // Summary scorecards — deduplicated by college, best (lowest) rank across programs
  const collegeSummary = useMemo(() => {
    const byName = new Map();
    filteredEntries.forEach(e => {
      const existing = byName.get(e.college_name);
      if (!existing || (e.rank != null && (existing.rank == null || e.rank < existing.rank))) {
        byName.set(e.college_name, e);
      }
    });
    return [...byName.values()]
      .sort((a, b) => {
        if (a.rank == null && b.rank == null) return 0;
        if (a.rank == null) return 1;
        if (b.rank == null) return -1;
        return a.rank - b.rank;
      })
      .map(e => ({
        name: e.college_name,
        rank: e.rank,
        type: e.college_type,
        location: [e.location_city, e.location_state].filter(Boolean).join(', '),
        fees: e.annual_fees,
      }));
  }, [filteredEntries]);

  return (
    <DashboardShell sidebar={<CounselorSidebar />}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compare Colleges</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Select one or more programs/branches, then pick colleges to compare their rankings side-by-side.
        </p>
      </div>

      {/* Step 1 + Step 2 selector card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-5">

        {/* Program multi-select */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Step 1 — Select Programs / Branches
              <span className="text-xs font-normal text-gray-400">(pick one or more)</span>
            </span>
          </label>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading programs…
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : programsByField.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                No college data available yet. Ask your Super Admin to populate the Top Colleges list.
              </p>
            </div>
          ) : (
            <MultiSelector
              allNames={allProgramNames}
              selected={selectedPrograms}
              onChange={handleProgramsChange}
              itemLabel="program"
              searchPlaceholder="Type to search programs…"
              emptyPlaceholder="Search and select programs / branches…"
            />
          )}
        </div>

        {/* College multi-select */}
        {!loading && !error && programsByField.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <GitCompareArrows className="w-4 h-4 text-indigo-500" />
                Step 2 — Select Colleges to Compare
                {selectedPrograms.length > 0 && availableNames.length > 0 && (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    ({availableNames.length} college{availableNames.length !== 1 ? 's' : ''} available)
                  </span>
                )}
              </span>
            </label>
            <MultiSelector
              allNames={availableNames}
              selected={selected}
              onChange={setSelected}
              disabled={!selectedPrograms.length}
              itemLabel="college"
              searchPlaceholder="Type to search colleges…"
              emptyPlaceholder="Search and select colleges to compare…"
              disabledPlaceholder="Select a program first…"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {selected.length > 0 && filteredEntries.length > 0 && (
        <>
          {/* Summary scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {collegeSummary.map((c, i) => (
              <div key={c.name}
                className={`bg-white rounded-2xl border p-4 shadow-sm relative overflow-hidden ${
                  i === 0 ? 'border-yellow-200' : 'border-gray-100'
                }`}>
                {i === 0 && (
                  <div className="absolute top-3 right-3">
                    <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                  </div>
                )}
                <p className="text-xs font-semibold text-indigo-600 mb-1">
                  {i === 0 ? 'Best Ranked' : `Rank #${i + 1} in selection`}
                </p>
                <p className="text-sm font-bold text-gray-900 leading-snug mb-2">{c.name}</p>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {c.rank && (
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full font-semibold">
                      #{c.rank} overall
                    </span>
                  )}
                  {c.type && (
                    <span className={`px-2 py-0.5 rounded-full ${TYPE_BADGE[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.type}
                    </span>
                  )}
                  {c.location && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{c.location}
                    </span>
                  )}
                  {c.fees && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      ₹{Number(c.fees).toLocaleString('en-IN')}/yr
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* One ComparisonTable per selected program */}
          <div className="space-y-6">
            {entriesByProgram.map(([program, entries]) => (
              <ComparisonTable
                key={program}
                field={entries[0]?.field ?? ''}
                program={program}
                entries={entries}
              />
            ))}
          </div>
        </>
      )}

      {/* No ranking data for selection */}
      {selected.length > 0 && filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Trophy className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No ranking data found for selected colleges</p>
          <p className="text-xs text-gray-400 mt-1">The selected colleges may not have entries for the chosen programs.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !selectedPrograms.length && programsByField.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
          <GitCompareArrows className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold">Start by selecting programs above</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">
            Choose one or more branches (e.g. Computer Science Engineering, MBBS) then pick colleges to compare.
          </p>
        </div>
      )}

      {/* Programs selected but no colleges chosen yet */}
      {!loading && !error && selectedPrograms.length > 0 && selected.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
          <GitCompareArrows className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold">Now select colleges to compare</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">
            {availableNames.length} college{availableNames.length !== 1 ? 's' : ''} available across the selected program{selectedPrograms.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </DashboardShell>
  );
};

export default CounselorCompareCollegesPage;
