import { Track } from "@/components/Playlist";

const DB_NAME = "AudioPlayerDB";
const DB_VERSION = 1;
const STORE_NAME = "audioFiles";
const STORAGE_KEY = "audioPlayerTracks";

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

// Save audio file to IndexedDB
export const saveAudioFile = async (id: string, file: File): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, file });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get audio file from IndexedDB
export const getAudioFile = async (id: string): Promise<File | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.file : null);
    };
    request.onerror = () => reject(request.error);
  });
};

// Delete audio file from IndexedDB
export const deleteAudioFile = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Save track metadata to localStorage
export const saveTracksMetadata = (tracks: Track[]): void => {
  const metadata = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    duration: track.duration,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
};

// Load tracks from storage
export const loadTracks = async (): Promise<Track[]> => {
  try {
    const metadataStr = localStorage.getItem(STORAGE_KEY);
    if (!metadataStr) return [];

    const metadata = JSON.parse(metadataStr);
    const tracks: Track[] = [];

    for (const meta of metadata) {
      const file = await getAudioFile(meta.id);
      if (file) {
        tracks.push({
          id: meta.id,
          name: meta.name,
          duration: meta.duration,
          file,
        });
      }
    }

    return tracks;
  } catch (error) {
    console.error("Error loading tracks:", error);
    return [];
  }
};

// Clear all stored data
export const clearAllTracks = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
