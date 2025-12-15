// Official UK Government Orange Book Risk Appetite Definitions
// Source: Risk Appetite Guidance Note (August 2021) - HM Treasury

export const ORANGE_BOOK_RISK_LEVELS = [
  "Averse",
  "Minimal", 
  "Cautious",
  "Open",
  "Eager"
] as const;

export type OrangeBookRiskLevel = typeof ORANGE_BOOK_RISK_LEVELS[number];

export const RISK_APPETITE_DEFINITIONS: Record<OrangeBookRiskLevel, string> = {
  "Averse": "Avoid actions with associated risk. No decisions are taken outside of processes and oversight/monitoring arrangements. Organisational controls minimise risk of fraud, with significant levels of resource focused on detection and prevention.",
  
  "Minimal": "Willing to consider low risk actions which support delivery of priorities and objectives. Processes and oversight/monitoring arrangements enable limited risk taking. Organisational controls maximise fraud prevention, detection and deterrence through robust controls and sanctions.",
  
  "Cautious": "Willing to consider actions where benefits outweigh risks. Processes and oversight/monitoring arrangements enable cautious risk taking. Controls enable fraud prevention, detection and deterrence by maintaining appropriate controls and sanctions.",
  
  "Open": "Receptive to taking difficult decisions when benefits outweigh risks. Processes and oversight/monitoring arrangements enable considered risk taking. Levels of fraud controls are varied to reflect scale of risks with costs.",
  
  "Eager": "Ready to take difficult decisions when benefits outweigh risks. Processes and oversight/monitoring arrangements support informed risk taking. Levels of fraud controls are varied to reflect scale of risk with costs."
};

export const RISK_CATEGORY_GUIDANCE: Record<string, string> = {
  "Human": "Risks arising from ineffective leadership and engagement, suboptimal culture, inappropriate behaviours, the unavailability of sufficient capacity and capability, industrial action and/or non-compliance with relevant employment legislation/HR policies.",
  
  "Financial": "Risks arising from not managing finances in accordance with requirements and financial constraints resulting in poor returns from investments, failure to manage assets/liabilities or to obtain value for money from the resources deployed, and/or non-compliant financial reporting.",
  
  "Reputational": "Risks arising from adverse events, including ethical violations, a lack of sustainability, systemic or repeated failures or poor quality or a lack of innovation, leading to damages to reputation and or destruction of trust and relations.",
  
  "Delivery": "Risks arising from inadequate, poorly designed or ineffective/inefficient internal processes resulting in fraud, error, impaired customer service (quality and/or quantity of service), non-compliance and/or poor value for money.",
  
  "Compliance": "Risks arising from a defective transaction, a claim being made (including a defence to a claim or a counterclaim) or some other legal event occurring that results in a liability or other loss, or a failure to take appropriate measures to meet legal or regulatory requirements."
};
