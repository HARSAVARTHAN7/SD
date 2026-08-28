import React, { useState } from 'react';
import { X, Megaphone, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Announcement } from '../../types';

interface PostAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostAnnouncementModal: React.FC<PostAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { courses, postAnnouncement, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('important');
  const [targetCourse, setTargetCourse] = useState('AP Calculus BC');

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showToast('Missing Fields', 'Please enter a title and message content.', 'warning');
      return;
    }

    postAnnouncement({
      authorId: user.id,
      authorName: user.name,
      authorRole: user.title || 'Faculty Member',
      authorAvatar: user.avatar,
      title,
      content,
      priority,
      targetCourse,
    });

    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" /> Campus Communication
          </div>
          <h3 className="text-xl font-bold">Broadcast Announcement</h3>
          <p className="text-xs text-purple-100 mt-0.5">Post an official notification visible on student dashboards.</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 📢 Final Project Guidelines & Office Hours Update"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Audience / Course
              </label>
              <select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-800 font-medium"
              >
                <option value="All Students">All Students (General)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Announcement['priority'])}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-800 font-medium"
              >
                <option value="normal">Normal Notice</option>
                <option value="important">Important (Highlighted)</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice Content
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full announcement message here..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Broadcast Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
