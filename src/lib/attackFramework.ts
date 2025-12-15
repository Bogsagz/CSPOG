// MITRE ATT&CK Framework Data
// Organized by matrix (Enterprise, Mobile, ICS) and tactics

export type AttackMatrix = 'enterprise' | 'mobile' | 'ics';

export interface SubTechnique {
  id: string;
  name: string;
}

export interface Technique {
  id: string;
  name: string;
  subTechniques?: SubTechnique[];
}

export interface Tactic {
  id: string;
  name: string;
  techniques: Technique[];
}

export interface AttackMatrixData {
  name: string;
  tactics: Tactic[];
}

// Enterprise ATT&CK Matrix
export const enterpriseMatrix: AttackMatrixData = {
  name: "Enterprise",
  tactics: [
    {
      id: "TA0043",
      name: "Reconnaissance",
      techniques: [
        { id: "T1595", name: "Active Scanning", subTechniques: [
          { id: "T1595.001", name: "Scanning IP Blocks" },
          { id: "T1595.002", name: "Vulnerability Scanning" },
          { id: "T1595.003", name: "Wordlist Scanning" }
        ]},
        { id: "T1592", name: "Gather Victim Host Information", subTechniques: [
          { id: "T1592.001", name: "Hardware" },
          { id: "T1592.002", name: "Software" },
          { id: "T1592.003", name: "Firmware" },
          { id: "T1592.004", name: "Client Configurations" }
        ]},
        { id: "T1589", name: "Gather Victim Identity Information", subTechniques: [
          { id: "T1589.001", name: "Credentials" },
          { id: "T1589.002", name: "Email Addresses" },
          { id: "T1589.003", name: "Employee Names" }
        ]},
        { id: "T1590", name: "Gather Victim Network Information", subTechniques: [
          { id: "T1590.001", name: "Domain Properties" },
          { id: "T1590.002", name: "DNS" },
          { id: "T1590.004", name: "Network Topology" },
          { id: "T1590.005", name: "IP Addresses" },
          { id: "T1590.006", name: "Network Security Appliances" }
        ]},
        { id: "T1591", name: "Gather Victim Org Information", subTechniques: [
          { id: "T1591.001", name: "Determine Physical Locations" },
          { id: "T1591.002", name: "Business Relationships" },
          { id: "T1591.003", name: "Identify Business Tempo" },
          { id: "T1591.004", name: "Identify Roles" }
        ]},
        { id: "T1598", name: "Phishing for Information", subTechniques: [
          { id: "T1598.001", name: "Spearphishing Service" },
          { id: "T1598.002", name: "Spearphishing Attachment" },
          { id: "T1598.003", name: "Spearphishing Link" }
        ]},
        { id: "T1597", name: "Search Closed Sources", subTechniques: [
          { id: "T1597.001", name: "Threat Intel Vendors" },
          { id: "T1597.002", name: "Purchase Technical Data" }
        ]},
        { id: "T1596", name: "Search Open Technical Databases", subTechniques: [
          { id: "T1596.001", name: "DNS/Passive DNS" },
          { id: "T1596.002", name: "WHOIS" },
          { id: "T1596.003", name: "Digital Certificates" },
          { id: "T1596.004", name: "CDNs" },
          { id: "T1596.005", name: "Scan Databases" }
        ]},
        { id: "T1593", name: "Search Open Websites/Domains", subTechniques: [
          { id: "T1593.001", name: "Social Media" },
          { id: "T1593.002", name: "Search Engines" },
          { id: "T1593.003", name: "Code Repositories" }
        ]},
        { id: "T1594", name: "Search Victim-Owned Websites" }
      ]
    },
    {
      id: "TA0042",
      name: "Resource Development",
      techniques: [
        { id: "T1583", name: "Acquire Infrastructure", subTechniques: [
          { id: "T1583.001", name: "Domains" },
          { id: "T1583.002", name: "DNS Server" },
          { id: "T1583.003", name: "Virtual Private Server" },
          { id: "T1583.004", name: "Server" },
          { id: "T1583.005", name: "Botnet" },
          { id: "T1583.006", name: "Web Services" },
          { id: "T1583.007", name: "Serverless" },
          { id: "T1583.008", name: "Malvertising" }
        ]},
        { id: "T1586", name: "Compromise Accounts", subTechniques: [
          { id: "T1586.001", name: "Social Media Accounts" },
          { id: "T1586.002", name: "Email Accounts" },
          { id: "T1586.003", name: "Cloud Accounts" }
        ]},
        { id: "T1584", name: "Compromise Infrastructure", subTechniques: [
          { id: "T1584.001", name: "Domains" },
          { id: "T1584.002", name: "DNS Server" },
          { id: "T1584.003", name: "Virtual Private Server" },
          { id: "T1584.004", name: "Server" },
          { id: "T1584.005", name: "Botnet" },
          { id: "T1584.006", name: "Web Services" },
          { id: "T1584.007", name: "Serverless" }
        ]},
        { id: "T1587", name: "Develop Capabilities", subTechniques: [
          { id: "T1587.001", name: "Malware" },
          { id: "T1587.002", name: "Code Signing Certificates" },
          { id: "T1587.003", name: "Digital Certificates" },
          { id: "T1587.004", name: "Exploits" }
        ]},
        { id: "T1585", name: "Establish Accounts", subTechniques: [
          { id: "T1585.001", name: "Social Media Accounts" },
          { id: "T1585.002", name: "Email Accounts" },
          { id: "T1585.003", name: "Cloud Accounts" }
        ]},
        { id: "T1588", name: "Obtain Capabilities", subTechniques: [
          { id: "T1588.001", name: "Malware" },
          { id: "T1588.002", name: "Tool" },
          { id: "T1588.003", name: "Code Signing Certificates" },
          { id: "T1588.004", name: "Digital Certificates" },
          { id: "T1588.005", name: "Exploits" },
          { id: "T1588.006", name: "Vulnerabilities" }
        ]},
        { id: "T1608", name: "Stage Capabilities", subTechniques: [
          { id: "T1608.001", name: "Upload Malware" },
          { id: "T1608.002", name: "Upload Tool" },
          { id: "T1608.003", name: "Install Digital Certificate" },
          { id: "T1608.004", name: "Drive-by Target" },
          { id: "T1608.005", name: "Link Target" },
          { id: "T1608.006", name: "SEO Poisoning" }
        ]}
      ]
    },
    {
      id: "TA0001",
      name: "Initial Access",
      techniques: [
        { id: "T1189", name: "Drive-by Compromise" },
        { id: "T1190", name: "Exploit Public-Facing Application" },
        { id: "T1133", name: "External Remote Services" },
        { id: "T1200", name: "Hardware Additions" },
        { id: "T1566", name: "Phishing", subTechniques: [
          { id: "T1566.001", name: "Spearphishing Attachment" },
          { id: "T1566.002", name: "Spearphishing Link" },
          { id: "T1566.003", name: "Spearphishing via Service" },
          { id: "T1566.004", name: "Spearphishing Voice" }
        ]},
        { id: "T1091", name: "Replication Through Removable Media" },
        { id: "T1195", name: "Supply Chain Compromise", subTechniques: [
          { id: "T1195.001", name: "Compromise Software Dependencies" },
          { id: "T1195.002", name: "Compromise Software Supply Chain" },
          { id: "T1195.003", name: "Compromise Hardware Supply Chain" }
        ]},
        { id: "T1199", name: "Trusted Relationship" },
        { id: "T1078", name: "Valid Accounts", subTechniques: [
          { id: "T1078.001", name: "Default Accounts" },
          { id: "T1078.002", name: "Domain Accounts" },
          { id: "T1078.003", name: "Local Accounts" },
          { id: "T1078.004", name: "Cloud Accounts" }
        ]}
      ]
    },
    {
      id: "TA0002",
      name: "Execution",
      techniques: [
        { id: "T1059", name: "Command and Scripting Interpreter", subTechniques: [
          { id: "T1059.001", name: "PowerShell" },
          { id: "T1059.002", name: "AppleScript" },
          { id: "T1059.003", name: "Windows Command Shell" },
          { id: "T1059.004", name: "Unix Shell" },
          { id: "T1059.005", name: "Visual Basic" },
          { id: "T1059.006", name: "Python" },
          { id: "T1059.007", name: "JavaScript" },
          { id: "T1059.008", name: "Network Device CLI" },
          { id: "T1059.009", name: "Cloud API" }
        ]},
        { id: "T1609", name: "Container Administration Command" },
        { id: "T1610", name: "Deploy Container" },
        { id: "T1203", name: "Exploitation for Client Execution" },
        { id: "T1559", name: "Inter-Process Communication", subTechniques: [
          { id: "T1559.001", name: "Component Object Model" },
          { id: "T1559.002", name: "Dynamic Data Exchange" },
          { id: "T1559.003", name: "XPC Services" }
        ]},
        { id: "T1106", name: "Native API" },
        { id: "T1053", name: "Scheduled Task/Job", subTechniques: [
          { id: "T1053.002", name: "At" },
          { id: "T1053.003", name: "Cron" },
          { id: "T1053.005", name: "Scheduled Task" },
          { id: "T1053.006", name: "Systemd Timers" },
          { id: "T1053.007", name: "Container Orchestration Job" }
        ]},
        { id: "T1129", name: "Shared Modules" },
        { id: "T1072", name: "Software Deployment Tools" },
        { id: "T1569", name: "System Services", subTechniques: [
          { id: "T1569.001", name: "Launchctl" },
          { id: "T1569.002", name: "Service Execution" }
        ]},
        { id: "T1204", name: "User Execution", subTechniques: [
          { id: "T1204.001", name: "Malicious Link" },
          { id: "T1204.002", name: "Malicious File" },
          { id: "T1204.003", name: "Malicious Image" }
        ]},
        { id: "T1047", name: "Windows Management Instrumentation" }
      ]
    },
    {
      id: "TA0003",
      name: "Persistence",
      techniques: [
        { id: "T1098", name: "Account Manipulation", subTechniques: [
          { id: "T1098.001", name: "Additional Cloud Credentials" },
          { id: "T1098.002", name: "Additional Email Delegate Permissions" },
          { id: "T1098.003", name: "Additional Cloud Roles" },
          { id: "T1098.004", name: "SSH Authorized Keys" },
          { id: "T1098.005", name: "Device Registration" },
          { id: "T1098.006", name: "Additional Container Cluster Roles" }
        ]},
        { id: "T1197", name: "BITS Jobs" },
        { id: "T1547", name: "Boot or Logon Autostart Execution", subTechniques: [
          { id: "T1547.001", name: "Registry Run Keys / Startup Folder" },
          { id: "T1547.002", name: "Authentication Package" },
          { id: "T1547.003", name: "Time Providers" },
          { id: "T1547.004", name: "Winlogon Helper DLL" },
          { id: "T1547.005", name: "Security Support Provider" },
          { id: "T1547.006", name: "Kernel Modules and Extensions" },
          { id: "T1547.009", name: "Shortcut Modification" },
          { id: "T1547.012", name: "Print Processors" },
          { id: "T1547.013", name: "XDG Autostart Entries" },
          { id: "T1547.014", name: "Active Setup" },
          { id: "T1547.015", name: "Login Items" }
        ]},
        { id: "T1037", name: "Boot or Logon Initialization Scripts", subTechniques: [
          { id: "T1037.001", name: "Logon Script (Windows)" },
          { id: "T1037.002", name: "Login Hook" },
          { id: "T1037.003", name: "Network Logon Script" },
          { id: "T1037.004", name: "RC Scripts" },
          { id: "T1037.005", name: "Startup Items" }
        ]},
        { id: "T1176", name: "Browser Extensions" },
        { id: "T1554", name: "Compromise Client Software Binary" },
        { id: "T1136", name: "Create Account", subTechniques: [
          { id: "T1136.001", name: "Local Account" },
          { id: "T1136.002", name: "Domain Account" },
          { id: "T1136.003", name: "Cloud Account" }
        ]},
        { id: "T1543", name: "Create or Modify System Process", subTechniques: [
          { id: "T1543.001", name: "Launch Agent" },
          { id: "T1543.002", name: "Systemd Service" },
          { id: "T1543.003", name: "Windows Service" },
          { id: "T1543.004", name: "Launch Daemon" }
        ]},
        { id: "T1546", name: "Event Triggered Execution", subTechniques: [
          { id: "T1546.001", name: "Change Default File Association" },
          { id: "T1546.002", name: "Screensaver" },
          { id: "T1546.003", name: "Windows Management Instrumentation Event" },
          { id: "T1546.004", name: "Unix Shell Configuration Modification" },
          { id: "T1546.005", name: "Trap" },
          { id: "T1546.006", name: "LC_LOAD_DYLIB Addition" },
          { id: "T1546.007", name: "Netsh Helper DLL" },
          { id: "T1546.008", name: "Accessibility Features" },
          { id: "T1546.009", name: "AppCert DLLs" },
          { id: "T1546.010", name: "AppInit DLLs" },
          { id: "T1546.011", name: "Application Shimming" },
          { id: "T1546.012", name: "Image File Execution Options Injection" },
          { id: "T1546.013", name: "PowerShell Profile" },
          { id: "T1546.014", name: "Emond" },
          { id: "T1546.015", name: "Component Object Model Hijacking" },
          { id: "T1546.016", name: "Installer Packages" }
        ]},
        { id: "T1133", name: "External Remote Services" },
        { id: "T1574", name: "Hijack Execution Flow", subTechniques: [
          { id: "T1574.001", name: "DLL Search Order Hijacking" },
          { id: "T1574.002", name: "DLL Side-Loading" },
          { id: "T1574.004", name: "Dylib Hijacking" },
          { id: "T1574.005", name: "Executable Installer File Permissions Weakness" },
          { id: "T1574.006", name: "Dynamic Linker Hijacking" },
          { id: "T1574.007", name: "Path Interception by PATH Environment Variable" },
          { id: "T1574.008", name: "Path Interception by Search Order Hijacking" },
          { id: "T1574.009", name: "Path Interception by Unquoted Path" },
          { id: "T1574.010", name: "Services File Permissions Weakness" },
          { id: "T1574.011", name: "Services Registry Permissions Weakness" },
          { id: "T1574.012", name: "COR_PROFILER" },
          { id: "T1574.013", name: "KernelCallbackTable" },
          { id: "T1574.014", name: "AppDomainManager" }
        ]},
        { id: "T1525", name: "Implant Internal Image" },
        { id: "T1556", name: "Modify Authentication Process", subTechniques: [
          { id: "T1556.001", name: "Domain Controller Authentication" },
          { id: "T1556.002", name: "Password Filter DLL" },
          { id: "T1556.003", name: "Pluggable Authentication Modules" },
          { id: "T1556.004", name: "Network Device Authentication" },
          { id: "T1556.005", name: "Reversible Encryption" },
          { id: "T1556.006", name: "Multi-Factor Authentication" },
          { id: "T1556.007", name: "Hybrid Identity" },
          { id: "T1556.008", name: "Network Provider DLL" }
        ]},
        { id: "T1137", name: "Office Application Startup", subTechniques: [
          { id: "T1137.001", name: "Office Template Macros" },
          { id: "T1137.002", name: "Office Test" },
          { id: "T1137.003", name: "Outlook Forms" },
          { id: "T1137.004", name: "Outlook Home Page" },
          { id: "T1137.005", name: "Outlook Rules" },
          { id: "T1137.006", name: "Add-ins" }
        ]},
        { id: "T1542", name: "Pre-OS Boot", subTechniques: [
          { id: "T1542.001", name: "System Firmware" },
          { id: "T1542.002", name: "Component Firmware" },
          { id: "T1542.003", name: "Bootkit" },
          { id: "T1542.004", name: "ROMMONkit" },
          { id: "T1542.005", name: "TFTP Boot" }
        ]},
        { id: "T1053", name: "Scheduled Task/Job" },
        { id: "T1505", name: "Server Software Component", subTechniques: [
          { id: "T1505.001", name: "SQL Stored Procedures" },
          { id: "T1505.002", name: "Transport Agent" },
          { id: "T1505.003", name: "Web Shell" },
          { id: "T1505.004", name: "IIS Components" },
          { id: "T1505.005", name: "Terminal Services DLL" }
        ]},
        { id: "T1205", name: "Traffic Signaling", subTechniques: [
          { id: "T1205.001", name: "Port Knocking" },
          { id: "T1205.002", name: "Socket Filters" }
        ]},
        { id: "T1078", name: "Valid Accounts" }
      ]
    },
    {
      id: "TA0004",
      name: "Privilege Escalation",
      techniques: [
        { id: "T1548", name: "Abuse Elevation Control Mechanism", subTechniques: [
          { id: "T1548.001", name: "Setuid and Setgid" },
          { id: "T1548.002", name: "Bypass User Account Control" },
          { id: "T1548.003", name: "Sudo and Sudo Caching" },
          { id: "T1548.004", name: "Elevated Execution with Prompt" },
          { id: "T1548.005", name: "Temporary Elevated Cloud Access" }
        ]},
        { id: "T1134", name: "Access Token Manipulation", subTechniques: [
          { id: "T1134.001", name: "Token Impersonation/Theft" },
          { id: "T1134.002", name: "Create Process with Token" },
          { id: "T1134.003", name: "Make and Impersonate Token" },
          { id: "T1134.004", name: "Parent PID Spoofing" },
          { id: "T1134.005", name: "SID-History Injection" }
        ]},
        { id: "T1547", name: "Boot or Logon Autostart Execution" },
        { id: "T1037", name: "Boot or Logon Initialization Scripts" },
        { id: "T1543", name: "Create or Modify System Process" },
        { id: "T1484", name: "Domain Policy Modification", subTechniques: [
          { id: "T1484.001", name: "Group Policy Modification" },
          { id: "T1484.002", name: "Domain Trust Modification" }
        ]},
        { id: "T1611", name: "Escape to Host" },
        { id: "T1546", name: "Event Triggered Execution" },
        { id: "T1068", name: "Exploitation for Privilege Escalation" },
        { id: "T1574", name: "Hijack Execution Flow" },
        { id: "T1055", name: "Process Injection", subTechniques: [
          { id: "T1055.001", name: "Dynamic-link Library Injection" },
          { id: "T1055.002", name: "Portable Executable Injection" },
          { id: "T1055.003", name: "Thread Execution Hijacking" },
          { id: "T1055.004", name: "Asynchronous Procedure Call" },
          { id: "T1055.005", name: "Thread Local Storage" },
          { id: "T1055.008", name: "Ptrace System Calls" },
          { id: "T1055.009", name: "Proc Memory" },
          { id: "T1055.011", name: "Extra Window Memory Injection" },
          { id: "T1055.012", name: "Process Hollowing" },
          { id: "T1055.013", name: "Process Doppelgänging" },
          { id: "T1055.014", name: "VDSO Hijacking" },
          { id: "T1055.015", name: "ListPlanting" }
        ]},
        { id: "T1053", name: "Scheduled Task/Job" },
        { id: "T1078", name: "Valid Accounts" }
      ]
    },
    {
      id: "TA0005",
      name: "Defense Evasion",
      techniques: [
        { id: "T1548", name: "Abuse Elevation Control Mechanism" },
        { id: "T1134", name: "Access Token Manipulation" },
        { id: "T1197", name: "BITS Jobs" },
        { id: "T1612", name: "Build Image on Host" },
        { id: "T1622", name: "Debugger Evasion" },
        { id: "T1140", name: "Deobfuscate/Decode Files or Information" },
        { id: "T1610", name: "Deploy Container" },
        { id: "T1006", name: "Direct Volume Access" },
        { id: "T1484", name: "Domain Policy Modification" },
        { id: "T1480", name: "Execution Guardrails", subTechniques: [
          { id: "T1480.001", name: "Environmental Keying" }
        ]},
        { id: "T1211", name: "Exploitation for Defense Evasion" },
        { id: "T1222", name: "File and Directory Permissions Modification", subTechniques: [
          { id: "T1222.001", name: "Windows File and Directory Permissions" },
          { id: "T1222.002", name: "Linux and Mac File and Directory Permissions" }
        ]},
        { id: "T1564", name: "Hide Artifacts", subTechniques: [
          { id: "T1564.001", name: "Hidden Files and Directories" },
          { id: "T1564.002", name: "Hidden Users" },
          { id: "T1564.003", name: "Hidden Window" },
          { id: "T1564.004", name: "NTFS File Attributes" },
          { id: "T1564.005", name: "Hidden File System" },
          { id: "T1564.006", name: "Run Virtual Instance" },
          { id: "T1564.007", name: "VBA Stomping" },
          { id: "T1564.008", name: "Email Hiding Rules" },
          { id: "T1564.009", name: "Resource Forking" },
          { id: "T1564.010", name: "Process Argument Spoofing" },
          { id: "T1564.011", name: "Ignore Process Interrupts" }
        ]},
        { id: "T1574", name: "Hijack Execution Flow" },
        { id: "T1562", name: "Impair Defenses", subTechniques: [
          { id: "T1562.001", name: "Disable or Modify Tools" },
          { id: "T1562.002", name: "Disable Windows Event Logging" },
          { id: "T1562.003", name: "Impair Command History Logging" },
          { id: "T1562.004", name: "Disable or Modify System Firewall" },
          { id: "T1562.006", name: "Indicator Blocking" },
          { id: "T1562.007", name: "Disable or Modify Cloud Firewall" },
          { id: "T1562.008", name: "Disable or Modify Cloud Logs" },
          { id: "T1562.009", name: "Safe Mode Boot" },
          { id: "T1562.010", name: "Downgrade Attack" },
          { id: "T1562.011", name: "Spoof Security Alerting" },
          { id: "T1562.012", name: "Disable or Modify Linux Audit System" }
        ]},
        { id: "T1070", name: "Indicator Removal", subTechniques: [
          { id: "T1070.001", name: "Clear Windows Event Logs" },
          { id: "T1070.002", name: "Clear Linux or Mac System Logs" },
          { id: "T1070.003", name: "Clear Command History" },
          { id: "T1070.004", name: "File Deletion" },
          { id: "T1070.005", name: "Network Share Connection Removal" },
          { id: "T1070.006", name: "Timestomp" },
          { id: "T1070.007", name: "Clear Network Connection History" },
          { id: "T1070.008", name: "Clear Mailbox Data" },
          { id: "T1070.009", name: "Clear Persistence" }
        ]},
        { id: "T1202", name: "Indirect Command Execution" },
        { id: "T1036", name: "Masquerading", subTechniques: [
          { id: "T1036.001", name: "Invalid Code Signature" },
          { id: "T1036.002", name: "Right-to-Left Override" },
          { id: "T1036.003", name: "Rename System Utilities" },
          { id: "T1036.004", name: "Masquerade Task or Service" },
          { id: "T1036.005", name: "Match Legitimate Name or Location" },
          { id: "T1036.006", name: "Space after Filename" },
          { id: "T1036.007", name: "Double File Extension" },
          { id: "T1036.008", name: "Masquerade File Type" },
          { id: "T1036.009", name: "Break Process Trees" }
        ]},
        { id: "T1556", name: "Modify Authentication Process" },
        { id: "T1578", name: "Modify Cloud Compute Infrastructure", subTechniques: [
          { id: "T1578.001", name: "Create Snapshot" },
          { id: "T1578.002", name: "Create Cloud Instance" },
          { id: "T1578.003", name: "Delete Cloud Instance" },
          { id: "T1578.004", name: "Revert Cloud Instance" },
          { id: "T1578.005", name: "Modify Cloud Compute Configurations" }
        ]},
        { id: "T1112", name: "Modify Registry" },
        { id: "T1601", name: "Modify System Image", subTechniques: [
          { id: "T1601.001", name: "Patch System Image" },
          { id: "T1601.002", name: "Downgrade System Image" }
        ]},
        { id: "T1599", name: "Network Boundary Bridging", subTechniques: [
          { id: "T1599.001", name: "Network Address Translation Traversal" }
        ]},
        { id: "T1027", name: "Obfuscated Files or Information", subTechniques: [
          { id: "T1027.001", name: "Binary Padding" },
          { id: "T1027.002", name: "Software Packing" },
          { id: "T1027.003", name: "Steganography" },
          { id: "T1027.004", name: "Compile After Delivery" },
          { id: "T1027.005", name: "Indicator Removal from Tools" },
          { id: "T1027.006", name: "HTML Smuggling" },
          { id: "T1027.007", name: "Dynamic API Resolution" },
          { id: "T1027.008", name: "Stripped Payloads" },
          { id: "T1027.009", name: "Embedded Payloads" },
          { id: "T1027.010", name: "Command Obfuscation" },
          { id: "T1027.011", name: "Fileless Storage" },
          { id: "T1027.012", name: "LNK Icon Smuggling" }
        ]},
        { id: "T1647", name: "Plist File Modification" },
        { id: "T1542", name: "Pre-OS Boot" },
        { id: "T1055", name: "Process Injection" },
        { id: "T1620", name: "Reflective Code Loading" },
        { id: "T1207", name: "Rogue Domain Controller" },
        { id: "T1014", name: "Rootkit" },
        { id: "T1218", name: "System Binary Proxy Execution", subTechniques: [
          { id: "T1218.001", name: "Compiled HTML File" },
          { id: "T1218.002", name: "Control Panel" },
          { id: "T1218.003", name: "CMSTP" },
          { id: "T1218.004", name: "InstallUtil" },
          { id: "T1218.005", name: "Mshta" },
          { id: "T1218.007", name: "Msiexec" },
          { id: "T1218.008", name: "Odbcconf" },
          { id: "T1218.009", name: "Regsvcs/Regasm" },
          { id: "T1218.010", name: "Regsvr32" },
          { id: "T1218.011", name: "Rundll32" },
          { id: "T1218.012", name: "Verclsid" },
          { id: "T1218.013", name: "Mavinject" },
          { id: "T1218.014", name: "MMC" }
        ]},
        { id: "T1216", name: "System Script Proxy Execution", subTechniques: [
          { id: "T1216.001", name: "PubPrn" },
          { id: "T1216.002", name: "SyncAppvPublishingServer" }
        ]},
        { id: "T1221", name: "Template Injection" },
        { id: "T1205", name: "Traffic Signaling" },
        { id: "T1127", name: "Trusted Developer Utilities Proxy Execution", subTechniques: [
          { id: "T1127.001", name: "MSBuild" }
        ]},
        { id: "T1535", name: "Unused/Unsupported Cloud Regions" },
        { id: "T1550", name: "Use Alternate Authentication Material", subTechniques: [
          { id: "T1550.001", name: "Application Access Token" },
          { id: "T1550.002", name: "Pass the Hash" },
          { id: "T1550.003", name: "Pass the Ticket" },
          { id: "T1550.004", name: "Web Session Cookie" }
        ]},
        { id: "T1078", name: "Valid Accounts" },
        { id: "T1497", name: "Virtualization/Sandbox Evasion", subTechniques: [
          { id: "T1497.001", name: "System Checks" },
          { id: "T1497.002", name: "User Activity Based Checks" },
          { id: "T1497.003", name: "Time Based Evasion" }
        ]},
        { id: "T1600", name: "Weaken Encryption", subTechniques: [
          { id: "T1600.001", name: "Reduce Key Space" },
          { id: "T1600.002", name: "Disable Crypto Hardware" }
        ]},
        { id: "T1220", name: "XSL Script Processing" }
      ]
    },
    {
      id: "TA0006",
      name: "Credential Access",
      techniques: [
        { id: "T1557", name: "Adversary-in-the-Middle", subTechniques: [
          { id: "T1557.001", name: "LLMNR/NBT-NS Poisoning" },
          { id: "T1557.002", name: "ARP Cache Poisoning" },
          { id: "T1557.003", name: "DHCP Spoofing" }
        ]},
        { id: "T1110", name: "Brute Force", subTechniques: [
          { id: "T1110.001", name: "Password Guessing" },
          { id: "T1110.002", name: "Password Cracking" },
          { id: "T1110.003", name: "Password Spraying" },
          { id: "T1110.004", name: "Credential Stuffing" }
        ]},
        { id: "T1555", name: "Credentials from Password Stores", subTechniques: [
          { id: "T1555.001", name: "Keychain" },
          { id: "T1555.002", name: "Securityd Memory" },
          { id: "T1555.003", name: "Credentials from Web Browsers" },
          { id: "T1555.004", name: "Windows Credential Manager" },
          { id: "T1555.005", name: "Password Managers" },
          { id: "T1555.006", name: "Cloud Secrets Management Stores" }
        ]},
        { id: "T1212", name: "Exploitation for Credential Access" },
        { id: "T1187", name: "Forced Authentication" },
        { id: "T1606", name: "Forge Web Credentials", subTechniques: [
          { id: "T1606.001", name: "Web Cookies" },
          { id: "T1606.002", name: "SAML Tokens" }
        ]},
        { id: "T1056", name: "Input Capture", subTechniques: [
          { id: "T1056.001", name: "Keylogging" },
          { id: "T1056.002", name: "GUI Input Capture" },
          { id: "T1056.003", name: "Web Portal Capture" },
          { id: "T1056.004", name: "Credential API Hooking" }
        ]},
        { id: "T1556", name: "Modify Authentication Process" },
        { id: "T1111", name: "Multi-Factor Authentication Interception" },
        { id: "T1621", name: "Multi-Factor Authentication Request Generation" },
        { id: "T1040", name: "Network Sniffing" },
        { id: "T1003", name: "OS Credential Dumping", subTechniques: [
          { id: "T1003.001", name: "LSASS Memory" },
          { id: "T1003.002", name: "Security Account Manager" },
          { id: "T1003.003", name: "NTDS" },
          { id: "T1003.004", name: "LSA Secrets" },
          { id: "T1003.005", name: "Cached Domain Credentials" },
          { id: "T1003.006", name: "DCSync" },
          { id: "T1003.007", name: "Proc Filesystem" },
          { id: "T1003.008", name: "/etc/passwd and /etc/shadow" }
        ]},
        { id: "T1528", name: "Steal Application Access Token" },
        { id: "T1649", name: "Steal or Forge Authentication Certificates" },
        { id: "T1558", name: "Steal or Forge Kerberos Tickets", subTechniques: [
          { id: "T1558.001", name: "Golden Ticket" },
          { id: "T1558.002", name: "Silver Ticket" },
          { id: "T1558.003", name: "Kerberoasting" },
          { id: "T1558.004", name: "AS-REP Roasting" }
        ]},
        { id: "T1539", name: "Steal Web Session Cookie" },
        { id: "T1552", name: "Unsecured Credentials", subTechniques: [
          { id: "T1552.001", name: "Credentials In Files" },
          { id: "T1552.002", name: "Credentials in Registry" },
          { id: "T1552.003", name: "Bash History" },
          { id: "T1552.004", name: "Private Keys" },
          { id: "T1552.005", name: "Cloud Instance Metadata API" },
          { id: "T1552.006", name: "Group Policy Preferences" },
          { id: "T1552.007", name: "Container API" },
          { id: "T1552.008", name: "Chat Messages" }
        ]}
      ]
    },
    {
      id: "TA0007",
      name: "Discovery",
      techniques: [
        { id: "T1087", name: "Account Discovery", subTechniques: [
          { id: "T1087.001", name: "Local Account" },
          { id: "T1087.002", name: "Domain Account" },
          { id: "T1087.003", name: "Email Account" },
          { id: "T1087.004", name: "Cloud Account" }
        ]},
        { id: "T1010", name: "Application Window Discovery" },
        { id: "T1217", name: "Browser Information Discovery" },
        { id: "T1580", name: "Cloud Infrastructure Discovery" },
        { id: "T1538", name: "Cloud Service Dashboard" },
        { id: "T1526", name: "Cloud Service Discovery" },
        { id: "T1613", name: "Container and Resource Discovery" },
        { id: "T1622", name: "Debugger Evasion" },
        { id: "T1482", name: "Domain Trust Discovery" },
        { id: "T1083", name: "File and Directory Discovery" },
        { id: "T1615", name: "Group Policy Discovery" },
        { id: "T1654", name: "Log Enumeration" },
        { id: "T1046", name: "Network Service Discovery" },
        { id: "T1135", name: "Network Share Discovery" },
        { id: "T1040", name: "Network Sniffing" },
        { id: "T1201", name: "Password Policy Discovery" },
        { id: "T1120", name: "Peripheral Device Discovery" },
        { id: "T1069", name: "Permission Groups Discovery", subTechniques: [
          { id: "T1069.001", name: "Local Groups" },
          { id: "T1069.002", name: "Domain Groups" },
          { id: "T1069.003", name: "Cloud Groups" }
        ]},
        { id: "T1057", name: "Process Discovery" },
        { id: "T1012", name: "Query Registry" },
        { id: "T1018", name: "Remote System Discovery" },
        { id: "T1518", name: "Software Discovery", subTechniques: [
          { id: "T1518.001", name: "Security Software Discovery" }
        ]},
        { id: "T1082", name: "System Information Discovery" },
        { id: "T1614", name: "System Location Discovery", subTechniques: [
          { id: "T1614.001", name: "System Language Discovery" }
        ]},
        { id: "T1016", name: "System Network Configuration Discovery", subTechniques: [
          { id: "T1016.001", name: "Internet Connection Discovery" },
          { id: "T1016.002", name: "Wi-Fi Discovery" }
        ]},
        { id: "T1049", name: "System Network Connections Discovery" },
        { id: "T1033", name: "System Owner/User Discovery" },
        { id: "T1007", name: "System Service Discovery" },
        { id: "T1124", name: "System Time Discovery" },
        { id: "T1497", name: "Virtualization/Sandbox Evasion" }
      ]
    },
    {
      id: "TA0008",
      name: "Lateral Movement",
      techniques: [
        { id: "T1210", name: "Exploitation of Remote Services" },
        { id: "T1534", name: "Internal Spearphishing" },
        { id: "T1570", name: "Lateral Tool Transfer" },
        { id: "T1563", name: "Remote Service Session Hijacking", subTechniques: [
          { id: "T1563.001", name: "SSH Hijacking" },
          { id: "T1563.002", name: "RDP Hijacking" }
        ]},
        { id: "T1021", name: "Remote Services", subTechniques: [
          { id: "T1021.001", name: "Remote Desktop Protocol" },
          { id: "T1021.002", name: "SMB/Windows Admin Shares" },
          { id: "T1021.003", name: "Distributed Component Object Model" },
          { id: "T1021.004", name: "SSH" },
          { id: "T1021.005", name: "VNC" },
          { id: "T1021.006", name: "Windows Remote Management" },
          { id: "T1021.007", name: "Cloud Services" },
          { id: "T1021.008", name: "Direct Cloud VM Connections" }
        ]},
        { id: "T1091", name: "Replication Through Removable Media" },
        { id: "T1072", name: "Software Deployment Tools" },
        { id: "T1080", name: "Taint Shared Content" },
        { id: "T1550", name: "Use Alternate Authentication Material" }
      ]
    },
    {
      id: "TA0009",
      name: "Collection",
      techniques: [
        { id: "T1557", name: "Adversary-in-the-Middle" },
        { id: "T1560", name: "Archive Collected Data", subTechniques: [
          { id: "T1560.001", name: "Archive via Utility" },
          { id: "T1560.002", name: "Archive via Library" },
          { id: "T1560.003", name: "Archive via Custom Method" }
        ]},
        { id: "T1123", name: "Audio Capture" },
        { id: "T1119", name: "Automated Collection" },
        { id: "T1185", name: "Browser Session Hijacking" },
        { id: "T1115", name: "Clipboard Data" },
        { id: "T1530", name: "Data from Cloud Storage" },
        { id: "T1602", name: "Data from Configuration Repository", subTechniques: [
          { id: "T1602.001", name: "SNMP (MIB Dump)" },
          { id: "T1602.002", name: "Network Device Configuration Dump" }
        ]},
        { id: "T1213", name: "Data from Information Repositories", subTechniques: [
          { id: "T1213.001", name: "Confluence" },
          { id: "T1213.002", name: "Sharepoint" },
          { id: "T1213.003", name: "Code Repositories" }
        ]},
        { id: "T1005", name: "Data from Local System" },
        { id: "T1039", name: "Data from Network Shared Drive" },
        { id: "T1025", name: "Data from Removable Media" },
        { id: "T1074", name: "Data Staged", subTechniques: [
          { id: "T1074.001", name: "Local Data Staging" },
          { id: "T1074.002", name: "Remote Data Staging" }
        ]},
        { id: "T1114", name: "Email Collection", subTechniques: [
          { id: "T1114.001", name: "Local Email Collection" },
          { id: "T1114.002", name: "Remote Email Collection" },
          { id: "T1114.003", name: "Email Forwarding Rule" }
        ]},
        { id: "T1056", name: "Input Capture" },
        { id: "T1113", name: "Screen Capture" },
        { id: "T1125", name: "Video Capture" }
      ]
    },
    {
      id: "TA0011",
      name: "Command and Control",
      techniques: [
        { id: "T1071", name: "Application Layer Protocol", subTechniques: [
          { id: "T1071.001", name: "Web Protocols" },
          { id: "T1071.002", name: "File Transfer Protocols" },
          { id: "T1071.003", name: "Mail Protocols" },
          { id: "T1071.004", name: "DNS" }
        ]},
        { id: "T1092", name: "Communication Through Removable Media" },
        { id: "T1659", name: "Content Injection" },
        { id: "T1132", name: "Data Encoding", subTechniques: [
          { id: "T1132.001", name: "Standard Encoding" },
          { id: "T1132.002", name: "Non-Standard Encoding" }
        ]},
        { id: "T1001", name: "Data Obfuscation", subTechniques: [
          { id: "T1001.001", name: "Junk Data" },
          { id: "T1001.002", name: "Steganography" },
          { id: "T1001.003", name: "Protocol Impersonation" }
        ]},
        { id: "T1568", name: "Dynamic Resolution", subTechniques: [
          { id: "T1568.001", name: "Fast Flux DNS" },
          { id: "T1568.002", name: "Domain Generation Algorithms" },
          { id: "T1568.003", name: "DNS Calculation" }
        ]},
        { id: "T1573", name: "Encrypted Channel", subTechniques: [
          { id: "T1573.001", name: "Symmetric Cryptography" },
          { id: "T1573.002", name: "Asymmetric Cryptography" }
        ]},
        { id: "T1008", name: "Fallback Channels" },
        { id: "T1105", name: "Ingress Tool Transfer" },
        { id: "T1104", name: "Multi-Stage Channels" },
        { id: "T1095", name: "Non-Application Layer Protocol" },
        { id: "T1571", name: "Non-Standard Port" },
        { id: "T1572", name: "Protocol Tunneling" },
        { id: "T1090", name: "Proxy", subTechniques: [
          { id: "T1090.001", name: "Internal Proxy" },
          { id: "T1090.002", name: "External Proxy" },
          { id: "T1090.003", name: "Multi-hop Proxy" },
          { id: "T1090.004", name: "Domain Fronting" }
        ]},
        { id: "T1219", name: "Remote Access Software" },
        { id: "T1205", name: "Traffic Signaling" },
        { id: "T1102", name: "Web Service", subTechniques: [
          { id: "T1102.001", name: "Dead Drop Resolver" },
          { id: "T1102.002", name: "Bidirectional Communication" },
          { id: "T1102.003", name: "One-Way Communication" }
        ]}
      ]
    },
    {
      id: "TA0010",
      name: "Exfiltration",
      techniques: [
        { id: "T1020", name: "Automated Exfiltration", subTechniques: [
          { id: "T1020.001", name: "Traffic Duplication" }
        ]},
        { id: "T1030", name: "Data Transfer Size Limits" },
        { id: "T1048", name: "Exfiltration Over Alternative Protocol", subTechniques: [
          { id: "T1048.001", name: "Exfiltration Over Symmetric Encrypted Non-C2 Protocol" },
          { id: "T1048.002", name: "Exfiltration Over Asymmetric Encrypted Non-C2 Protocol" },
          { id: "T1048.003", name: "Exfiltration Over Unencrypted Non-C2 Protocol" }
        ]},
        { id: "T1041", name: "Exfiltration Over C2 Channel" },
        { id: "T1011", name: "Exfiltration Over Other Network Medium", subTechniques: [
          { id: "T1011.001", name: "Exfiltration Over Bluetooth" }
        ]},
        { id: "T1052", name: "Exfiltration Over Physical Medium", subTechniques: [
          { id: "T1052.001", name: "Exfiltration over USB" }
        ]},
        { id: "T1567", name: "Exfiltration Over Web Service", subTechniques: [
          { id: "T1567.001", name: "Exfiltration to Code Repository" },
          { id: "T1567.002", name: "Exfiltration to Cloud Storage" },
          { id: "T1567.003", name: "Exfiltration to Text Storage Sites" },
          { id: "T1567.004", name: "Exfiltration Over Webhook" }
        ]},
        { id: "T1029", name: "Scheduled Transfer" },
        { id: "T1537", name: "Transfer Data to Cloud Account" }
      ]
    },
    {
      id: "TA0040",
      name: "Impact",
      techniques: [
        { id: "T1531", name: "Account Access Removal" },
        { id: "T1485", name: "Data Destruction" },
        { id: "T1486", name: "Data Encrypted for Impact" },
        { id: "T1565", name: "Data Manipulation", subTechniques: [
          { id: "T1565.001", name: "Stored Data Manipulation" },
          { id: "T1565.002", name: "Transmitted Data Manipulation" },
          { id: "T1565.003", name: "Runtime Data Manipulation" }
        ]},
        { id: "T1491", name: "Defacement", subTechniques: [
          { id: "T1491.001", name: "Internal Defacement" },
          { id: "T1491.002", name: "External Defacement" }
        ]},
        { id: "T1561", name: "Disk Wipe", subTechniques: [
          { id: "T1561.001", name: "Disk Content Wipe" },
          { id: "T1561.002", name: "Disk Structure Wipe" }
        ]},
        { id: "T1499", name: "Endpoint Denial of Service", subTechniques: [
          { id: "T1499.001", name: "OS Exhaustion Flood" },
          { id: "T1499.002", name: "Service Exhaustion Flood" },
          { id: "T1499.003", name: "Application Exhaustion Flood" },
          { id: "T1499.004", name: "Application or System Exploitation" }
        ]},
        { id: "T1657", name: "Financial Theft" },
        { id: "T1495", name: "Firmware Corruption" },
        { id: "T1490", name: "Inhibit System Recovery" },
        { id: "T1498", name: "Network Denial of Service", subTechniques: [
          { id: "T1498.001", name: "Direct Network Flood" },
          { id: "T1498.002", name: "Reflection Amplification" }
        ]},
        { id: "T1496", name: "Resource Hijacking" },
        { id: "T1489", name: "Service Stop" },
        { id: "T1529", name: "System Shutdown/Reboot" }
      ]
    }
  ]
};

