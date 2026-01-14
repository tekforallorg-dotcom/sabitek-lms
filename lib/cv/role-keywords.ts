/**
 * Role-Based Keywords for CV Generation v2
 * 
 * Comprehensive keyword database for various IT, business, and professional roles.
 * Keywords are sourced from real job postings, industry standards, and ATS best practices.
 * 
 * Categories:
 * - IT & Technology
 * - Business & Finance
 * - Marketing & Sales
 * - Operations & Administration
 * - Healthcare & Science
 * - Education & Training
 * - Creative & Design
 * - Engineering
 */

// ============================================
// IT & TECHNOLOGY ROLES
// ============================================
export const IT_ROLES: Record<string, string[]> = {
  // Help Desk & Support
  'it support': [
    'IT Support', 'Technical Support', 'Help Desk', 'Service Desk', 'Desktop Support',
    'End User Support', 'Tier 1 Support', 'Tier 2 Support', 'Level 1', 'Level 2',
    'Troubleshooting', 'Incident Management', 'Problem Management', 'Request Fulfillment',
    'Active Directory', 'Azure AD', 'Office 365', 'Microsoft 365', 'Windows 10/11',
    'Remote Desktop', 'TeamViewer', 'AnyDesk', 'VPN Support', 'Network Connectivity',
    'Hardware Troubleshooting', 'Software Installation', 'Printer Support', 'Mobile Device Management',
    'ITIL', 'ServiceNow', 'Jira Service Management', 'Zendesk', 'Freshservice',
    'SLA Management', 'Ticket Resolution', 'Knowledge Base', 'User Training',
    'Password Reset', 'Account Management', 'Asset Management', 'Inventory Management',
    'Documentation', 'Technical Writing', 'Escalation Procedures', 'On-call Support'
  ],

  'help desk': [
    'Help Desk', 'Service Desk', 'IT Help Desk', 'Technical Help Desk',
    'First Point of Contact', 'Customer Service', 'User Support', 'Client Support',
    'Phone Support', 'Email Support', 'Chat Support', 'Remote Support', 'Walk-in Support',
    'Ticket Logging', 'Ticket Prioritization', 'Ticket Escalation', 'Ticket Closure',
    'Issue Triage', 'Initial Diagnosis', 'Basic Troubleshooting', 'Quick Resolution',
    'ServiceNow', 'Remedy', 'Cherwell', 'ManageEngine', 'Spiceworks',
    'Call Handling', 'Call Logging', 'Call Routing', 'Queue Management',
    'Customer Satisfaction', 'First Call Resolution', 'Average Handle Time', 'Response Time',
    'Knowledge Articles', 'FAQ Management', 'Self-Service Portal', 'User Guides'
  ],

  'desktop support': [
    'Desktop Support', 'Desktop Engineering', 'Endpoint Support', 'Client Support',
    'Windows Administration', 'macOS Support', 'Linux Desktop', 'Chrome OS',
    'Hardware Deployment', 'Software Deployment', 'Image Creation', 'System Imaging',
    'SCCM', 'Intune', 'JAMF', 'PDQ Deploy', 'Group Policy', 'GPO',
    'Laptop Configuration', 'Desktop Configuration', 'Workstation Setup', 'Docking Stations',
    'Peripheral Support', 'Monitor Setup', 'Printer Installation', 'Scanner Configuration',
    'Driver Installation', 'BIOS Configuration', 'Firmware Updates', 'Hardware Diagnostics',
    'Break-Fix', 'Warranty Management', 'Vendor Coordination', 'Parts Ordering',
    'Asset Tagging', 'Inventory Tracking', 'Lifecycle Management', 'E-waste Disposal'
  ],

  'systems support analyst': [
    'Systems Support', 'Application Support', 'Production Support', 'Operations Support',
    'System Administration', 'Server Support', 'Infrastructure Support', 'Platform Support',
    'Windows Server', 'Linux Server', 'Unix', 'AIX', 'Solaris',
    'Active Directory', 'LDAP', 'DNS', 'DHCP', 'Group Policy',
    'VMware', 'Hyper-V', 'Citrix', 'Virtual Desktop Infrastructure', 'VDI',
    'Monitoring', 'Nagios', 'Zabbix', 'SolarWinds', 'PRTG', 'Datadog',
    'Incident Response', 'Root Cause Analysis', 'Problem Resolution', 'Change Management',
    'Backup Administration', 'Veeam', 'Commvault', 'NetBackup', 'Disaster Recovery',
    'Patch Management', 'Security Updates', 'Vulnerability Remediation', 'Compliance',
    'Performance Tuning', 'Capacity Planning', 'Resource Optimization', 'Health Checks',
    'Shell Scripting', 'PowerShell', 'Bash', 'Python Scripting', 'Automation',
    'On-call Support', '24/7 Operations', 'Shift Handover', 'Runbook Execution'
  ],

  'systems support': [
    'Systems Support', 'Technical Support', 'Application Support', 'Production Support',
    'System Administration', 'Server Management', 'Infrastructure Support',
    'Windows Server', 'Linux', 'Active Directory', 'Group Policy',
    'Troubleshooting', 'Incident Management', 'Problem Resolution',
    'Monitoring', 'Performance Analysis', 'Capacity Planning',
    'Backup', 'Recovery', 'Disaster Recovery', 'Business Continuity',
    'Documentation', 'Runbooks', 'Standard Operating Procedures',
    'Vendor Management', 'Escalation', 'On-call Support',
    'ITIL', 'Change Management', 'Release Management'
  ],

  'systems administrator': [
    'Systems Administration', 'Server Administration', 'Infrastructure Administration',
    'Windows Server 2016/2019/2022', 'Linux Administration', 'RHEL', 'CentOS', 'Ubuntu Server',
    'Active Directory Design', 'Forest Management', 'Domain Controller', 'Replication',
    'Group Policy Management', 'OU Structure', 'Security Groups', 'Service Accounts',
    'Virtualization', 'VMware vSphere', 'ESXi', 'vCenter', 'Hyper-V Cluster',
    'Storage Administration', 'SAN', 'NAS', 'iSCSI', 'Fibre Channel',
    'Backup Strategy', 'RPO', 'RTO', 'Business Continuity', 'DR Testing',
    'Security Hardening', 'CIS Benchmarks', 'Security Baseline', 'Audit Compliance',
    'PowerShell Automation', 'Scheduled Tasks', 'WMI', 'Remote Management',
    'Certificate Management', 'PKI', 'SSL/TLS', 'Certificate Authority'
  ],

  'systems analyst': [
    'Systems Analysis', 'Business Systems Analysis', 'Technical Analysis',
    'Requirements Gathering', 'Requirements Documentation', 'Business Requirements', 'Technical Requirements',
    'Stakeholder Interviews', 'Workshops', 'JAD Sessions', 'Focus Groups',
    'Process Mapping', 'Process Flow', 'Workflow Analysis', 'Gap Analysis',
    'Use Cases', 'User Stories', 'Acceptance Criteria', 'Definition of Done',
    'System Design', 'Solution Design', 'Technical Specification', 'Functional Specification',
    'Data Modeling', 'ERD', 'Database Design', 'Data Dictionary',
    'SQL Queries', 'Report Development', 'Crystal Reports', 'SSRS', 'Power BI',
    'Integration Analysis', 'API Specification', 'Interface Design', 'Data Mapping',
    'UAT Coordination', 'Test Case Review', 'Defect Triage', 'Go-Live Support',
    'Change Management', 'Impact Analysis', 'Release Planning', 'Documentation'
  ],

  // Network & Infrastructure
  'network support': [
    'Network Support', 'Network Operations', 'NOC', 'Network Troubleshooting',
    'LAN Support', 'WAN Support', 'WLAN Support', 'Wireless Support',
    'TCP/IP', 'Subnetting', 'VLSM', 'IPv4', 'IPv6',
    'Switching', 'Routing', 'VLAN Configuration', 'Trunking', 'STP',
    'Cisco IOS', 'Cisco Catalyst', 'Cisco Nexus', 'Juniper', 'Aruba',
    'Firewall Support', 'ACL Configuration', 'NAT', 'PAT', 'Port Forwarding',
    'VPN Troubleshooting', 'Site-to-Site VPN', 'Client VPN', 'SSL VPN',
    'Network Monitoring', 'SNMP', 'NetFlow', 'Syslog', 'Network Mapping',
    'Wireshark', 'Packet Capture', 'Protocol Analysis', 'Traffic Analysis',
    'Cable Management', 'Patch Panel', 'Network Rack', 'Fiber Optics'
  ],

  'network engineer': [
    'Network Engineering', 'Network Design', 'Network Architecture', 'Network Planning',
    'Enterprise Networking', 'Campus Network', 'Data Center Network', 'Branch Network',
    'Cisco CCNA', 'CCNP', 'CCIE', 'Juniper JNCIA', 'JNCIS',
    'Routing Protocols', 'BGP', 'OSPF', 'EIGRP', 'IS-IS', 'RIP',
    'Switching Technologies', 'Layer 2', 'Layer 3', 'Spanning Tree', 'HSRP', 'VRRP',
    'SD-WAN', 'Cisco Meraki', 'Viptela', 'VMware NSX', 'Software-Defined Networking',
    'Load Balancing', 'F5', 'Citrix ADC', 'HAProxy', 'NGINX',
    'Network Security', 'Palo Alto', 'Fortinet', 'Check Point', 'Cisco ASA',
    'Cloud Networking', 'AWS VPC', 'Azure Virtual Network', 'GCP VPC',
    'Network Automation', 'Ansible', 'Python', 'Netmiko', 'NAPALM'
  ],

  // Security
  'security analyst': [
    'Security Analysis', 'Cybersecurity', 'Information Security', 'IT Security',
    'Security Operations', 'SOC', 'Security Monitoring', 'Threat Detection',
    'SIEM', 'Splunk', 'QRadar', 'ArcSight', 'LogRhythm', 'Elastic SIEM',
    'Incident Response', 'Security Incidents', 'Breach Response', 'Forensics',
    'Vulnerability Management', 'Nessus', 'Qualys', 'Rapid7', 'Tenable',
    'Penetration Testing', 'Ethical Hacking', 'Kali Linux', 'Metasploit', 'Burp Suite',
    'Malware Analysis', 'Threat Intelligence', 'IOC', 'MITRE ATT&CK',
    'Endpoint Security', 'EDR', 'CrowdStrike', 'Carbon Black', 'SentinelOne',
    'Identity Management', 'IAM', 'PAM', 'CyberArk', 'BeyondTrust',
    'Compliance', 'ISO 27001', 'SOC 2', 'PCI DSS', 'GDPR', 'HIPAA',
    'Security Awareness', 'Phishing Simulation', 'User Training', 'Policy Development'
  ],

  'security engineer': [
    'Security Engineering', 'Security Architecture', 'Security Infrastructure',
    'Firewall Engineering', 'Next-Gen Firewall', 'NGFW', 'UTM',
    'Network Security', 'Zero Trust', 'Micro-segmentation', 'NAC',
    'Cloud Security', 'AWS Security', 'Azure Security', 'GCP Security',
    'Container Security', 'Kubernetes Security', 'Docker Security',
    'DevSecOps', 'Security Automation', 'Infrastructure as Code Security',
    'Cryptography', 'PKI', 'HSM', 'Key Management', 'Encryption',
    'DLP', 'Data Loss Prevention', 'CASB', 'Email Security',
    'WAF', 'Web Application Firewall', 'API Security', 'Bot Management',
    'Threat Modeling', 'Security Design', 'Risk Assessment', 'Security Review'
  ],

  // Software Development
  'software developer': [
    'Software Development', 'Application Development', 'Web Development',
    'Full Stack Development', 'Backend Development', 'Frontend Development',
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust',
    'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express',
    'Spring Boot', 'Django', 'Flask', 'FastAPI', '.NET Core', 'ASP.NET',
    'REST API', 'GraphQL', 'gRPC', 'WebSocket', 'Microservices',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Version Control',
    'CI/CD', 'Jenkins', 'GitHub Actions', 'CircleCI', 'Travis CI',
    'Docker', 'Kubernetes', 'Container', 'Orchestration',
    'Agile', 'Scrum', 'Kanban', 'Sprint', 'Stand-up',
    'Unit Testing', 'Integration Testing', 'TDD', 'BDD', 'Jest', 'PyTest',
    'Code Review', 'Pull Request', 'Clean Code', 'SOLID', 'Design Patterns'
  ],

  'frontend developer': [
    'Frontend Development', 'UI Development', 'Client-Side Development',
    'HTML5', 'CSS3', 'JavaScript ES6+', 'TypeScript',
    'React', 'React Hooks', 'Redux', 'Context API', 'React Query',
    'Vue.js', 'Vuex', 'Vue Router', 'Composition API',
    'Angular', 'RxJS', 'NgRx', 'Angular Material',
    'Next.js', 'Nuxt.js', 'Gatsby', 'Static Site Generation', 'SSR',
    'CSS Frameworks', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Styled Components',
    'Responsive Design', 'Mobile-First', 'Cross-Browser', 'Progressive Web Apps',
    'State Management', 'Component Architecture', 'Atomic Design',
    'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',
    'Performance Optimization', 'Lighthouse', 'Core Web Vitals', 'Lazy Loading',
    'Accessibility', 'WCAG', 'ARIA', 'Screen Reader', 'Keyboard Navigation',
    'Testing', 'Jest', 'React Testing Library', 'Cypress', 'Playwright'
  ],

  'backend developer': [
    'Backend Development', 'Server-Side Development', 'API Development',
    'Node.js', 'Express.js', 'Fastify', 'NestJS', 'Koa',
    'Python', 'Django', 'Flask', 'FastAPI', 'Celery',
    'Java', 'Spring Boot', 'Spring MVC', 'Hibernate', 'Maven', 'Gradle',
    'C#', '.NET Core', 'ASP.NET Web API', 'Entity Framework',
    'Go', 'Gin', 'Echo', 'Fiber',
    'REST API Design', 'API Versioning', 'API Documentation', 'Swagger', 'OpenAPI',
    'GraphQL', 'Apollo Server', 'Hasura', 'Prisma',
    'Authentication', 'OAuth 2.0', 'JWT', 'SAML', 'SSO',
    'Database Design', 'SQL Optimization', 'Query Performance', 'Indexing',
    'Caching', 'Redis', 'Memcached', 'CDN',
    'Message Queues', 'RabbitMQ', 'Kafka', 'SQS', 'Event-Driven',
    'Microservices', 'Service Mesh', 'API Gateway', 'Load Balancing'
  ],

  'mobile developer': [
    'Mobile Development', 'Mobile App Development', 'Native Development',
    'iOS Development', 'Swift', 'Objective-C', 'Xcode', 'CocoaPods',
    'Android Development', 'Kotlin', 'Java', 'Android Studio', 'Gradle',
    'React Native', 'Expo', 'Cross-Platform', 'Hybrid Apps',
    'Flutter', 'Dart', 'Widget', 'Material Design',
    'Mobile UI/UX', 'Human Interface Guidelines', 'Material Design Guidelines',
    'App Store', 'Google Play', 'App Submission', 'App Review',
    'Push Notifications', 'Firebase', 'APNs', 'FCM',
    'Offline Storage', 'SQLite', 'Realm', 'Core Data',
    'REST API Integration', 'Mobile Security', 'App Performance',
    'Mobile Testing', 'XCTest', 'Espresso', 'Appium', 'Detox'
  ],

  // DevOps & Cloud
  'devops engineer': [
    'DevOps', 'DevOps Engineering', 'Site Reliability Engineering', 'SRE',
    'CI/CD', 'Continuous Integration', 'Continuous Delivery', 'Continuous Deployment',
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'Azure DevOps', 'CircleCI', 'ArgoCD',
    'Infrastructure as Code', 'IaC', 'Terraform', 'Pulumi', 'CloudFormation',
    'Configuration Management', 'Ansible', 'Puppet', 'Chef', 'Salt',
    'Containerization', 'Docker', 'Docker Compose', 'Container Registry',
    'Container Orchestration', 'Kubernetes', 'K8s', 'Helm', 'Kustomize',
    'Cloud Platforms', 'AWS', 'Azure', 'GCP', 'Multi-Cloud',
    'Monitoring', 'Prometheus', 'Grafana', 'Datadog', 'New Relic',
    'Logging', 'ELK Stack', 'Elasticsearch', 'Logstash', 'Kibana', 'Splunk',
    'Alerting', 'PagerDuty', 'OpsGenie', 'Incident Management',
    'Linux Administration', 'Shell Scripting', 'Python', 'Go',
    'GitOps', 'Flux', 'ArgoCD', 'Infrastructure Automation'
  ],

  'cloud engineer': [
    'Cloud Engineering', 'Cloud Architecture', 'Cloud Solutions',
    'AWS', 'Amazon Web Services', 'EC2', 'S3', 'RDS', 'Lambda', 'EKS', 'ECS',
    'Azure', 'Microsoft Azure', 'Azure VMs', 'Azure Functions', 'AKS', 'Azure SQL',
    'GCP', 'Google Cloud', 'Compute Engine', 'Cloud Functions', 'GKE', 'BigQuery',
    'Cloud Migration', 'Lift and Shift', 'Re-platforming', 'Re-architecting',
    'Serverless', 'FaaS', 'Lambda', 'Azure Functions', 'Cloud Functions',
    'Cloud Security', 'IAM', 'Security Groups', 'VPC', 'Private Link',
    'Cost Optimization', 'FinOps', 'Reserved Instances', 'Spot Instances',
    'High Availability', 'Disaster Recovery', 'Multi-Region', 'Failover',
    'Cloud Networking', 'VPN', 'Direct Connect', 'ExpressRoute', 'Peering'
  ],

  // Data & Analytics
  'data analyst': [
    'Data Analysis', 'Business Intelligence', 'Analytics', 'Reporting',
    'SQL', 'Advanced SQL', 'Query Optimization', 'Stored Procedures',
    'Excel', 'Advanced Excel', 'Pivot Tables', 'VLOOKUP', 'Power Query', 'Macros',
    'Power BI', 'DAX', 'Power Query M', 'Data Modeling', 'Dashboard Design',
    'Tableau', 'Tableau Desktop', 'Tableau Server', 'Data Visualization',
    'Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter',
    'R', 'R Studio', 'ggplot2', 'dplyr', 'tidyr',
    'Statistical Analysis', 'Hypothesis Testing', 'Regression', 'A/B Testing',
    'ETL', 'Data Extraction', 'Data Transformation', 'Data Loading',
    'Data Cleaning', 'Data Quality', 'Data Validation', 'Missing Data',
    'KPIs', 'Metrics', 'Performance Indicators', 'Trend Analysis',
    'Forecasting', 'Predictive Analytics', 'Time Series', 'Seasonality'
  ],

  'data engineer': [
    'Data Engineering', 'Data Pipeline', 'Data Infrastructure',
    'ETL Development', 'ELT', 'Data Integration', 'Data Orchestration',
    'Apache Spark', 'PySpark', 'Spark SQL', 'Spark Streaming',
    'Apache Kafka', 'Kafka Streams', 'Event Streaming', 'Real-Time Data',
    'Airflow', 'DAGs', 'Workflow Orchestration', 'Luigi', 'Prefect',
    'Data Warehousing', 'Snowflake', 'Redshift', 'BigQuery', 'Databricks',
    'Data Lake', 'Delta Lake', 'Data Lakehouse', 'S3', 'ADLS',
    'SQL', 'NoSQL', 'PostgreSQL', 'MongoDB', 'Cassandra',
    'Python', 'Scala', 'Java', 'SQL', 'Shell Scripting',
    'Cloud Data Services', 'AWS Glue', 'Azure Data Factory', 'GCP Dataflow',
    'Data Modeling', 'Dimensional Modeling', 'Star Schema', 'Snowflake Schema',
    'Data Governance', 'Data Catalog', 'Data Lineage', 'Metadata Management'
  ],

  'data scientist': [
    'Data Science', 'Machine Learning', 'Artificial Intelligence', 'AI/ML',
    'Python', 'R', 'Jupyter Notebooks', 'Google Colab',
    'Machine Learning', 'Supervised Learning', 'Unsupervised Learning', 'Deep Learning',
    'Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'XGBoost',
    'Natural Language Processing', 'NLP', 'NLTK', 'spaCy', 'Transformers', 'BERT',
    'Computer Vision', 'OpenCV', 'Image Classification', 'Object Detection',
    'Statistical Modeling', 'Regression', 'Classification', 'Clustering',
    'Feature Engineering', 'Feature Selection', 'Dimensionality Reduction',
    'Model Training', 'Hyperparameter Tuning', 'Cross-Validation', 'Model Evaluation',
    'MLOps', 'Model Deployment', 'MLflow', 'Kubeflow', 'SageMaker',
    'A/B Testing', 'Experimentation', 'Causal Inference',
    'Data Visualization', 'Storytelling', 'Business Insights'
  ],

  // Database
  'database administrator': [
    'Database Administration', 'DBA', 'Database Management',
    'SQL Server', 'MSSQL', 'SQL Server Administration', 'SSMS',
    'Oracle', 'Oracle Database', 'Oracle RAC', 'Oracle Data Guard',
    'MySQL', 'MySQL Administration', 'MySQL Replication', 'MySQL Cluster',
    'PostgreSQL', 'Postgres', 'PostgreSQL Administration', 'pgAdmin',
    'MongoDB', 'NoSQL', 'Document Database', 'MongoDB Atlas',
    'Database Design', 'Schema Design', 'Normalization', 'Denormalization',
    'Performance Tuning', 'Query Optimization', 'Index Optimization', 'Execution Plans',
    'Backup and Recovery', 'Point-in-Time Recovery', 'Database Backup', 'Restore',
    'High Availability', 'Clustering', 'Replication', 'Failover',
    'Security', 'Database Security', 'Encryption', 'Access Control', 'Auditing',
    'Migration', 'Database Migration', 'Version Upgrade', 'Data Migration'
  ],

  // QA & Testing
  'qa engineer': [
    'Quality Assurance', 'QA', 'Software Testing', 'Test Engineering',
    'Manual Testing', 'Functional Testing', 'Regression Testing', 'Smoke Testing',
    'Test Planning', 'Test Strategy', 'Test Cases', 'Test Scenarios',
    'Automation Testing', 'Test Automation', 'Automated Testing',
    'Selenium', 'WebDriver', 'Selenium Grid', 'Page Object Model',
    'Cypress', 'Playwright', 'Puppeteer', 'End-to-End Testing',
    'API Testing', 'Postman', 'REST Assured', 'SoapUI',
    'Performance Testing', 'JMeter', 'LoadRunner', 'Gatling', 'K6',
    'Mobile Testing', 'Appium', 'XCUITest', 'Espresso',
    'CI/CD Integration', 'Test Pipeline', 'Continuous Testing',
    'Bug Tracking', 'Jira', 'Bugzilla', 'Defect Management',
    'Agile Testing', 'Sprint Testing', 'BDD', 'Cucumber', 'Gherkin'
  ],
}

