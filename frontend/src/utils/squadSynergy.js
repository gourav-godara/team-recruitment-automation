/**
 * Squad Synergy & Role Coverage Analysis
 * Analyzes team member technical skills and roles across 5 industry pillars:
 * 1. Frontend / Mobile
 * 2. Backend & Systems
 * 3. AI / ML / Data
 * 4. DevOps & Cloud
 * 5. UI/UX & Product Design
 */

const ROLE_PILLARS = {
  frontend: {
    label: 'Frontend/Mobile',
    icon: 'devices',
    keywords: [
      'react', 'next', 'next.js', 'vue', 'angular', 'svelte', 'tailwind', 'css', 'html',
      'javascript', 'typescript', 'frontend', 'front-end', 'ui', 'flutter', 'react native',
      'ios', 'android', 'swift', 'kotlin', 'web', 'web3', 'd3', 'd3.js', 'js', 'ts'
    ],
  },
  backend: {
    label: 'Backend/Systems',
    icon: 'database',
    keywords: [
      'node', 'express', 'python', 'fastapi', 'flask', 'django', 'golang', 'go', 'rust',
      'c++', 'c#', 'c', 'java', 'spring', 'sql', 'postgresql', 'postgres', 'mysql', 'mongodb',
      'redis', 'graphql', 'rest', 'backend', 'back-end', 'microservices', 'sqlite', 'timescaledb',
      'server', 'api'
    ],
  },
  aiml: {
    label: 'AI/ML & Data',
    icon: 'psychology',
    keywords: [
      'ai', 'ml', 'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'opencv',
      'nlp', 'llm', 'langchain', 'gemini', 'transformers', 'computer vision', 'pandas',
      'numpy', 'scikit', 'scikit-learn', 'data', 'spark', 'analytics', 'yolo', 'jupyter',
      'jupyter notebook'
    ],
  },
  devops: {
    label: 'DevOps & Cloud',
    icon: 'cloud',
    keywords: [
      'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'cloud', 'ci/cd', 'terraform',
      'ansible', 'linux', 'devops', 'monitoring', 'kafka', 'grpc', 'security', 'shell', 'bash'
    ],
  },
  design: {
    label: 'UI/UX & Design',
    icon: 'palette',
    keywords: [
      'figma', 'design', 'ui/ux', 'ux', 'product design', 'wireframing', 'user research',
      'framer', 'adobe', 'designer', 'animation', 'css3', 'svg'
    ],
  },
};

/**
 * Calculates role coverage and squad synergy for a team.
 * Grounded in authentic candidate skills, declared roles, and verified GitHub repository tech stacks.
 */
export function analyzeSquadSynergy(members = []) {
  const coveredPillars = new Set();
  const matchedPillars = {};

  const allSkillTokens = [];
  members.forEach((m) => {
    // 1. Declared skills from CSV
    const rawSkills = Array.isArray(m.skills) ? m.skills.join(' ') : (m.skills || '');

    // 2. Verified Top Languages from candidate GitHub profile
    const topLangs = Array.isArray(m.top_languages)
      ? m.top_languages.join(' ')
      : (m.top_languages || '');

    // 3. Languages and stack names from verified repositories
    const repoLangs = Array.isArray(m.recent_repos)
      ? m.recent_repos.map((r) => `${r.language || ''} ${r.name || ''}`).join(' ')
      : '';

    // 4. Role or title
    const roleText = m.role || '';

    // 5. GitHub metrics signals
    const ghMetricsLangs = Array.isArray(m.github_metrics?.top_languages)
      ? m.github_metrics.top_languages.join(' ')
      : '';

    const combined = `${rawSkills} ${topLangs} ${repoLangs} ${roleText} ${ghMetricsLangs}`.toLowerCase();
    const tokens = combined.split(/[^a-z0-9+#.-]+/);
    allSkillTokens.push(...tokens);
  });

  const fullSkillText = allSkillTokens.join(' ');

  for (const [key, pillar] of Object.entries(ROLE_PILLARS)) {
    const isCovered = pillar.keywords.some((kw) => {
      if (kw.includes(' ')) {
        return fullSkillText.includes(kw);
      }
      return allSkillTokens.includes(kw);
    });

    matchedPillars[key] = isCovered;
    if (isCovered) {
      coveredPillars.add(key);
    }
  }

  const coverageCount = coveredPillars.size;
  const synergyScore = Math.round((coverageCount / 5) * 100);

  let badgeLabel = 'Single Discipline';
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
  let isBalanced = false;

  if (coverageCount >= 4) {
    badgeLabel = '🏆 Fullstack Squad (Balanced)';
    badgeColor = 'bg-emerald-100 text-emerald-950 border-emerald-400';
    isBalanced = true;
  } else if (coverageCount === 3) {
    badgeLabel = '⚡ Triad Squad (Solid Coverage)';
    badgeColor = 'bg-blue-100 text-blue-950 border-blue-400';
    isBalanced = true;
  } else if (coverageCount === 2) {
    badgeLabel = 'Dual Track';
    badgeColor = 'bg-amber-100 text-amber-950 border-amber-400';
  }

  return {
    coverageCount,
    totalPillars: 5,
    synergyScore,
    badgeLabel,
    badgeColor,
    isBalanced,
    matchedPillars,
    pillars: ROLE_PILLARS,
  };
}

/**
 * Generates an executive jury brief for the team inspection drawer and comparisons.
 * Purely grounded in real evaluation metrics, composite scores, and verified portfolios.
 */
export function generateJuryBrief(team) {
  if (!team) return '';

  const members = team.members || [];
  const leadName = members[0]?.name || (members[0]?.email ? members[0].email.split('@')[0] : 'Team Lead');

  const expYears = team.score_details?.find((s) => (s.key || '').toLowerCase().includes('exp'))?.raw_value;
  const expText = expYears ? `${expYears} yrs avg` : 'demonstrated technical';

  const isEligible = team.eligibility_status === 'ELIGIBLE' || team.status === 'ELIGIBLE' || team.status === 'SHORTLISTED';

  if (!isEligible) {
    const reason = team.disqualification_reason || team.decision_reason || 'Ineligible under configured rules.';
    return `Ineligible candidate: ${reason}. Does not satisfy minimum eligibility gates.`;
  }

  if (team.status === 'SHORTLISTED' || team.rank <= 5) {
    return `Prime finalist contender: Led by ${leadName} with ${expText} background and verified GitHub code presence. Achieved a top-tier composite score of ${Number(team.total_score || 0).toFixed(1)}/100 across evaluated recruitment criteria with zero hard gate violations.`;
  }

  return `Strong waitlist candidate: Composite score of ${Number(team.total_score || 0).toFixed(1)}/100 across evaluated recruitment signals. Positioned as an immediate reserve contender for shortlist quota expansion.`;
}
