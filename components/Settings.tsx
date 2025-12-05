import React, { useState, useEffect } from 'react';
import { Cloud, Save, Download, LogIn, LogOut, Loader2, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { handleAuthClick, handleSignOut, saveToDrive, loadFromDrive, checkIsSignedIn } from '../services/googleDriveService';
import { SyncedData } from '../types';

interface SettingsProps {
  onLoadData: (data: SyncedData) => void;
  getCurrentData: () => SyncedData;
  driveConfig: { apiKey: string; clientId: string };
  setDriveConfig: (config: { apiKey: string; clientId: string }) => void;
  isDriveReady: boolean;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    onLoadData, 
    getCurrentData, 
    driveConfig, 
    setDriveConfig,
    isDriveReady,
    autoSaveEnabled,
    setAutoSaveEnabled
}) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isDriveReady) {
        setIsSignedIn(checkIsSignedIn());
    }
  }, [isDriveReady]);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
      setMessage({ type, text });
      setTimeout(() => setMessage(null), 5000);
  };

  const handleLogin = async () => {
    try {
        await handleAuthClick();
        setIsSignedIn(true);
        showMessage('success', 'Connesso a Google Drive con successo!');
    } catch (error) {
        console.error(error);
        showMessage('error', 'Errore durante il login.');
    }
  };

  const handleLogout = () => {
      handleSignOut();
      setIsSignedIn(false);
      showMessage('info', 'Disconnesso da Google Drive.');
  };

  const handleSave = async () => {
      if (!isSignedIn) return;
      setLoading(true);
      try {
          const data = getCurrentData();
          await saveToDrive(data);
          showMessage('success', 'Dati salvati correttamente su Google Drive (workflow_data.json)');
      } catch (error) {
          console.error(error);
          showMessage('error', 'Errore durante il salvataggio.');
      } finally {
          setLoading(false);
      }
  };

  const handleLoad = async () => {
      if (!isSignedIn) return;
      setLoading(true);
      try {
          const data = await loadFromDrive();
          if (data) {
              onLoadData(data);
              showMessage('success', 'Dati caricati e sincronizzati!');
          } else {
              showMessage('info', 'Nessun file di backup trovato su Drive.');
          }
      } catch (error) {
          console.error(error);
          showMessage('error', 'Errore durante il caricamento.');
      } finally {
          setLoading(false);
      }
  };

  const downloadLocalBackup = () => {
      const data = getCurrentData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Impostazioni & Sincronizzazione</h2>
      </div>

      {message && (
          <div className={`p-4 rounded-lg mb-4 flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
              <Info className="w-5 h-5" />
              {message.text}
          </div>
      )}

      {/* Sezione Credenziali */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              Configurazione Google Drive
          </h3>
          
          <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-500">
                  Per sincronizzare i dati tra dispositivi, inserisci le credenziali del tuo progetto Google Cloud.
                  Il file verrà salvato nel tuo Drive come <code>workflow_data.json</code>.
              </p>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google API Key</label>
                  <input 
                      type="password" 
                      value={driveConfig.apiKey}
                      onChange={(e) => setDriveConfig({...driveConfig, apiKey: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Incolla la tua API Key qui"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Client ID</label>
                  <input 
                      type="text" 
                      value={driveConfig.clientId}
                      onChange={(e) => setDriveConfig({...driveConfig, clientId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Incolla il Client ID (es. 1234...apps.googleusercontent.com)"
                  />
              </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              {!isSignedIn ? (
                  <button 
                    onClick={handleLogin}
                    disabled={!isDriveReady}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                      <LogIn className="w-4 h-4" />
                      Connetti Google Account
                  </button>
              ) : (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                  >
                      <LogOut className="w-4 h-4" />
                      Disconnetti
                  </button>
              )}
              {!isDriveReady && <span className="text-xs text-amber-600">Inserisci le chiavi per abilitare il login</span>}
          </div>
      </div>

      {/* Sezione Sincronizzazione */}
      {isSignedIn && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Save className="w-5 h-5 text-indigo-600" />
                      Sincronizzazione
                  </h3>
                  
                  {/* Auto Save Toggle */}
                  <button 
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                        autoSaveEnabled 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-sm font-medium">Auto-Save</span>
                    {autoSaveEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
              </div>

              <div className="flex flex-wrap gap-4">
                  <button 
                      onClick={handleSave} 
                      disabled={loading || autoSaveEnabled}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      title={autoSaveEnabled ? "Disattiva Auto-Save per salvare manualmente" : ""}
                  >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Salva su Cloud
                  </button>
                  <button 
                      onClick={handleLoad} 
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Scarica da Cloud
                  </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 text-center">
                  {autoSaveEnabled 
                    ? "Il salvataggio automatico è ATTIVO. Le modifiche verranno salvate dopo 5 secondi di inattività."
                    : "Usa 'Salva' dopo aver fatto modifiche. Usa 'Scarica' quando cambi dispositivo."}
              </p>
          </div>
      )}

      {/* Backup Locale */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-2 text-slate-700">Backup Locale</h3>
          <p className="text-sm text-slate-500 mb-4">Scarica una copia dei tuoi dati attuali sul dispositivo.</p>
          <button 
              onClick={downloadLocalBackup}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
              <Download className="w-4 h-4" />
              Scarica JSON
          </button>
      </div>
    </div>
  );
};