// ============================================
// BUSINESS & FINANCE ROLES
// ============================================
export const BUSINESS_ROLES: Record<string, string[]> = {
  'business analyst': [
    'Business Analysis', 'Requirements Analysis', 'Process Analysis',
    'Requirements Gathering', 'Requirements Elicitation', 'Business Requirements Document', 'BRD',
    'Stakeholder Management', 'Stakeholder Interviews', 'Workshop Facilitation',
    'Process Mapping', 'Business Process Modeling', 'BPMN', 'Swimlane Diagrams',
    'Gap Analysis', 'Current State', 'Future State', 'As-Is To-Be',
    'Use Cases', 'User Stories', 'Acceptance Criteria', 'Epic',
    'Agile', 'Scrum', 'Kanban', 'SAFe', 'Sprint Planning',
    'JIRA', 'Confluence', 'Azure DevOps', 'Trello',
    'Data Analysis', 'SQL', 'Excel', 'Reporting',
    'UAT', 'User Acceptance Testing', 'Test Coordination',
    'Change Management', 'Impact Assessment', 'Training'
  ],

  'project manager': [
    'Project Management', 'Program Management', 'Portfolio Management',
    'Project Planning', 'Project Scheduling', 'Resource Planning', 'Budget Management',
    'Agile', 'Scrum', 'Waterfall', 'Hybrid', 'Kanban',
    'PMP', 'PRINCE2', 'PMI', 'Agile Certification', 'Scrum Master',
    'Stakeholder Management', 'Executive Reporting', 'Status Reports',
    'Risk Management', 'Risk Assessment', 'Risk Mitigation', 'Issue Management',
    'Scope Management', 'Change Control', 'Scope Creep',
    'MS Project', 'Smartsheet', 'Monday.com', 'Asana', 'Jira',
    'Team Leadership', 'Cross-Functional Teams', 'Matrix Management',
    'Vendor Management', 'Contract Management', 'Procurement',
    'Go-Live', 'Cutover Planning', 'Post-Implementation Review'
  ],

  'product manager': [
    'Product Management', 'Product Strategy', 'Product Vision', 'Product Roadmap',
    'User Research', 'Customer Discovery', 'Customer Interviews', 'User Personas',
    'Market Research', 'Competitive Analysis', 'Market Sizing', 'TAM SAM SOM',
    'Product Requirements', 'PRD', 'Feature Specification', 'User Stories',
    'Prioritization', 'MoSCoW', 'RICE', 'Kano Model', 'Value vs Effort',
    'Agile', 'Scrum', 'Sprint Planning', 'Backlog Grooming', 'Refinement',
    'Metrics', 'KPIs', 'OKRs', 'Product Analytics', 'Data-Driven',
    'A/B Testing', 'Experimentation', 'Feature Flags', 'Hypothesis Testing',
    'Go-to-Market', 'Product Launch', 'Beta Testing', 'Early Access',
    'Stakeholder Alignment', 'Executive Presentations', 'Roadmap Communication',
    'Product Analytics', 'Mixpanel', 'Amplitude', 'Google Analytics'
  ],

  'scrum master': [
    'Scrum Master', 'Agile Coach', 'Agile Facilitation',
    'Scrum Framework', 'Scrum Events', 'Sprint Planning', 'Daily Standup',
    'Sprint Review', 'Sprint Retrospective', 'Backlog Refinement',
    'Servant Leadership', 'Team Facilitation', 'Impediment Removal',
    'Agile Metrics', 'Velocity', 'Burndown', 'Burnup', 'Cycle Time',
    'Continuous Improvement', 'Kaizen', 'Process Improvement',
    'Coaching', 'Mentoring', 'Team Development',
    'Conflict Resolution', 'Team Dynamics', 'Collaboration',
    'CSM', 'PSM', 'SAFe Scrum Master', 'Agile Certification',
    'Jira', 'Azure DevOps', 'Rally', 'Agile Tools'
  ],

  'financial analyst': [
    'Financial Analysis', 'Financial Modeling', 'Financial Planning',
    'Budgeting', 'Forecasting', 'Variance Analysis', 'Trend Analysis',
    'Financial Reporting', 'Management Reporting', 'Board Reporting',
    'Excel', 'Advanced Excel', 'Financial Functions', 'Pivot Tables', 'Macros',
    'SAP', 'Oracle Financials', 'NetSuite', 'QuickBooks',
    'P&L Analysis', 'Balance Sheet', 'Cash Flow', 'Working Capital',
    'Valuation', 'DCF', 'Comparable Analysis', 'Precedent Transactions',
    'KPIs', 'Financial Metrics', 'ROI', 'NPV', 'IRR',
    'Data Visualization', 'Power BI', 'Tableau', 'Financial Dashboards',
    'Audit Support', 'Internal Controls', 'Compliance', 'SOX'
  ],

  'accountant': [
    'Accounting', 'Financial Accounting', 'Management Accounting',
    'General Ledger', 'GL', 'Journal Entries', 'Account Reconciliation',
    'Accounts Payable', 'AP', 'Invoice Processing', 'Vendor Payments',
    'Accounts Receivable', 'AR', 'Invoicing', 'Collections', 'Credit Control',
    'Month-End Close', 'Year-End Close', 'Financial Close',
    'Financial Statements', 'Income Statement', 'Balance Sheet', 'Cash Flow Statement',
    'GAAP', 'IFRS', 'Accounting Standards', 'Compliance',
    'Tax Preparation', 'Tax Filing', 'VAT', 'Corporate Tax',
    'QuickBooks', 'Sage', 'Xero', 'SAP', 'Oracle Financials',
    'Audit Preparation', 'External Audit', 'Internal Audit',
    'Payroll', 'Payroll Processing', 'Benefits Administration'
  ],
}

