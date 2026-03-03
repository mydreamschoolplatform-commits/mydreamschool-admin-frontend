import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { Search, Filter, MessageSquare, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSupportPage = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        let result = tickets;
        if (statusFilter !== 'All') {
            result = result.filter(t => t.status === statusFilter);
        }
        if (categoryFilter !== 'All') {
            result = result.filter(t => t.category === categoryFilter);
        }
        setFilteredTickets(result);
    }, [tickets, statusFilter, categoryFilter]);

    const fetchTickets = async () => {
        try {
            const res = await client.get('/support/admin/all');
            setTickets(res.data);
            setFilteredTickets(res.data);
        } catch (err) {
            console.error("Error fetching tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !selectedTicket) return;

        try {
            const res = await client.post(`/support/${selectedTicket._id}/reply`, { message: replyMessage });
            // Update local state
            const updatedTicket = res.data;
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            setSelectedTicket(updatedTicket);
            setReplyMessage('');
        } catch (err) {
            alert('Failed to send reply');
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTicket) return;
        try {
            const res = await client.patch(`/support/${selectedTicket._id}/status`, { status: newStatus });
            const updatedTicket = res.data;
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            setSelectedTicket(updatedTicket); // Update view
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (e, ticketId) => {
        e.stopPropagation(); // Prevent selection
        if (!window.confirm("Are you sure you want to delete this resolved ticket? This action cannot be undone.")) return;

        try {
            await client.delete(`/support/admin/${ticketId}`);
            setTickets(prev => prev.filter(t => t._id !== ticketId));
            if (selectedTicket?._id === ticketId) {
                setSelectedTicket(null);
            }
        } catch (err) {
            console.error("Delete Error", err);
            alert('Failed to delete ticket');
        }
    };

    // If Teacher tries to access (though middleware blocks, UI should also block)
    if (user && user.role === 'Teacher') {
        return <div className="p-8 text-center text-red-500">Access Denied: Teachers cannot access Support Desk.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Support Desk</h1>
                <div className="flex gap-2">
                    <select
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                    <select
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        <option value="Payment">Payment</option>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Account Access">Account Access</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket List */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
                        All Tickets ({filteredTickets.length})
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {loading && <p className="p-4 text-gray-500">Loading...</p>}
                        {!loading && filteredTickets.length === 0 && <p className="p-4 text-gray-500 text-sm">No tickets found.</p>}

                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                                    ${selectedTicket?._id === ticket._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase
                                        ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">{ticket.category}</h4>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 truncate">{ticket.studentId?.fullName || 'Unknown Student'} • {ticket.ticketId}</p>
                                    {ticket.status === 'Resolved' && (
                                        <button
                                            onClick={(e) => handleDelete(e, ticket._id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete Ticket"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 h-[calc(100vh-200px)] flex flex-col">
                    {selectedTicket ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900">{selectedTicket.category}</h2>
                                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{selectedTicket.ticketId}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Reported by
                                        <Link
                                            to={`/students/${selectedTicket.studentId?._id}`}
                                            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline ml-1"
                                            title="View Student Profile"
                                        >
                                            {selectedTicket.studentId?.fullName}
                                        </Link>
                                        {selectedTicket.studentId?.class && ` (${selectedTicket.studentId.class})`}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Status:</label>
                                    <select
                                        className="text-sm border-gray-300 rounded-md p-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                                {/* Original Issue */}
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <p className="text-xs font-bold text-red-800 mb-2 uppercase tracking-wide">Original Issue</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                                    {selectedTicket.image && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Attachment</p>
                                            <img src={selectedTicket.image} alt="Issue Attachment" loading="lazy" className="max-w-xs rounded border border-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* History Loop */}
                                {selectedTicket.history.map((item, idx) => (
                                    <div key={idx} className={`flex ${item.senderRole === 'Student' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-lg text-sm shadow-sm
                                            ${item.senderRole === 'Student' ? 'bg-gray-100 text-gray-800 rounded-tl-none' : 'bg-indigo-50 text-indigo-900 rounded-tr-none border border-indigo-100'}`}>
                                            <div className="flex justify-between items-center mb-1 gap-4">
                                                <span className="font-bold text-xs opacity-70">{item.senderRole === 'Student' ? selectedTicket.studentId?.fullName : 'Admin Staff'}</span>
                                                <span className="text-[10px] opacity-50">{new Date(item.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div className="whitespace-pre-wrap">{item.message}</div>
                                            {item.action !== 'Reply' && <div className="mt-2 text-[10px] italic opacity-60 bg-black/5 p-1 rounded inline-block">{item.action}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <form onSubmit={handleReply}>
                                    <div className="flex gap-4">
                                        <textarea
                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                            rows="2"
                                            placeholder="Write an official reply..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyMessage.trim()}
                                            className="px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSupportPage;
