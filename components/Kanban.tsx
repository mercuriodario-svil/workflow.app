import React, { useState } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, GripVertical, CheckSquare, Square, Trash2, Sparkles, Loader2, Flag } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { analyzeTasks } from '../services/geminiService';

interface KanbanProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'Da Fare', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { id: 'doing', label: 'In Corso', color: 'bg-indigo-50 text-indigo-900 border-indigo-100' },
  { id: 'done', label: 'Completato', color: 'bg-emerald-50 text-emerald-900 border-emerald-100' },
];

const PRIORITY_CONFIG = {
  low: { label: 'Bassa', color: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'text-blue-500' },
  medium: { label: 'Media', color: 'bg-amber-50 text-amber-700 border-amber-200', iconColor: 'text-amber-500' },
  high: { label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200', iconColor: 'text-red-500' }
};

export const Kanban: React.FC<KanbanProps> = ({ tasks, setTasks }) => {
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      content: newTaskContent,
      status: 'todo',
      priority: newTaskPriority,
      checklist: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskContent('');
    setNewTaskPriority('medium'); // Reset default
  };

  const moveTask = (id: string, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal opening
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const currentIndex = COLUMNS.findIndex(c => c.id === t.status);
      let newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
      
      // Bounds check
      if (newIndex < 0) return t;
      if (newIndex >= COLUMNS.length) return t;

      return { ...t, status: COLUMNS[newIndex].id };
    }));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal opening
    // Removed window.confirm to ensure deletion works in all environments
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeTasks(tasks);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // --- Checklist & Edit Logic ---

  const handleSaveTask = () => {
      if (!editingTask) return;
      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      setEditingTask(null);
  };

  const addChecklistItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTask || !newChecklistItem.trim()) return;
      
      const newItem = {
          id: crypto.randomUUID(),
          text: newChecklistItem.trim(),
          done: false
      };
      
      setEditingTask({
          ...editingTask,
          checklist: [...(editingTask.checklist || []), newItem]
      });
      setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
      if (!editingTask) return;
      setEditingTask({
          ...editingTask,
          checklist: editingTask.checklist.map(item => 
              item.id === itemId ? { ...item, done: !item.done } : item
          )
      });
  };

  const removeChecklistItem = (itemId: string) => {
      if (!editingTask) return;
      setEditingTask({
          ...editingTask,
          checklist: editingTask.checklist.filter(item => item.id !== itemId)
      });
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={addTask} className="flex gap-2 flex-1 w-full max-w-lg">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              placeholder="Aggiungi un nuovo task..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
            />
            <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700 text-sm"
            >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || tasks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors shadow-sm self-end sm:self-auto"
        >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analisi AI
        </button>
      </div>

      {analysis && (
        <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-indigo-900 text-sm leading-relaxed shadow-sm relative animate-in fade-in slide-in-from-top-2">
            <button 
                onClick={() => setAnalysis('')} 
                className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-700"
            >
                <X className="w-4 h-4" />
            </button>
            <h4 className="font-semibold mb-1 flex items-center gap-2 text-indigo-700">
                <span className="text-xl">✨</span> Strategia Consigliata
            </h4>
            <div className="whitespace-pre-line">{analysis}</div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-[800px] h-full">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex-1 flex flex-col min-w-[300px]">
              <div className={`p-3 rounded-t-xl border-t border-x font-semibold flex justify-between items-center ${col.color}`}>
                <span>{col.label}</span>
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full border border-slate-100">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <div className="bg-slate-50 flex-1 p-3 rounded-b-xl border border-slate-200 space-y-3 overflow-y-auto">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setEditingTask(task)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:shadow-md transition-all cursor-pointer hover:border-indigo-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-slate-800 leading-snug font-medium flex-1 mr-2">{task.content}</p>
                        <button onClick={(e) => deleteTask(task.id, e)} className="text-red-400 hover:text-red-600 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${PRIORITY_CONFIG[task.priority].color}`}>
                           <Flag className="w-3 h-3" />
                           {PRIORITY_CONFIG[task.priority].label}
                        </span>
                        {(task.checklist || []).length > 0 && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                {task.checklist.filter(i => i.done).length}/{task.checklist.length}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                        <button 
                            onClick={(e) => moveTask(task.id, 'left', e)}
                            disabled={col.id === 'todo'}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <GripVertical className="w-4 h-4 text-slate-200" />
                        <button 
                            onClick={(e) => moveTask(task.id, 'right', e)}
                            disabled={col.id === 'done'}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">Dettagli Task</h3>
                      <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-slate-500 mb-1">Descrizione Task</label>
                          <input 
                              type="text" 
                              value={editingTask.content}
                              onChange={(e) => setEditingTask({...editingTask, content: e.target.value})}
                              className="w-full text-lg p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 bg-white"
                          />
                      </div>

                      <div className="mb-6">
                         <label className="block text-sm font-medium text-slate-500 mb-2">Priorità</label>
                         <div className="flex gap-2">
                            {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setEditingTask({...editingTask, priority: p})}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
                                        editingTask.priority === p 
                                            ? `${PRIORITY_CONFIG[p].color} ring-1 ring-offset-1 ring-slate-200` 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Flag className={`w-4 h-4 ${editingTask.priority === p ? 'fill-current' : ''}`} />
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                         </div>
                      </div>

                      <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-500 mb-2">Checklist</label>
                          <div className="space-y-2 mb-3">
                              {(editingTask.checklist || []).map(item => (
                                  <div key={item.id} className="flex items-center gap-2 group p-1 hover:bg-slate-50 rounded">
                                      <button 
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className={`flex-shrink-0 ${item.done ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                                      >
                                          {item.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                      </button>
                                      <span className={`flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-900 font-medium'}`}>
                                          {item.text}
                                      </span>
                                      <button onClick={() => removeChecklistItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                              {(!editingTask.checklist || editingTask.checklist.length === 0) && (
                                  <p className="text-sm text-slate-400 italic">Nessun elemento nella checklist.</p>
                              )}
                          </div>

                          <form onSubmit={addChecklistItem} className="flex gap-2 mt-4">
                              <input 
                                  type="text" 
                                  value={newChecklistItem}
                                  onChange={(e) => setNewChecklistItem(e.target.value)}
                                  placeholder="Aggiungi voce..."
                                  className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                              />
                              <button type="submit" className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">
                                  <Plus className="w-4 h-4" />
                              </button>
                          </form>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                      <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Annulla</button>
                      <button onClick={handleSaveTask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition">Salva Modifiche</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};