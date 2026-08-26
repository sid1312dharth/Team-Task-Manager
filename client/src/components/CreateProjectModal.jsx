import React, { useState } from 'react';
import { FolderPlus, Check } from 'lucide-react';
import Modal from './Modal';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const COLOR_PALETTES = [
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Rose', hex: '#F43F5E' }
];

const CATEGORIES = [
  'General',
  'Frontend',
  'Backend',
  'Mobile',
  'Design',
  'DevOps',
  'Marketing',
  'Research'
];

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [category, setCategory] = useState('General');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Project title is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        color,
        category,
        target_date: targetDate || null
      };

      const newProj = await api.projects.create(payload);
      showToast(`Project "${newProj.name}" created!`, 'success');

      // Reset
      setName('');
      setDescription('');
      setColor('#6366F1');
      setCategory('General');
      setTargetDate('');

      if (onProjectCreated) onProjectCreated(newProj);
      onClose();
    } catch (err) {
      showToast(err.message || 'Error creating project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Set up a workspace for your team to organize tasks and sprints."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Project Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website 3.0 Revamp"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the goals, deliverables, and context of this project..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Category & Target Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Deadline
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Theme Color Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Project Theme Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PALETTES.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${color === c.hex
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                    : 'hover:scale-105'
                  }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

