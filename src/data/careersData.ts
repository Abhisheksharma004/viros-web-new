export interface JobOpening {
    id: string;
    title: string;
    department: "Engineering" | "Sales & Business" | "Software & IT" | "Operations & Support" | string;
    location: string;
    type: "Full-Time" | "Hybrid" | "Remote" | "Contract" | string;
    experience: string;
    salary: string;
    summary: string;
    tags: string[];
    responsibilities: string[];
    requirements: string[];
    niceToHave: string[];
    isActive?: boolean;
    createdAt?: string | Date;
}

export const JOB_OPENINGS: JobOpening[] = [
    {
        id: "aidc-sr-engineer",
        title: "Senior AIDC Solutions Engineer",
        department: "Engineering",
        location: "Noida / Delhi NCR (On-Site)",
        type: "Full-Time",
        experience: "3 - 6 Years",
        salary: "Competitive / Best in Industry",
        summary: "Lead the technical design, deployment, and optimization of enterprise barcode, RFID, and automated scanning systems for Fortune 500 manufacturing & logistics clients.",
        tags: ["AIDC", "Barcode Hardware", "RFID Systems", "Industrial Automation", "Zebra / Honeywell"],
        responsibilities: [
            "Architect and integrate industrial barcode printers, handheld mobile computers, and fixed industrial scanners into client workflows.",
            "Perform on-site site surveys, radio-frequency RFID evaluations, and thermal printing optimizations.",
            "Collaborate closely with enterprise clients in automotive, pharma, and FMCG sectors to solve complex warehouse traceability bottlenecks.",
            "Provide Tier-3 escalation support and mentor junior deployment field engineers."
        ],
        requirements: [
            "Bachelor's degree in Electrical/Electronics, Computer Science, or equivalent practical experience.",
            "Minimum 3 years of hands-on experience with AIDC equipment (Zebra, Honeywell, Datalogic, TSC, SATO).",
            "Strong understanding of industrial networking protocols (Ethernet/IP, Modbus, TCP/IP, RS232).",
            "Willingness for periodic client site visits and factory installations."
        ],
        niceToHave: [
            "OEM certification from Zebra, Honeywell, or GS1 Standards.",
            "Experience with 21 CFR Part 11 or pharma serialization workflows."
        ]
    },
    {
        id: "fullstack-software-dev",
        title: "Full Stack Software Developer (IoT & Web)",
        department: "Software & IT",
        location: "Noida / Hybrid",
        type: "Full-Time",
        experience: "2 - 5 Years",
        salary: "Competitive / Best in Industry",
        summary: "Build high-throughput warehouse intelligence software, barcode generation platforms, real-time inventory dashboards, and microservices.",
        tags: ["React / Next.js", "Node.js", "PostgreSQL", "REST / GraphQL", "IoT Protocols"],
        responsibilities: [
            "Develop scalable web applications and RESTful APIs for inventory tracking, asset management, and warranty monitoring.",
            "Integrate barcode/RFID scanner webhooks and real-time telemetry streams using WebSockets.",
            "Design performant database schemas and caching layers for heavy enterprise transaction logs.",
            "Collaborate with UX designers to craft intuitive, modern dashboards for warehouse and plant supervisors."
        ],
        requirements: [
            "Proven experience building full-stack applications with TypeScript, React/Next.js, and Node.js.",
            "Proficient in relational databases (PostgreSQL, MySQL) and database modeling.",
            "Familiarity with state management, API design, and cloud deployments (AWS / GCP / Vercel).",
            "Good knowledge of Git workflows and CI/CD pipelines."
        ],
        niceToHave: [
            "Prior experience with Zebra ZPL / EPL printer programming or barcode label software.",
            "Exposure to MQTT or real-time IoT device streams."
        ]
    },
    {
        id: "enterprise-b2b-sales",
        title: "Enterprise Sales Manager (AIDC & IT)",
        department: "Sales & Business",
        location: "Noida / Delhi NCR",
        type: "Full-Time",
        experience: "4 - 8 Years",
        salary: "High Base + Lucrative Incentives",
        summary: "Drive enterprise customer acquisition across Manufacturing, Healthcare, Pharmaceuticals, and E-commerce sectors for high-value AIDC and IT hardware contracts.",
        tags: ["B2B Sales", "Key Account Management", "Enterprise Solutioning", "Client Acquisition"],
        responsibilities: [
            "Identify and close new enterprise business opportunities across industrial clusters and corporate accounts.",
            "Prepare compelling solution pitches, technical proposals, and commercial contracts.",
            "Build strong long-term relationships with CIOs, Supply Chain Heads, and Operations Directors.",
            "Achieve quarterly revenue targets and coordinate with technical teams for smooth project rollouts."
        ],
        requirements: [
            "Proven track record of B2B solution sales in IT hardware, barcode automation, or enterprise software.",
            "Exceptional communication, presentation, negotiation, and relationship-building skills.",
            "Self-motivated with strong analytical and pipeline management skills.",
            "Existing client relationships in Northern / Western Indian industrial corridors is a strong plus."
        ],
        niceToHave: [
            "MBA in Marketing / Sales or Engineering background.",
            "Experience with CRM tools like Salesforce, HubSpot, or Zoho CRM."
        ]
    },
    {
        id: "vision-ai-engineer",
        title: "Machine Vision & Quality Inspector Engineer",
        department: "Engineering",
        location: "Noida / On-Site",
        type: "Full-Time",
        experience: "2 - 5 Years",
        salary: "Competitive / Best in Industry",
        summary: "Develop and deploy optical character recognition (OCR), defect detection, and high-speed line inspection camera systems for production lines.",
        tags: ["Machine Vision", "OpenCV / Python", "Industrial Cameras", "Defect Detection", "Edge AI"],
        responsibilities: [
            "Configure industrial camera systems, optics, and lighting for high-speed conveyor lines.",
            "Implement vision algorithms for barcode grading (ISO/IEC), OCR expiry verification, and surface defect detection.",
            "Program PLC interfaces (triggering, reject mechanisms, line stops) for defective item sorting.",
            "Conduct on-site testing, validation, and calibration on production floors."
        ],
        requirements: [
            "Degree in Computer Vision, Robotics, Electronics, or Computer Science.",
            "Hands-on experience with industrial smart cameras (Cognex, Keyence, Basler, or Hikrobot).",
            "Proficiency in Python/C++ with OpenCV and image processing libraries.",
            "Understanding of optics, lenses, and lighting angles for industrial imaging."
        ],
        niceToHave: [
            "Familiarity with deep learning frameworks (TensorFlow, PyTorch, YOLO).",
            "Experience with PLC communication (Siemens, Omron, Mitsubishi)."
        ]
    },
    {
        id: "technical-support-specialist",
        title: "Customer Support & Hardware Service Specialist",
        department: "Operations & Support",
        location: "Noida / On-Site",
        type: "Full-Time",
        experience: "1 - 3 Years",
        salary: "Industry Standard + Performance Bonuses",
        summary: "Provide rapid technical support, warranty claim diagnostics, printhead maintenance, and repairs for enterprise barcode printers and mobile scanners.",
        tags: ["Hardware Diagnostics", "Customer Support", "Printer Maintenance", "Warranty Operations"],
        responsibilities: [
            "Diagnose, repair, and maintain thermal barcode printers, scanners, and RFID readers.",
            "Manage customer support tickets, warranty status verifications, and spare parts dispatch.",
            "Provide phone, email, and remote desktop support to plant operators and IT administrators.",
            "Maintain comprehensive records of service history and customer satisfaction metrics."
        ],
        requirements: [
            "Diploma or Degree in Hardware & Networking, Electronics, or Information Technology.",
            "Hands-on experience in electronic/hardware troubleshooting and component assembly.",
            "Customer-first attitude with courteous problem-solving communication.",
            "Ability to work in a fast-paced team environment."
        ],
        niceToHave: [
            "Familiarity with thermal ribbon matching, direct thermal vs thermal transfer printing.",
            "Prior service center experience with Zebra/TSC/Honeywell equipment."
        ]
    },
    {
        id: "tech-intern",
        title: "Engineering & IT Solutions Intern",
        department: "Software & IT",
        location: "Noida (Office)",
        type: "Full-Time",
        experience: "0 - 1 Years (Freshers Welcome)",
        salary: "Monthly Stipend + Full-Time PPO Opportunity",
        summary: "Kickstart your career working directly with senior engineers on real-world industrial automation, barcode systems, web portals, and customer rollouts.",
        tags: ["Fresher Friendly", "Web Development", "Hardware Testing", "Fast Learning", "PPO"],
        responsibilities: [
            "Assist senior engineers with device configuration, firmware updates, and barcode template creation.",
            "Contribute to frontend / backend feature development on internal ERP and client management portals.",
            "Perform quality testing and documentation for software and hardware rollouts.",
            "Learn industry-standard AIDC frameworks and supply chain technology protocols."
        ],
        requirements: [
            "Recent graduate or final-year student in B.Tech / BCA / MCA / Diploma in CS/IT/Electronics.",
            "Basic understanding of programming (JavaScript/TypeScript, Python, or C/C++).",
            "High curiosity, enthusiasm to learn hardware-software integration, and strong work ethic.",
            "Good logical reasoning and problem-solving aptitude."
        ],
        niceToHave: [
            "Personal projects or GitHub portfolio showcasing web apps or hardware tinkering.",
            "Good English communication skills."
        ]
    }
];
