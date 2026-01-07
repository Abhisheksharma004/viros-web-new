import React from "react";

export interface ServiceData {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    icon: React.ReactNode;
    image: string;
    gradient: string;
    features: string[];
    benefits: { title: string; description: string }[];
    specifications?: { label: string; value: string }[];
    process: { step: number; title: string; description: string }[];
    faqs: { question: string; answer: string }[];
    brands?: { name: string; logo: string }[];
    products?: { name: string; description: string; image: string; category: string }[];
    useCases?: { industry: string; scenario: string; solution: string }[];
}

export const services: ServiceData[] = [
    {
        id: "hardware",
        title: "Hardware Solutions",
        description: "Premium barcode printers, scanners, and mobile computing devices for industrial and retail environments.",
        longDescription: "Our Hardware Solutions provide robust and reliable AIDC equipment tailored for high-demand environments. From rugged industrial printers capable of 24/7 operation to versatile handheld scanners that streamline inventory management, we partner with leading global brands to ensure you get the best hardware for your specific operational needs. We offer comprehensive installation and configuration services to ensure seamless integration with your existing systems.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
        ),
        features: ["Industrial Label Printers", "Handheld Barcode Scanners", "Mobile Computers (PDA)", "RFID Readers"],
        gradient: "from-[#06b6d4] to-[#06124f]",
        image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        benefits: [
            { title: "Increased Accuracy", description: "Eliminate manual data entry errors with precision scanning and printing." },
            { title: "Durability", description: "Equipment designed to withstand harsh industrial environments, drops, and dust." },
            { title: "Productivity", description: "Faster processing times for inventory audits, shipping, and receiving." },
            { title: "Connectivity", description: "Seamless integration with Wi-Fi, Bluetooth, and 5G networks for real-time data sync." }
        ],
        specifications: [
            { label: "Printer Types", value: "Industrial, Desktop, Mobile, RFID" },
            { label: "Scanner Tech", value: "1D Laser, 2D Imager, DPM" },
            { label: "Connectivity", value: "USB, Ethernet, Wi-Fi 6, Bluetooth 5.0" },
            { label: "Supported Brands", value: "Zebra, Honeywell, TSC, Sato" }
        ],
        brands: [
            { name: "Zebra Technologies", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Zebra_Technologies_logo.svg/320px-Zebra_Technologies_logo.svg.png" },
            { name: "Honeywell", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Honeywell_logo.svg/320px-Honeywell_logo.svg.png" },
            { name: "TSC Printers", logo: "https://www.tscprinters.com/media/wysiwyg/TSC_logo.png" },
            { name: "Sato", logo: "https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png" }
        ],
        products: [
            {
                name: "Zebra ZT411 Industrial Printer",
                description: "High-performance 4-inch industrial printer with 300 dpi resolution, ideal for manufacturing and logistics.",
                image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Industrial Printer"
            },
            {
                name: "Honeywell Granit 1991i Scanner",
                description: "Ultra-rugged 2D imager scanner designed for extreme environments with superior scan performance.",
                image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Barcode Scanner"
            },
            {
                name: "Zebra TC52 Mobile Computer",
                description: "Android-based mobile computer with advanced data capture for retail and field operations.",
                image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Mobile Computer"
            },
            {
                name: "TSC TTP-247 Desktop Printer",
                description: "Compact and affordable desktop thermal printer perfect for small to medium businesses.",
                image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Desktop Printer"
            }
        ],
        useCases: [
            { industry: "Manufacturing", scenario: "Track work-in-progress inventory across production lines", solution: "Deployed Zebra industrial printers and handheld scanners for real-time tracking" },
            { industry: "Retail", scenario: "Streamline checkout and inventory management", solution: "Implemented POS-integrated barcode scanners and mobile computers" },
            { industry: "Logistics", scenario: "Improve warehouse picking accuracy and speed", solution: "Provided rugged mobile computers with voice-directed picking software" }
        ],
        process: [
            { step: 1, title: "Assessment", description: "We evaluate your current workflow and environmental conditions." },
            { step: 2, title: "Selection", description: "Recommending the best hardware mix for your specific budget and needs." },
            { step: 3, title: "Deployment", description: "On-site installation, configuration, and network integration." },
            { step: 4, title: "Training", description: "Hands-on training for your staff on device operation and basic troubleshooting." }
        ],
        faqs: [
            { question: "What warranty comes with the hardware?", answer: "Most devices come with a standard 1-3 year manufacturer warranty. We also offer extended comprehensive coverage." },
            { question: "Can these devices integrate with my ERP?", answer: "Yes, our hardware is compatible with SAP, Oracle, Microsoft Dynamics, and most custom ERPs via standard drivers and APIs." },
            { question: "Do you provide demo units for testing?", answer: "Absolutely! We offer free demo units for qualified businesses to test in their actual working environment before purchase." }
        ]
    },
    {
        id: "software",
        title: "Software Solutions",
        description: "Custom software for inventory management, asset tracking, and point-of-sale integration.",
        longDescription: "Unlock the power of data with our custom Software Solutions. We design and develop intelligent software platforms that give you real-time visibility into your inventory, assets, and sales. Whether you need a standalone WMS or a module that integrates with your ERP, our software team builds scalable, user-friendly applications that drive efficiency and reduce error rates across your supply chain.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        features: ["Inventory Management System", "Asset Tracking Software", "Warehouse Management (WMS)", "Custom Integration APIs"],
        gradient: "from-[#06124f] to-[#06b6d4]",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        benefits: [
            { title: "Real-time Visibility", description: "Track stock levels, location, and movement in real-time." },
            { title: "Automated Reporting", description: "Generate detailed reports on stock aging, turnover, and discrepancies." },
            { title: "Scalability", description: "Cloud-based architecture that grows with your business needs." },
            { title: "User-Friendly Interface", description: "Intuitive designs that require minimal training for warehouse staff." }
        ],
        specifications: [
            { label: "Deployment", value: "Cloud (AWS/Azure) or On-Premise" },
            { label: "Compatibility", value: "Windows, Android, iOS, Web" },
            { label: "Database", value: "SQL Server, PostgreSQL, MongoDB" },
            { label: "Integration", value: "REST APIs, SOAP, Webhooks" }
        ],
        brands: [
            { name: "Microsoft Azure", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/320px-Microsoft_Azure.svg.png" },
            { name: "Amazon Web Services", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/320px-Amazon_Web_Services_Logo.svg.png" },
            { name: "SAP", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/320px-SAP_2011_logo.svg.png" },
            { name: "Oracle", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/320px-Oracle_logo.svg.png" }
        ],
        products: [
            {
                name: "VirosTrack WMS",
                description: "Complete warehouse management system with bin location tracking, pick-pack-ship workflows, and real-time dashboards.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Warehouse Management"
            },
            {
                name: "AssetGuard Pro",
                description: "Enterprise asset tracking solution with RFID integration, depreciation tracking, and maintenance scheduling.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Asset Management"
            },
            {
                name: "RetailSync POS",
                description: "Modern point-of-sale system with inventory sync, customer loyalty programs, and multi-store support.",
                image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Point of Sale"
            },
            {
                name: "Custom API Gateway",
                description: "Middleware solution for seamless integration between legacy systems and modern cloud applications.",
                image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Integration"
            }
        ],
        useCases: [
            { industry: "E-commerce", scenario: "Sync inventory across multiple sales channels", solution: "Built custom API integration connecting Shopify, Amazon, and internal WMS" },
            { industry: "Healthcare", scenario: "Track medical equipment and supplies across facilities", solution: "Developed RFID-based asset tracking system with compliance reporting" },
            { industry: "Distribution", scenario: "Optimize warehouse picking routes and reduce errors", solution: "Implemented WMS with AI-powered route optimization and voice picking" }
        ],
        process: [
            { step: 1, title: "Requirement Gathering", description: "Detailed sessions to understand your business logic and pain points." },
            { step: 2, title: "Prototyping", description: "Creating clickable prototypes to visualize the solution before coding." },
            { step: 3, title: "Development", description: "Agile development with regular feedback loops and testing." },
            { step: 4, title: "Go-Live & Support", description: "Smooth deployment with post-launch hypercare and updates." }
        ],
        faqs: [
            { question: "Is the software customizable?", answer: "Absolutely. We build solutions from the ground up or customize existing modules to fit your exact workflow." },
            { question: "Is my data secure?", answer: "We implement industry-standard encryption, role-based access control, and regular backups to ensure data security." },
            { question: "What is the typical development timeline?", answer: "Depending on complexity, projects range from 2-6 months. We provide detailed timelines after requirement analysis." }
        ]
    },
    {
        id: "consumables",
        title: "Consumables",
        description: "High-quality thermal transfer ribbons and labels designed for durability and print clarity.",
        longDescription: "The quality of your labels and ribbons directly impacts the readability and longevity of your barcodes. We supply a wide range of consumables including Chromo paper labels, TT ribbons (Wax, Wax-Resin, Resin), and specialized asset tags for extreme environments. Our consumables are tested for compatibility with all major printer brands to ensure consistent, high-quality print output.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
        ),
        features: ["Thermal Transfer Ribbons", "Direct Thermal Labels", "Polyester & Asset Tags", "Custom Pre-printed Labels"],
        gradient: "from-[#06b6d4] via-[#06124f] to-[#06b6d4]",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        benefits: [
            { title: "Print Clarity", description: "High-contrast printing for 100% scan rates." },
            { title: "Longevity", description: "Labels that resist fading, scratching, and chemical exposure." },
            { title: "Printhead Protection", description: "Premium ribbons that extend the life of your thermal printheads." },
            { title: "Customization", description: "Any size, color, or pre-printed logo available on request." }
        ],
        specifications: [
            { label: "Label Materials", value: "Paper, Polyester, Polypropylene, Vinyl" },
            { label: "Ribbon Types", value: "Wax, Wax-Resin, Full Resin" },
            { label: "Core Sizes", value: "0.5 inch, 1 inch, 3 inch" },
            { label: "Adhesives", value: "Permanent, Removable, Freezer-grade" }
        ],
        products: [
            {
                name: "Premium Wax Ribbons",
                description: "Cost-effective ribbons for standard paper labels. Ideal for shipping labels and general-purpose applications.",
                image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Thermal Ribbon"
            },
            {
                name: "Wax-Resin Hybrid Ribbons",
                description: "Enhanced durability for synthetic labels. Perfect for product labeling and outdoor use.",
                image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Thermal Ribbon"
            },
            {
                name: "Polyester Asset Tags",
                description: "Ultra-durable tags for IT assets, machinery, and equipment. Resistant to chemicals and extreme temperatures.",
                image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Asset Tag"
            },
            {
                name: "Custom Pre-printed Labels",
                description: "Labels with your logo, warning symbols, or fixed text. Available in rolls or sheets.",
                image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Custom Label"
            }
        ],
        useCases: [
            { industry: "Food & Beverage", scenario: "Labels for freezer storage and cold chain", solution: "Supplied freezer-grade adhesive labels with resin ribbons" },
            { industry: "Automotive", scenario: "Durable part identification labels", solution: "Provided polyester labels with chemical-resistant coating" },
            { industry: "Pharmaceuticals", scenario: "Compliance labeling with variable data", solution: "Custom pre-printed labels with thermal overprinting capability" }
        ],
        process: [
            { step: 1, title: "Sample Testing", description: "We provide samples to test adhesion and print durability in your environment." },
            { step: 2, title: "Quotation", description: "Competitive pricing based on volume and specifications." },
            { step: 3, title: "Production", description: "Precision manufacturing with strict quality control checks." },
            { step: 4, title: "Delivery", description: "Timely delivery with options for scheduled restocking." }
        ],
        faqs: [
            { question: "What ribbon should I use for glossy labels?", answer: "For glossy synthetic labels (like polyester), a Resin ribbon is required for durability and smudge resistance." },
            { question: "Do you offer minimum order quantities?", answer: "We support businesses of all sizes, but bulk orders attract significant volume discounts." },
            { question: "Can I get custom sizes?", answer: "Yes! We manufacture labels in any custom size, shape, and color to meet your exact requirements." }
        ]
    },
    {
        id: "support",
        title: "Support & Maintenance",
        description: "Comprehensive after-sales support, annual maintenance contracts (AMC), and on-site repairs.",
        longDescription: "Downtime costs money. Our Support & Maintenance services are designed to keep your operations running smoothly. We offer flexible Annual Maintenance Contracts (AMC), rapid response on-site repair, and remote troubleshooting. Our certified technicians are experts in diagnosing and fixing issues with barcode printers, scanners, and mobile computers, extending the lifecycle of your hardware investment.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        features: ["Annual Maintenance Contracts", "On-site Installation", "Printer Repair Services", "Remote Technical Support"],
        gradient: "from-[#06124f] via-[#06b6d4] to-[#06124f]",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        benefits: [
            { title: "Minimized Downtime", description: "Quick turnaround times on repairs to keep your business moving." },
            { title: "Predictable Costs", description: "Fixed-cost AMC plans eliminate surprise repair bills." },
            { title: "Expertise", description: "Access to factory-trained technicians with genuine spare parts." },
            { title: "Lifecycle Management", description: "Advice on when to repair versus when to upgrade aging equipment." }
        ],
        specifications: [
            { label: "Response Time", value: "4-24 Hours (Depending on SLA)" },
            { label: "Coverage Area", value: "Pan-India On-site Support" },
            { label: "Support Channels", value: "Phone, Email, Remote Desktop, On-site" },
            { label: "Spare Parts", value: "100% Genuine OEM Parts" }
        ],
        brands: [
            { name: "Zebra Certified", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Zebra_Technologies_logo.svg/320px-Zebra_Technologies_logo.svg.png" },
            { name: "Honeywell Authorized", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Honeywell_logo.svg/320px-Honeywell_logo.svg.png" },
            { name: "TSC Partner", logo: "https://www.tscprinters.com/media/wysiwyg/TSC_logo.png" },
            { name: "Sato Certified", logo: "https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png" }
        ],
        products: [
            {
                name: "Basic AMC Plan",
                description: "Annual preventive maintenance with priority support. Excludes spare parts.",
                image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Service Plan"
            },
            {
                name: "Comprehensive AMC",
                description: "All-inclusive plan covering labor, parts, and unlimited service calls.",
                image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Service Plan"
            },
            {
                name: "On-Demand Repair",
                description: "Pay-per-incident repair service with 24-48 hour response time.",
                image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Service Plan"
            },
            {
                name: "Remote Support Package",
                description: "Unlimited remote troubleshooting and software updates for your devices.",
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Service Plan"
            }
        ],
        useCases: [
            { industry: "Manufacturing", scenario: "24/7 production line with zero tolerance for downtime", solution: "Deployed comprehensive AMC with 4-hour on-site response guarantee" },
            { industry: "Retail Chain", scenario: "Multi-location POS and printer support", solution: "Centralized helpdesk with regional technician network" },
            { industry: "Logistics", scenario: "Fleet of mobile computers requiring regular maintenance", solution: "Quarterly preventive maintenance visits with swap device program" }
        ],
        process: [
            { step: 1, title: "Issue Logging", description: "Log a ticket via our portal or hotline." },
            { step: 2, title: "Diagnosis", description: "Initial remote diagnosis to identify the problem." },
            { step: 3, title: "Resolution", description: "On-site visit by an engineer or instructions for ship-in repair." },
            { step: 4, title: "Verification", description: "Testing the verified device and closing the ticket." }
        ],
        faqs: [
            { question: "What is covered under AMC?", answer: "Our standard AMC covers all service charges and routine preventative maintenance. Spare parts can be included in comprehensive plans." },
            { question: "Do you repair discontinued models?", answer: "Yes, subject to spare parts availability. We try our best to keep your legacy systems running." },
            { question: "Can I upgrade my AMC plan mid-year?", answer: "Absolutely! You can upgrade from Basic to Comprehensive at any time with prorated pricing." }
        ]
    },
    {
        id: "rental",
        title: "Laptop & Desktop Rental",
        description: "Scale your workforce instantly with our flexible high-performance IT equipment rental solutions.",
        longDescription: "Avoid heavy capital expenditure with our IT Rental Services. Whether you need equipment for a short-term project, a training event, or to scale up for peak season, we provide high-performance Laptops, Desktops, Servers, and Workstations on flexible rental terms. All equipment is quality-tested, pre-configured to your specifications, and supported by our 24/7 replacement guarantee.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        features: ["Short & Long-term Rentals", "Workstations & Servers", "MacBooks & Windows Laptops", "24/7 Replacement Support"],
        gradient: "from-[#06b6d4] to-[#06124f]",
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        benefits: [
            { title: "Capital Conservation", description: "Shift from CAPEX to OPEX and free up cash flow." },
            { title: "Flexibility", description: "Scale up or down instantly based on project demands." },
            { title: "Latest Tech", description: "Access the newest processors and hardware without buying." },
            { title: "Zero Maintenance", description: "We handle all maintenance and replacements during the rental period." }
        ],
        specifications: [
            { label: "Rental Terms", value: "Daily, Weekly, Monthly, Yearly" },
            { label: "Inventory", value: "HP, Dell, Lenovo, Apple" },
            { label: "OS Options", value: "Windows 10/11 Pro, MacOS, Linux" },
            { label: "Setup", value: "Pre-installed Custom Software Images" }
        ],
        brands: [
            { name: "HP", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/320px-HP_logo_2012.svg.png" },
            { name: "Dell", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/320px-Dell_Logo.svg.png" },
            { name: "Lenovo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/320px-Lenovo_logo_2015.svg.png" },
            { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/160px-Apple_logo_black.svg.png" }
        ],
        products: [
            {
                name: "Dell Latitude 5430 Laptop",
                description: "14-inch business laptop with Intel i5, 16GB RAM, 512GB SSD. Perfect for office work and remote teams.",
                image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Laptop"
            },
            {
                name: "HP EliteDesk 800 Desktop",
                description: "Compact desktop workstation with Intel i7, 32GB RAM, ideal for CAD and design work.",
                image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Desktop"
            },
            {
                name: "MacBook Pro 14-inch",
                description: "M3 Pro chip, 18GB RAM, 512GB SSD. For creative professionals and developers.",
                image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Laptop"
            },
            {
                name: "Lenovo ThinkStation P360",
                description: "Professional workstation for engineering, 3D rendering, and data analysis.",
                image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                category: "Workstation"
            }
        ],
        useCases: [
            { industry: "IT Services", scenario: "Temporary workforce for a 6-month project", solution: "Rented 50 laptops with pre-configured VPN and security software" },
            { industry: "Education", scenario: "Computer lab setup for training program", solution: "Provided 30 desktops on 3-month rental with educational software" },
            { industry: "Events", scenario: "Registration kiosks for a 3-day conference", solution: "Supplied tablets and laptops with custom event management software" }
        ],
        process: [
            { step: 1, title: "Requirement", description: "Specify configuration, quantity, and duration." },
            { step: 2, title: "Proposal", description: "We offer the best commercial quote and terms." },
            { step: 3, title: "Delivery", description: "Equipment delivered and set up at your location." },
            { step: 4, title: "Pickup", description: "Hassle-free pickup at the end of the rental term." }
        ],
        faqs: [
            { question: "Is there a security deposit?", answer: "A refundable security deposit is typically required for new clients, based on the equipment value." },
            { question: "What happens if a laptop stops working?", answer: "We provide an immediate free replacement to ensure zero productive hours are lost." },
            { question: "Can I extend my rental period?", answer: "Yes! You can extend your rental at any time. Just contact us 48 hours before the end date." }
        ]
    }
];