// ============================================
// MARKETING & SALES ROLES
// ============================================
export const MARKETING_ROLES: Record<string, string[]> = {
  'digital marketing': [
    'Digital Marketing', 'Online Marketing', 'Internet Marketing',
    'SEO', 'Search Engine Optimization', 'On-Page SEO', 'Off-Page SEO', 'Technical SEO',
    'SEM', 'Search Engine Marketing', 'Google Ads', 'Bing Ads', 'PPC',
    'Social Media Marketing', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'TikTok',
    'Content Marketing', 'Content Strategy', 'Blog Writing', 'Copywriting',
    'Email Marketing', 'Email Campaigns', 'Mailchimp', 'HubSpot', 'SendGrid',
    'Marketing Automation', 'Lead Nurturing', 'Drip Campaigns',
    'Analytics', 'Google Analytics', 'GA4', 'UTM Tracking', 'Conversion Tracking',
    'A/B Testing', 'Landing Pages', 'Conversion Optimization', 'CRO',
    'Influencer Marketing', 'Affiliate Marketing', 'Partnership Marketing'
  ],

  'sales manager': [
    'Sales Management', 'Sales Leadership', 'Team Management',
    'Sales Strategy', 'Go-to-Market', 'Territory Planning',
    'Pipeline Management', 'Sales Forecasting', 'Revenue Forecasting',
    'CRM', 'Salesforce', 'HubSpot', 'Pipedrive', 'Zoho',
    'Lead Generation', 'Prospecting', 'Cold Calling', 'Outbound Sales',
    'Account Management', 'Key Accounts', 'Enterprise Sales', 'B2B Sales',
    'Sales Training', 'Coaching', 'Performance Management',
    'Quota Management', 'Target Achievement', 'KPIs', 'Metrics',
    'Contract Negotiation', 'Pricing', 'Deal Closing',
    'Client Relationships', 'Customer Success', 'Retention'
  ],

  'customer success': [
    'Customer Success', 'Client Success', 'Customer Experience',
    'Onboarding', 'Customer Onboarding', 'Implementation',
    'Account Management', 'Relationship Management', 'Client Engagement',
    'Retention', 'Churn Prevention', 'Renewal Management', 'Upselling',
    'Customer Health', 'Health Score', 'NPS', 'CSAT', 'Customer Satisfaction',
    'Product Adoption', 'Feature Adoption', 'Usage Analytics',
    'Quarterly Business Reviews', 'QBR', 'Executive Engagement',
    'Escalation Management', 'Issue Resolution', 'Customer Advocacy',
    'CRM', 'Gainsight', 'ChurnZero', 'Totango', 'Salesforce'
  ],
}

