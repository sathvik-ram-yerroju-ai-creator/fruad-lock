import { IncidentReport, EvidenceItem } from '@/types/scam';

export interface GeneratedReportDocument {
  reportId: string;
  markdown: string;
  jsonBlob: string;
  plainText: string;
  generatedAt: string;
}

export function generateIncidentDossier(
  report: IncidentReport,
  evidenceItems: EvidenceItem[]
): GeneratedReportDocument {
  const generatedAt = new Date().toISOString();

  const markdown = `# CYBER INCIDENT EVIDENCE DOSSIER
**Document ID:** ${report.id}
**Generated Date:** ${new Date(generatedAt).toLocaleString()}
**Classification:** Citizen Cybersecurity Incident Report (Advisory Draft)

---

> **IMPORTANT LEGAL NOTICE & DISCLAIMER:**
> This document distinguishes strictly between **User-Attested Factual Statements** (reported directly by the victim) and **AI Risk Indicators** (generated algorithmically by Fraud Lock advisory heuristics). This report is intended to assist law enforcement, banking fraud departments, and cyber cells (e.g. India National Cyber Crime Portal 1930 / cybercrime.gov.in) with structured incident triage.

---

## 1. USER-ATTESTED FACTUAL STATEMENTS
*(The following facts are declared by the user and have not been altered)*

- **Incident Category / Type:** ${report.incident_type}
- **Date & Time of Incident:** ${new Date(report.incident_date).toLocaleString()}
- **Financial Loss Claimed:** ${report.currency} ${report.financial_loss_amount.toLocaleString()}
- **Platform / Vector Used:** ${report.scammer_platform}
- **Scammer Contact Identifiers:**
${report.scammer_contacts.map((c) => `  - \`${c}\``).join('\n') || '  - None recorded'}

### User Incident Summary:
${report.summary || 'User did not provide a descriptive narrative.'}

### Incident Timeline:
${
  report.timeline_events.length > 0
    ? report.timeline_events
        .map(
          (t) =>
            `- **[${new Date(t.timestamp).toLocaleTimeString()}]** ${t.description} *(User-Verified: ${
              t.verified_by_user ? 'YES' : 'PENDING'
            })*`
        )
        .join('\n')
    : 'No timeline events recorded.'
}

---

## 2. EMERGENCY MITIGATION STEPS TAKEN
- [${report.emergency_steps_taken.bank_contacted ? 'X' : ' '}] Bank contacted for transaction freezing
- [${report.emergency_steps_taken.card_blocked ? 'X' : ' '}] Debit/Credit card blocked
- [${report.emergency_steps_taken.upi_complaint_filed ? 'X' : ' '}] UPI dispute logged with payment app
- [${report.emergency_steps_taken.cyber_helpline_called ? 'X' : ' '}] National Cyber Helpline (1930) contacted
- [${report.emergency_steps_taken.passwords_changed ? 'X' : ' '}] Compromised credentials changed from trusted device
- [${report.emergency_steps_taken.app_uninstalled ? 'X' : ' '}] Remote screen-sharing application uninstalled

---

## 3. ATTACHED EVIDENCE ITEMS & ARTIFACTS
Total evidence artifacts linked: **${evidenceItems.length}**

${
  evidenceItems.length > 0
    ? evidenceItems
        .map(
          (item, idx) => `
### Evidence Item #${idx + 1}: ${item.title}
- **Type:** ${item.type.toUpperCase()}
- **Date Captured:** ${new Date(item.created_at).toLocaleString()}
- **Raw Content / Excerpt:**
\`\`\`text
${item.content.trim()}
\`\`\`
${item.user_notes ? `- **User Notes:** ${item.user_notes}` : ''}
${
  item.ai_analysis
    ? `- **Fraud Lock Advisory Indicator:** ${item.ai_analysis.risk_level} (${item.ai_analysis.category})
- **Technical Signals:** ${item.ai_analysis.technical_indicators.join('; ')}`
    : ''
}
`
        )
        .join('\n')
    : 'No attached evidence items in this dossier.'
}

---

## 4. FRAUD LOCK AI RISK ASSESSMENT (ADVISORY ONLY)
- **Status:** Algorithmic Heuristic Assessment
- **Legal Weight:** Advisory technical analysis only. Does not constitute judicial proof.
- **Verification Notice:** All digital evidence should be preserved in raw format (SMS headers, email EML files, bank UTR transaction receipts) for forensic analysis.

---
*Generated via 🛡️ FRAUD LOCK ("Detect. Alert. Protect. Report.")*
`;

  const jsonBlob = JSON.stringify(
    {
      report_metadata: {
        id: report.id,
        generated_at: generatedAt,
        standard: 'FRAUD_LOCK_INCIDENT_REPORT_V1',
        disclaimer: 'Separates user-attested facts from algorithmic advisory risk indicators.',
      },
      user_attested_facts: {
        incident_type: report.incident_type,
        incident_date: report.incident_date,
        financial_loss: {
          amount: report.financial_loss_amount,
          currency: report.currency,
        },
        scammer_platform: report.scammer_platform,
        scammer_contacts: report.scammer_contacts,
        narrative: report.summary,
        timeline: report.timeline_events,
        mitigation_actions: report.emergency_steps_taken,
      },
      evidence_vault_items: evidenceItems.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        content: e.content,
        user_notes: e.user_notes,
        created_at: e.created_at,
        ai_analysis_summary: e.ai_analysis
          ? {
              risk_level: e.ai_analysis.risk_level,
              category: e.ai_analysis.category,
              confidence: e.ai_analysis.confidence,
            }
          : null,
      })),
    },
    null,
    2
  );

  return {
    reportId: report.id,
    markdown,
    jsonBlob,
    plainText: markdown.replace(/[#*`>]/g, ''),
    generatedAt,
  };
}
