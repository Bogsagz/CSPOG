// MITRE ATT&CK Enterprise Mitigations
// Source: https://attack.mitre.org/mitigations/enterprise/

export interface Mitigation {
  id: string;
  name: string;
  description: string;
  techniques: string[]; // Array of technique IDs this mitigation addresses
}

export const enterpriseMitigations: Mitigation[] = [
  {
    id: "M1036",
    name: "Account Use Policies",
    description: "Configure features related to account use like login attempt lockouts, specific login times, etc.",
    techniques: ["T1110", "T1110.001", "T1110.002", "T1110.003", "T1110.004", "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004"]
  },
  {
    id: "M1015",
    name: "Active Directory Configuration",
    description: "Configure Active Directory to prevent use of certain techniques; use SID Filtering, etc.",
    techniques: ["T1134", "T1134.005", "T1484", "T1484.001", "T1484.002", "T1558", "T1558.001", "T1558.002", "T1558.003", "T1558.004", "T1207", "T1003", "T1003.006"]
  },
  {
    id: "M1049",
    name: "Antivirus/Antimalware",
    description: "Use signatures or heuristics to detect malicious software.",
    techniques: ["T1059", "T1059.001", "T1059.003", "T1059.005", "T1059.007", "T1204", "T1204.001", "T1204.002", "T1566", "T1566.001", "T1566.002", "T1566.003", "T1027", "T1027.002", "T1027.006", "T1588.001", "T1587.001", "T1105", "T1055", "T1055.001", "T1055.002", "T1055.012"]
  },
  {
    id: "M1048",
    name: "Application Isolation and Sandboxing",
    description: "Restrict execution of code to a virtual environment on or in transit to an endpoint system.",
    techniques: ["T1189", "T1203", "T1559", "T1559.001", "T1559.002", "T1204", "T1204.001", "T1204.002", "T1566", "T1566.001", "T1566.002", "T1566.003", "T1221", "T1080"]
  },
  {
    id: "M1047",
    name: "Audit",
    description: "Perform audits or scans of systems, permissions, insecure software, insecure configurations, etc. to identify potential weaknesses.",
    techniques: ["T1574", "T1574.001", "T1574.002", "T1574.004", "T1574.005", "T1574.006", "T1574.007", "T1574.008", "T1574.009", "T1574.010", "T1574.011", "T1098", "T1098.001", "T1098.002", "T1098.003", "T1098.004", "T1136", "T1136.001", "T1136.002", "T1136.003", "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004", "T1053", "T1053.002", "T1053.003", "T1053.005", "T1053.006", "T1053.007"]
  },
  {
    id: "M1040",
    name: "Behavior Prevention on Endpoint",
    description: "Use capabilities to prevent suspicious behavior patterns from occurring on endpoint systems.",
    techniques: ["T1059", "T1059.001", "T1059.003", "T1059.005", "T1059.006", "T1059.007", "T1547", "T1547.001", "T1055", "T1055.001", "T1055.002", "T1055.003", "T1055.004", "T1055.008", "T1055.011", "T1055.012", "T1055.013", "T1055.014", "T1218", "T1218.001", "T1218.002", "T1218.003", "T1218.004", "T1218.005", "T1218.007", "T1218.008", "T1218.009", "T1218.010", "T1218.011", "T1218.012", "T1218.013", "T1218.014", "T1106"]
  },
  {
    id: "M1046",
    name: "Boot Integrity",
    description: "Use secure methods to boot a system and verify the integrity of the operating system and loading mechanisms.",
    techniques: ["T1542", "T1542.001", "T1542.002", "T1542.003", "T1495", "T1014"]
  },
  {
    id: "M1045",
    name: "Code Signing",
    description: "Enforce binary and application integrity with digital signature verification to prevent untrusted code from executing.",
    techniques: ["T1059", "T1059.001", "T1059.005", "T1059.006", "T1204", "T1204.002", "T1553", "T1553.001", "T1553.002", "T1553.003", "T1553.004", "T1553.006", "T1072", "T1195", "T1195.001", "T1195.002", "T1588.003", "T1587.002", "T1547.006"]
  },
  {
    id: "M1043",
    name: "Credential Access Protection",
    description: "Use capabilities to prevent successful credential access by adversaries; including blocking forms of credential dumping.",
    techniques: ["T1003", "T1003.001", "T1003.002", "T1003.003", "T1003.004", "T1003.005", "T1003.006", "T1003.007", "T1003.008", "T1556", "T1556.001", "T1556.002", "T1555", "T1555.001", "T1555.002", "T1555.003", "T1555.004", "T1555.005", "T1552", "T1552.001", "T1552.002", "T1552.004", "T1552.006"]
  },
  {
    id: "M1053",
    name: "Data Backup",
    description: "Take and store data backups from end user systems and critical servers.",
    techniques: ["T1485", "T1486", "T1561", "T1561.001", "T1561.002", "T1490", "T1491", "T1491.001", "T1491.002"]
  },
  {
    id: "M1042",
    name: "Disable or Remove Feature or Program",
    description: "Remove or deny access to unnecessary and potentially vulnerable software to prevent abuse by adversaries.",
    techniques: ["T1059", "T1059.001", "T1059.002", "T1059.003", "T1059.004", "T1059.005", "T1059.006", "T1059.007", "T1218", "T1218.001", "T1218.002", "T1218.003", "T1218.004", "T1218.005", "T1218.007", "T1218.008", "T1218.009", "T1218.010", "T1218.011", "T1218.012", "T1218.013", "T1218.014", "T1047", "T1197", "T1137", "T1137.001", "T1137.002", "T1137.003", "T1137.004", "T1137.005", "T1137.006", "T1559", "T1559.001", "T1559.002", "T1133", "T1021", "T1021.001", "T1021.002", "T1021.003", "T1021.004", "T1021.005", "T1021.006", "T1091", "T1200", "T1543.003", "T1569.002"]
  },
  {
    id: "M1038",
    name: "Execution Prevention",
    description: "Block execution of code on a system through application control, and/or script blocking.",
    techniques: ["T1059", "T1059.001", "T1059.003", "T1059.005", "T1059.006", "T1059.007", "T1204", "T1204.001", "T1204.002", "T1218", "T1218.001", "T1218.002", "T1218.003", "T1218.004", "T1218.005", "T1218.007", "T1218.008", "T1218.009", "T1218.010", "T1218.011", "T1218.012", "T1218.013", "T1218.014", "T1027.010", "T1055", "T1055.001", "T1055.002", "T1106", "T1129", "T1047", "T1221", "T1559", "T1559.001", "T1559.002"]
  },
  {
    id: "M1028",
    name: "Exploit Protection",
    description: "Use capabilities to detect and block conditions that may lead to or be indicative of a software exploit occurring.",
    techniques: ["T1189", "T1190", "T1203", "T1210", "T1068", "T1211", "T1212", "T1499.004"]
  },
  {
    id: "M1050",
    name: "Exploit Protection",
    description: "Use capabilities to detect and block conditions that may lead to or be indicative of a software exploit occurring.",
    techniques: ["T1189", "T1190", "T1203", "T1210", "T1068", "T1211", "T1212", "T1499.004"]
  },
  {
    id: "M1024",
    name: "Filter Network Traffic",
    description: "Use network appliances to filter ingress or egress traffic and perform protocol-based filtering.",
    techniques: ["T1071", "T1071.001", "T1071.002", "T1071.003", "T1071.004", "T1095", "T1104", "T1132", "T1132.001", "T1132.002", "T1568", "T1568.001", "T1568.002", "T1568.003", "T1572", "T1573", "T1573.001", "T1573.002", "T1090", "T1090.001", "T1090.002", "T1090.003", "T1219", "T1008", "T1105", "T1041", "T1048", "T1048.001", "T1048.002", "T1048.003", "T1187", "T1189", "T1190", "T1199", "T1557", "T1557.001", "T1557.002", "T1557.003"]
  },
  {
    id: "M1037",
    name: "Filter Network Traffic",
    description: "Use network appliances to filter ingress or egress traffic and perform protocol-based filtering.",
    techniques: ["T1071", "T1071.001", "T1071.002", "T1071.003", "T1071.004", "T1095", "T1104", "T1132", "T1132.001", "T1132.002", "T1568", "T1568.001", "T1568.002", "T1568.003", "T1572", "T1573", "T1573.001", "T1573.002", "T1090", "T1090.001", "T1090.002", "T1090.003", "T1219", "T1008", "T1105", "T1041", "T1048", "T1048.001", "T1048.002", "T1048.003", "T1187", "T1189", "T1190", "T1199", "T1557", "T1557.001", "T1557.002", "T1557.003"]
  },
  {
    id: "M1035",
    name: "Limit Access to Resource Over Network",
    description: "Prevent access to file shares, remote access to systems, unnecessary services. Mechanisms to limit access may include use of network concentrators, RDP gateways, etc.",
    techniques: ["T1021", "T1021.001", "T1021.002", "T1021.003", "T1021.004", "T1021.005", "T1021.006", "T1133", "T1072", "T1080", "T1570", "T1210", "T1187", "T1557", "T1557.001", "T1557.002"]
  },
  {
    id: "M1034",
    name: "Limit Hardware Installation",
    description: "Block users or groups from installing or using unapproved hardware on systems, including USB devices.",
    techniques: ["T1200", "T1091", "T1052", "T1052.001"]
  },
  {
    id: "M1033",
    name: "Limit Software Installation",
    description: "Block users or groups from installing unapproved software.",
    techniques: ["T1176", "T1554", "T1195", "T1195.001", "T1195.002", "T1072"]
  },
  {
    id: "M1032",
    name: "Multi-factor Authentication",
    description: "Use two or more pieces of evidence to authenticate to a system; such as username and password in addition to a token from a physical smart card or token generator.",
    techniques: ["T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004", "T1110", "T1110.001", "T1110.002", "T1110.003", "T1110.004", "T1133", "T1021", "T1021.001", "T1021.002", "T1021.004", "T1021.005", "T1021.006", "T1556", "T1556.006", "T1539", "T1528", "T1550", "T1550.001", "T1550.002", "T1550.003", "T1550.004", "T1552.001", "T1111", "T1621"]
  },
  {
    id: "M1031",
    name: "Network Intrusion Prevention",
    description: "Use intrusion detection signatures to block traffic at network boundary points.",
    techniques: ["T1071", "T1071.001", "T1071.002", "T1071.003", "T1071.004", "T1095", "T1189", "T1190", "T1203", "T1210", "T1219", "T1105", "T1041", "T1048", "T1048.001", "T1048.002", "T1048.003", "T1571", "T1572", "T1573", "T1573.001", "T1573.002", "T1090", "T1090.001", "T1090.002", "T1557", "T1557.001", "T1557.002", "T1557.003", "T1598", "T1598.001", "T1598.002", "T1598.003"]
  },
  {
    id: "M1030",
    name: "Network Segmentation",
    description: "Architect sections of the network to isolate critical systems, functions, or resources. Use physical and logical segmentation to prevent access to potentially sensitive systems and information.",
    techniques: ["T1021", "T1021.001", "T1021.002", "T1021.003", "T1021.004", "T1021.005", "T1021.006", "T1133", "T1072", "T1080", "T1570", "T1210", "T1557", "T1557.001", "T1557.002", "T1557.003", "T1199", "T1190", "T1020.001", "T1498", "T1498.001", "T1498.002", "T1499", "T1499.001", "T1499.002", "T1499.003", "T1499.004"]
  },
  {
    id: "M1027",
    name: "Password Policies",
    description: "Set and enforce secure password policies for accounts.",
    techniques: ["T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004", "T1110", "T1110.001", "T1110.002", "T1110.003", "T1110.004", "T1003", "T1003.003", "T1555", "T1555.001", "T1555.002", "T1555.003", "T1556.001"]
  },
  {
    id: "M1026",
    name: "Privileged Account Management",
    description: "Manage the creation, modification, use, and permissions associated to privileged accounts, including SYSTEM and root.",
    techniques: ["T1098", "T1098.001", "T1098.002", "T1098.003", "T1098.004", "T1098.005", "T1136", "T1136.001", "T1136.002", "T1136.003", "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004", "T1134", "T1134.001", "T1134.002", "T1134.003", "T1134.005", "T1053", "T1053.002", "T1053.003", "T1053.005", "T1053.006", "T1053.007", "T1543", "T1543.001", "T1543.002", "T1543.003", "T1543.004", "T1484", "T1484.001", "T1484.002", "T1548", "T1548.001", "T1548.002", "T1548.003", "T1548.004", "T1547", "T1547.001", "T1003", "T1003.001", "T1003.002", "T1003.003", "T1003.004", "T1003.005", "T1003.006", "T1558", "T1558.001", "T1558.002", "T1558.003", "T1558.004", "T1069", "T1069.001", "T1069.002", "T1069.003", "T1087", "T1087.001", "T1087.002", "T1087.003", "T1087.004", "T1574.010", "T1574.011", "T1037", "T1037.001", "T1037.002", "T1037.003", "T1037.004", "T1037.005", "T1021", "T1021.001", "T1021.002", "T1021.003", "T1021.004", "T1021.005", "T1021.006", "T1072", "T1047", "T1218.007"]
  },
  {
    id: "M1025",
    name: "Privileged Process Integrity",
    description: "Protect processes with high privileges that can be used to interact with critical system components through use of protected process light, anti-process injection defenses, or other process integrity enforcement measures.",
    techniques: ["T1055", "T1055.001", "T1055.002", "T1055.003", "T1055.004", "T1055.005", "T1055.008", "T1055.009", "T1055.011", "T1055.012", "T1055.013", "T1055.014", "T1055.015", "T1003", "T1003.001", "T1134"]
  },
  {
    id: "M1029",
    name: "Remote Data Storage",
    description: "Use remote security log and sensitive file storage where access can be controlled better to prevent exposure of intrusion detection log data or sensitive information.",
    techniques: ["T1070", "T1070.001", "T1070.002", "T1565", "T1565.001", "T1565.002", "T1485"]
  },
  {
    id: "M1022",
    name: "Restrict File and Directory Permissions",
    description: "Restrict access by setting directory and file permissions that are not specific to users or privileged accounts.",
    techniques: ["T1574", "T1574.001", "T1574.002", "T1574.004", "T1574.005", "T1574.006", "T1574.007", "T1574.008", "T1574.009", "T1574.010", "T1574.011", "T1547", "T1547.001", "T1547.009", "T1546", "T1546.004", "T1546.015", "T1543", "T1543.001", "T1543.002", "T1543.003", "T1543.004", "T1037", "T1037.003", "T1037.004", "T1037.005", "T1053", "T1053.003", "T1053.006", "T1070.003", "T1070.004", "T1003.003", "T1003.004", "T1003.005", "T1222", "T1222.001", "T1222.002", "T1552", "T1552.001", "T1552.004", "T1552.006", "T1530", "T1039", "T1005"]
  },
  {
    id: "M1044",
    name: "Restrict Library Loading",
    description: "Prevent abuse of library loading mechanisms in the operating system and software to load untrusted code by configuring appropriate library loading mechanisms and investigating potential vulnerable software.",
    techniques: ["T1574", "T1574.001", "T1574.002", "T1574.004", "T1574.006", "T1129", "T1546.006", "T1547.006"]
  },
  {
    id: "M1021",
    name: "Restrict Registry Permissions",
    description: "Restrict the ability to modify certain hives or keys in the Windows Registry.",
    techniques: ["T1547", "T1547.001", "T1547.002", "T1547.004", "T1547.005", "T1547.012", "T1547.014", "T1546", "T1546.001", "T1546.002", "T1546.007", "T1546.008", "T1546.009", "T1546.010", "T1546.011", "T1546.012", "T1546.015", "T1112", "T1574.011", "T1574.012"]
  },
  {
    id: "M1020",
    name: "Restrict Web-Based Content",
    description: "Restrict use of certain websites, block downloads/attachments, block Javascript, restrict browser extensions, etc.",
    techniques: ["T1189", "T1204", "T1204.001", "T1204.002", "T1566", "T1566.001", "T1566.002", "T1566.003", "T1598", "T1598.001", "T1598.002", "T1598.003", "T1176", "T1219", "T1221", "T1608.004"]
  },
  {
    id: "M1054",
    name: "Software Configuration",
    description: "Implement configuration changes to software (other than the operating system) to mitigate security risks associated to how the software operates.",
    techniques: ["T1137", "T1137.001", "T1137.002", "T1137.003", "T1137.004", "T1137.005", "T1137.006", "T1221", "T1559", "T1559.001", "T1559.002", "T1059.007", "T1204.001", "T1566.001", "T1566.002", "T1218.001", "T1218.010", "T1127", "T1185", "T1539"]
  },
  {
    id: "M1019",
    name: "Threat Intelligence Program",
    description: "A threat intelligence program helps an organization generate their own threat intelligence information and track trends to inform defensive priorities to mitigate risk.",
    techniques: ["T1583", "T1583.001", "T1583.002", "T1583.003", "T1583.004", "T1583.005", "T1583.006", "T1584", "T1584.001", "T1584.002", "T1584.003", "T1584.004", "T1584.005", "T1584.006", "T1585", "T1585.001", "T1585.002", "T1586", "T1586.001", "T1586.002", "T1587", "T1587.001", "T1587.002", "T1587.003", "T1587.004", "T1588", "T1588.001", "T1588.002", "T1588.003", "T1588.004", "T1588.005", "T1588.006", "T1608", "T1608.001", "T1608.002", "T1608.003", "T1608.004", "T1608.005", "T1595", "T1595.001", "T1595.002", "T1592", "T1592.001", "T1592.002", "T1592.003", "T1592.004", "T1589", "T1589.001", "T1589.002", "T1589.003", "T1590", "T1590.001", "T1590.002", "T1590.004", "T1590.005", "T1590.006", "T1591", "T1591.001", "T1591.002", "T1591.003", "T1591.004", "T1598", "T1598.001", "T1598.002", "T1598.003", "T1597", "T1597.001", "T1597.002", "T1596", "T1596.001", "T1596.002", "T1596.003", "T1596.004", "T1596.005", "T1593", "T1593.001", "T1593.002", "T1594"]
  },
  {
    id: "M1051",
    name: "Update Software",
    description: "Perform regular software updates to mitigate exploitation risk.",
    techniques: ["T1189", "T1190", "T1203", "T1210", "T1068", "T1211", "T1212", "T1499.004", "T1195", "T1195.001", "T1195.002", "T1588.005", "T1588.006", "T1587.004"]
  },
  {
    id: "M1052",
    name: "User Account Control",
    description: "Configure Windows User Account Control to mitigate risk of adversaries obtaining elevated process access.",
    techniques: ["T1548.002", "T1574.012"]
  },
  {
    id: "M1018",
    name: "User Account Management",
    description: "Manage the creation, modification, use, and permissions associated to user accounts.",
    techniques: ["T1098", "T1098.001", "T1098.002", "T1098.003", "T1098.004", "T1136", "T1136.001", "T1136.002", "T1136.003", "T1078", "T1078.001", "T1078.002", "T1078.003", "T1078.004", "T1053", "T1053.002", "T1053.005", "T1087", "T1087.001", "T1087.002", "T1087.003", "T1087.004", "T1069", "T1069.001", "T1069.002", "T1069.003", "T1021", "T1021.001", "T1021.002", "T1021.003", "T1021.004", "T1021.005", "T1021.006", "T1133", "T1547.004", "T1556.001", "T1564.002"]
  },
  {
    id: "M1017",
    name: "User Training",
    description: "Train users to be aware of access or manipulation attempts by an adversary to reduce the risk of successful spearphishing, social engineering, and other techniques that involve user interaction.",
    techniques: ["T1566", "T1566.001", "T1566.002", "T1566.003", "T1598", "T1598.001", "T1598.002", "T1598.003", "T1204", "T1204.001", "T1204.002", "T1204.003", "T1189", "T1528", "T1539", "T1534", "T1656", "T1657"]
  },
  {
    id: "M1016",
    name: "Vulnerability Scanning",
    description: "Vulnerability scanning is used to find potentially exploitable software vulnerabilities to remediate them.",
    techniques: ["T1189", "T1190", "T1203", "T1210", "T1068", "T1499.004", "T1595.002"]
  },
  {
    id: "M1055",
    name: "Do Not Mitigate",
    description: "This category is to associate techniques that mitigation might increase risk of compromise and therefore mitigation is not recommended.",
    techniques: ["T1480", "T1480.001"]
  },
  {
    id: "M1056",
    name: "Pre-compromise",
    description: "This category is used for any applicable mitigation activities that apply to techniques occurring before an adversary gains Initial Access, such as Reconnaissance and Resource Development techniques.",
    techniques: ["T1595", "T1595.001", "T1595.002", "T1595.003", "T1592", "T1592.001", "T1592.002", "T1592.003", "T1592.004", "T1589", "T1589.001", "T1589.002", "T1589.003", "T1590", "T1590.001", "T1590.002", "T1590.004", "T1590.005", "T1590.006", "T1591", "T1591.001", "T1591.002", "T1591.003", "T1591.004", "T1598", "T1598.001", "T1598.002", "T1598.003", "T1597", "T1597.001", "T1597.002", "T1596", "T1596.001", "T1596.002", "T1596.003", "T1596.004", "T1596.005", "T1593", "T1593.001", "T1593.002", "T1593.003", "T1594", "T1583", "T1583.001", "T1583.002", "T1583.003", "T1583.004", "T1583.005", "T1583.006", "T1583.007", "T1583.008", "T1584", "T1584.001", "T1584.002", "T1584.003", "T1584.004", "T1584.005", "T1584.006", "T1584.007", "T1585", "T1585.001", "T1585.002", "T1585.003", "T1586", "T1586.001", "T1586.002", "T1586.003", "T1587", "T1587.001", "T1587.002", "T1587.003", "T1587.004", "T1588", "T1588.001", "T1588.002", "T1588.003", "T1588.004", "T1588.005", "T1588.006", "T1608", "T1608.001", "T1608.002", "T1608.003", "T1608.004", "T1608.005", "T1608.006"]
  },
  {
    id: "M1057",
    name: "Data Loss Prevention",
    description: "Use a data loss prevention (DLP) strategy to categorize sensitive data, identify data formats indicative of personal identifiable information (PII), and restrict exfiltration of sensitive data.",
    techniques: ["T1041", "T1048", "T1048.001", "T1048.002", "T1048.003", "T1567", "T1567.001", "T1567.002", "T1052", "T1052.001", "T1020", "T1020.001", "T1030", "T1537", "T1119"]
  },
  {
    id: "M1058",
    name: "Encrypt Sensitive Information",
    description: "Protect sensitive information with strong encryption.",
    techniques: ["T1557", "T1557.001", "T1557.002", "T1557.003", "T1040", "T1552", "T1552.001", "T1552.004", "T1003.008", "T1114", "T1114.001", "T1114.002", "T1114.003", "T1530", "T1539"]
  },
  {
    id: "M1059",
    name: "Operating System Configuration",
    description: "Make configuration changes related to the operating system or a common feature of the operating system that result in system hardening against techniques.",
    techniques: ["T1553", "T1553.004", "T1553.006", "T1548.002", "T1003.001", "T1003.002", "T1003.004", "T1003.005", "T1556.002", "T1556.008", "T1218.008", "T1218.014", "T1564.001", "T1564.009"]
  }
];

