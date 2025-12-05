import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ClipboardList, Trello, Layout, Settings as SettingsIcon, Cloud, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Timesheet } from './components/Timesheet';
import { Notepad } from './components/Notepad';
import { Kanban } from './components/Kanban';
import { Settings } from './components/Settings';
import { Project, TimesheetEntry, Note, Task, SyncedData } from './types';
import { initGoogleDrive, saveToDrive, checkIsSignedIn } from './services/googleDriveService';

// Mock Data / Default State
const DEFAULT_PROJECTS: Project[] = [
  { id: '1', name: 'Sviluppo', color: '#4f46e5' }, // Indigo 600
  { id: '2', name: 'Formazione', color: '#0ea5e9' }, // Sky 500
  { id: '3', name: 'Meeting', color: '#8b5cf6' }, // Violet 500
];

const NAV_ITEMS = [
  { id: 'timesheet', label: 'Rendicontazione', icon: Calendar },
  { id: 'kanban', label: 'Lista Task', icon: Trello },
  { id: 'notepad', label: 'Blocco Note', icon: ClipboardList },
  { id: 'settings', label: 'Impostazioni', icon: SettingsIcon },
];

function App() {
  const [activeTab, setActiveTab] = useState('timesheet');
  
  // State Persistence with LocalStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('wf_projects');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    } catch (e) { return DEFAULT_PROJECTS; }
  });

  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(() => {
    try {
      const saved = localStorage.getItem('wf_entries');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('wf_notes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('wf_tasks');
      return saved ? JSON.parse(saved) : [
        { id: '1', content: 'Configurare ambiente di sviluppo', status: 'done', priority: 'high', checklist: [] },
        { id: '2', content: 'Scrivere documentazione API', status: 'todo', priority: 'medium', checklist: [{id: 'c1', text: 'Endpoint Login', done: false}] }
      ];
    } catch (e) { return []; }
  });

  // Google Drive Config State
  const [driveConfig, setDriveConfig] = useState(() => {
    try {
        const saved = localStorage.getItem('wf_drive_config');
        return saved ? JSON.parse(saved) : { apiKey: '', clientId: '' };
    } catch(e) { return { apiKey: '', clientId: '' }; }
  });

  const [isDriveReady, setIsDriveReady] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
     return localStorage.getItem('wf_autosave') === 'true';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Init Google Drive
  useEffect(() => {
    if (driveConfig.apiKey && driveConfig.clientId) {
        initGoogleDrive(driveConfig.apiKey, driveConfig.clientId, (success) => {
            setIsDriveReady(success);
        });
    }
    localStorage.setItem('wf_drive_config', JSON.stringify(driveConfig));
  }, [driveConfig]);

  // Save effects (Local Storage)
  useEffect(() => localStorage.setItem('wf_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('wf_entries', JSON.stringify(timesheetEntries)), [timesheetEntries]);
  useEffect(() => localStorage.setItem('wf_notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('wf_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('wf_autosave', String(autoSaveEnabled)), [autoSaveEnabled]);

  // Sync Data Helper
  const getCurrentData = (): SyncedData => ({
      projects,
      entries: timesheetEntries,
      notes,
      tasks,
      lastUpdated: new Date().toISOString()
  });

  // --- AUTO SAVE LOGIC ---
  const isFirstRender = useRef(true);

  useEffect(() => {
      // Skip auto-save on initial load to prevent overwriting cloud with potentially stale local data immediately
      if (isFirstRender.current) {
          isFirstRender.current = false;
          return;
      }

      if (!autoSaveEnabled || !isDriveReady) return;

      const performAutoSave = async () => {
          if (checkIsSignedIn()) {
              setSyncStatus('saving');
              try {
                  const data = getCurrentData();
                  await saveToDrive(data);
                  setSyncStatus('success');
                  // Reset status after 3 seconds
                  setTimeout(() => setSyncStatus('idle'), 3000);
              } catch (error) {
                  console.error("Auto-save failed", error);
                  setSyncStatus('error');
              }
          }
      };

      // Debounce: Wait 5 seconds after last change before saving
      const timeoutId = setTimeout(performAutoSave, 5000);

      return () => clearTimeout(timeoutId);
  }, [projects, timesheetEntries, notes, tasks, autoSaveEnabled, isDriveReady]);


  const addProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      // Random nice colors
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    setProjects([...projects, newProject]);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    setTimesheetEntries(timesheetEntries.filter(e => e.projectId !== id));
  };

  const clearAllProjects = () => {
    setProjects([]);
    setTimesheetEntries([]);
  };

  const handleCreateTasksFromNote = (newTasks: string[]) => {
      const tasksObjects: Task[] = newTasks.map(t => ({
          id: crypto.randomUUID(),
          content: t,
          status: 'todo',
          priority: 'medium',
          checklist: []
      }));
      setTasks(prev => [...prev, ...tasksObjects]);
      setActiveTab('kanban'); // Switch to Kanban view to see results
  };

  const loadData = (data: SyncedData) => {
      if (data.projects) setProjects(data.projects);
      if (data.entries) setTimesheetEntries(data.entries);
      if (data.notes) setNotes(data.notes);
      if (data.tasks) setTasks(data.tasks);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar Navigation - Dark Theme for contrast */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-900/20">
             <Layout className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight">WorkFlow</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-900/30' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-100' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sync Status Indicator */}
        {isDriveReady && autoSaveEnabled && (
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 text-xs font-medium">
                    {syncStatus === 'idle' && (
                        <>
                            <Cloud className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500">Cloud Sincronizzato</span>
                        </>
                    )}
                    {syncStatus === 'saving' && (
                        <>
                            <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                            <span className="text-indigo-400">Salvataggio...</span>
                        </>
                    )}
                    {syncStatus === 'success' && (
                        <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Salvato</span>
                        </>
                    )}
                    {syncStatus === 'error' && (
                        <>
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">Errore Sync</span>
                        </>
                    )}
                </div>
            </div>
        )}

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            &copy; 2024 WorkFlow AI
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                {activeTab === 'timesheet' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <Timesheet
                            projects={projects}
                            entries={timesheetEntries}
                            setEntries={setTimesheetEntries}
                            addProject={addProject}
                            removeProject={removeProject}
                            clearAllProjects={clearAllProjects}
                        />
                    </div>
                )}

                {activeTab === 'kanban' && (
                    <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                        <Kanban tasks={tasks} setTasks={setTasks} />
                    </div>
                )}

                {activeTab === 'notepad' && (
                    <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                        <Notepad
                            notes={notes}
                            setNotes={setNotes}
                            onCreateTaskFromNote={handleCreateTasksFromNote}
                        />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                        <Settings
                            onLoadData={loadData}
                            getCurrentData={getCurrentData}
                            driveConfig={driveConfig}
                            setDriveConfig={setDriveConfig}
                            isDriveReady={isDriveReady}
                            autoSaveEnabled={autoSaveEnabled}
                            setAutoSaveEnabled={setAutoSaveEnabled}
                        />
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;