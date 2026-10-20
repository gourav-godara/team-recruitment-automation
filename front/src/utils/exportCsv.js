/**
 * Generates and triggers browser download of RFC 4180 CSV files
 * directly from evaluation results or backend endpoints.
 */

export function downloadEvaluationCsv(teams, runId = '1') {
  if (!teams || teams.length === 0) {
    alert('No evaluation results to export.');
    return;
  }

  const headers = [
    'Rank',
    'Team Name',
    'Team ID',
    'Total Score',
    'Selection Status',
    'Eligibility Status',
    'Team Size',
    'Decision Reason',
  ];

  const rows = teams.map((t) => [
    t.rank != null ? t.rank : '',
    `"${(t.team_name || '').replace(/"/g, '""')}"`,
    `"${t.external_id || t.team_id || ''}"`,
    t.total_score != null ? Number(t.total_score).toFixed(2) : '',
    `"${t.status || ''}"`,
    `"${t.eligibility_status || ''}"`,
    t.team_size || 3,
    `"${(t.explanation || t.disqualification_reason || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `shortlisted_teams_run_${runId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
