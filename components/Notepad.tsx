import React, { useState, useEffect } from 'react';
import { Plus, Save, Wand2, Loader2, ListTodo } from 'lucide-react';
import { Note } from '../types';
import { improveNote, suggestTasks } from '../services/geminiService';

interface NotepadProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onCreateTaskFromNote: (tasks: string[]) => void;
}

export const Notepad: React.FC<NotepadProps> = ({ notes, setNotes, onCreateTaskFromNote }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Nuova Nota',
      content: '',
      updatedAt: new Date()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
  };

  const handleImprove = async () => {
    if (!activeNote || !activeNote.content) return;
    setIsImproving(true);
    const improved = await improveNote(activeNote.content);
    updateNote(activeNote.id, { content: improved });
    setIsImproving(false);
  };

  const handleExtractTasks = async () => {
      if (!activeNote || !activeNote.content) return;
      setIsExtracting(true);
      const tasks = await suggestTasks(activeNote.content);
      if (tasks.length > 0) {
          onCreateTaskFromNote(tasks);
          alert(`${tasks.length} task creati nella Kanban Board!`);
      } else {
          alert("Nessun task trovato nel testo.");
      }
      setIsExtracting(false);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar List */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">Appunti</h3>
          <button
            onClick={handleCreateNote}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {notes.length === 0 && (
            <div className="text-center text-slate-400 py-8 text-sm">
              Nessuna nota. Creane una nuova!
            </div>
          )}
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                activeNoteId === note.id
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`font-medium truncate ${activeNoteId === note.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                {note.title || 'Senza titolo'}
              </div>
              <div className={`text-xs mt-1 ${activeNoteId === note.id ? 'text-indigo-500' : 'text-slate-500'}`}>
                {new Date(note.updatedAt).toLocaleDateString('it-IT')} {new Date(note.updatedAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {activeNote ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                className="text-xl font-bold text-slate-800 bg-transparent focus:outline-none placeholder-slate-300 w-full"
                placeholder="Titolo della nota..."
              />
              <div className="flex gap-2">
                 <button
                    onClick={handleExtractTasks}
                    disabled={isExtracting || !activeNote.content}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    title="Estrai Task per la Kanban"
                 >
                    {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4" />}
                    Crea Task
                 </button>
                <button
                    onClick={handleImprove}
                    disabled={isImproving || !activeNote.content}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                >
                    {isImproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Migliora AI
                </button>
              </div>
            </div>
            {/* FORCE WHITE BACKGROUND AND DARK TEXT */}
            <textarea
              value={activeNote.content}
              onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
              className="flex-1 p-6 resize-none focus:outline-none text-slate-900 bg-white leading-relaxed text-lg placeholder-slate-300"
              placeholder="Scrivi qui i tuoi appunti..."
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Save className="w-8 h-8 text-slate-300" />
            </div>
            <p>Seleziona o crea una nota per iniziare</p>
          </div>
        )}
      </div>
    </div>
  );
};