// Mobile ATT&CK Matrix (simplified - key tactics and techniques)
export const mobileMatrix: AttackMatrixData = {
  name: "Mobile",
  tactics: [
    {
      id: "TA0027",
      name: "Initial Access",
      techniques: [
        { id: "T1474", name: "Supply Chain Compromise", subTechniques: [
          { id: "T1474.001", name: "Compromise Software Dependencies" },
          { id: "T1474.002", name: "Compromise Software Supply Chain" },
          { id: "T1474.003", name: "Compromise Hardware Supply Chain" }
        ]},
        { id: "T1476", name: "Deliver Malicious App via Authorized App Store" },
        { id: "T1478", name: "Install Insecure or Malicious Configuration" },
        { id: "T1664", name: "Exploitation for Initial Access" },
        { id: "T1660", name: "Phishing", subTechniques: [
          { id: "T1660.001", name: "Spearphishing Message" },
          { id: "T1660.002", name: "Spearphishing Link" }
        ]},
        { id: "T1456", name: "Drive-By Compromise" },
        { id: "T1458", name: "Replication Through Removable Media" }
      ]
    },
    {
      id: "TA0041",
      name: "Execution",
      techniques: [
        { id: "T1623", name: "Command and Scripting Interpreter", subTechniques: [
          { id: "T1623.001", name: "Unix Shell" }
        ]},
        { id: "T1575", name: "Native Code" },
        { id: "T1603", name: "Scheduled Task/Job" }
      ]
    },
    {
      id: "TA0028",
      name: "Persistence",
      techniques: [
        { id: "T1398", name: "Boot or Logon Initialization Scripts" },
        { id: "T1577", name: "Compromise Application Executable" },
        { id: "T1624", name: "Event Triggered Execution", subTechniques: [
          { id: "T1624.001", name: "Broadcast Receivers" }
        ]},
        { id: "T1645", name: "Compromise Client Software Binary" },
        { id: "T1541", name: "Foreground Persistence" }
      ]
    },
    {
      id: "TA0029",
      name: "Privilege Escalation",
      techniques: [
        { id: "T1404", name: "Exploitation for Privilege Escalation" },
        { id: "T1626", name: "Abuse Elevation Control Mechanism", subTechniques: [
          { id: "T1626.001", name: "Device Administrator Permissions" }
        ]}
      ]
    },
    {
      id: "TA0030",
      name: "Defense Evasion",
      techniques: [
        { id: "T1630", name: "Indicator Removal on Host", subTechniques: [
          { id: "T1630.001", name: "Uninstall Malicious Application" },
          { id: "T1630.002", name: "File Deletion" },
          { id: "T1630.003", name: "Disguise Root/Jailbreak Indicators" }
        ]},
        { id: "T1617", name: "Hooking" },
        { id: "T1629", name: "Impair Defenses", subTechniques: [
          { id: "T1629.001", name: "Prevent Application Removal" },
          { id: "T1629.002", name: "Device Lockout" },
          { id: "T1629.003", name: "Disable or Modify Tools" }
        ]},
        { id: "T1406", name: "Obfuscated Files or Information", subTechniques: [
          { id: "T1406.001", name: "Steganography" },
          { id: "T1406.002", name: "Software Packing" }
        ]},
        { id: "T1632", name: "Subvert Trust Controls", subTechniques: [
          { id: "T1632.001", name: "Code Signing Policy Modification" }
        ]},
        { id: "T1628", name: "Hide Artifacts", subTechniques: [
          { id: "T1628.001", name: "Suppress Application Icon" },
          { id: "T1628.002", name: "User Evasion" }
        ]}
      ]
    },
    {
      id: "TA0031",
      name: "Credential Access",
      techniques: [
        { id: "T1634", name: "Credentials from Password Store", subTechniques: [
          { id: "T1634.001", name: "Credentials from Web Browsers" }
        ]},
        { id: "T1417", name: "Input Capture", subTechniques: [
          { id: "T1417.001", name: "Keylogging" },
          { id: "T1417.002", name: "GUI Input Capture" }
        ]},
        { id: "T1635", name: "Steal Application Access Token" },
        { id: "T1409", name: "Stored Application Data" }
      ]
    },
    {
      id: "TA0032",
      name: "Discovery",
      techniques: [
        { id: "T1420", name: "File and Directory Discovery" },
        { id: "T1430", name: "Location Tracking" },
        { id: "T1426", name: "System Information Discovery" },
        { id: "T1421", name: "System Network Configuration Discovery" },
        { id: "T1424", name: "Process Discovery" },
        { id: "T1418", name: "Software Discovery" }
      ]
    },
    {
      id: "TA0033",
      name: "Collection",
      techniques: [
        { id: "T1517", name: "Access Notifications" },
        { id: "T1429", name: "Audio Capture" },
        { id: "T1432", name: "Access Contact List" },
        { id: "T1533", name: "Data from Local System" },
        { id: "T1636", name: "Protected User Data", subTechniques: [
          { id: "T1636.001", name: "Calendar Entries" },
          { id: "T1636.002", name: "Call Log" },
          { id: "T1636.003", name: "Contact List" },
          { id: "T1636.004", name: "SMS Messages" }
        ]},
        { id: "T1513", name: "Screen Capture" },
        { id: "T1512", name: "Video Capture" }
      ]
    },
    {
      id: "TA0037",
      name: "Command and Control",
      techniques: [
        { id: "T1437", name: "Application Layer Protocol", subTechniques: [
          { id: "T1437.001", name: "Web Protocols" }
        ]},
        { id: "T1521", name: "Encrypted Channel", subTechniques: [
          { id: "T1521.001", name: "Symmetric Cryptography" },
          { id: "T1521.002", name: "Asymmetric Cryptography" }
        ]},
        { id: "T1509", name: "Non-Standard Port" },
        { id: "T1544", name: "Ingress Tool Transfer" }
      ]
    },
    {
      id: "TA0036",
      name: "Exfiltration",
      techniques: [
        { id: "T1646", name: "Exfiltration Over C2 Channel" },
        { id: "T1639", name: "Exfiltration Over Alternative Protocol", subTechniques: [
          { id: "T1639.001", name: "Exfiltration Over Unencrypted Non-C2 Protocol" }
        ]}
      ]
    },
    {
      id: "TA0034",
      name: "Impact",
      techniques: [
        { id: "T1471", name: "Data Encrypted for Impact" },
        { id: "T1447", name: "Delete Device Data" },
        { id: "T1448", name: "Carrier Billing Fraud" },
        { id: "T1616", name: "Call Control" },
        { id: "T1582", name: "SMS Control" },
        { id: "T1642", name: "Endpoint Denial of Service" }
      ]
    }
  ]
};

