import React, { useState } from 'react';
import type { StickyNote, Camera } from '../types/camera';
import { X, Plus, FileText, Trash2, Tag, Clock } from 'lucide-react';

interface StickyNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stickyNotes: StickyNote[];
  onAddNote: (note: Omit<StickyNote, 'id'>) => void;
  onDeleteNote: (id: string) => void;
  cameras: Camera[];
  activeCamera?: Camera | null;
  currentDate: string;
}

export const StickyNotesDrawer: React.FC<StickyNotesDrawerProps> = ({
  isOpen,
  onClose,
  stickyNotes,
  onAddNote,
  onDeleteNote,
  cameras,
  activeCamera,
  currentDate,
}) => {
  const [text, setText] = useState('');
  const [selectedCamId, setSelectedCamId] = useState(activeCamera?._id || cameras[0]?._id || '');
  const [noteColor, setNoteColor] = useState<'yellow' | 'cyan' | 'purple' | 'green'>('yellow');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const cam = cameras.find((c) => c._id === selectedCamId) || activeCamera || cameras[0];

    onAddNote({
      cameraId: cam._id,
      cameraName: cam.name,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      date: currentDate,
      text,
      author: 'Patrol Operator',
      color: noteColor,
    });

    setText('');
  };

  const getColorBg = (color: string) => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200';
      case 'purple':
        return 'bg-purple-950/90 border-purple-500/50 text-purple-200';
      case 'green':
        return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200';
      default:
        return 'bg-amber-950/90 border-amber-500/50 text-amber-200';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 glass-panel bg-slate-950/95 border-l border-cyan-500/30 p-4 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-100">Patrol Sticky Notes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Target Camera</label>
            <select
              value={selectedCamId}
              onChange={(e) => setSelectedCamId(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
            >
              {cameras.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Annotation Note</label>
            <textarea
              rows={3}
              placeholder="Record patrol observations, security flags, or equipment status..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(['yellow', 'cyan', 'purple', 'green'] as const).map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setNoteColor(clr)}
                  className={`w-5 h-5 rounded-full border transition ${
                    clr === 'yellow'
                      ? 'bg-amber-400'
                      : clr === 'cyan'
                      ? 'bg-cyan-400'
                      : clr === 'purple'
                      ? 'bg-purple-400'
                      : 'bg-emerald-400'
                  } ${noteColor === clr ? 'scale-125 border-white ring-2 ring-cyan-500/50' : 'border-transparent opacity-70'}`}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-400/20 hover:bg-amber-300 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Save Note
            </button>
          </div>
        </form>

        <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {stickyNotes.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">
              No sticky notes added for this recording session yet.
            </p>
          ) : (
            stickyNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-xl border ${getColorBg(note.color)} relative group`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-1">
                  <span className="flex items-center gap-1 font-bold">
                    <Tag className="w-3 h-3" /> {note.cameraName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {note.timestamp}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-sans">{note.text}</p>
                <div className="flex items-center justify-between text-[9px] opacity-60 mt-2">
                  <span>Author: {note.author}</span>
                  <span>{note.date}</span>
                </div>

                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 transition"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
