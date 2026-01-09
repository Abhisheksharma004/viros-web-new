"use client";

import { useState } from "react";

export default function AboutManagementPage() {
    const [aboutData, setAboutData] = useState({
        title: "About VIROS Entrepreneurs",
        subtitle: "Leading provider of barcode solutions",
        description: "VIROS Entrepreneurs has been at the forefront of providing comprehensive AIDC (Automatic Identification and Data Capture) solutions for over a decade. We specialize in barcode label printers, handheld scanners, mobile devices, and custom software solutions.",
        mission: "To empower businesses with cutting-edge identification and data capture technology that drives efficiency and accuracy.",
        vision: "To be the most trusted partner for AIDC solutions across India and beyond.",
        yearEstablished: "2010",
        teamSize: "50+",
        clientsServed: "500+",
        projectsCompleted: "1000+"
    });

    const [values, setValues] = useState([
        { id: 1, title: "Innovation", description: "Constantly evolving with the latest technology", icon: "💡" },
        { id: 2, title: "Quality", description: "Delivering excellence in every solution", icon: "⭐" },
        { id: 3, title: "Customer Focus", description: "Your success is our priority", icon: "🎯" },
        { id: 4, title: "Integrity", description: "Honest and transparent in all dealings", icon: "🤝" }
    ]);

    const [milestones, setMilestones] = useState([
        { id: 1, year: "2010", title: "Company Founded", description: "Started with a vision to transform AIDC industry" },
        { id: 2, year: "2015", title: "Expanded Operations", description: "Opened offices in 5 major cities" },
        { id: 3, year: "2020", title: "Digital Transformation", description: "Launched cloud-based solutions" },
        { id: 4, year: "2024", title: "Industry Leader", description: "Recognized as top AIDC solution provider" }
    ]);

    const handleSave = () => {
        alert("About page content saved successfully!");
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">About Page Management</h1>
                    <p className="text-gray-600 mt-1">Manage your company information and story</p>
                </div>
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                    Save Changes
                </button>
            </div>

            {/* Main Content Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Main Content</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                            <input
                                type="text"
                                value={aboutData.title}
                                onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                            <input
                                type="text"
                                value={aboutData.subtitle}
                                onChange={(e) => setAboutData({ ...aboutData, subtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={aboutData.description}
                                onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* Mission & Vision */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Mission & Vision</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
                            <textarea
                                value={aboutData.mission}
                                onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vision Statement</label>
                            <textarea
                                value={aboutData.vision}
                                onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* Statistics */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Company Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
                            <input
                                type="text"
                                value={aboutData.yearEstablished}
                                onChange={(e) => setAboutData({ ...aboutData, yearEstablished: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                            <input
                                type="text"
                                value={aboutData.teamSize}
                                onChange={(e) => setAboutData({ ...aboutData, teamSize: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Clients Served</label>
                            <input
                                type="text"
                                value={aboutData.clientsServed}
                                onChange={(e) => setAboutData({ ...aboutData, clientsServed: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Projects Completed</label>
                            <input
                                type="text"
                                value={aboutData.projectsCompleted}
                                onChange={(e) => setAboutData({ ...aboutData, projectsCompleted: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Core Values</h2>
                    <button className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-colors">
                        Add Value
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {values.map((value) => (
                        <div key={value.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#06b6d4] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-3xl">{value.icon}</span>
                                <div className="flex space-x-2">
                                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{value.title}</h3>
                            <p className="text-sm text-gray-600">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Company Milestones */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Company Milestones</h2>
                    <button className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-colors">
                        Add Milestone
                    </button>
                </div>
                <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex items-start space-x-4 border-l-4 border-[#06b6d4] pl-4 py-2">
                            <div className="flex-shrink-0 w-16 text-center">
                                <span className="text-2xl font-bold text-[#06b6d4]">{milestone.year}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">{milestone.title}</h3>
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