// ============================================
// OPERATIONS & ADMIN ROLES
// ============================================
export const OPERATIONS_ROLES: Record<string, string[]> = {
  'operations manager': [
    'Operations Management', 'Business Operations', 'Operations Excellence',
    'Process Improvement', 'Process Optimization', 'Lean', 'Six Sigma',
    'Resource Management', 'Capacity Planning', 'Workforce Planning',
    'KPIs', 'Metrics', 'Performance Management', 'Dashboards',
    'Vendor Management', 'Supplier Management', 'Contract Management',
    'Budget Management', 'Cost Control', 'Cost Reduction',
    'Quality Management', 'Quality Assurance', 'Quality Control',
    'Team Leadership', 'Staff Management', 'Hiring', 'Training',
    'Project Management', 'Cross-Functional Coordination',
    'Compliance', 'Policy Development', 'SOP', 'Standard Operating Procedures'
  ],

  'administrative assistant': [
    'Administrative Support', 'Executive Support', 'Office Administration',
    'Calendar Management', 'Scheduling', 'Meeting Coordination',
    'Travel Arrangements', 'Expense Reports', 'Reimbursements',
    'Document Management', 'Filing', 'Record Keeping', 'Data Entry',
    'Microsoft Office', 'Word', 'Excel', 'PowerPoint', 'Outlook',
    'Google Workspace', 'Gmail', 'Google Calendar', 'Google Drive',
    'Communication', 'Email Management', 'Phone Handling', 'Reception',
    'Event Planning', 'Meeting Setup', 'Catering Coordination',
    'Office Supplies', 'Inventory Management', 'Vendor Coordination',
    'Confidentiality', 'Discretion', 'Professional Communication'
  ],

  'human resources': [
    'Human Resources', 'HR', 'People Operations', 'Talent Management',
    'Recruitment', 'Talent Acquisition', 'Sourcing', 'Interviewing', 'Hiring',
    'Onboarding', 'New Hire Orientation', 'Employee Onboarding',
    'Employee Relations', 'Conflict Resolution', 'Grievance Handling',
    'Performance Management', 'Performance Reviews', 'Goal Setting',
    'Compensation', 'Benefits Administration', 'Payroll',
    'HRIS', 'Workday', 'BambooHR', 'ADP', 'SAP SuccessFactors',
    'Compliance', 'Employment Law', 'Labor Relations', 'Policy Development',
    'Training & Development', 'Learning & Development', 'L&D',
    'Employee Engagement', 'Culture', 'Retention', 'Exit Interviews'
  ],
}

