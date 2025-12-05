import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project, TimesheetEntry, DAYS_OF_WEEK } from '../types';

interface TimesheetProps {
  projects: Project[];
  entries: TimesheetEntry[];
  setEntries: React.Dispatch<React.SetStateAction<TimesheetEntry[]>>;
  addProject: (name: string) => void;
  removeProject: (id: string) => void;
  clearAllProjects: () => void;
}

export const Timesheet: React.FC<TimesheetProps> = ({ projects, entries, setEntries, addProject, removeProject, clearAllProjects }) => {
  const [newProjectName, setNewProjectName] = useState('');

  // Initialize entries for new projects
  useEffect(() => {
    setEntries(prev => {
      const existingIds = new Set(prev.map(e => e.projectId));
      const newEntries = projects
        .filter(p => !existingIds.has(p.id))
        .map(p => ({ projectId: p.id, hours: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } }));
      return [...prev, ...newEntries];
    });
  }, [projects, setEntries]);

  const handleHourChange = (projectId: string, dayIndex: number, value: string) => {
    // Handle empty string or invalid number as 0
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;

    setEntries(prev => prev.map(entry => {
      if (entry.projectId === projectId) {
        return {
          ...entry,
          hours: { ...entry.hours, [dayIndex]: Math.min(24, Math.max(0, numValue)) }
        };
      }
      return entry;
    }));
  };

  const handleClearWeek = () => {
    // Call the prop to clear all projects and entries
    clearAllProjects();
  };

  const getDailyTotal = (dayIndex: number) => {
    return entries.reduce((acc, entry) => acc + (entry.hours[dayIndex] || 0), 0);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  // Prepare data for chart
  const chartData = projects.map(p => {
    const entry = entries.find(e => e.projectId === p.id);
    const totalHours = entry ? Object.values(entry.hours).reduce((a: number, b: number) => a + b, 0) : 0;
    return {
      name: p.name,
      hours: totalHours,
      fill: p.color
    };
  }).filter(d => d.hours > 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Rendicontazione Ore</h2>
        <div className="flex gap-2">
            <button
                type="button"
                onClick={handleClearWeek}
                className="flex items-center gap-2 px-3 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm active:bg-red-100"
                title="Elimina tutti i progetti"
            >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Svuota tutto</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
          <form onSubmit={handleAddProject} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nuovo Progetto..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-1/4">Progetto</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="px-4 py-3 text-center">{day}</th>
                ))}
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                          Nessun progetto. Aggiungine uno per iniziare.
                      </td>
                  </tr>
              )}
              {projects.map((project) => {
                const entry = entries.find(e => e.projectId === project.id);
                return (
                  <tr key={project.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                      {project.name}
                    </td>
                    {DAYS_OF_WEEK.map((_, dayIdx) => (
                      <td key={dayIdx} className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={entry?.hours[dayIdx] || ''}
                          onChange={(e) => handleHourChange(project.id, dayIdx, e.target.value)}
                          className="w-full text-center p-1 border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900 placeholder-slate-200"
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="px-4 py-3 text-slate-600">Totale Ore</td>
                {DAYS_OF_WEEK.map((_, dayIdx) => {
                  const total = getDailyTotal(dayIdx);
                  const isOver = total > 8;
                  const isUnder = total < 8 && total > 0;
                  const isPerfect = total === 8;
                  
                  let colorClass = "text-slate-500";
                  if (isOver) colorClass = "text-red-600";
                  if (isUnder) colorClass = "text-amber-600";
                  if (isPerfect) colorClass = "text-emerald-600";

                  return (
                    <td key={dayIdx} className={`px-4 py-3 text-center ${colorClass}`}>
                      {total}h
                    </td>
                  );
                })}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Charts Section */}
      {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Distribuzione Ore per Progetto</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', backgroundColor: '#fff' }}
                    cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      )}
    </div>
  );
};