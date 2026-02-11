"use client";

import { useCallback, useState } from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
import { motion } from "motion/react";

interface FileUploadProps {
    onFilesAdded: (files: File[]) => void;
    onUrlAdded: (url: string) => void;
}

export function FileUpload({ onFilesAdded, onUrlAdded }: FileUploadProps) {
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith("audio/")
            );
            if (files.length > 0) {
                onFilesAdded(files);
            }
        },
        [onFilesAdded]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []).filter((file) =>
                file.type.startsWith("audio/")
            );
            if (files.length > 0) {
                onFilesAdded(files);
            }
        },
        [onFilesAdded]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative border-2 border-dashed border-gray-600 rounded-3xl p-12 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-800/50"
        >
            <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center"
                >
                    <Upload size={32} className="text-purple-500" />
                </motion.div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                        Drop your audio files here
                    </h3>
                    <p className="text-sm text-gray-400">
                        or click to browse audio files
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
