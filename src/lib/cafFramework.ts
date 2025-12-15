// NCSC CAF Framework Structure
export interface CAFOutcome {
  id: string;
  name: string;
  description: string;
  evidence?: string[]; // Evidence requirements for critical systems
}

export interface CAFPrinciple {
  id: string;
  name: string;
  description: string;
  outcomes: CAFOutcome[];
}

export interface CAFObjective {
  objective: string;
  title: string;
  principles: CAFPrinciple[];
}

export const CAF_FRAMEWORK: CAFObjective[] = [
  {
    objective: "A",
    title: "Managing Security Risk",
    principles: [
      { 
        id: "A1", 
        name: "Governance", 
        description: "Effective governance structures oversee and ensure accountability for cyber security risk management",
        outcomes: [
          { 
            id: "A1.a", 
            name: "Board Direction", 
            description: "Effective organisational security management led at board level and articulated clearly in policies",
            evidence: [
              "Information security policy",
              "Relevant job descriptions showing roles have accountability for security of networks and information systems",
              "Any cyber specific training at board level (exercise training)"
            ]
          },
          { 
            id: "A1.b", 
            name: "Roles and Responsibilities", 
            description: "Established roles and responsibilities for security at all levels with clear communication channels",
            evidence: [
              "Skills matrix and/or examples of a training record",
              "RACI tables",
              "Job description for information security",
              "Acceptable Use Policy"
            ]
          },
          { 
            id: "A1.c", 
            name: "Decision-making", 
            description: "Senior-level accountability with appropriate delegation and risk consideration",
            evidence: [
              "Information security management policy",
              "Information security and IT policy suite",
              "Chart of the organisation's information security function, showing accountabilities and responsibilities",
              "Board updates on cyber risk and the status of the organisation, including decisions made and evidence of regular reviews",
              "Risk register detailing the decisions made at the various levels within the organisation",
              "Minutes from the board, information governance and/or information security forum (or equivalent)",
              "Job descriptions and terms of reference",
              "Documented risk appetite"
            ]
          },
        ]
      },
      { 
        id: "A2", 
        name: "Risk Management", 
        description: "Security risks to the organisation and services are identified, assessed and managed",
        outcomes: [
          { 
            id: "A2.a", 
            name: "Risk Management Process", 
            description: "Comprehensive risk management regime covering identification, assessment and mitigation",
            evidence: [
              "Evidence of risk management process review (documented improvements identified in the review)",
              "Information security in project management (evidence of the project lifecycle process including cybersecurity at each stage)",
              "Examples of Cyber Essentials remediation tracker or ITHC remediation tracker",
              "Example of a risk assessment using information from Cyber Threat Intelligence, identified vulnerabilities",
              "Example of a risk assessment used for a change control, if used",
              "Threat intelligence collection process/plan, if used",
              "Vulnerability management policy/procedure and examples of vulnerability management (scanning schedules and results)"
            ]
          },
          { 
            id: "A2.b", 
            name: "Assurance", 
            description: "Regular risk assessments identify and prioritize cyber risks to essential functions",
            evidence: [
              "Process followed to action findings identified by the assurance process",
              "ITHC, audit remediation action trackers",
              "Asset disposal procedure, including examples of certificates if used",
              "Cyber Essentials certification",
              "ISO27001 certification",
              "Internal and external audit schedules and reports",
              "Written minutes or documentation showing a meeting of the operations manager with the managed service provider",
              "Any audits conducted for suppliers"
            ]
          },
          { id: "A2.c", name: "Risk Treatment", description: "Risks are managed through appropriate treatment strategies" },
        ]
      },
      { 
        id: "A3", 
        name: "Asset Management", 
        description: "Assets relevant to security risks are identified and managed",
        outcomes: [
          { 
            id: "A3.a", 
            name: "Asset Management", 
            description: "Essential functions, systems and data assets are identified and documented",
            evidence: [
              "Asset register (please redact)",
              "Asset management policy",
              "Use of hardened gold builds (CIS Hardened images)",
              "Evidence that security requirements are included in the procurement of systems and services",
              "Asset disposal procedure, including example of certificates, if used",
              "Project management policy/procedure that shows cyber security should be considered and embedded from the early stages",
              "Any use of information asset owners (IAO) in asset management procedures, specific IAO training",
              "Maintenance of assets conducted by authorised, trained personnel",
              "Information on any data centres used including access control, power supply, uninterruptible power supply (UPS), standby generator, monitoring for power/moisture"
            ]
          },
          { id: "A3.b", name: "Asset Lifecycle", description: "Lifecycle management of assets supporting essential functions" },
        ]
      },
      { 
        id: "A4", 
        name: "Supply Chain", 
        description: "Security risks from the supply chain are identified and managed",
        outcomes: [
          { 
            id: "A4.a", 
            name: "Supply Chain", 
            description: "Understanding of supply chain relationships and dependencies",
            evidence: [
              "Cyber security supplier management process/policy, or references to cyber security in supplier management process",
              "Customer/supplier responsibility contract clauses",
              "Data sharing agreements",
              "Information sharing clauses within contracts",
              "Incident reporting and handling clauses in contracts",
              "Supplier risk assessment",
              "Supplier responsibilities within contracts including notifications of internal incidents",
              "Examples of supply chain mapping that may have been done to identify, prioritise and assess suppliers",
              "Monitoring, review, evaluation in supplier information security service delivery"
            ]
          },
          { id: "A4.b", name: "Supply Chain Security", description: "Security requirements embedded in supplier relationships and contracts" },
          { id: "A4.c", name: "Supply Chain Management", description: "Active management of supply chain security risks" },
        ]
      },
    ]
  },
  {
    objective: "B",
    title: "Protecting Against Cyber Attack",
    principles: [
      { 
        id: "B1", 
        name: "Service Protection", 
        description: "Services and systems are designed and maintained to prevent, detect and correct security issues",
        outcomes: [
          { 
            id: "B1.a", 
            name: "Policy, process and procedure development", 
            description: "Policies and processes govern protection of essential functions",
            evidence: [
              "Policies and processes that support critical systems (information security, IT, risk management, supplier, physical, legal)",
              "Documentation approval and sign-off process",
              "Evidence of policies on HR system",
              "Policy review or renewal schedule",
              "Communication plan",
              "Minutes or agendas from governance steering group meetings"
            ]
          },
          { 
            id: "B1.b", 
            name: "Policy, process and procedure implementation", 
            description: "Security by design principles applied to services and systems",
            evidence: [
              "Policies and processes that support critical systems (information security, IT, risk management, supplier, physical, legal, HR, finance)",
              "Documentation approval and sign-off process",
              "Process for dealing with policy breaches",
              "Policy review or renewal schedule",
              "Incident management reports or equivalent",
              "Disaster recovery plan",
              "Business continuity plan",
              "Communication plan",
              "Documented roles and responsibilities",
              "HR disciplinary process"
            ]
          },
          { id: "B1.c", name: "Service Deployment", description: "Secure deployment and configuration management" },
        ]
      },
      { 
        id: "B2", 
        name: "Identity and Access Control", 
        description: "User access to systems and data is managed appropriately",
        outcomes: [
          { 
            id: "B2.a", 
            name: "Identity verification, authentication and authorisation", 
            description: "User identities are verified before access is granted",
            evidence: [
              "Organisational procedure documentation that support the critical systems (information security, IT)",
              "Joiners, movers and leavers process",
              "Access control policy",
              "Remote access policy",
              "Process for HR and payroll system",
              "Evidence of what authentication you have in place",
              "Evidence of user access reviews (screenshot of review reminder)"
            ]
          },
          { 
            id: "B2.b", 
            name: "Device management", 
            description: "Access to systems and data is appropriately restricted",
            evidence: [
              "Organisational information and IT policies (information security, commercial access, BYOD, acceptable use, remote access, mobile device management)",
              "Procedure documentation that support critical systems (privileged access management, build documents)",
              "Network diagram showing commercial connectivity",
              "Risk assessments for commercial connectivity and remediation plans",
              "Joiners, movers and leavers process"
            ]
          },
          { 
            id: "B2.c", 
            name: "Privileged user management", 
            description: "Privileged access is tightly controlled and monitored",
            evidence: [
              "Organisational information and IT policies (information security, BYOD, acceptable use, remote access, identity and access management)",
              "Evidence of multi-factor authorisation for cloud computing platform",
              "Evidence of multi-factor authorisation to access domain servers",
              "Evidence of domain admin review (screenshot of review reminder)",
              "Evidence of separate standard and administrative accounts",
              "Process and procedure documentation (privileged access management)",
              "Joiners, movers and leavers process",
              "Network diagram showing boundary enforcing controls, zoning model and monitoring arrangements",
              "Risk assessments for commercial connectivity and remediation plans"
            ]
          },
          { 
            id: "B2.d", 
            name: "Identity and access management (IdAM)", 
            description: "User accounts and credentials are effectively managed",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, identity and access management)",
              "Joiners, movers and leavers process",
              "Documented process for approving and requesting user access",
              "Screenshot of access logs",
              "Process and procedure documentation (information asset owner approval)",
              "Network diagram showing boundary enforcing controls, zoning model and monitoring arrangements"
            ]
          },
        ]
      },
      { 
        id: "B3", 
        name: "Data Security", 
        description: "Sensitive data is handled securely and in accordance with relevant obligations",
        outcomes: [
          { 
            id: "B3.a", 
            name: "Understanding data", 
            description: "Data is classified and handling requirements defined",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, identity and access management, removable media)",
              "Organisational process and procedure documentation (information asset owner approval)",
              "Joiners, movers and leavers process",
              "Network diagram showing boundary enforcing controls, zoning model and monitoring arrangements",
              "Evidence of who has access to any Microsoft Teams or Slack channels that hold data important to the operation of your essential function"
            ]
          },
          { 
            id: "B3.b", 
            name: "Data in transit", 
            description: "Data is protected in transit",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, identity and access management, cryptographic)",
              "Evidence of internet protocol security (IPsec) or SSL tunnels",
              "Supplier assurance process (questionnaire, risk assessments, inventory)",
              "Network diagram showing boundary enforcing controls, zoning model, supplier connectivity and monitoring arrangements"
            ]
          },
          { 
            id: "B3.c", 
            name: "Stored data", 
            description: "Data is protected at rest",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, identity and access management, data movement/transfer, physical security, clear desk, data handling, data classification, data retention, backup/verification/recovery, cryptographic)"
            ]
          },
          { 
            id: "B3.d", 
            name: "Mobile data", 
            description: "Mobile data is securely managed",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, identity and access management, data handling, data classification, data retention, cryptographic, mobile device management)",
              "Information asset register (physical devices, data) and supporting process",
              "Evidence of bitlocker"
            ]
          },
          { 
            id: "B3.e", 
            name: "Media/equipment sanitisation", 
            description: "Data lifecycle including disposal is securely managed",
            evidence: [
              "Organisational information and IT policies (information security, asset management, acceptable use, data handling, data retention, secure data deletion and destruction)",
              "Information asset register (physical devices, software, data) and supporting process",
              "Procedure to wipe devices",
              "Disposal certificates"
            ]
          },
        ]
      },
      { 
        id: "B4", 
        name: "System Security", 
        description: "Systems are kept secure and resilient",
        outcomes: [
          { 
            id: "B4.a", 
            name: "Secure by design", 
            description: "Systems are designed with security in mind",
            evidence: [
              "Policies and processes for secure development, software assurance, network and information system recovery",
              "Approved product or software list",
              "Competency framework or skills matrix",
              "Network diagram showing boundary enforcing controls, zoning model, supplier connectivity and monitoring arrangements",
              "Data flow diagrams",
              "Infrastructure, endpoint and server build standards"
            ]
          },
          { 
            id: "B4.b", 
            name: "Secure configuration", 
            description: "Systems are configured securely and maintained",
            evidence: [
              "Policies and processes for secure development, asset management, change management",
              "Information asset register (physical, software and data) and supporting process",
              "Infrastructure, endpoint and server build standards",
              "Security configuration change logs",
              "Approved software list",
              "Network diagram showing boundary enforcing controls, zoning model, environments (test, development, production) monitoring arrangements",
              "Data flow diagrams"
            ]
          },
          { 
            id: "B4.c", 
            name: "Secure management", 
            description: "Systems are securely managed",
            evidence: [
              "Organisational information and IT policies (information security, acceptable use, antivirus, identity and access management)",
              "Organisational process and procedure documentation (privileged access management)",
              "Infrastructure, endpoint and server build standards",
              "Network diagram showing boundary enforcing controls, zoning model, environments (test, development, production) monitoring arrangements"
            ]
          },
          { 
            id: "B4.d", 
            name: "Vulnerability management", 
            description: "Vulnerabilities are identified and remediated in a timely manner",
            evidence: [
              "Organisational information and IT policies (information security, patch management, vulnerability management including remediation plans and testing)",
              "Risk assessments, risk register and risk sign-offs process",
              "Infrastructure, endpoint and server build standards",
              "Network diagram showing boundary enforcing controls, zoning model, environments (test, development, production) monitoring arrangements",
              "Evidence of penetration testing",
              "Evidence of severity scoring"
            ]
          },
        ]
      },
      { 
        id: "B5", 
        name: "Resilient Networks", 
        description: "Networks are designed and operated to secure the systems and data",
        outcomes: [
          { 
            id: "B5.a", 
            name: "Resilience preparation", 
            description: "Network design incorporates security principles",
            evidence: [
              "Organisational information and IT policies (information security, backup/verification/recovery, physical security for data centres/server rooms)",
              "Organisational process and procedure documentation (SOC or SIEM, failover procedures)",
              "Business continuity plan (including tests)",
              "Disaster recovery plan (including tests)",
              "IT disaster recovery plan (including table-top exercise reports)",
              "Incident response plan",
              "Business impact assessment (BIA)",
              "Recovery time objective (RTO) and recovery point objective (RPO)",
              "Information asset register (physical, software and data) and supporting process"
            ]
          },
          { 
            id: "B5.b", 
            name: "Design for resilience", 
            description: "Networks are protected from unauthorised access",
            evidence: [
              "Risk assessments",
              "Evidence that your risk register considers resource limitations",
              "Organisational process and procedure documentation (design, failover procedures)",
              "Network diagram showing boundary enforcing controls, zoning model, environments (test, development, production) monitoring arrangements"
            ]
          },
          { 
            id: "B5.c", 
            name: "Backups", 
            description: "Network activity is monitored for anomalies",
            evidence: [
              "Backup, verification and recovery policy and process",
              "Evidence of backup testing or a backup test schedule",
              "Information asset register (software and data) and supporting process"
            ]
          },
        ]
      },
      { 
        id: "B6", 
        name: "Staff Awareness and Training", 
        description: "Staff are equipped and supported to play their part in protecting the organisation",
        outcomes: [
          { 
            id: "B6.a", 
            name: "Cyber security culture", 
            description: "Staff understand their security responsibilities",
            evidence: [
              "Organisational information and IT policies (information security, incident management, HR policy on staff training)",
              "Details of security briefings",
              "Communication plan",
              "Evidence of staff news informing employees of contribution to cyber security",
              "Evidence of intranet main page showing cyber security contribution"
            ]
          },
          { 
            id: "B6.b", 
            name: "Cyber security training", 
            description: "Staff receive appropriate security training",
            evidence: [
              "Organisational information and IT policies (information security, HR policy on staff training)",
              "Evidence of information and cyber security training courses (mandatory and role-specific)",
              "Industry training and certifications",
              "Skills matrix",
              "Details of simulated cyber attack campaigns (phishing simulations)",
              "Cyber security communications to employees"
            ]
          },
        ]
      },
    ]
  },
  {
    objective: "C",
    title: "Detecting Cyber Security Events",
    principles: [
      { 
        id: "C1", 
        name: "Security Monitoring", 
        description: "Networks and systems are monitored to detect cyber security events",
        outcomes: [
          { 
            id: "C1.a", 
            name: "Monitoring coverage", 
            description: "Comprehensive monitoring strategy covers essential functions",
            evidence: [
              "Protective monitoring policy and support process",
              "Architecture for event logging infrastructure and SIEM implementation",
              "SOC or SIEM processes"
            ]
          },
          { 
            id: "C1.b", 
            name: "Securing logs", 
            description: "Monitoring capabilities detect security events",
            evidence: [
              "Policies and support processes for protective monitoring, incident management, backup/verification/recovery",
              "Architecture for event logging infrastructure and SIEM implementation",
              "SOC and SIEM processes (including retention)",
              "Evidence of who has access to cyber security portals (Microsoft Defender Portal)",
              "Evidence that SIEM system is read-only access"
            ]
          },
          { 
            id: "C1.c", 
            name: "Generating alerts", 
            description: "Security events are analyzed and responded to",
            evidence: [
              "Policies and support processes for protective monitoring, incident management, backup/verification/recovery",
              "Architecture for event logging infrastructure and SIEM implementation",
              "SOC and SIEM processes",
              "Information asset register (physical, software and data) and supporting process",
              "Evidence of early warnings from NCSC",
              "Evidence of alert prioritisation to confirm essential functions are resolved as a priority",
              "Evidence of alert testing (copy of a tuning request)"
            ]
          },
          { 
            id: "C1.d", 
            name: "Identifying security incidents", 
            description: "Security incidents are identified",
            evidence: [
              "Policies and support processes for protective monitoring, incident management, patch management",
              "Change requests to resolve identified vulnerabilities",
              "Architecture for event logging infrastructure and SIEM implementation",
              "SOC or SIEM processes",
              "Information asset register (physical, software and data) and supporting process",
              "Evidence of any threat intelligence feeds your organisation is part of",
              "Schedule for protective technologies (anti-virus or intrusion detection systems)"
            ]
          },
          { 
            id: "C1.e", 
            name: "Monitoring tools and skills", 
            description: "Monitoring staff have appropriate skills",
            evidence: [
              "Policies and support processes for protective monitoring, incident management",
              "Architecture for event logging infrastructure and SIEM implementation",
              "SOC or SIEM processes",
              "Documented monitoring staff roles",
              "Skills matrix",
              "Vendor training and cyber certifications"
            ]
          },
        ]
      },
      { 
        id: "C2", 
        name: "Proactive Security Event Discovery", 
        description: "Proactive analysis is used to improve detection of cyber security events",
        outcomes: [
          { id: "C2.a", name: "Threat Intelligence", description: "Threat intelligence informs security measures" },
          { id: "C2.b", name: "Security Testing", description: "Proactive testing identifies security weaknesses" },
        ]
      },
    ]
  },
  {
    objective: "D",
    title: "Minimising the Impact of Cyber Security Incidents",
    principles: [
      { 
        id: "D1", 
        name: "Response and Recovery Planning", 
        description: "Effective plans and processes are in place to respond to cyber security incidents",
        outcomes: [
          { 
            id: "D1.a", 
            name: "Response Plan", 
            description: "Documented and tested incident response plans exist",
            evidence: [
              "Incident response plan",
              "Evidence of recent incidents",
              "Collection of evidence/forensics (in house or contracted to a supplier, evidence of past examples)"
            ]
          },
          { 
            id: "D1.b", 
            name: "Response and Recovery Capability", 
            description: "Capability and resources to respond to incidents",
            evidence: [
              "Backup policy/plan and process for the restoration of backups (may be included in the backup policy/plan)",
              "Schedule for restore testing and/or examples of recent restore testing",
              "Communications plan (regulatory, internal and external stakeholders, media)",
              "Business impact assessment",
              "Legal and contractual requirements identified"
            ]
          },
          { 
            id: "D1.c", 
            name: "Testing and Exercising", 
            description: "Plans to recover essential functions after incidents",
            evidence: [
              "Documented exercise scenarios",
              "Exercise schedule and reports of past exercises demonstrating exercises are conducted"
            ]
          },
        ]
      },
      { 
        id: "D2", 
        name: "Lessons Learned", 
        description: "Lessons learned from incidents and near-misses are identified and acted upon",
        outcomes: [
          { 
            id: "D2.a", 
            name: "Incident Root Cause Analysis", 
            description: "Incidents are reviewed to identify improvements",
            evidence: [
              "Evidence that root cause analysis is conducted as part of the incident process",
              "Evidence of sessions or meeting notes to discuss lessons learned following an exercise",
              "Action tracker to prove lessons learned from exercises",
              "Root cause analysis methodology used (Kelvin TOP-SET, Five whys, Fault tree analysis (FTA), informal)"
            ]
          },
          { 
            id: "D2.b", 
            name: "Using Incidents to Drive Improvements", 
            description: "Lessons learned drive security improvements",
            evidence: [
              "Lessons learned documented from previous incidents",
              "Response plans incorporate lessons learned"
            ]
          },
        ]
      },
    ]
  }
];
