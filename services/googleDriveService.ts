import { SyncedData } from "../types";

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const FILE_NAME = 'workflow_data.json';

// Global variables for Google scripts
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleDrive = async (apiKey: string, clientId: string, onInitComplete: (success: boolean) => void) => {
  if (!apiKey || !clientId) return;

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    if (gisInited) onInitComplete(true);
  };

  const loadGapi = () => {
      window.gapi.load('client', initializeGapiClient);
  }

  const loadGis = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        if (gapiInited) onInitComplete(true);
  }

  // Check if scripts are loaded
  if (window.gapi) loadGapi();
  if (window.google) loadGis();
};

export const handleAuthClick = async () => {
  return new Promise<void>((resolve, reject) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({prompt: ''});
    }
  });
};

export const handleSignOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};

const findConfigFile = async (): Promise<string | null> => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Error searching file', err);
    throw err;
  }
};

export const saveToDrive = async (data: SyncedData): Promise<void> => {
  try {
    const fileId = await findConfigFile();
    const fileContent = JSON.stringify(data);
    const blob = new Blob([fileContent], { type: 'application/json' });
    
    // Using simple upload for small files via fetch because gapi doesn't support multipart easily for updates without helpers
    const accessToken = window.gapi.client.getToken().access_token;

    if (fileId) {
      // Update existing file
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });
    } else {
      // Create new file
      const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json',
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });
    }
  } catch (err) {
    console.error('Error saving to drive', err);
    throw err;
  }
};

export const loadFromDrive = async (): Promise<SyncedData | null> => {
    const fileId = await findConfigFile();
    if (!fileId) return null;

    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        // gapi automatically parses JSON for 'media' alt if headers are correct, 
        // but sometimes returns string. Safety check.
        const result = response.result;
        if (typeof result === 'string') {
             return JSON.parse(result);
        }
        return result as SyncedData;
    } catch (err) {
        console.error("Error loading from drive", err);
        throw err;
    }
};

export const checkIsSignedIn = () => {
    return window.gapi && window.gapi.client && window.gapi.client.getToken() !== null;
}