import React, { useState, useRef, useEffect } from 'react';
import type { StickyNote, Camera } from '../types/camera';
import { X, Pin, Link as LinkIcon, Plus } from 'lucide-react';

interface FloatingStickyNoteProps {
  isOpen: boolean;
  onClose: () => void;
  stickyNotes: StickyNote[];
  onAddNote: (note: Omit<StickyNote, 'id'>) => void;
  onDeleteNote: (id: string) => void;
  cameras: Camera[];
  activeCamera?: Camera | null;
  currentDate: string;
}

export const FloatingStickyNote: React.FC<FloatingStickyNoteProps> = ({
  isOpen,
  onClose,
  stickyNotes,
  onAddNote,
  onDeleteNote,
  cameras,
  activeCamera,
  currentDate,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  const [text, setText] = useState('');
  const [noteColor, setNoteColor] = useState<'yellow' | 'cyan' | 'purple' | 'green' | 'pink'>('yellow');

  // Load existing notes text if we want to combine them or just allow creating new ones.
  // For simplicity based on the request, we'll let the user type in the main area and save it.
  
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from header
    if ((e.target as HTMLElement).closest('.note-header')) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;

    const cam = activeCamera || cameras[0];
    onAddNote({
      cameraId: cam?._id || 'unknown',
      cameraName: cam?.name || 'Unknown',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      date: currentDate,
      text,
      author: 'Patrol Operator',
      color: (noteColor === 'pink' ? 'yellow' : noteColor) as any, // fallback if pink is not in type
    });
    setText('');
  };

  const getBgColor = () => {
    switch (noteColor) {
      case 'cyan': return 'bg-[#C7E5F0]';
      case 'purple': return 'bg-[#DCD0FF]';
      case 'green': return 'bg-[#CDEAC0]';
      case 'pink': return 'bg-[#F9C8D2]';
      default: return 'bg-[#FBE3CC]'; // warm yellow/beige
    }
  };

  const getBorderColor = () => {
    switch (noteColor) {
      case 'cyan': return 'border-[#A3D1E4]';
      case 'purple': return 'border-[#C2B2E6]';
      case 'green': return 'border-[#A5D090]';
      case 'pink': return 'border-[#ECA3B4]';
      default: return 'border-[#E2C39B]';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-[100] shadow-2xl rounded-sm border-t-[6px] overflow-hidden ${getBgColor()} ${getBorderColor()} text-gray-800 font-sans`}
      style={{
        left: position.x,
        top: position.y,
        width: 380,
        height: isMinimized ? 40 : 420,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderBottomWidth: '1px',
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Header (Draggable) */}
      <div 
        className="note-header h-10 px-3 flex items-center justify-between cursor-move select-none border-b border-black/5"
        onDoubleClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3 opacity-60">
          <Pin className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[13px] font-semibold text-black/80">New note</span>
          </div>
        </div>
        <div className="flex items-center gap-3 opacity-50">
          <button onClick={handleSubmit} title="Save Note" className="hover:opacity-100 transition"><LinkIcon className="w-3.5 h-3.5" /></button>
          <button onClick={onClose} title="Close Note" className="hover:opacity-100 transition"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div className="flex flex-col h-[380px]">
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <h3 className="font-semibold text-[15px] text-black/80 mb-2">{currentDate}</h3>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a new note here..."
                className="w-full bg-black/5 rounded-lg p-2 resize-none outline-none text-[14px] leading-relaxed placeholder-black/40 text-black/90 font-medium min-h-[80px]"
                autoFocus
              />
              
              {/* History of notes for this camera */}
              {stickyNotes
                .filter((n: StickyNote) => n.cameraId === (activeCamera?._id || 'unknown'))
                .map((note: StickyNote) => (
                  <div key={note.id} className="bg-black/5 rounded p-3 relative group">
                    <p className="text-[13px] text-black/80 leading-relaxed whitespace-pre-wrap pr-6">{note.text}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                      <span className="text-[10px] font-bold text-black/40 uppercase">{note.timestamp}</span>
                      <span className="text-[10px] font-bold text-black/40 uppercase">{note.author}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-black/10 rounded"
                      title="Delete Note"
                    >
                      <X className="w-3 h-3 text-black/60" />
                    </button>
                  </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="h-10 px-4 flex items-center justify-between border-t border-black/5 bg-black/5 shrink-0">
            <div className="flex items-center gap-2">
              <button title="Save Note" onClick={handleSubmit} className="flex items-center gap-1 text-[11px] font-bold text-black/60 hover:text-black/90 transition px-2 py-1 rounded bg-black/5 shadow-sm border border-black/10">
                <Plus className="w-3 h-3" /> SAVE
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 opacity-80">
              {(['pink', 'yellow', 'cyan', 'green', 'purple'] as const).map((clr) => {
                let clrBg = '';
                if (clr === 'pink') clrBg = 'bg-[#FFC0CB]';
                else if (clr === 'yellow') clrBg = 'bg-[#FFE4B5]';
                else if (clr === 'cyan') clrBg = 'bg-[#87CEEB]';
                else if (clr === 'green') clrBg = 'bg-[#98FB98]';
                else if (clr === 'purple') clrBg = 'bg-[#DDA0DD]';

                return (
                  <button
                    key={clr}
                    onClick={() => setNoteColor(clr as any)}
                    className={`w-4 h-4 rounded-full border border-black/20 ${clrBg} ${noteColor === clr ? 'ring-1 ring-offset-1 ring-black/40 scale-110' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
