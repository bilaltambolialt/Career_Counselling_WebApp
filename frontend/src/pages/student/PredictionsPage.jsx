import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, RefreshCw, Trash2, AlertCircle, CheckCircle, Info, Lock, Star, MapPin } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { fetchPredictions, generatePredictions, clearPredictions } from '../../services/studentService.js';
import api from '../../utils/api.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CLASS_STYLES = {
  Backup: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', ring: 'border-emerald-200' },
  Safe:   { badge: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-500',    ring: 'border-blue-200'    },
  Dream:  { badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-500',   ring: 'border-amber-200'   },
};

const RISK_STYLES = {
  Low:    'text-emerald-600',
  Medium: 'text-blue-600',
  High:   'text-amber-600',
};

const CLASS_LABEL = {
  Backup: 'High Probability',
  Safe:   'Medium Probability',
  Dream:  'Low Probability',
};

const CLASS_DESC = {
  Backup: 'You comfortably exceed the historical cutoff — high chance of admission.',
  Safe:   'You are above the historical cutoff — solid admission prospects.',
  Dream:  'You are at or below the historical cutoff — competitive stretch target.',
};

function ProbabilityBar({ value, classification }) {
  const styles = CLASS_STYLES[classification] ?? CLASS_STYLES.Safe;
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Admission probability</span>
        <span className="text-xs font-bold text-gray-700">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${styles.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PredictionCard({ prediction }) {
  const cls = prediction.classification;
  const styles = CLASS_STYLES[cls] ?? CLASS_STYLES.Safe;

  const diffSign = prediction.score_diff_pct >= 0 ? '+' : '';
  const diffLabel = prediction.comparison_mode === 'rank'
    ? `${diffSign}${prediction.score_diff_pct} rank positions vs avg cutoff`
    : `${diffSign}${prediction.score_diff_pct} percentile points vs avg cutoff`;

  return (
    <div className={`bg-white rounded-2xl border ${styles.ring} shadow-sm p-5`}>
      {/* College + Branch */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
            {prediction.colleges?.name ?? 'Unknown College'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {prediction.college_branches?.branch_name ?? '—'}
            {prediction.colleges?.location && (
              <span className="ml-1.5 text-gray-400">· {prediction.colleges.location}</span>
            )}
          </p>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge}`}>
          {CLASS_LABEL[cls] ?? cls}
        </span>
      </div>

      {/* Probability bar */}
      <ProbabilityBar value={prediction.probability_percentage} classification={cls} />

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          Risk: <span className={`font-semibold ${RISK_STYLES[prediction.risk_level]}`}>
            {prediction.risk_level}
          </span>
        </span>
        <span title={diffLabel}>
          Score gap: <span className="font-medium text-gray-700">{diffSign}{prediction.score_diff_pct}</span>
        </span>
        {prediction.trend_shift != null && (
          <span>
            Cutoff trend:{' '}
            <span className={`font-medium ${prediction.trend_shift > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {prediction.trend_shift > 0 ? `↑ +${prediction.trend_shift}` : `↓ ${prediction.trend_shift}`}
            </span>
          </span>
        )}
      </div>

      {/* Strategy */}
      {prediction.strategy_suggestion && (
        <p className="mt-3 text-xs text-gray-500 border-t border-gray-50 pt-2.5 leading-relaxed">
          {prediction.strategy_suggestion}
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

// ── Sponsored Partner Card ────────────────────────────────────────────────────
function SponsoredCard({ college }) {
  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              title="Sponsored"
              className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px] font-black leading-none shadow-sm shrink-0"
            >
              S
            </span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-300 shrink-0" />
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{college.college_name}</p>
          <p className="text-xs text-amber-700 font-medium mt-0.5">{college.program}</p>
        </div>
        {college.rank && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            #{college.rank}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {(college.location_city || college.location_state) && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
            {[college.location_city, college.location_state].filter(Boolean).join(', ')}
          </div>
        )}
        {college.annual_fees && (
          <div className="flex items-center gap-1 font-semibold text-gray-700">
            <span className="text-gray-400">₹</span>
            {Number(college.annual_fees).toLocaleString('en-IN')}
            <span className="font-normal text-gray-400">/ yr</span>
          </div>
        )}
        {college.college_type && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
            {college.college_type}
          </span>
        )}
      </div>
      {college.notable_features && (
        <p className="text-[11px] text-amber-600 italic leading-snug border-t border-amber-100 pt-2 line-clamp-2">
          {college.notable_features}
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PredictionsPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [sponsoredColleges, setSponsored] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [clearing, setClearing]       = useState(false);
  const [error, setError]             = useState('');
  const [genError, setGenError]       = useState('');
  const [locked, setLocked]           = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [lastGenerated, setLastGenerated]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    setLocked(false);
    Promise.allSettled([
      fetchPredictions(),
      api.get('/student/explore/sponsored'),
    ]).then(([predRes, sponsoredRes]) => {
      if (predRes.status === 'fulfilled') {
        const data = predRes.value.data.data ?? [];
        setPredictions(data);
        if (data.length) setLastGenerated(data[0]?.created_at ?? null);

        // Filter sponsored to those relevant to the student's field based on predictions
        if (sponsoredRes.status === 'fulfilled') {
          const allSponsored = sponsoredRes.value.data.data ?? [];
          if (data.length && allSponsored.length) {
            // Collect unique fields from predictions (via college name / branch)
            // Use all sponsored — backend already returns them ordered by rank
            // Dedupe by college_name to avoid showing same college twice across programs
            const seen = new Set();
            const relevant = allSponsored.filter(s => {
              if (seen.has(s.college_name)) return false;
              seen.add(s.college_name);
              return true;
            });
            setSponsored(relevant);
          } else {
            setSponsored(sponsoredRes.value.data.data ?? []);
          }
        }
      } else {
        if (predRes.reason?.response?.status === 403) {
          setLocked(true);
        } else {
          setError('Failed to load recommendations.');
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      await generatePredictions();
      load();
    } catch (err) {
      if (err?.response?.status === 403) {
        setLocked(true);
      } else {
        setGenError(
          err?.response?.data?.message ||
          'Failed to generate recommendations. Make sure you have exam scores with percentile or rank data.',
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearPredictions();
      setPredictions([]);
      setLastGenerated(null);
    } catch {
      setError('Failed to clear recommendations.');
    } finally {
      setClearing(false);
      setShowClearModal(false);
    }
  };

  // Group by classification for summary counts
  const counts = predictions.reduce(
    (acc, p) => { acc[p.classification] = (acc[p.classification] ?? 0) + 1; return acc; },
    {},
  );

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">College Recommendations</h1>
            <p className="text-gray-500 text-sm mt-1">
              Personalised college matches based on your exam scores and historical cutoff data.
            </p>
          </div>
          {!locked && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-shrink-0 gap-2 w-full sm:w-auto">
              {predictions.length > 0 && (
                <button
                  onClick={() => setShowClearModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Analysing…' : predictions.length ? 'Re-run Analysis' : 'Run Analysis'}
              </button>
            </div>
          )}
        </div>

        {/* How it works info banner */}
        <div className="mb-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            Results are based on your highest exam percentile or rank compared to historical cutoff data
            uploaded by your institution. Click <strong>Run Analysis</strong> to generate or refresh your recommendations.
          </p>
        </div>

        {/* Generation error */}
        {genError && (
          <div className="mb-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{genError}</p>
          </div>
        )}

        {/* Load error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : locked ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 font-semibold mb-1">Recommendations Not Available</p>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Your counselor has not enabled this feature yet. Please contact your counselor to get access.
            </p>
          </div>
        ) : predictions.length === 0 ? (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium mb-1">No recommendations yet</p>
              <p className="text-gray-400 text-sm">
                Add your exam scores, then click <strong>Run Analysis</strong> to see matched colleges.
              </p>
            </div>
            {sponsoredColleges.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-300" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Featured Partner Colleges</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sponsoredColleges.map((c) => (
                    <SponsoredCard key={c.id} college={c} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Summary strip */}
            <div className="flex flex-wrap gap-3 mb-5">
              {lastGenerated && (
                <span className="text-xs text-gray-400 self-center">
                  Last analysed: {new Date(lastGenerated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              <div className="ml-auto flex gap-2">
                {['Backup', 'Safe', 'Dream'].map((c) => counts[c] ? (
                  <span
                    key={c}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CLASS_STYLES[c].badge}`}
                  >
                    {counts[c]} {CLASS_LABEL[c]}
                  </span>
                ) : null)}
              </div>
            </div>

            {/* Legend */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Backup', 'Safe', 'Dream'].map((c) => (
                <div key={c} className={`flex items-start gap-2 p-3 rounded-xl border ${CLASS_STYLES[c].ring} bg-white`}>
                  <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${CLASS_STYLES[c].badge.split(' ')[1]}`} />
                  <div>
                    <p className={`text-xs font-semibold ${CLASS_STYLES[c].badge.split(' ')[1]}`}>{CLASS_LABEL[c]}</p>
                    <p className="text-xs text-gray-400 leading-snug">{CLASS_DESC[c]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured Partner Colleges — shown above prediction cards */}
            {sponsoredColleges.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-300" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Featured Partner Colleges</h2>
                  <span className="text-xs text-gray-400 ml-1">— explore these institutions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sponsoredColleges.map((c) => (
                    <SponsoredCard key={c.id} college={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {predictions.map((p) => (
                <PredictionCard key={p.id} prediction={p} />
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={showClearModal}
        title="Clear Recommendations?"
        message="This will remove all current recommendations. You can re-run the analysis at any time."
        confirmLabel="Clear"
        danger
        loading={clearing}
        onConfirm={handleClear}
        onCancel={() => setShowClearModal(false)}
      />
    </DashboardShell>
  );
};

export default PredictionsPage;