// Function to find mitigations for a given technique ID
export function getMitigationsForTechnique(techniqueId: string): Mitigation[] {
  return enterpriseMitigations.filter(m => 
    m.techniques.some(t => {
      // Match exact technique ID or if input is a sub-technique, match parent technique
      if (t === techniqueId) return true;
      // If technique is a sub-technique (e.g., T1059.001), also check parent (T1059)
      const parentTechnique = techniqueId.split('.')[0];
      return t === parentTechnique;
    })
  );
}

// Function to get mitigations for multiple techniques
export function getMitigationsForTechniques(techniqueIds: string[]): { techniqueId: string; mitigations: Mitigation[] }[] {
  return techniqueIds.map(id => ({
    techniqueId: id,
    mitigations: getMitigationsForTechnique(id)
  }));
}

// Function to get unique mitigations across all provided techniques
export function getUniqueMitigationsForTechniques(techniqueIds: string[]): Mitigation[] {
  const mitigationMap = new Map<string, Mitigation>();
  
  techniqueIds.forEach(id => {
    const mitigations = getMitigationsForTechnique(id);
    mitigations.forEach(m => {
      if (!mitigationMap.has(m.id)) {
        mitigationMap.set(m.id, m);
      }
    });
  });
  
  return Array.from(mitigationMap.values()).sort((a, b) => a.id.localeCompare(b.id));
}
