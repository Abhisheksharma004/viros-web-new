"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Calendar, Gift, Loader2, Bell, User, Mail, Eye, History, Clock } from 'lucide-react';

interface Birthday {
    id?: number;
    name: string;
    date: string; // Format: YYYY-MM-DD
    phone?: string;
    email?: string;
    notes?: string;
    is_active: boolean;
}

interface EmailHistory {
    id: number;
    recipient_email: string;
    recipient_name: string;
    sent_at: string;
    status: 'sent' | 'failed' | 'pending';
    message_id: string;
    error_message?: string;
    celebration_time: string;
    department: string;
}

export default function BirthdayRemainderPage() {
    const [birthdays, setBirthdays] = useState<Birthday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
    const [formData, setFormData] = useState<Birthday>({
        name: '',
        date: '',
        phone: '',
        email: '',
        notes: '',
        is_active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all');
    const [error, setError] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedBirthdayForHistory, setSelectedBirthdayForHistory] = useState<Birthday | null>(null);
    const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

    useEffect(() => {
        fetchBirthdays();
    }, []);

    const fetchBirthdays = async () => {
        try {
            const res = await fetch('/api/birthdays');
            if (!res.ok) {
                const errorData = await res.json();
                if (errorData.code === 'TABLE_NOT_FOUND') {
                    setError('Database table not found. Please run: node run_birthday_migration.js');
                } else {
                    setError('Failed to fetch birthdays. Please check your database connection.');
                }
                setBirthdays([]);
                return;
            }
            const data = await res.json();
            // Ensure data is an array before setting
            setBirthdays(Array.isArray(data) ? data : []);
            setError(null);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
            setError('Unable to connect to the server. Please try again.');
            // Set empty array if API doesn't exist or fails
            setBirthdays([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (birthday?: Birthday) => {
        if (birthday) {
            setEditingBirthday(birthday);
            setFormData({
                ...birthday,
                phone: birthday.phone || '',
                email: birthday.email || '',
                notes: birthday.notes || ''
            });
        } else {
            setEditingBirthday(null);
            setFormData({
                name: '',
                date: '',
                phone: '',
                email: '',
                notes: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBirthday(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingBirthday
                ? `/api/birthdays/${editingBirthday.id}`
                : '/api/birthdays';
            const method = editingBirthday ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchBirthdays();
                handleCloseModal();
            } else {
                const errorData = await res.json();
                if (errorData.code === 'TABLE_NOT_FOUND') {
                    setError('Database table not found. Please run: node run_birthday_migration.js');
                } else {
                    alert('Failed to save birthday. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error saving birthday:', error);
            alert('Failed to save birthday. Please check your connection.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this birthday reminder?')) return;
        try {
            const res = await fetch(`/api/birthdays/${id}`, { method: 'DELETE' });
            if (res.ok) {
                // Refresh the list from server to ensure consistency
                await fetchBirthdays();
                alert('Birthday deleted successfully!');
            } else {
                const errorData = await res.json();
                alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting birthday:', error);
            alert('Failed to delete birthday. Please check your connection.');
        }
    };

    const toggleActive = async (id: number, is_active: boolean) => {
        try {
            const res = await fetch(`/api/birthdays/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !is_active }),
            });
            if (res.ok) {
                fetchBirthdays();
            }
        } catch (error) {
            console.error('Error toggling active status:', error);
        }
    };

    const handleSendBirthdayEmail = async (birthday: Birthday) => {
        if (!birthday.email) {
            alert('❌ This person does not have an email address in the system.\n\nPlease add their email address first.');
            return;
        }

        const confirmed = confirm(`Send birthday wishes email to ${birthday.name} (${birthday.email})?`);
        if (!confirmed) return;

        try {
            const response = await fetch('/api/send-birthday-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: birthday.email,
                    name: birthday.name,
                    celebrationTime: '3:00 PM',
                    department: 'VIROS Team',
                    birthdayId: birthday.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Birthday email sent successfully to ${birthday.name}! 🎉`);
                // Refresh history if modal is open
                if (isHistoryModalOpen && selectedBirthdayForHistory?.id === birthday.id) {
                    fetchEmailHistory(birthday.id!);
                }
            } else {
                alert(`❌ Failed to send email:\n${data.error || 'Unknown error'}\n\n${data.details || ''}`);
            }
        } catch (error) {
            console.error('Error sending birthday email:', error);
            alert('❌ Failed to send birthday email. Please check your connection.');
        }
    };

    const handlePreviewEmail = async (birthday: Birthday) => {
        try {
            const response = await fetch('/api/preview-birthday-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: birthday.name,
                    celebrationTime: '3:00 PM',
                    department: 'VIROS Team'
                })
            });

            if (response.ok) {
                const html = await response.text();
                const newWindow = window.open('', '_blank', 'width=800,height=600');
                if (newWindow) {
                    newWindow.document.write(html);
                    newWindow.document.close();
                    setPreviewWindow(newWindow);
                }
            } else {
                alert('Failed to generate preview');
            }
        } catch (error) {
            console.error('Error previewing email:', error);
            alert('Failed to preview email');
        }
    };

    const fetchEmailHistory = async (birthdayId: number) => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`/api/birthday-email-history/${birthdayId}`);
            if (response.ok) {
                const data = await response.json();
                setEmailHistory(Array.isArray(data) ? data : []);
            } else {
                const errorData = await response.json();
                if (errorData.code === 'TABLE_NOT_FOUND') {
                    alert('⚠️ Email history table not found.\n\nPlease run: node run_birthday_email_history_migration.js');
                }
                setEmailHistory([]);
            }
        } catch (error) {
            console.error('Error fetching email history:', error);
            setEmailHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewHistory = async (birthday: Birthday) => {
        if (!birthday.id) return;
        setSelectedBirthdayForHistory(birthday);
        setIsHistoryModalOpen(true);
        await fetchEmailHistory(birthday.id);
    };

    const handleCloseHistory = () => {
        setIsHistoryModalOpen(false);
        setSelectedBirthdayForHistory(null);
        setEmailHistory([]);
    };

    // Calculate days until birthday
    const getDaysUntilBirthday = (dateString: string) => {
        const today = new Date();
        const birthDate = new Date(dateString);
        
        // Set the year to current/next year
        const currentYear = today.getFullYear();
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        
        let daysUntil: number;
        if (thisYearBirthday >= today) {
            daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        } else {
            const nextYearBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
            daysUntil = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        return daysUntil;
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // Filter birthdays
    const filteredBirthdays = (Array.isArray(birthdays) ? birthdays : []).filter(birthday => {
        if (filter === 'all') return true;
        const daysUntil = getDaysUntilBirthday(birthday.date);
        if (filter === 'today') return daysUntil === 0;
        if (filter === 'upcoming') return daysUntil <= 30 && daysUntil > 0;
        return true;
    }).sort((a, b) => getDaysUntilBirthday(a.date) - getDaysUntilBirthday(b.date));

    const upcomingCount = (Array.isArray(birthdays) ? birthdays : []).filter(b => {
        const days = getDaysUntilBirthday(b.date);
        return days <= 30 && days > 0;
    }).length;

    const todayCount = (Array.isArray(birthdays) ? birthdays : []).filter(b => getDaysUntilBirthday(b.date) === 0).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-8 h-8 text-[#06b6d4]" />
                                Birthday Reminders
                            </h1>
                            <p className="text-gray-600 mt-2">Manage and track important birthdays</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-[#06b6d4] text-white px-6 py-3 rounded-lg hover:bg-[#0891b2] 
                                     transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Birthday
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ Database Table Missing</h3>
                                <p className="text-sm text-yellow-700 mb-4">
                                    The <code className="bg-yellow-100 px-2 py-1 rounded">birthdays</code> table needs to be created in your database.
                                </p>
                                
                                <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-3">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="bg-yellow-400 text-white px-2 py-1 rounded-full text-xs">EASY FIX</span>
                                        3 Simple Steps:
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                        <li>
                                            Open <a href="http://localhost/phpmyadmin" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">phpMyAdmin</a>
                                        </li>
                                        <li>Select database <code className="bg-gray-100 px-2 py-0.5 rounded">viros_web_new</code> from left sidebar</li>
                                        <li>Click <strong>SQL</strong> tab and paste this code:</li>
                                    </ol>
                                    
                                    <div className="mt-3 relative">
                                        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64">
{`DROP TABLE IF EXISTS birthdays;

CREATE TABLE birthdays (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_birthdays_date (date),
  KEY idx_birthdays_active (is_active)
) ENGINE=InnoDB;`}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                const sql = `DROP TABLE IF EXISTS birthdays;\n\nCREATE TABLE birthdays (\n  id INT NOT NULL AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL,\n  date DATE NOT NULL,\n  phone VARCHAR(50) DEFAULT NULL,\n  email VARCHAR(255) DEFAULT NULL,\n  notes TEXT DEFAULT NULL,\n  is_active TINYINT(1) DEFAULT 1,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  PRIMARY KEY (id),\n  KEY idx_birthdays_date (date),\n  KEY idx_birthdays_active (is_active)\n) ENGINE=InnoDB;`;
                                                navigator.clipboard.writeText(sql);
                                                alert('✅ SQL copied to clipboard! Now paste it in phpMyAdmin.');
                                            }}
                                            className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                                        >
                                            📋 Copy SQL
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => window.open('http://localhost/phpmyadmin', '_blank')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open phpMyAdmin
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setError(null);
                                            fetchBirthdays();
                                        }}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                                    >
                                        ✓ Done! Check Again
                                    </button>
                                </div>

                                <p className="text-xs text-yellow-600 mt-3">
                                    💡 <strong>Tip:</strong> The SQL is also saved in <code>setup_birthdays_table.sql</code> in your project root.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Birthdays</p>
                                <p className="text-3xl font-bold text-gray-900">{Array.isArray(birthdays) ? birthdays.length : 0}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Today</p>
                                <p className="text-3xl font-bold text-green-600">{todayCount}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <Gift className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Next 30 Days</p>
                                <p className="text-3xl font-bold text-orange-600">{upcomingCount}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Bell className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'all'
                                    ? 'bg-[#06b6d4] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Birthdays
                        </button>
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'today'
                                    ? 'bg-[#06b6d4] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Today ({todayCount})
                        </button>
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'upcoming'
                                    ? 'bg-[#06b6d4] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                    </div>
                </div>

                {/* Birthdays List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" />
                        </div>
                    ) : filteredBirthdays.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No birthdays found</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="mt-4 text-[#06b6d4] hover:underline"
                            >
                                Add your first birthday
                            </button>
                        </div>
                    ) : (
                        <div>
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="w-[25%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Name
                                        </th>
                                        <th className="w-[13%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Birthday
                                        </th>
                                        <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Days Until
                                        </th>
                                        <th className="w-[22%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Contact
                                        </th>
                                        <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredBirthdays.map((birthday) => {
                                        const daysUntil = getDaysUntilBirthday(birthday.date);
                                        return (
                                            <tr key={birthday.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center">
                                                        <div className="shrink-0 h-9 w-9 bg-[#06b6d4] rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">
                                                                {birthday.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3 overflow-hidden">
                                                            <div className="text-sm font-medium text-gray-900 truncate" title={birthday.name}>
                                                                {birthday.name}
                                                            </div>
                                                            {birthday.notes && (
                                                                <div className="text-xs text-gray-500 truncate" title={birthday.notes}>
                                                                    {birthday.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-gray-900">
                                                    {new Date(birthday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {daysUntil === 0 ? (
                                                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            Today! 🎉
                                                        </span>
                                                    ) : daysUntil === 1 ? (
                                                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                            Tomorrow
                                                        </span>
                                                    ) : daysUntil <= 7 ? (
                                                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            {daysUntil} Days - Soon!
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            {daysUntil} Days - Soon!
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-gray-500">
                                                    {birthday.phone && <div className="truncate" title={birthday.phone}>📞 {birthday.phone}</div>}
                                                    {birthday.email && <div className="truncate" title={birthday.email}>✉️ {birthday.email}</div>}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button
                                                        onClick={() => toggleActive(birthday.id!, birthday.is_active)}
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            birthday.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {birthday.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-1.5">
                                                        {birthday.email && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePreviewEmail(birthday)}
                                                                    className="text-purple-600 hover:text-purple-800"
                                                                    title="Preview email"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendBirthdayEmail(birthday)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                    title="Send birthday email"
                                                                >
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleViewHistory(birthday)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="View email history"
                                                        >
                                                            <History className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenModal(birthday)}
                                                            className="text-[#06b6d4] hover:text-[#0891b2]"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(birthday.id!)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingBirthday ? 'Edit Birthday' : 'Add Birthday'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Birthday Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none resize-none"
                                    placeholder="Add any notes or reminders"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-[#06b6d4] border-gray-300 rounded focus:ring-[#06b6d4]"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Active (receive reminders)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                                             hover:bg-gray-50 transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#06b6d4] text-white rounded-lg 
                                             hover:bg-[#0891b2] transition-colors flex items-center justify-center gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSaving ? 'Saving...' : editingBirthday ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-6 h-6 text-blue-600" />
                                    Email History
                                </h2>
                                {selectedBirthdayForHistory && (
                                    <p className="text-gray-600 mt-1">
                                        {selectedBirthdayForHistory.name} ({selectedBirthdayForHistory.email})
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleCloseHistory}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" />
                            </div>
                        ) : emailHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No emails sent yet</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Email history will appear here once you start sending birthday wishes
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {emailHistory.map((history) => (
                                    <div
                                        key={history.id}
                                        className={`border rounded-lg p-4 ${
                                            history.status === 'sent'
                                                ? 'border-green-200 bg-green-50'
                                                : history.status === 'failed'
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            history.status === 'sent'
                                                                ? 'bg-green-100 text-green-800'
                                                                : history.status === 'failed'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {history.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-sm text-gray-600 flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(history.sent_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    <strong>To:</strong> {history.recipient_email}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <strong>Department:</strong> {history.department}
                                                </p>
                                                {history.message_id && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Message ID: {history.message_id}
                                                    </p>
                                                )}
                                                {history.error_message && (
                                                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                                                        <strong>Error:</strong> {history.error_message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleCloseHistory}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
