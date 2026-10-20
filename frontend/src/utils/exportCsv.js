/**
 * Utility functions for exporting evaluation data in multiple standard formats:
 * - RFC 4180 Full Results CSV
 * - Shortlisted Finalists CSV
 * - Complete Individual Candidates Roster CSV
 * - Structured JSON Audit Dossier
 */

/**
 * Triggers a browser download without blocking or popup warnings.
 */
function triggerFileDownload(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 250);
}

/**
 * 1. Download Official Full Results CSV (all teams with composite scores, ranks, failed gates, and reasons)
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
    'Candidate Names',
    'Gate Failures',
    'Decision Reason',
  ];

  const rows = teams.map((t) => {
    const memberNames = (t.members || [])
      .map((m) => {
        const scoreStr = m.score != null ? ` (${Number(m.score).toFixed(1)}/100)` : '';
        return `${m.name || m.member_name || 'Candidate'}${scoreStr}`;
      })
      .join('; ');

    const failuresStr = (t.failed_rules || [])
      .map((r) => `${r.rule_name || 'Gate'}: ${r.reason || 'Failed'}`)
      .join(' | ');

    return [
      t.rank != null ? t.rank : '',
      `"${(t.team_name || '').replace(/"/g, '""')}"`,
      `"${t.external_id || t.team_id || ''}"`,
      t.total_score != null ? Number(t.total_score).toFixed(2) : '',
      `"${t.status || ''}"`,
      `"${t.eligibility_status || ''}"`,
      t.team_size || (t.members ? t.members.length : 1),
      `"${memberNames.replace(/"/g, '""')}"`,
      `"${failuresStr.replace(/"/g, '""')}"`,
      `"${(t.explanation || t.disqualification_reason || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerFileDownload(csvContent, `official_full_results_run_${runId}.csv`);
}

/**
 * 2. Download Shortlisted Finalists Only CSV
 */
export function downloadShortlistCsv(teams, runId = '1') {
  const shortlisted = (teams || []).filter((t) => t.status === 'SHORTLISTED');
  if (shortlisted.length === 0) {
    alert('No shortlisted finalist teams found in current run.');
    return;
  }

  const headers = [
    'Shortlist Rank',
    'Team Name',
    'Team ID',
    'Composite Score',
    'Roster Size',
    'Candidate Members',
    'Selection Reason',
  ];

  const rows = shortlisted.map((t, idx) => {
    const memberNames = (t.members || [])
      .map((m) => {
        const scoreStr = m.score != null ? ` (${Number(m.score).toFixed(1)}/100)` : '';
        return `${m.name || m.member_name || 'Candidate'}${scoreStr}`;
      })
      .join('; ');

    return [
      idx + 1,
      `"${(t.team_name || '').replace(/"/g, '""')}"`,
      `"${t.external_id || t.team_id || ''}"`,
      t.total_score != null ? Number(t.total_score).toFixed(2) : '',
      t.team_size || (t.members ? t.members.length : 1),
      `"${memberNames.replace(/"/g, '""')}"`,
      `"${(t.explanation || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerFileDownload(csvContent, `shortlisted_finalists_run_${runId}.csv`);
}

/**
 * 3. Download Complete Individual Candidate Roster CSV (every applicant across teams with individual scores and sources)
 */
export function downloadCandidateRosterCsv(teams, dataset, runId = '1') {
  const candidateRows = [];

  const teamList = (teams && teams.length > 0) ? teams : (dataset?.teams || []);

  teamList.forEach((team) => {
    const members = team.members || [];
    members.forEach((m) => {
      const memberFailures = (m.failed_rules || [])
        .map((r) => `${r.rule_name || 'Rule'}: ${r.reason || 'Failed'}`)
        .join('; ');

      candidateRows.push({
        candidateName: m.name || m.member_name || 'Applicant',
        email: m.email || '',
        score: m.score != null ? Number(m.score).toFixed(1) : '',
        eligibility: m.is_eligible != null ? (m.is_eligible ? 'ELIGIBLE' : 'DISQUALIFIED') : '',
        experience: m.experience_years != null ? Number(m.experience_years).toFixed(1) : '',
        experienceSource: m.experience_source || 'Not provided',
        skills: Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills || ''),
        githubUrl: m.github_url || '',
        linkedinUrl: m.linkedin_url || '',
        portfolioUrl: m.portfolio_url || '',
        gender: m.declared_gender || m.gender || '',
        teamName: team.team_name || team.name || '',
        teamRank: team.rank != null ? team.rank : '',
        teamStatus: team.status || '',
        gateFailures: memberFailures,
      });
    });
  });

  if (candidateRows.length === 0) {
    alert('No candidate roster records available to export.');
    return;
  }

  const headers = [
    'Candidate Name',
    'Email Address',
    'Individual Score (/100)',
    'Candidate Eligibility',
    'Experience (Years)',
    'Experience Source',
    'Technical Skills',
    'GitHub Profile URL',
    'LinkedIn URL',
    'Portfolio URL',
    'Declared Gender',
    'Team Name',
    'Team Rank',
    'Team Selection Status',
    'Gate Failure Details',
  ];

  const rows = candidateRows.map((c) => [
    `"${c.candidateName.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    c.score,
    `"${c.eligibility.replace(/"/g, '""')}"`,
    c.experience,
    `"${c.experienceSource.replace(/"/g, '""')}"`,
    `"${c.skills.replace(/"/g, '""')}"`,
    `"${c.githubUrl.replace(/"/g, '""')}"`,
    `"${c.linkedinUrl.replace(/"/g, '""')}"`,
    `"${c.portfolioUrl.replace(/"/g, '""')}"`,
    `"${c.gender.replace(/"/g, '""')}"`,
    `"${c.teamName.replace(/"/g, '""')}"`,
    c.teamRank,
    `"${c.teamStatus.replace(/"/g, '""')}"`,
    `"${c.gateFailures.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerFileDownload(csvContent, `all_candidates_roster_run_${runId}.csv`);
}

/**
 * 4. Download Structured JSON Audit Dossier
 */
export function downloadEvaluationJson(teams, runInfo, dataset, runId = '1') {
  const payload = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      run_id: runId,
      engine_version: '2.0.0',
      total_teams_evaluated: teams.length,
      shortlisted_count: teams.filter((t) => t.status === 'SHORTLISTED').length,
      cutoff_score: runInfo?.cutoff_floor || 75.0,
      dataset_name: dataset?.name || dataset?.filename || 'Applicant Dataset',
    },
    teams,
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  triggerFileDownload(jsonContent, `evaluation_audit_package_run_${runId}.json`, 'application/json');
}
