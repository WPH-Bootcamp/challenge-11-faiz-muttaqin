"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Music2,
} from "lucide-react";

type PlayerState = "playing" | "paused" | "loading";

export function MusicPlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>("paused");
  const [progress, setProgress] = useState(23); // Current progress in seconds
  const [volume, setVolume] = useState(70);

  const duration = 205; // Total duration in seconds (3:25)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause toggle with loading state
  const handlePlayPause = () => {
    if (playerState === "loading") return;

    setPlayerState("loading");
    setTimeout(() => {
      setPlayerState(playerState === "playing" ? "paused" : "playing");
    }, 500);
  };

  // Simulate progress when playing
  useEffect(() => {
    if (playerState === "playing") {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < duration ? prev + 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playerState, duration]);

  // Motion variants for container
  const containerVariants = {
    playing: {
      background: "#1f2937",
      boxShadow: "0 20px 60px rgba(139, 92, 246, 0.3)",
      transition: { duration: 0.3 },
    },
    paused: {
      background: "#1f2937",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.3 },
    },
    loading: {
      background: "#1f2937",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.3 },
    },
  };

  // Motion variants for album artwork
  const artworkVariants = {
    playing: {
      scale: 1,
      rotate: 360,
      transition: {
        scale: { duration: 0.3, type: "spring" },
        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
      },
    },
    paused: {
      scale: 0.95,
      rotate: 0,
      transition: {
        scale: { duration: 0.3, type: "spring" },
        rotate: { duration: 0.3 },
      },
    },
    loading: {
      scale: 0.9,
      rotate: 0,
      transition: {
        scale: { duration: 0.3, type: "spring" },
        rotate: { duration: 0.3 },
      },
    },
  };

  // Equalizer bar component
  const EqualizerBar = ({ index }: { index: number }) => {
    const barVariants = {
      playing: {
        height: ["20%", "100%", "20%"],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.1,
        },
      },
      paused: {
        height: "20%",
        opacity: 1,
        transition: { duration: 0.3 },
      },
      loading: {
        height: "50%",
        opacity: 0.5,
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        variants={barVariants}
        animate={playerState}
        className="w-3 bg-purple-500 rounded-t-sm"
        style={{ minHeight: "8px" }}
      />
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      animate={playerState}
      className="w-full max-w-[500px] rounded-3xl p-8 shadow-2xl"
    >
      {/* Album Artwork */}
      <div className="flex items-start gap-6 mb-6">
        <motion.div
          variants={artworkVariants}
          animate={playerState}
          className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden"
        >
          <Music2 size={40} className="text-gray-900 opacity-70" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white mb-1 truncate">
            Awesome Song Title
          </h2>
          <p className="text-sm text-gray-400 truncate">Amazing Artist</p>
        </div>
      </div>

      {/* Equalizer Bars */}
      <div className="flex items-end justify-start gap-2 h-20 mb-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <EqualizerBar key={index} index={index} />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background:
                playerState === "playing"
                  ? "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)"
                  : "#6b7280",
            }}
            initial={{ width: `${(progress / duration) * 100}%` }}
            animate={{ width: `${(progress / duration) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Shuffle"
        >
          <Shuffle size={20} />
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Previous"
        >
          <SkipBack size={24} />
        </motion.button>

        <motion.button
          whileHover={
            playerState !== "loading" ? { scale: 1.05 } : undefined
          }
          whileTap={playerState !== "loading" ? { scale: 0.95 } : undefined}
          onClick={handlePlayPause}
          disabled={playerState === "loading"}
          className={`w-15 h-15 rounded-full flex items-center justify-center transition-colors ${
            playerState === "loading"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-500"
          }`}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          aria-label={playerState === "playing" ? "Pause" : "Play"}
        >
          <AnimatePresence mode="wait">
            {playerState === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
              >
                <div className="w-15 h-15 p-0 border-3 border-gray-400 border-t-white rounded-full" />
              </motion.div>
            ) : playerState === "playing" ? (
              <motion.div
                key="pause"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Pause size={28} className="text-white" fill="white" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Play size={28} className="text-white" fill="white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Next"
        >
          <SkipForward size={24} />
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Repeat"
        >
          <Repeat size={20} />
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 size={18} className="text-gray-400 shrink-0" />
        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-6 appearance-none bg-transparent cursor-pointer volume-slider"
            style={
              {
                "--volume-width": `${volume}%`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      <style jsx>{`
        .volume-slider::-webkit-slider-track {
          width: 100%;
          height: 6px;
          background: linear-gradient(
            to right,
            #a855f7 0%,
            #a855f7 var(--volume-width),
            #374151 var(--volume-width),
            #374151 100%
          );
          border-radius: 9999px;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -5px;
        }

        .volume-slider::-moz-range-track {
          width: 100%;
          height: 6px;
          background: #374151;
          border-radius: 9999px;
        }

        .volume-slider::-moz-range-progress {
          height: 6px;
          background: #a855f7;
          border-radius: 9999px;
        }

        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }

        .volume-slider:hover::-webkit-slider-track {
          background: linear-gradient(
            to right,
            #ec4899 0%,
            #ec4899 var(--volume-width),
            #374151 var(--volume-width),
            #374151 100%
          );
        }

        .volume-slider:hover::-moz-range-progress {
          background: #ec4899;
        }
      `}</style>
    </motion.div>
  );
}