// ============================================
// LEVEL-SPECIFIC KEYWORDS
// ============================================
export const LEVEL_KEYWORDS: Record<string, string[]> = {
  entry: [
    'Entry Level', 'Junior', 'Graduate', 'Trainee', 'Associate',
    'Learning', 'Training', 'Development', 'Growth Mindset',
    'Team Player', 'Collaboration', 'Communication',
    'Attention to Detail', 'Organization', 'Time Management',
    'Problem Solving', 'Analytical Thinking', 'Critical Thinking',
    'Adaptability', 'Flexibility', 'Quick Learner', 'Eager to Learn',
    'Documentation', 'Process Following', 'Procedure Adherence',
    'Support', 'Assistance', 'Helping', 'Contributing'
  ],

  mid: [
    'Mid-Level', 'Intermediate', 'Experienced',
    'Independent Work', 'Self-Starter', 'Initiative',
    'Project Ownership', 'Delivery', 'Execution',
    'Process Improvement', 'Efficiency', 'Optimization',
    'Stakeholder Communication', 'Client Interaction',
    'Mentoring Juniors', 'Knowledge Sharing', 'Training Others',
    'Cross-Team Collaboration', 'Cross-Functional',
    'Problem Solving', 'Decision Making', 'Judgment'
  ],

  senior: [
    'Senior', 'Lead', 'Principal', 'Staff',
    'Technical Leadership', 'Team Leadership', 'People Management',
    'Architecture', 'Design', 'Strategy', 'Planning',
    'Mentoring', 'Coaching', 'Team Development',
    'Best Practices', 'Standards', 'Guidelines', 'Governance',
    'Stakeholder Management', 'Executive Communication',
    'Cross-Functional Leadership', 'Influence', 'Driving Change',
    'Complex Problem Solving', 'Strategic Thinking', 'Innovation',
    'Code Review', 'Technical Review', 'Quality Assurance'
  ],

  lead: [
    'Lead', 'Team Lead', 'Tech Lead', 'Engineering Lead',
    'Team Management', 'People Management', 'Direct Reports',
    'Hiring', 'Interviewing', 'Onboarding', 'Team Building',
    'Performance Management', 'Career Development', 'One-on-Ones',
    'Project Planning', 'Resource Allocation', 'Capacity Planning',
    'Technical Direction', 'Architecture Decisions', 'Technology Strategy',
    'Stakeholder Management', 'Executive Reporting', 'Presentations',
    'Process Design', 'Workflow Optimization', 'Continuous Improvement',
    'Budget Management', 'Vendor Management', 'Contract Negotiation'
  ],

  executive: [
    'Executive', 'Director', 'VP', 'Vice President', 'C-Level',
    'Strategic Leadership', 'Vision', 'Mission', 'Strategy Development',
    'Organizational Leadership', 'Change Management', 'Transformation',
    'P&L Responsibility', 'Budget Ownership', 'Financial Management',
    'Board Reporting', 'Investor Relations', 'Stakeholder Communication',
    'Business Development', 'Partnership Development', 'Market Expansion',
    'Talent Strategy', 'Organizational Design', 'Culture Building',
    'Governance', 'Risk Management', 'Compliance',
    'Industry Thought Leadership', 'Speaking Engagements', 'Publications'
  ],
}

