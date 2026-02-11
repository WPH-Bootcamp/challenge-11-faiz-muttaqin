"use client";

import { motion } from "motion/react";
import { Music2, Play, X } from "lucide-react";

export interface Track {
    id: string;
    name: string;
    file: File;
    duration: number;
    url?: string; // Optional URL for CDN-hosted audio
}

interface PlaylistProps {
    tracks: Track[];
    currentTrackId: string | null;
    onTrackSelect: (trackId: string) => void;
    onTrackRemove: (trackId: string) => void;
}

export function Playlist({
    tracks,
    currentTrackId,
    onTrackSelect,
    onTrackRemove,
}: PlaylistProps) {
    if (tracks.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gray-800 rounded-3xl p-6 mt-6"
        >
            <h3 className="text-lg font-semibold text-white mb-4">Playlist</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {tracks.map((track, index) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${currentTrackId === track.id
                                ? "bg-purple-500/20 border border-purple-500/50"
                                : "bg-gray-700/50 hover:bg-gray-700"
                            }`}
                        onClick={() => onTrackSelect(track.id)}
                    >
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${currentTrackId === track.id
                                    ? "bg-purple-500"
                                    : "bg-gray-600 group-hover:bg-purple-500/50"
                                }`}
                        >
                            {currentTrackId === track.id ? (
                                <Play size={20} className="text-white" fill="white" />
                            ) : (
                                <Music2 size={20} className="text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {track.name}
                            </p>
                            <p className="text-xs text-gray-400">
                                {Math.floor(track.duration / 60)}:
                                {Math.floor(track.duration % 60)
                                    .toString()
                                    .padStart(2, "0")}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTrackRemove(track.id);
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/5 hover:bg-red-500/30 flex items-center justify-center group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} className="text-red-400" />
                        </motion.button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
