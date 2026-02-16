export function calculateLeadScore(lead: any) {
  let score = 0;

  // Pontuação por informações preenchidas
  if (lead.email) score += 20;
  if (lead.phone) score += 20;
  if (lead.company) score += 15;
  
  // Pontuação por valor
  if (lead.value > 10000) score += 25;
  else if (lead.value > 5000) score += 15;
  else if (lead.value > 0) score += 10;

  // Pontuação por status
  const statusScores: any = {
    NEW: 0,
    CONTACTED: 10,
    QUALIFIED: 20,
    PROPOSAL: 30,
    NEGOTIATION: 40,
  };

  score += statusScores[lead.status] || 0;

  return Math.min(score, 100);
}

export function getScoreColor(score: number) {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "default";
}