// ============================================
// SOFT SKILLS
// ============================================
export const SOFT_SKILLS: string[] = [
  'Communication', 'Written Communication', 'Verbal Communication', 'Presentation Skills',
  'Teamwork', 'Collaboration', 'Team Player', 'Cross-Functional Collaboration',
  'Problem Solving', 'Analytical Thinking', 'Critical Thinking', 'Logical Reasoning',
  'Leadership', 'Initiative', 'Self-Motivation', 'Proactive',
  'Time Management', 'Prioritization', 'Deadline Management', 'Multitasking',
  'Adaptability', 'Flexibility', 'Change Management', 'Resilience',
  'Attention to Detail', 'Accuracy', 'Quality Focus', 'Thoroughness',
  'Customer Focus', 'Customer Service', 'Client Relations', 'Stakeholder Management',
  'Conflict Resolution', 'Negotiation', 'Diplomacy', 'Mediation',
  'Creativity', 'Innovation', 'Creative Thinking', 'Out-of-the-Box Thinking',
  'Emotional Intelligence', 'Empathy', 'Active Listening', 'Interpersonal Skills',
  'Work Ethic', 'Reliability', 'Dependability', 'Accountability',
  'Decision Making', 'Judgment', 'Risk Assessment', 'Strategic Thinking',
]

