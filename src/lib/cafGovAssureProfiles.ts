export interface GovAssureProfile {
  outcomeNumber: string;
  outcomeName: string;
  baselineProfile: string;
  enhancedProfile: string;
}

export const govAssureProfiles: GovAssureProfile[] = [
  { outcomeNumber: "A1.a", outcomeName: "Board Direction", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A1.b", outcomeName: "Roles & Responsibilities", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A1.c", outcomeName: "Decision-making", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A2.a", outcomeName: "Risk Management Process", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A2.b", outcomeName: "Assurance", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A3.a", outcomeName: "Asset Management", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "A4.a", outcomeName: "Supply Chain", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B1.a", outcomeName: "Policy & Process Development", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B1.b", outcomeName: "Policy & Process Implementation", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B2.a", outcomeName: "Identity Verification, Authentication and Authorisation", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B2.b", outcomeName: "Device Management", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B2.c", outcomeName: "Privileged User Management", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B2.d", outcomeName: "Identity & Access Management (IdAM)", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B3.a", outcomeName: "Understanding Data", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B3.b", outcomeName: "Data in Transit", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B3.c", outcomeName: "Stored Data", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B3.d", outcomeName: "Mobile Data", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B3.e", outcomeName: "Media/Equipment Sanitisation", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B4.a", outcomeName: "Secure By Design", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B4.b", outcomeName: "Secure Configuration", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B4.c", outcomeName: "Secure Management", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B4.d", outcomeName: "Vulnerability Management", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B5.a", outcomeName: "Resilience Preparation", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B5.b", outcomeName: "Design for Resilience", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B5.c", outcomeName: "Backups", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "B6.a", outcomeName: "Cyber Security Culture", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "B6.b", outcomeName: "Cyber Security Training", baselineProfile: "Partially Achieved", enhancedProfile: "Partially Achieved" },
  { outcomeNumber: "C1.a", outcomeName: "Monitoring Coverage", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "C1.b", outcomeName: "Securing Logs", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "C1.c", outcomeName: "Generating Alerts", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "C1.d", outcomeName: "Identifying Security Incidents", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "C1.e", outcomeName: "Monitoring Tools & Skills", baselineProfile: "Partially Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "C2.a", outcomeName: "System Abnormalities for Attack Detection", baselineProfile: "Not Achieved", enhancedProfile: "Not Achieved" },
  { outcomeNumber: "C2.b", outcomeName: "Proactive Attack Discovery", baselineProfile: "Not Achieved", enhancedProfile: "Not Achieved" },
  { outcomeNumber: "D1.a", outcomeName: "Response Plan", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "D1.b", outcomeName: "Response & Recovery Capability", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "D1.c", outcomeName: "Testing & Exercising", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "D2.a", outcomeName: "Incident Root Cause Analysis", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
  { outcomeNumber: "D2.b", outcomeName: "Using Incidents to Drive Improvements", baselineProfile: "Achieved", enhancedProfile: "Achieved" },
];