// ICS ATT&CK Matrix (simplified - key tactics and techniques)
export const icsMatrix: AttackMatrixData = {
  name: "ICS",
  tactics: [
    {
      id: "TA0108",
      name: "Initial Access",
      techniques: [
        { id: "T0817", name: "Drive-by Compromise" },
        { id: "T0866", name: "Exploitation of Remote Services" },
        { id: "T0886", name: "Remote Services" },
        { id: "T0819", name: "Exploit Public-Facing Application" },
        { id: "T0822", name: "External Remote Services" },
        { id: "T0883", name: "Internet Accessible Device" },
        { id: "T0847", name: "Replication Through Removable Media" },
        { id: "T0865", name: "Spearphishing Attachment" },
        { id: "T0862", name: "Supply Chain Compromise" },
        { id: "T0860", name: "Wireless Compromise" },
        { id: "T0848", name: "Rogue Master" },
        { id: "T0864", name: "Transient Cyber Asset" }
      ]
    },
    {
      id: "TA0104",
      name: "Execution",
      techniques: [
        { id: "T0807", name: "Command-Line Interface" },
        { id: "T0871", name: "Execution through API" },
        { id: "T0823", name: "Graphical User Interface" },
        { id: "T0874", name: "Hooking" },
        { id: "T0821", name: "Modify Controller Tasking" },
        { id: "T0834", name: "Native API" },
        { id: "T0853", name: "Scripting" },
        { id: "T0863", name: "User Execution" },
        { id: "T0858", name: "Change Operating Mode" }
      ]
    },
    {
      id: "TA0110",
      name: "Persistence",
      techniques: [
        { id: "T0889", name: "Modify Program" },
        { id: "T0839", name: "Module Firmware" },
        { id: "T0873", name: "Project File Infection" },
        { id: "T0857", name: "System Firmware" },
        { id: "T0859", name: "Valid Accounts" }
      ]
    },
    {
      id: "TA0111",
      name: "Privilege Escalation",
      techniques: [
        { id: "T0890", name: "Exploitation for Privilege Escalation" },
        { id: "T0874", name: "Hooking" }
      ]
    },
    {
      id: "TA0103",
      name: "Evasion",
      techniques: [
        { id: "T0858", name: "Change Operating Mode" },
        { id: "T0820", name: "Exploitation for Evasion" },
        { id: "T0872", name: "Indicator Removal on Host" },
        { id: "T0849", name: "Masquerading" },
        { id: "T0851", name: "Rootkit" },
        { id: "T0856", name: "Spoof Reporting Message" }
      ]
    },
    {
      id: "TA0109",
      name: "Discovery",
      techniques: [
        { id: "T0840", name: "Network Connection Enumeration" },
        { id: "T0842", name: "Network Sniffing" },
        { id: "T0846", name: "Remote System Discovery" },
        { id: "T0888", name: "Remote System Information Discovery" },
        { id: "T0887", name: "Wireless Sniffing" }
      ]
    },
    {
      id: "TA0109",
      name: "Lateral Movement",
      techniques: [
        { id: "T0812", name: "Default Credentials" },
        { id: "T0866", name: "Exploitation of Remote Services" },
        { id: "T0867", name: "Lateral Tool Transfer" },
        { id: "T0843", name: "Program Download" },
        { id: "T0886", name: "Remote Services" },
        { id: "T0859", name: "Valid Accounts" }
      ]
    },
    {
      id: "TA0100",
      name: "Collection",
      techniques: [
        { id: "T0811", name: "Data from Information Repositories" },
        { id: "T0868", name: "Detect Operating Mode" },
        { id: "T0877", name: "I/O Image" },
        { id: "T0830", name: "Man in the Middle" },
        { id: "T0801", name: "Monitor Process State" },
        { id: "T0861", name: "Point & Tag Identification" },
        { id: "T0845", name: "Program Upload" },
        { id: "T0852", name: "Screen Capture" },
        { id: "T0887", name: "Wireless Sniffing" }
      ]
    },
    {
      id: "TA0101",
      name: "Command and Control",
      techniques: [
        { id: "T0885", name: "Commonly Used Port" },
        { id: "T0884", name: "Connection Proxy" },
        { id: "T0869", name: "Standard Application Layer Protocol" }
      ]
    },
    {
      id: "TA0105",
      name: "Inhibit Response Function",
      techniques: [
        { id: "T0800", name: "Activate Firmware Update Mode" },
        { id: "T0878", name: "Alarm Suppression" },
        { id: "T0803", name: "Block Command Message" },
        { id: "T0804", name: "Block Reporting Message" },
        { id: "T0805", name: "Block Serial COM" },
        { id: "T0809", name: "Data Destruction" },
        { id: "T0814", name: "Denial of Service" },
        { id: "T0816", name: "Device Restart/Shutdown" },
        { id: "T0835", name: "Manipulate I/O Image" },
        { id: "T0838", name: "Modify Alarm Settings" },
        { id: "T0851", name: "Rootkit" },
        { id: "T0881", name: "Service Stop" },
        { id: "T0857", name: "System Firmware" }
      ]
    },
    {
      id: "TA0106",
      name: "Impair Process Control",
      techniques: [
        { id: "T0806", name: "Brute Force I/O" },
        { id: "T0836", name: "Modify Parameter" },
        { id: "T0839", name: "Module Firmware" },
        { id: "T0856", name: "Spoof Reporting Message" },
        { id: "T0855", name: "Unauthorized Command Message" }
      ]
    },
    {
      id: "TA0107",
      name: "Impact",
      techniques: [
        { id: "T0879", name: "Damage to Property" },
        { id: "T0813", name: "Denial of Control" },
        { id: "T0815", name: "Denial of View" },
        { id: "T0826", name: "Loss of Availability" },
        { id: "T0827", name: "Loss of Control" },
        { id: "T0828", name: "Loss of Productivity and Revenue" },
        { id: "T0837", name: "Loss of Protection" },
        { id: "T0880", name: "Loss of Safety" },
        { id: "T0829", name: "Loss of View" },
        { id: "T0831", name: "Manipulation of Control" },
        { id: "T0832", name: "Manipulation of View" },
        { id: "T0882", name: "Theft of Operational Information" }
      ]
    }
  ]
};

// Get all matrices
export const getAttackMatrices = (): Record<AttackMatrix, AttackMatrixData> => ({
  enterprise: enterpriseMatrix,
  mobile: mobileMatrix,
  ics: icsMatrix
});

// Flatten techniques for search
export const flattenTechniques = (matrix: AttackMatrixData): Array<{
  tacticId: string;
  tacticName: string;
  technique: Technique;
  subTechnique?: SubTechnique;
}> => {
  const result: Array<{
    tacticId: string;
    tacticName: string;
    technique: Technique;
    subTechnique?: SubTechnique;
  }> = [];

  matrix.tactics.forEach(tactic => {
    tactic.techniques.forEach(technique => {
      result.push({
        tacticId: tactic.id,
        tacticName: tactic.name,
        technique,
      });
      
      if (technique.subTechniques) {
        technique.subTechniques.forEach(sub => {
          result.push({
            tacticId: tactic.id,
            tacticName: tactic.name,
            technique,
            subTechnique: sub,
          });
        });
      }
    });
  });

  return result;
};
