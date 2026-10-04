import { useState } from 'react';
import { FileText, Download, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import { generateStudentReport } from '../../services/studentService.js';

const REPORT_TYPES = [
  {
    id: 'summary',
    title: 'Student Admission Summary',
    description:
      'A clean, comprehensive PDF summarising your academic background, exam scores, domain preferences, college shortlist, and personalised admission recommendations. Suitable for personal reference.',
    icon: FileText,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700',
    includes: [
      'Student personal & academic information',
      'All entrance exam scores',
      'Domain and course preferences',
      'College shortlist (Dream / Target / Safe) with probabilities',
      'Recommendations summary (High / Medium / Low probability counts)',
    ],
  },
];

const ReportsPage = () => {
  const [loading, setLoading] = useState({});
  const [error,   setError]   = useState({});
  const [success, setSuccess] = useState({});

  const handleDownload = async (reportId) => {
    setLoading(prev => ({ ...prev, [reportId]: true }));
    setError(prev =>   ({ ...prev, [reportId]: null }));
    setSuccess(prev => ({ ...prev, [reportId]: false }));

    try {
      const res = await generateStudentReport(reportId);

      // Axios throws automatically for non-2xx — if we reach here the PDF is ready
      const url   = URL.createObjectURL(res.data);
      const a     = document.createElement('a');
      const cd    = res.headers['content-disposition'] ?? '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.href     = url;
      a.download = match ? match[1] : `admission-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(prev => ({ ...prev, [reportId]: true }));
      setTimeout(() => setSuccess(prev => ({ ...prev, [reportId]: false })), 4000);
    } catch (err) {
      let msg = 'Failed to generate report. Please try again.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          msg = JSON.parse(text).message ?? msg;
        } catch { /* ignore decode errors */ }
      } else if (err.message) {
        msg = err.message;
      }
      setError(prev => ({ ...prev, [reportId]: msg }));
    } finally {
      setLoading(prev => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Download personalised admission reports based on your profile and recommendations.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Before generating a report</strong> — make sure your profile is complete, you have at least one exam
          score, and you have generated personalised recommendations. Reports are generated in real time and may take a
          few seconds.
        </div>
      </div>

      <div className="grid gap-6">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isLoading = loading[report.id];
          const hasError  = error[report.id];
          const didSucceed = success[report.id];

          return (
            <div
              key={report.id}
              className={`bg-white rounded-2xl border-2 ${report.border} p-6 shadow-sm`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${report.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">{report.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Includes</p>
                    <ul className="space-y-1">
                      {report.includes.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Feedback messages */}
                  {hasError && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {hasError}
                    </div>
                  )}
                  {didSucceed && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Report downloaded successfully!
                    </div>
                  )}

                  <button
                    onClick={() => handleDownload(report.id)}
                    disabled={isLoading}
                    className={`mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${report.btnColor}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PDF…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
};

export default ReportsPage;
