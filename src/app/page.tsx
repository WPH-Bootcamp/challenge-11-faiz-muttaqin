"use client";

import { useState, useCallback, useEffect } from "react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { FileUpload } from "@/components/FileUpload";
import { Playlist, type Track } from "@/components/Playlist";
import {
  saveAudioFile,
  saveTracksMetadata,
  loadTracks,
  deleteAudioFile,
} from "@/lib/audioStorage";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || null;
  const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);

  // Load tracks from storage on mount
  useEffect(() => {
    const loadStoredTracks = async () => {
      try {
        const storedTracks = await loadTracks();
        if (storedTracks.length > 0) {
          setTracks(storedTracks);
        }
      } catch (error) {
        console.error("Failed to load tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredTracks();
  }, []);

  // Save tracks to storage whenever they change
  useEffect(() => {
    if (!isLoading && tracks.length > 0) {
      saveTracksMetadata(tracks);
    }
  }, [tracks, isLoading]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newTracks: Track[] = await Promise.all(
      files.map(async (file) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);

        return new Promise<Track>((resolve) => {
          audio.addEventListener("loadedmetadata", async () => {
            URL.revokeObjectURL(audio.src);
            const track = {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              file,
              duration: audio.duration,
            };

            // Save file to IndexedDB
            try {
              await saveAudioFile(track.id, file);
            } catch (error) {
              console.error("Failed to save audio file:", error);
            }

            resolve(track);
          });
        });
      })
    );

    setTracks((prev) => [...prev, ...newTracks]);

    // Auto-play first track if none is selected
    if (!currentTrackId && newTracks.length > 0) {
      setCurrentTrackId(newTracks[0].id);
    }
  }, [currentTrackId]);

  const handleUrlAdded = useCallback(async (url: string) => {
    try {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timed out - the server may not support CORS or the URL is invalid"));
        }, 10000); // 10 second timeout

        audio.addEventListener("loadedmetadata", () => {
          clearTimeout(timeout);
          resolve();
        });
        
        audio.addEventListener("error", (e) => {
          clearTimeout(timeout);
          const errorMsg = audio.error?.message || "Unknown error";
          const errorCode = audio.error?.code;
          let specificError = "Failed to load audio from URL";
          
          if (errorCode === 2) { // MEDIA_ERR_NETWORK
            specificError = "Network error - The server may not support CORS (Cross-Origin Resource Sharing) or the URL is incorrect";
          } else if (errorCode === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
            specificError = "Audio format not supported or URL is invalid";
          }
          
          reject(new Error(`${specificError}. Details: ${errorMsg}`));
        });
      });

      const fileName = url.split('/').pop()?.split('?')[0] || 'Audio from URL';
      const track: Track = {
        id: `url-${Date.now()}-${Math.random()}`,
        name: fileName.replace(/\.[^/.]+$/, ""),
        file: new File([], fileName), // Dummy file for URL-based tracks
        duration: audio.duration,
        url: url, // Store the CDN URL
      };

      setTracks((prev) => [...prev, track]);

      // Auto-play if no track is selected
      if (!currentTrackId) {
        setCurrentTrackId(track.id);
      }

      // Note: URL-based tracks won't be saved to IndexedDB
      // They'll only persist during the session
    } catch (error) {
      console.error("Failed to load audio from URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to load audio:\n\n${errorMessage}\n\nTip: The URL must:\n1. Be a direct link to an audio file\n2. Support CORS (Cross-Origin requests)\n3. Be accessible from your browser`);
    }
  }, [currentTrackId]);

  const handleTrackSelect = useCallback((trackId: string) => {
    setCurrentTrackId(trackId);
  }, []);

  const handleTrackRemove = useCallback(async (trackId: string) => {
    // Remove from IndexedDB
    try {
      await deleteAudioFile(trackId);
    } catch (error) {
      console.error("Failed to delete audio file:", error);
    }

    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrackId === trackId) {
      setCurrentTrackId(null);
    }
  }, [currentTrackId]);

  const handleNext = useCallback(() => {
    if (currentIndex < tracks.length - 1) {
      setCurrentTrackId(tracks[currentIndex + 1].id);
    }
  }, [currentIndex, tracks]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentTrackId(tracks[currentIndex - 1].id);
    }
  }, [currentIndex, tracks]);

  // Page-wide drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the page container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("audio/")
      );

      if (files.length > 0) {
        await handleFilesAdded(files);
      }
    },
    [handleFilesAdded]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-white text-lg">Loading your audio library...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-[#0a0a0a] p-8 transition-colors ${
        isDragging ? "bg-purple-900/20" : ""
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-500/10 backdrop-blur-sm pointer-events-none">
          <div className="bg-gray-800 border-4 border-dashed border-purple-500 rounded-3xl p-16 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Drop your audio files here
            </h2>
            <p className="text-gray-400 text-lg">
              They will be added to your playlist
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        {tracks.length === 0 ? (
          <FileUpload onFilesAdded={handleFilesAdded} onUrlAdded={handleUrlAdded} />
        ) : (
          <>
            <MusicPlayer
              currentTrack={currentTrack}
              onNext={currentIndex < tracks.length - 1 ? handleNext : undefined}
              onPrevious={currentIndex > 0 ? handlePrevious : undefined}
            />
            <Playlist
              tracks={tracks}
              currentTrackId={currentTrackId}
              onTrackSelect={handleTrackSelect}
              onTrackRemove={handleTrackRemove}
            />
            <div className="mt-6">
              <FileUpload onFilesAdded={handleFilesAdded} onUrlAdded={handleUrlAdded} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
