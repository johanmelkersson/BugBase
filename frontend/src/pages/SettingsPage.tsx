import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteAccount, updateProfile } from '../api/users';

type Section = 'all' | 'profile' | 'admin';

export default function SettingsPage() {
    const [searchParams] = useSearchParams();
    const initialSection = (searchParams.get('section') as Section) ?? 'all';
    const [activeSection, setActiveSection] = useState<Section>(initialSection);

    const { auth, login, logout } = useAuth();
    const navigate = useNavigate();

    // Profile state
    const [username, setUsername] = useState(auth?.username ?? '');
    const [email, setEmail] = useState(auth?.email ?? '');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)



    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setProfileError('');
            const data: Record<string, string> = {};
            if (username !== auth?.username) data.username = username;
            if (email !== auth?.email) data.email = email;
            const response = await updateProfile(data);
            login(response.token, response.username, response.role, response.email, null, response.color);
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch {
            setProfileError('Could not save changes.');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordError('');
        if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return; }
        try {
            const response = await updateProfile({ currentPassword, password: newPassword });
            login(response.token, response.username, response.role, response.email, null, response.color);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setPasswordSuccess(true);
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch {
            setPasswordError('Incorrect current password.');
        }
    };

    const handleDeleteAccount = async () => {
        await deleteAccount();
        logout();
        navigate('/login');
    };

    const navItem = (label: string, section: Section, indent = false) => (
        <button
            onClick={() => setActiveSection(section)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${indent ? 'pl-7' : ''} ${activeSection === section
                ? 'bg-indigo-600/20 text-indigo-300'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col sm:flex-row h-[calc(100vh-57px)]">

            {/* Mobile tab bar */}
            <div className="sm:hidden flex border-b border-gray-700 px-4 gap-1 shrink-0">
                <button
                    onClick={() => setActiveSection('all')}
                    className={`px-3 py-2.5 text-sm transition-colors ${activeSection === 'all' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveSection('profile')}
                    className={`px-3 py-2.5 text-sm transition-colors ${activeSection === 'profile' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Profile
                </button>
                {auth?.role === 'Admin' && (
                    <button
                        onClick={() => setActiveSection('admin')}
                        className={`px-3 py-2.5 text-sm transition-colors ${activeSection === 'admin' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Admin
                    </button>
                )}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden sm:flex w-56 border-r border-gray-700/60 px-3 py-5 flex-col gap-1 shrink-0">
                <p className="text-xs text-gray-500 font-medium px-3 mb-2 uppercase tracking-wider">Settings</p>
                <button
                    onClick={() => setActiveSection('all')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${activeSection === 'all'
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <span className="text-xs">▾</span>
                    <span>All Settings</span>
                </button>
                {navItem('Profile', 'profile')}
                {auth?.role === 'Admin' && navItem('Admin', 'admin')}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-8 py-6 max-w-2xl">

                {(activeSection === 'all' || activeSection === 'profile') && (
                    <div className="flex flex-col gap-6 mb-8">
                        <h1 className="text-xl font-semibold text-white">Profile</h1>

                        {/* Profile card */}
                        <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6">
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Username</label>
                                    <input value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full bg-[#13141a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Email</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                                        className="w-full bg-[#13141a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                {profileError && <p className="text-red-400 text-sm">{profileError}</p>}
                                {profileSuccess && <p className="text-green-400 text-sm">Saved successfully.</p>}
                                <div className="flex justify-end mt-2">
                                    <button type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Change password card */}
                        <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6">
                            <h2 className="text-white font-medium text-sm mb-4">Change password</h2>
                            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Current password</label>
                                    <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required
                                        placeholder="Enter your current password"
                                        className="w-full bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">New password</label>
                                    <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required
                                        placeholder="At least 6 characters"
                                        className="w-full bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Confirm new password</label>
                                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required
                                        placeholder="Repeat new password"
                                        className="w-full bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-400 text-sm">Password changed successfully.</p>}
                                <div className="flex justify-end mt-2">
                                    <button type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
                                        Update password
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Avatar color */}
                        <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6">
                            <h2 className="text-white font-medium text-sm mb-1">Avatar color</h2>
                            <p className="text-gray-500 text-xs mb-4">Choose the color used for your avatar across all projects.</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: auth?.color ?? '#6366f1' }}>
                                    {auth?.username[0].toUpperCase()}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#10b981','#14b8a6','#06b6d4','#3b82f6'].map(c => (
                                        <button
                                            key={c}
                                            onClick={async () => {
                                                const response = await updateProfile({ color: c });
                                                login(response.token, response.username, response.role, response.email, null, response.color);
                                            }}
                                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${auth?.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1f27]' : ''}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Delete account */}
                        <div className="bg-[#1e1f27] border border-red-900/40 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-white text-sm font-medium">Delete account</p>
                                <p className="text-gray-500 text-xs mt-0.5">Permanently delete your account and all associated data.</p>
                            </div>
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="self-start sm:self-auto px-4 py-2 border border-red-500/40 text-red-400 hover:text-red-300 hover:border-red-400/60 text-sm rounded-lg transition-colors shrink-0">
                                Delete account
                            </button>
                        </div>
                    </div>
                )}

                {auth?.role === 'Admin' && (activeSection === 'all' || activeSection === 'admin') && (
                    <div className="flex flex-col gap-4 mb-8">
                        <h2 className="text-xl font-bold text-white">Admin</h2>
                        <div className="bg-[#1e1f27] border border-red-900/40 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-white text-sm font-medium">Relinquish Admin role</p>
                                <p className="text-gray-500 text-xs mt-0.5">This cannot be undone without help from another Admin.</p>
                            </div>
                            <button
                                onClick={() => setShowDowngradeConfirm(true)}
                                className="self-start sm:self-auto px-4 py-2 border border-red-500/40 text-red-400 hover:text-red-300 hover:border-red-400/60 text-sm rounded-lg transition-colors shrink-0"
                            >
                                Relinquish Admin role
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>

            {/* Delete account modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-white font-semibold mb-2">Delete account</h3>
                        <p className="text-gray-400 text-sm mb-6">Your account and all associated data will be permanently deleted.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">
                                Delete permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDowngradeConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-white font-semibold mb-2">Relinquish Admin role</h3>
                        <p className="text-gray-400 text-sm mb-6">You are about to remove your Admin access. This cannot be undone without help from another Admin.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDowngradeConfirm(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onClick={async () => {
                                const response = await updateProfile({ role: 'User' });
                                login(response.token, response.username, response.role, response.email, null, response.color);
                                setShowDowngradeConfirm(false);
                                navigate('/dashboard');
                            }}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">
                                Yes, relinquish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}