// ============================================
// REMOTE WORK SKILLS
// ============================================
export const REMOTE_SKILLS: string[] = [
  'Remote Work', 'Work From Home', 'WFH', 'Distributed Teams',
  'Asynchronous Communication', 'Async Communication', 'Written Communication',
  'Video Conferencing', 'Zoom', 'Microsoft Teams', 'Google Meet', 'Webex',
  'Collaboration Tools', 'Slack', 'Microsoft Teams', 'Discord',
  'Project Management Tools', 'Jira', 'Asana', 'Trello', 'Monday.com',
  'Documentation', 'Confluence', 'Notion', 'Google Docs', 'Knowledge Base',
  'Time Zone Management', 'Global Teams', 'International Collaboration',
  'Self-Management', 'Self-Discipline', 'Self-Motivation', 'Autonomy',
  'Virtual Meetings', 'Online Presentations', 'Screen Sharing',
  'Remote Support', 'Remote Desktop', 'TeamViewer', 'AnyDesk',
]

// ============================================
// COMBINED DATABASE
// ============================================
export const ALL_ROLE_KEYWORDS: Record<string, string[]> = {
  ...IT_ROLES,
  ...BUSINESS_ROLES,
  ...MARKETING_ROLES,
  ...OPERATIONS_ROLES,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get keywords for a role by matching against the database
 */
export function getKeywordsForRole(role: string, level: string): string[] {
  const roleLC = role.toLowerCase().trim()
  const keywords: Set<string> = new Set()

  // Direct match first
  if (ALL_ROLE_KEYWORDS[roleLC]) {
    ALL_ROLE_KEYWORDS[roleLC].forEach(k => keywords.add(k))
  }

  // Check for partial matches (e.g., "systems support analyst" matches "systems support")
  for (const [key, kws] of Object.entries(ALL_ROLE_KEYWORDS)) {
    // Role contains the key
    if (roleLC.includes(key)) {
      kws.forEach(k => keywords.add(k))
    }
    // Key contains the role
    if (key.includes(roleLC)) {
      kws.forEach(k => keywords.add(k))
    }
  }

  // Check individual words in the role
  const words = roleLC.split(/\s+/).filter(w => w.length > 2)
  for (const word of words) {
    for (const [key, kws] of Object.entries(ALL_ROLE_KEYWORDS)) {
      if (key.includes(word) || word.includes(key.split(' ')[0])) {
        // Add only a subset to avoid overwhelming
        kws.slice(0, 15).forEach(k => keywords.add(k))
      }
    }
  }

  // Add level-specific keywords
  const levelKws = LEVEL_KEYWORDS[level] || LEVEL_KEYWORDS['mid']
  levelKws.forEach(k => keywords.add(k))

  // Add some soft skills
  SOFT_SKILLS.slice(0, 8).forEach(k => keywords.add(k))

  // If still too few keywords, add generic ones
  if (keywords.size < 15) {
    // Add from analyst and support as fallback
    if (ALL_ROLE_KEYWORDS['business analyst']) {
      ALL_ROLE_KEYWORDS['business analyst'].slice(0, 10).forEach(k => keywords.add(k))
    }
    if (ALL_ROLE_KEYWORDS['it support']) {
      ALL_ROLE_KEYWORDS['it support'].slice(0, 10).forEach(k => keywords.add(k))
    }
  }

  return [...keywords].slice(0, 30)
}

/**
 * Get remote-specific keywords
 */
export function getRemoteKeywords(): string[] {
  return REMOTE_SKILLS
}

/**
 * Get soft skills
 */
export function getSoftSkills(): string[] {
  return SOFT_SKILLS
}

/**
 * Get level-specific keywords
 */
export function getLevelKeywords(level: string): string[] {
  return LEVEL_KEYWORDS[level] || LEVEL_KEYWORDS['mid']
}

export default {
  ALL_ROLE_KEYWORDS,
  LEVEL_KEYWORDS,
  SOFT_SKILLS,
  REMOTE_SKILLS,
  getKeywordsForRole,
  getRemoteKeywords,
  getSoftSkills,
  getLevelKeywords,
}