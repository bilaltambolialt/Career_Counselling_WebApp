import puppeteer from 'puppeteer';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const fmt = (val, fallback = '—') => (val ?? fallback);

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtPct = (val) => (val != null ? `${val}%` : '—');

const CATEGORY_LABEL = { dream: 'Dream', target: 'Target', safe: 'Safe' };
const CLASS_LABEL = { Backup: 'High Probability', Safe: 'Medium Probability', Dream: 'Low Probability' };
const CLASS_COLOR = {
  Backup: '#16a34a',   // green
  Safe:   '#2563eb',   // blue
  Dream:  '#7c3aed',   // purple
};
const CAT_COLOR = { dream: '#7c3aed', target: '#2563eb', safe: '#16a34a' };

// ─── Shared CSS ──────────────────────────────────────────────────────────────

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; line-height: 1.55; }
  h1 { font-size: 23px; font-weight: 800; letter-spacing: -0.3px; }
  h2 { font-size: 11.5px; font-weight: 700; color: #0f172a; margin-bottom: 12px;
       padding: 7px 12px; background: #f1f5f9; border-left: 4px solid #3b82f6;
       border-radius: 0 6px 6px 0; text-transform: uppercase; letter-spacing: 0.6px; }
  h3 { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1e293b; color: #e2e8f0; font-weight: 600; text-align: left; padding: 8px 11px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 7px 11px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr:last-child td { border-bottom: none; }
  .section { margin-bottom: 26px; }
  .header { padding: 26px 34px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1e293b 100%); color: #fff; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-brand { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #60a5fa; margin-bottom: 6px; font-weight: 700; }
  .header-title { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .header-meta { font-size: 10.5px; color: #94a3b8; margin-top: 10px; }
  .header-right { text-align: right; }
  .body { padding: 26px 34px; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
  .info-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 13px; border-top: 3px solid #3b82f6; }
  .info-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 4px; font-weight: 600; }
  .info-value { font-size: 12px; font-weight: 600; color: #0f172a; }
  .badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .pref-pill { display: inline-block; background: #ede9fe; color: #5b21b6; border-radius: 20px; padding: 2px 10px; font-size: 11px; margin: 2px 3px 2px 0; }
  .prob-bar-bg { background: #e2e8f0; border-radius: 4px; height: 5px; width: 80px; display: inline-block; vertical-align: middle; margin-left: 8px; }
  .prob-bar-fill { height: 100%; border-radius: 4px; }
  .footer { border-top: 2px solid #e2e8f0; padding: 10px 34px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
  .footer-left { color: #64748b; font-size: 9.5px; }
  .footer-center { color: #0f172a; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
  .footer-right { color: #94a3b8; font-size: 9.5px; text-align: right; }
  .cat-header { font-size: 12px; font-weight: 700; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
  .cat-block { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 14px; margin-bottom: 10px; }
  .no-data { color: #94a3b8; font-style: italic; font-size: 11px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .summary-strip { display: flex; gap: 12px; margin-bottom: 16px; }
  .summary-card { flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; text-align: center; border-top: 3px solid #e2e8f0; }
  .summary-num { font-size: 24px; font-weight: 800; color: #0f172a; }
  .summary-lbl { font-size: 9px; color: #64748b; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.4px; }
`;

// ─── generatePDF ─────────────────────────────────────────────────────────────

const isLinux = process.platform === 'linux';

export const generatePDF = async (html) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      ...(isLinux ? ['--single-process'] : []),
    ],
  });
  try {
    const page = await browser.newPage();
    // 'load' is more reliable than 'networkidle0' for self-contained HTML
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    const pdfResult = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    // Puppeteer v22+ may return Uint8Array — always convert to Buffer for reliable binary serialisation
    const buffer = Buffer.from(pdfResult);
    if (buffer.length === 0) throw new Error('Puppeteer generated an empty PDF');
    console.log('[pdfGenerator] PDF generated, size:', buffer.length, 'bytes');
    return buffer;
  } finally {
    await browser.close();
  }
};

// ─── buildStudentSummaryHTML ─────────────────────────────────────────────────

export const buildStudentSummaryHTML = ({ student, profile, scores, collegePref, predictions }) => {
  const isDiploma = profile?.qualification_type === 'Diploma';
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Exam scores rows
  const scoreRows = (scores ?? []).map(s => `
    <tr>
      <td>${fmt(s.exam_type?.replace(/_/g, ' '))}</td>
      <td>${fmt(s.score)}</td>
      <td>${s.percentile != null ? `${s.percentile}%ile` : '—'}</td>
      <td>${fmt(s.rank)}</td>
      <td>${fmt(s.attempt_year)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="no-data">No exam scores recorded</td></tr>`;

  // College preferences by category
  const prefByCategory = { dream: [], target: [], safe: [] };
  (collegePref ?? []).forEach(p => { if (prefByCategory[p.category]) prefByCategory[p.category].push(p); });

  const catIcons = { dream: '🎯', target: '🏹', safe: '🛡️' };
  const collegePrefHtml = ['dream', 'target', 'safe'].map(cat => {
    const items = prefByCategory[cat];
    const itemsHtml = items.length
      ? items.map(p => {
          const pred = (predictions ?? []).find(pr => pr.college_id === p.college_id);
          const probHtml = pred
            ? `<span class="badge" style="background:${CLASS_COLOR[pred.classification]}22;color:${CLASS_COLOR[pred.classification]}">${CLASS_LABEL[pred.classification] ?? pred.classification} · ${pred.probability_percentage}%</span>`
            : '';
          return `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
            <span><strong>${fmt(p.college_name)}</strong><span style="color:#64748b;margin-left:8px;font-size:11px">${fmt(p.college_location)}</span></span>
            ${probHtml}
          </div>`;
        }).join('')
      : `<div class="no-data">No colleges added yet</div>`;

    return `<div class="cat-block">
      <div class="cat-header" style="color:${CAT_COLOR[cat]}">${catIcons[cat]} ${CATEGORY_LABEL[cat]} (${items.length}/5)</div>
      ${itemsHtml}
    </div>`;
  }).join('');

  // Predictions summary counts
  const counts = { Backup: 0, Safe: 0, Dream: 0 };
  (predictions ?? []).forEach(p => { if (counts[p.classification] !== undefined) counts[p.classification]++; });
  const totalPred = predictions?.length ?? 0;

  // Domain pills
  const domainPills = (profile?.domains_of_interest ?? []).map(d =>
    `<span class="pref-pill">${d}</span>`).join('') || '<span class="no-data">None</span>';

  // Preferred states pills
  const statePills = (profile?.preferred_states ?? []).map(s =>
    `<span class="pref-pill" style="background:#dbeafe;color:#1d4ed8">${s}</span>`).join('') || '<span class="no-data">None</span>';

  const subHeader = (page, total) => `
<div class="sub-header">
  <div class="sub-header-left">
    <span class="sub-brand">ICGC</span>
    <span class="sub-dot">·</span>
    Student Admission Summary
  </div>
  <div class="sub-header-right">
    ${fmt(student?.name)} &nbsp;·&nbsp; Page ${page} of ${total}
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${BASE_CSS}
  .page-break { page-break-after: always; break-after: page; }
  .sub-header { background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%); padding: 9px 34px; display: flex; justify-content: space-between; align-items: center; }
  .sub-header-left { font-size: 10px; color: #94a3b8; letter-spacing: 0.3px; }
  .sub-brand { color: #60a5fa; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; font-size: 9px; }
  .sub-dot { color: #475569; margin: 0 6px; }
  .sub-header-right { font-size: 10px; color: #64748b; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════ PAGE 1 ═══ -->

<div class="header">
  <div>
    <div class="header-brand">ICGC</div>
    <div class="header-title">Indian Career Guidance Council</div>
    <h1>Student Admission Summary</h1>
    <div class="header-meta">Generated on ${generatedDate} &nbsp;·&nbsp; Confidential</div>
  </div>
  <div class="header-right">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Report Type</div>
    <div style="font-size:15px;font-weight:700;color:#fff">Student Summary</div>
    <div style="margin-top:10px;font-size:10px;color:#94a3b8;margin-bottom:2px">Category</div>
    <div style="font-size:13px;font-weight:700;color:#93c5fd">${fmt(student?.category)}</div>
    <div style="margin-top:10px;font-size:10px;color:#94a3b8;margin-bottom:2px">Student</div>
    <div style="font-size:12px;font-weight:600;color:#e2e8f0">${fmt(student?.name)}</div>
  </div>
</div>

<div class="body">

  <!-- Student Information -->
  <div class="section">
    <h2>Student Information</h2>
    <div class="info-grid">
      <div class="info-card"><div class="info-label">Full Name</div><div class="info-value">${fmt(student?.name)}</div></div>
      <div class="info-card"><div class="info-label">Email</div><div class="info-value">${fmt(student?.email)}</div></div>
      <div class="info-card"><div class="info-label">Phone</div><div class="info-value">${fmt(student?.phone)}</div></div>
      <div class="info-card"><div class="info-label">Date of Birth</div><div class="info-value">${fmtDate(profile?.dob)}</div></div>
      <div class="info-card"><div class="info-label">Gender</div><div class="info-value">${fmt(profile?.gender)}</div></div>
      <div class="info-card"><div class="info-label">State</div><div class="info-value">${fmt(profile?.state)}</div></div>
      <div class="info-card"><div class="info-label">Category</div><div class="info-value">${fmt(student?.category)}</div></div>
      <div class="info-card"><div class="info-label">Minority Status</div><div class="info-value">${profile?.minority_status ? 'Yes' : 'No'}</div></div>
      <div class="info-card"><div class="info-label">Annual Family Income</div><div class="info-value">${fmt(profile?.annual_family_income)}</div></div>
    </div>
  </div>

  <!-- Academic Background -->
  <div class="section">
    <h2>Academic Background</h2>
    <div class="info-grid">
      <div class="info-card"><div class="info-label">Qualification</div><div class="info-value">${fmt(profile?.qualification_type)}</div></div>
      ${isDiploma ? `
      <div class="info-card"><div class="info-label">Diploma Board</div><div class="info-value">${fmt(profile?.diploma_board)}</div></div>
      <div class="info-card"><div class="info-label">Diploma Branch</div><div class="info-value">${fmt(profile?.diploma_branch)}</div></div>
      <div class="info-card"><div class="info-label">Diploma %</div><div class="info-value">${fmtPct(profile?.diploma_percentage)}</div></div>
      <div class="info-card"><div class="info-label">Year of Passing</div><div class="info-value">${fmt(profile?.diploma_year_of_passing)}</div></div>
      ` : `
      <div class="info-card"><div class="info-label">Board (12th)</div><div class="info-value">${fmt(profile?.board_12th)}</div></div>
      <div class="info-card"><div class="info-label">Stream</div><div class="info-value">${fmt(profile?.stream_12th)}</div></div>
      <div class="info-card"><div class="info-label">12th Percentage</div><div class="info-value">${fmtPct(profile?.percentage_12th)}</div></div>
      ${profile?.pcm_percentage != null ? `<div class="info-card"><div class="info-label">PCM %</div><div class="info-value">${fmtPct(profile?.pcm_percentage)}</div></div>` : ''}
      ${profile?.pcb_percentage != null ? `<div class="info-card"><div class="info-label">PCB %</div><div class="info-value">${fmtPct(profile?.pcb_percentage)}</div></div>` : ''}
      `}
      <div class="info-card"><div class="info-label">Drop Year</div><div class="info-value">${profile?.is_drop_year ? `Yes (${fmt(profile?.num_attempts)} attempt(s))` : 'No'}</div></div>
    </div>
  </div>

  <!-- Entrance Exam Scores -->
  <div class="section">
    <h2>Entrance Exam Scores</h2>
    <table>
      <thead><tr><th>Exam</th><th>Score</th><th>Percentile</th><th>Rank</th><th>Year</th></tr></thead>
      <tbody>${scoreRows}</tbody>
    </table>
  </div>

</div>

<!-- ═══════════════════════════════════════════ PAGE BREAK ═ -->
<div class="page-break"></div>

<!-- ═══════════════════════════════════════════ PAGE 2 ═══ -->

${subHeader(2, 3)}

<div class="body">

  <!-- Preferences -->
  <div class="section">
    <h2>Academic &amp; Location Preferences</h2>
    <div class="two-col">
      <div>
        <h3>Domain Interests</h3>
        <div style="margin-bottom:12px">${domainPills}</div>
        <h3>Preferred Degree</h3>
        <div style="margin-bottom:12px">${profile?.preferred_degree_type ? `<span class="pref-pill" style="background:#fef9c3;color:#854d0e">${profile.preferred_degree_type}</span>` : '<span class="no-data">Not specified</span>'}</div>
        <h3>College Type Preferences</h3>
        <div>
          ${profile?.only_government_colleges ? '<span class="pref-pill" style="background:#dcfce7;color:#166534">Government Only</span>' : ''}
          ${profile?.private_allowed ? '<span class="pref-pill" style="background:#ede9fe;color:#5b21b6">Private Allowed</span>' : ''}
          ${profile?.deemed_universities_allowed ? '<span class="pref-pill" style="background:#fce7f3;color:#9d174d">Deemed Universities</span>' : ''}
        </div>
      </div>
      <div>
        <h3>Preferred States</h3>
        <div>${statePills}</div>
      </div>
    </div>
  </div>

  <!-- College Preferences -->
  <div class="section">
    <h2>College Shortlist (Dream / Target / Safe)</h2>
    ${collegePrefHtml}
  </div>

</div>

<!-- ═══════════════════════════════════════════ PAGE BREAK ═ -->
<div class="page-break"></div>

<!-- ═══════════════════════════════════════════ PAGE 3 ═══ -->

${subHeader(3, 3)}

<div class="body">

  <!-- Recommendations Summary -->
  <div class="section">
    <h2>Personalised Recommendations Summary</h2>
    <div class="summary-strip">
      <div class="summary-card"><div class="summary-num">${totalPred}</div><div class="summary-lbl">Total Recommendations</div></div>
      <div class="summary-card" style="border-top-color:#16a34a"><div class="summary-num" style="color:#16a34a">${counts.Backup}</div><div class="summary-lbl">High Probability</div></div>
      <div class="summary-card" style="border-top-color:#2563eb"><div class="summary-num" style="color:#2563eb">${counts.Safe}</div><div class="summary-lbl">Medium Probability</div></div>
      <div class="summary-card" style="border-top-color:#7c3aed"><div class="summary-num" style="color:#7c3aed">${counts.Dream}</div><div class="summary-lbl">Low Probability</div></div>
    </div>
    <p style="font-size:11px;color:#64748b;margin-top:10px">
      Recommendations are generated using a percentile-gap algorithm (v1.1) comparing your exam scores against
      historical cutoff data. Visit the Recommendations section in your portal for full details.
    </p>
  </div>

  <!-- Recommendations Detail Table -->
  ${totalPred > 0 ? `
  <div class="section">
    <h2>Detailed Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>College</th><th>Branch</th><th>Exam</th><th>Classification</th>
          <th>Probability</th><th>Cutoff %ile</th><th>Gap</th>
        </tr>
      </thead>
      <tbody>
        ${(predictions ?? []).map(p => {
          const cls   = p.classification;
          const color = CLASS_COLOR[cls] ?? '#374151';
          const collegeName = p.colleges?.name ?? '—';
          const branchName  = p.college_branches?.branch_name ?? '—';
          const examType    = p.student_exam_scores?.exam_type?.replace(/_/g, ' ') ?? '—';
          const prob  = p.probability_percentage;
          const cutoff = p.avg_cutoff_used;
          const gap   = p.score_diff_pct;
          return `<tr>
            <td><strong>${collegeName}</strong></td>
            <td>${branchName}</td>
            <td>${examType}</td>
            <td><span class="badge" style="background:${color}22;color:${color}">${CLASS_LABEL[cls] ?? cls}</span></td>
            <td><strong>${prob != null ? prob + '%' : '—'}</strong>
              <div class="prob-bar-bg"><div class="prob-bar-fill" style="width:${prob ?? 0}%;background:${color}"></div></div>
            </td>
            <td>${cutoff != null ? cutoff + '%ile' : '—'}</td>
            <td style="color:${(gap ?? 0) >= 0 ? '#16a34a' : '#dc2626'}">${gap != null ? (gap >= 0 ? '+' : '') + gap.toFixed(1) : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

</div>

<div class="footer">
  <div class="footer-left">Indian Career Guidance Council (ICGC) &nbsp;·&nbsp; Student Summary Report</div>
  <div class="footer-center">© Worknexis &nbsp;·&nbsp; All Rights Reserved</div>
  <div class="footer-right">Confidential — Personal use only<br/>${generatedDate}</div>
</div>

</body>
</html>`;
};

// ─── buildCounselorDetailedHTML ──────────────────────────────────────────────

export const buildCounselorDetailedHTML = ({ student, profile, scores, collegePref, predictions, counselor }) => {
  const isDiploma = profile?.qualification_type === 'Diploma';
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Exam scores rows
  const scoreRows = (scores ?? []).map(s => `
    <tr>
      <td>${fmt(s.exam_type?.replace(/_/g, ' '))}</td>
      <td>${fmt(s.score)}</td>
      <td>${s.percentile != null ? `${s.percentile}%ile` : '—'}</td>
      <td>${fmt(s.rank)}</td>
      <td>${fmt(s.attempt_year)}</td>
      <td>${fmt(s.attempt_number)}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="no-data">No exam scores recorded</td></tr>`;

  // All predictions table
  const predRows = (predictions ?? []).map(p => {
    const cls = p.classification;
    const color = CLASS_COLOR[cls] ?? '#374151';
    const collegeName  = p.colleges?.name ?? '—';
    const branchName   = p.college_branches?.branch_name ?? '—';
    const examType     = p.student_exam_scores?.exam_type?.replace(/_/g, ' ') ?? '—';
    const prob         = p.probability_percentage;
    const cutoff       = p.avg_cutoff_used;
    const gap          = p.score_diff_pct;
    return `<tr>
      <td><strong>${collegeName}</strong></td>
      <td>${branchName}</td>
      <td>${examType}</td>
      <td><span class="badge" style="background:${color}22;color:${color}">${CLASS_LABEL[cls] ?? cls}</span></td>
      <td><strong>${prob != null ? prob + '%' : '—'}</strong>
        <div class="prob-bar-bg" style="width:80px"><div class="prob-bar-fill" style="width:${prob ?? 0}%;background:${color}"></div></div>
      </td>
      <td>${cutoff != null ? cutoff + '%ile' : '—'}</td>
      <td style="color:${(gap ?? 0) >= 0 ? '#16a34a' : '#dc2626'}">${gap != null ? (gap >= 0 ? '+' : '') + gap.toFixed(1) : '—'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" class="no-data">No recommendations generated yet</td></tr>`;

  // College preferences
  const prefByCategory = { dream: [], target: [], safe: [] };
  (collegePref ?? []).forEach(p => { if (prefByCategory[p.category]) prefByCategory[p.category].push(p); });
  const catIcons = { dream: '🎯', target: '🏹', safe: '🛡️' };

  const collegePrefHtml = ['dream', 'target', 'safe'].map(cat => {
    const items = prefByCategory[cat];
    if (!items.length) return `<div class="cat-block"><div class="cat-header" style="color:${CAT_COLOR[cat]}">${catIcons[cat]} ${CATEGORY_LABEL[cat]} — No colleges added</div></div>`;
    const itemsHtml = items.map(p => {
      const pred = (predictions ?? []).find(pr => pr.college_id === p.college_id);
      const probHtml = pred
        ? `<span class="badge" style="background:${CLASS_COLOR[pred.classification]}22;color:${CLASS_COLOR[pred.classification]}">${CLASS_LABEL[pred.classification] ?? pred.classification} · ${pred.probability_percentage}%</span>`
        : '<span style="color:#94a3b8;font-size:11px">No prediction data</span>';
      return `<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
        <span><strong>${fmt(p.college_name)}</strong><span style="color:#64748b;margin-left:8px;font-size:11px">${fmt(p.college_location)}</span></span>
        ${probHtml}
      </div>`;
    }).join('');
    return `<div class="cat-block"><div class="cat-header" style="color:${CAT_COLOR[cat]}">${catIcons[cat]} ${CATEGORY_LABEL[cat]} (${items.length}/5)</div>${itemsHtml}</div>`;
  }).join('');

  // Summary counts
  const counts = { Backup: 0, Safe: 0, Dream: 0 };
  (predictions ?? []).forEach(p => { if (counts[p.classification] !== undefined) counts[p.classification]++; });
  const totalPred = predictions?.length ?? 0;

  // Domain/state pills
  const domainPills = (profile?.domains_of_interest ?? []).map(d => `<span class="pref-pill">${d}</span>`).join('') || '<span class="no-data">None</span>';
  const statePills = (profile?.preferred_states ?? []).map(s => `<span class="pref-pill" style="background:#dbeafe;color:#1d4ed8">${s}</span>`).join('') || '<span class="no-data">None</span>';

  const subHeader = (page) => `
<div class="sub-header">
  <div class="sub-header-left">
    <span class="sub-brand">ICGC</span>
    <span class="sub-dot">·</span>
    Counselor Detailed Report
  </div>
  <div class="sub-header-right">
    ${fmt(student?.name)} &nbsp;·&nbsp; Page ${page} of 3
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${BASE_CSS}
  .counselor-header-strip { background:#f8fafc; border-bottom: 2px solid #e2e8f0; padding:9px 34px; display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:#64748b; }
  .notes-box { background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #f59e0b; border-radius:8px; padding:14px; }
  .page-break { page-break-after: always; break-after: page; }
  .sub-header { background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%); padding: 9px 34px; display: flex; justify-content: space-between; align-items: center; }
  .sub-header-left { font-size: 10px; color: #94a3b8; letter-spacing: 0.3px; }
  .sub-brand { color: #60a5fa; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; font-size: 9px; }
  .sub-dot { color: #475569; margin: 0 6px; }
  .sub-header-right { font-size: 10px; color: #64748b; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════ PAGE 1 ═══ -->

<div class="header" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1e293b 100%)">
  <div>
    <div class="header-brand">ICGC</div>
    <div class="header-title">Indian Career Guidance Council</div>
    <h1>Counselor Detailed Report</h1>
    <div class="header-meta">Generated on ${generatedDate} &nbsp;·&nbsp; Professional / Confidential</div>
  </div>
  <div class="header-right">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Generated By</div>
    <div style="font-size:14px;font-weight:700;color:#fff">${fmt(counselor?.name)}</div>
    <div style="font-size:10.5px;color:#94a3b8;margin-top:3px">${fmt(counselor?.email)}</div>
    <div style="margin-top:10px;font-size:10px;color:#94a3b8;margin-bottom:2px">Student</div>
    <div style="font-size:12px;font-weight:600;color:#93c5fd">${fmt(student?.name)}</div>
  </div>
</div>

<div class="counselor-header-strip">
  <span><strong>Student:</strong> ${fmt(student?.name)} &nbsp;|&nbsp; <strong>Category:</strong> ${fmt(student?.category)} &nbsp;|&nbsp; <strong>State:</strong> ${fmt(profile?.state)}</span>
  <span><strong>Qualification:</strong> ${fmt(profile?.qualification_type)} &nbsp;|&nbsp; <strong>Profile Complete:</strong> ${profile?.profile_complete ? '✓ Yes' : '✗ No'}</span>
</div>

<div class="body">

  <!-- Student Information -->
  <div class="section">
    <h2>Student Information</h2>
    <div class="info-grid">
      <div class="info-card"><div class="info-label">Full Name</div><div class="info-value">${fmt(student?.name)}</div></div>
      <div class="info-card"><div class="info-label">Email</div><div class="info-value">${fmt(student?.email)}</div></div>
      <div class="info-card"><div class="info-label">Phone</div><div class="info-value">${fmt(student?.phone)}</div></div>
      <div class="info-card"><div class="info-label">Date of Birth</div><div class="info-value">${fmtDate(profile?.dob)}</div></div>
      <div class="info-card"><div class="info-label">Gender</div><div class="info-value">${fmt(profile?.gender)}</div></div>
      <div class="info-card"><div class="info-label">State</div><div class="info-value">${fmt(profile?.state)}</div></div>
      <div class="info-card"><div class="info-label">Category</div><div class="info-value">${fmt(student?.category)}</div></div>
      <div class="info-card"><div class="info-label">Minority Status</div><div class="info-value">${profile?.minority_status ? 'Yes' : 'No'}</div></div>
      <div class="info-card"><div class="info-label">Annual Family Income</div><div class="info-value">${fmt(profile?.annual_family_income)}</div></div>
    </div>
  </div>

  <!-- Academic Background -->
  <div class="section">
    <h2>Academic Background</h2>
    <div class="info-grid">
      <div class="info-card"><div class="info-label">Qualification Type</div><div class="info-value">${fmt(profile?.qualification_type)}</div></div>
      ${isDiploma ? `
      <div class="info-card"><div class="info-label">Diploma Board</div><div class="info-value">${fmt(profile?.diploma_board)}</div></div>
      <div class="info-card"><div class="info-label">Diploma Branch</div><div class="info-value">${fmt(profile?.diploma_branch)}</div></div>
      <div class="info-card"><div class="info-label">Diploma %</div><div class="info-value">${fmtPct(profile?.diploma_percentage)}</div></div>
      <div class="info-card"><div class="info-label">Year of Passing</div><div class="info-value">${fmt(profile?.diploma_year_of_passing)}</div></div>
      ` : `
      <div class="info-card"><div class="info-label">12th Board</div><div class="info-value">${fmt(profile?.board_12th)}</div></div>
      <div class="info-card"><div class="info-label">Stream</div><div class="info-value">${fmt(profile?.stream_12th)}</div></div>
      <div class="info-card"><div class="info-label">12th Percentage</div><div class="info-value">${fmtPct(profile?.percentage_12th)}</div></div>
      <div class="info-card"><div class="info-label">PCM %</div><div class="info-value">${fmtPct(profile?.pcm_percentage)}</div></div>
      <div class="info-card"><div class="info-label">PCB %</div><div class="info-value">${fmtPct(profile?.pcb_percentage)}</div></div>
      `}
      <div class="info-card"><div class="info-label">Drop Year</div><div class="info-value">${profile?.is_drop_year ? 'Yes' : 'No'}</div></div>
      <div class="info-card"><div class="info-label">Number of Attempts</div><div class="info-value">${fmt(profile?.num_attempts)}</div></div>
    </div>
  </div>

  <!-- Entrance Exam Scores -->
  <div class="section">
    <h2>Entrance Exam Scores (All Attempts)</h2>
    <table>
      <thead><tr><th>Exam</th><th>Score</th><th>Percentile</th><th>Rank</th><th>Year</th><th>Attempt #</th></tr></thead>
      <tbody>${scoreRows}</tbody>
    </table>
  </div>

</div>

<!-- ═══════════════════════════════════════════ PAGE BREAK ═ -->
<div class="page-break"></div>

<!-- ═══════════════════════════════════════════ PAGE 2 ═══ -->

${subHeader(2)}

<div class="body">

  <!-- Academic & Location Preferences -->
  <div class="section">
    <h2>Academic &amp; Location Preferences</h2>
    <div class="two-col">
      <div>
        <h3>Domain Interests</h3>
        <div style="margin-bottom:10px">${domainPills}</div>
        <h3>Preferred Degree</h3>
        <div style="margin-bottom:10px">${profile?.preferred_degree_type ? `<span class="pref-pill" style="background:#fef9c3;color:#854d0e">${profile.preferred_degree_type}</span>` : '<span class="no-data">Not specified</span>'}</div>
        <h3>College Type</h3>
        <div style="margin-bottom:10px">
          ${profile?.only_government_colleges ? '<span class="pref-pill" style="background:#dcfce7;color:#166534">Government Only</span>' : ''}
          ${profile?.private_allowed ? '<span class="pref-pill" style="background:#ede9fe;color:#5b21b6">Private Allowed</span>' : ''}
          ${profile?.deemed_universities_allowed ? '<span class="pref-pill" style="background:#fce7f3;color:#9d174d">Deemed Universities</span>' : ''}
        </div>
        <h3>Preferred Branches</h3>
        <div>${(profile?.preferred_branches ?? []).length ? profile.preferred_branches.map(b => `<span class="pref-pill" style="background:#f0fdf4;color:#166534">${typeof b === 'string' ? b : (b?.branch_name ?? b?.name ?? '')}</span>`).join('') : '<span class="no-data">None specified</span>'}</div>
      </div>
      <div>
        <h3>Preferred States</h3>
        <div>${statePills}</div>
      </div>
    </div>
  </div>

  <!-- College Shortlist -->
  <div class="section">
    <h2>College Shortlist (Dream / Target / Safe)</h2>
    ${collegePrefHtml}
  </div>

</div>

<!-- ═══════════════════════════════════════════ PAGE BREAK ═ -->
<div class="page-break"></div>

<!-- ═══════════════════════════════════════════ PAGE 3 ═══ -->

${subHeader(3)}

<div class="body">

  <!-- All Personalised Recommendations -->
  <div class="section">
    <h2>All Personalised Recommendations</h2>
    <div class="summary-strip" style="margin-bottom:16px">
      <div class="summary-card"><div class="summary-num">${totalPred}</div><div class="summary-lbl">Total</div></div>
      <div class="summary-card" style="border-top-color:#16a34a"><div class="summary-num" style="color:#16a34a">${counts.Backup}</div><div class="summary-lbl">High Probability</div></div>
      <div class="summary-card" style="border-top-color:#2563eb"><div class="summary-num" style="color:#2563eb">${counts.Safe}</div><div class="summary-lbl">Medium Probability</div></div>
      <div class="summary-card" style="border-top-color:#7c3aed"><div class="summary-num" style="color:#7c3aed">${counts.Dream}</div><div class="summary-lbl">Low Probability</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>College</th><th>Branch</th><th>Exam</th><th>Classification</th>
          <th>Probability</th><th>Cutoff %ile</th><th>Gap</th>
        </tr>
      </thead>
      <tbody>${predRows}</tbody>
    </table>
  </div>

  <!-- Counselor Strategy Notes -->
  <div class="section">
    <h2>Counselor Strategy Notes</h2>
    <div class="notes-box">
      <p style="color:#92400e;font-size:10.5px;font-weight:600;margin-bottom:10px">
        Guidance for session planning based on recommendation classification:
      </p>
      <p style="color:#64748b;font-size:11px;margin-bottom:8px">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;vertical-align:middle;margin-right:6px"></span>
        <strong style="color:#166534">High Probability (${counts.Backup} colleges)</strong> — Student's percentile is ≥10 points above the average cutoff.
        Admission is highly likely. Use as safety schools; set expectations appropriately.
      </p>
      <p style="color:#64748b;font-size:11px;margin-bottom:8px">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2563eb;vertical-align:middle;margin-right:6px"></span>
        <strong style="color:#1d4ed8">Medium Probability (${counts.Safe} colleges)</strong> — Student is within the cutoff range (0–10 point gap).
        Competitive but realistic; focus counseling energy here.
      </p>
      <p style="color:#64748b;font-size:11px">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#7c3aed;vertical-align:middle;margin-right:6px"></span>
        <strong style="color:#5b21b6">Low Probability (${counts.Dream} colleges)</strong> — Student is 0–15 points below the cutoff.
        Aspirational; advise realistic backup planning and possible re-attempt strategy.
      </p>
    </div>
  </div>

</div>

<div class="footer">
  <div class="footer-left">Indian Career Guidance Council (ICGC) &nbsp;·&nbsp; Counselor Report &nbsp;·&nbsp; Algorithm v1.1</div>
  <div class="footer-center">© Worknexis &nbsp;·&nbsp; All Rights Reserved</div>
  <div class="footer-right">Confidential — Counselor use only<br/>${generatedDate}</div>
</div>

</body>
</html>`;
};
