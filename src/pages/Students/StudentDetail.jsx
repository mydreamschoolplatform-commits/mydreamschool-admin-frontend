import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import DateSelector from '../../components/common/DateSelector';
import Avatar from '../../components/common/Avatar';
import { IMAGE_BASE_URL } from '../../api/config';

const StudentDetail = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await client.get(`/admin/students/${id}`);
                setData(res.data);
                // Initialize form data with all fields, defaulting to empty strings to prevent controlled/uncontrolled errors
                setFormData({
                    fullName: res.data.profile.fullName || '',
                    username: res.data.profile.username || '',
                    class: res.data.profile.class || '',
                    medium: res.data.profile.medium || '',
                    schoolName: res.data.profile.schoolName || '',
                    fatherName: res.data.profile.fatherName || '',
                    motherName: res.data.profile.motherName || '',
                    phoneNumber: res.data.profile.phoneNumber || '',
                    village: res.data.profile.village || '',
                    mandal: res.data.profile.mandal || '',
                    district: res.data.profile.district || '',
                    gender: res.data.profile.gender || '',
                    dateOfBirth: res.data.profile.dateOfBirth ? res.data.profile.dateOfBirth.split('T')[0] : '',
                    profileImage: res.data.profile.profileImage || '' // Keep existing for reference
                });
            } catch (err) {
                console.error("Error details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            const dataToSend = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                // Only append if the key is not profileImage, as it's handled separately
                if (key !== 'profileImage') {
                    dataToSend.append(key, formData[key]);
                }
            });

            // Append File if selected
            if (selectedFile) {
                dataToSend.append('profileImage', selectedFile);
            } else if (formData.profileImage && !previewUrl) {
                // If no new file is selected but there was an existing image, keep it
                // This might be redundant if the backend handles missing file as "no change"
                // but explicitly sending the URL can ensure it's not accidentally cleared.
                // However, for multipart/form-data, it's usually better to only send the file.
                // If the backend expects a URL when no file is uploaded, this logic might need adjustment.
                // For now, we assume if selectedFile is null, and formData.profileImage exists,
                // the backend will retain the existing image unless explicitly told to remove it.
                // Or, if the backend expects a string URL for existing images, we'd append it here.
                // For simplicity, we'll rely on the backend to handle image updates based on file presence.
            }


            await client.put(`/admin/students/${id}`, dataToSend);

            alert("Profile updated successfully!");
            setIsEditing(false);
            setSelectedFile(null);
            setPreviewUrl(null);

            // Refetch to ensure we have the server's view of the data (including any formatting)
            const res = await client.get(`/admin/students/${id}`);
            setData(res.data);
            setFormData({
                ...res.data.profile,
                dateOfBirth: res.data.profile.dateOfBirth ? res.data.profile.dateOfBirth.split('T')[0] : '',
                profileImage: res.data.profile.profileImage || ''
            });

        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update profile: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-8 text-center">Loading student details...</div>;
    if (!data || !data.profile) return <div className="p-8 text-center text-red-500">Student not found or error loading data.</div>;

    const { profile } = data;
    // API_BASE_URL is now handled by client or config
    // For image display, we might need the base URL if it's relative
    // In prod, Cloudinary returns full URLs, so this fallback is for legacy local images

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Students
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-center mb-6">
                        <div className="h-24 w-24 mx-auto mb-4 relative group">
                            <Avatar
                                src={formData.profileImage}
                                name={formData.fullName}
                                size="xl"
                                className="w-24 h-24 border-2 border-indigo-100 shadow-sm"
                            />
                            {/* Hover Edit Hint */}
                            {isEditing && (
                                <label className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-medium">Upload</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>

                        {!isEditing ? (
                            <>
                                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                                <p className="text-sm text-gray-500">@{profile.username}</p>

                                {user.role === 'Super Admin' && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700 transition"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-left text-gray-500 mb-1">Full Name</label>
                                    <input
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className="block w-full text-center border-gray-300 rounded-md text-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <p className="text-sm text-gray-400">@{profile.username}</p>
                                {/* Quick Image Action */}
                                <div className="text-xs text-gray-500">
                                    {selectedFile ? `Selected: ${selectedFile.name}` : 'Click avatar to upload new image'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-left">
                            {[
                                { label: 'Gender', name: 'gender', type: 'select', options: ['Male', 'Female'] },
                                { label: 'Date of Birth', name: 'dateOfBirth', type: 'date' },
                                { label: 'Class', name: 'class', type: 'select', options: ['6', '7', '8', '9', '10'] },
                                { label: 'Medium', name: 'medium', type: 'select', options: ['Telugu', 'English'] },
                                { label: 'School', name: 'schoolName', type: 'text', fullWidth: true },
                                // removed explicit profileImage text field in favor of upload
                                // { label: 'Profile Image URL', name: 'profileImage', type: 'text', fullWidth: true },
                                { label: 'Mother Name', name: 'motherName', type: 'text' },
                                { label: 'Father Name', name: 'fatherName', type: 'text' },
                                { label: 'Phone', name: 'phoneNumber', type: 'text' },
                                { label: 'Village', name: 'village', type: 'text' },
                                { label: 'Mandal', name: 'mandal', type: 'text' },
                                { label: 'District', name: 'district', type: 'text' },
                            ].map((field) => (
                                <div key={field.name} className={`flex flex-col ${field.fullWidth ? 'col-span-1 sm:col-span-2' : ''}`}>
                                    <span className="text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wider">{field.label}</span>
                                    {isEditing ? (
                                        field.type === 'select' ? (
                                            <select
                                                name={field.name}
                                                value={formData[field.name]}
                                                onChange={handleInputChange}
                                                className="block w-full text-sm border-gray-300 rounded-md p-2 border focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50"
                                            >
                                                <option value="" disabled>Select {field.label}</option>
                                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'date' ? (
                                            <DateSelector
                                                value={formData[field.name]}
                                                onChange={(val) => handleInputChange({ target: { name: field.name, value: val } })}
                                                startYear={1990}
                                                endYear={new Date().getFullYear()}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                value={formData[field.name]}
                                                onChange={handleInputChange}
                                                className="block w-full text-sm border-gray-300 rounded-md p-2 border focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50"
                                            />
                                        )
                                    ) : (
                                        <span className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1 truncate" title={profile[field.name]}>
                                            {field.type === 'date' && profile[field.name]
                                                ? new Date(profile[field.name]).toLocaleDateString()
                                                : profile[field.name]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isEditing && (
                            <div className="mt-8 flex space-x-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        setFormData({
                                            ...profile,
                                            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
                                        });
                                    }}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    {/* Handwriting Stats */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">✍️</span>
                            Handwriting Discipline
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Current Streak</div>
                                <div className="text-3xl font-bold text-indigo-600 mt-2">{profile.handwritingStreak?.currentStreak || 0} <span className="text-lg text-gray-400">Days</span></div>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Last Practice</div>
                                <div className="text-lg font-medium text-gray-900 mt-2">
                                    {profile.handwritingStreak?.lastPracticeDate
                                        ? new Date(profile.handwritingStreak.lastPracticeDate).toLocaleDateString()
                                        : 'Never Practiced'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Control Panel */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6 md:mt-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">📅</span>
                        Subscription & Access
                    </h3>
                    {/* Status Badge */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Current Status</span>
                        {(() => {
                            const sub = profile.subscription;
                            const access = profile.accessEnabled;
                            if (access === false) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">DISABLED</span>;
                            if (!sub) return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">NO_DATA</span>;

                            const now = new Date();
                            const exp = new Date(sub.expiryDate);
                            const grace = sub.graceDays || 0;
                            const eff = new Date(exp);
                            eff.setDate(eff.getDate() + grace);

                            if (now > eff) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">EXPIRED</span>;
                            return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">ACTIVE</span>;
                        })()}
                    </div>

                    {data.profile.subscription ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    defaultValue={data.profile.subscription.startDate ? data.profile.subscription.startDate.split('T')[0] : ''}
                                    id="subStartDate"
                                    className="block w-full text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    defaultValue={data.profile.subscription.expiryDate ? data.profile.subscription.expiryDate.split('T')[0] : ''}
                                    id="subExpiryDate"
                                    className="block w-full text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Grace Period (Days)</label>
                                <input
                                    type="number"
                                    defaultValue={data.profile.subscription.graceDays || 0}
                                    id="subGraceDays"
                                    className="block w-full text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>

                            {user.role === 'Super Admin' && (
                                <button
                                    onClick={async () => {
                                        const start = document.getElementById('subStartDate').value;
                                        const end = document.getElementById('subExpiryDate').value;
                                        const grace = document.getElementById('subGraceDays').value;

                                        if (!start || !end) return alert("Dates are required");

                                        try {
                                            await client.put(`/admin/students/${id}/subscription`, {
                                                startDate: start,
                                                expiryDate: end,
                                                graceDays: parseInt(grace)
                                            });
                                            alert("Subscription updated!");
                                            // Reload
                                            window.location.reload();
                                        } catch (e) {
                                            alert("Update failed: " + e.message);
                                        }
                                    }}
                                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Update Subscription
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-500 py-4">
                            No subscription data found.
                            {/* Helper to init if missing? Backend schema default should handle it on new students. Legacy might miss it. */}
                            {user.role === 'Super Admin' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            // Initialize with defaults (1 year)
                                            const start = new Date().toISOString().split('T')[0];
                                            const end = new Date();
                                            end.setFullYear(end.getFullYear() + 1);
                                            const endStr = end.toISOString().split('T')[0];

                                            await client.put(`/admin/students/${id}/subscription`, {
                                                startDate: start,
                                                expiryDate: endStr,
                                                graceDays: 0
                                            });
                                            window.location.reload();
                                        } catch (e) {
                                            alert("Init failed: " + e.message);
                                        }
                                    }}
                                    className="mt-2 text-indigo-600 hover:underline"
                                >
                                    Initialize Subscription
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StudentDetail;
