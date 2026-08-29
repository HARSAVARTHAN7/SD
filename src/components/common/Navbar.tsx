import React, { useState } from 'react';
import {
  School,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  ShieldAlert,
  Camera,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  tabs: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, tabs }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotifRead, clearNotifs, updateUser, showToast } = useApp();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [newAvatar, setNewAvatar] = useState(user?.avatar || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    if (!user) return;
    const avatarUrl = newAvatar.trim() || user.avatar;
    const updatedUser = { ...user, avatar: avatarUrl };
    updateUser(updatedUser);
    setPhotoModalOpen(false);
    showToast('Photo Updated', 'Your profile picture has been updated successfully.', 'success');
  };

  const roleNotifs = notifications.filter(
    (n) => n.roleTarget === 'all' || n.roleTarget === user?.role
  );
  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  const dashboardTitle =
    user?.role === 'student'
      ? 'Student Dashboard'
      : user?.role === 'teacher'
      ? 'Teacher Dashboard'
      : 'Admin Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                  user?.role === 'student'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                    : user?.role === 'teacher'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/20'
                    : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 shadow-slate-900/30 text-amber-400'
                }`}
              >
                {user?.role === 'admin' ? <ShieldAlert className="w-5 h-5 text-amber-400" /> : <School className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800 text-lg tracking-tight">
                    {dashboardTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  {user?.role === 'student'
                    ? `${user?.semester || '5th Semester'} • ${user?.department || 'Computer Science'}`
                    : user?.role === 'teacher'
                    ? user?.department
                    : 'Central Academic Administration & Operations'}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? user?.role === 'student'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : user?.role === 'teacher'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                        : 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-fadeIn">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        {roleNotifs.length}
                      </span>
                    </div>
                    {roleNotifs.length > 0 && (
                      <button
                        onClick={() => clearNotifs()}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 p-2">
                    {roleNotifs.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No notifications at this time
                      </div>
                    ) : (
                      roleNotifs.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markNotifRead(item.id)}
                          className={`p-3 rounded-2xl cursor-pointer transition-colors ${
                            item.read ? 'bg-white hover:bg-slate-50 opacity-75' : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200/70 transition-all cursor-pointer"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-xs"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {user?.role === 'student'
                      ? `${user.studentId || user.rollNo}`
                      : user?.role === 'teacher'
                      ? user?.title
                      : 'Administrator'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800 text-sm">{user?.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                    <div className="mt-2 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {user?.role === 'student'
                        ? `${user?.semester || 'Semester 5'} • ${user?.department || 'CS Department'}`
                        : user?.role === 'teacher'
                        ? `${user?.department}`
                        : 'Institutional Master Access'}
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setPhotoModalOpen(true);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-purple-600" />
                      Change Profile Photo
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Self-service Profile Photo Update Modal */}
        {photoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setPhotoModalOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white relative">
                <button
                  onClick={() => setPhotoModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs uppercase font-bold text-amber-400">Account Settings</span>
                <h3 className="text-xl font-bold mt-1">Update Profile Photo</h3>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={newAvatar || user?.avatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-md"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-2">Upload Local Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold">Or Image URL</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Save Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSelectTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? user?.role === 'student'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : user?.role === 'teacher'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
