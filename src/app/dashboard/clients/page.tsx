"use client";

export default function ClientsPage() {
    const clients = [
        { id: 1, name: "Client A", logo: "🏢", status: "Active" },
        { id: 2, name: "Client B", logo: "🏭", status: "Active" },
        { id: 3, name: "Client C", logo: "🏪", status: "Active" },
        { id: 4, name: "Client D", logo: "🏬", status: "Active" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clients Management</h1>
                    <p className="text-gray-600 mt-1">Manage client logos and information</p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg">
                    Add Client
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {clients.map((client) => (
                    <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-all group">
                        <div className="text-6xl mb-3">{client.logo}</div>
                        <h3 className="font-medium text-gray-900 mb-2">{client.name}</h3>
                        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
    );
}
