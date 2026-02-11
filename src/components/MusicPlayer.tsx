"use client";

import { useState, useEffect, useRef } from "react";
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
import type { Track } from "./Playlist";
import { Slider } from "@/components/ui/slider";

type PlayerState = "playing" | "paused" | "loading";

interface MusicPlayerProps {
  currentTrack: Track | null;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MusicPlayer({
  currentTrack,
  onNext,
  onPrevious,
}: MusicPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>("paused");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [frequencyData, setFrequencyData] = useState<number[]>([0, 0, 0, 0, 0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;

      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
        setProgress(0);
      });

      audioRef.current.addEventListener("timeupdate", () => {
        setProgress(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener("ended", () => {
        setPlayerState("paused");
        if (onNext) onNext();
      });
    }

    return () => {
      audioRef.current?.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new track
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      // Check if track has a URL (CDN) or file (local)
      const audioUrl = currentTrack.url || URL.createObjectURL(currentTrack.file);
      audioRef.current.src = audioUrl;
      if (currentTrack.url) {
        audioRef.current.crossOrigin = "anonymous";
      }
      audioRef.current.load();

      // Auto-play when track is loaded
      const handleCanPlay = () => {
        // Initialize Web Audio API before playing
        if (!audioContextRef.current) {
          console.log("🔧 Initializing Web Audio API (auto-play)...");
          initializeAudioContext();
        }

        // Resume AudioContext if suspended
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().then(() => {
            console.log("   AudioContext resumed, state:", audioContextRef.current?.state);
          });
        }

        audioRef.current?.play().then(() => {
          setPlayerState("playing");
          startVisualization();
          console.log("▶️ Auto-playing with visualization");
        }).catch((error) => {
          console.error("❌ Auto-play failed:", error);
          setPlayerState("paused");
        });
      };

      audioRef.current.addEventListener("canplay", handleCanPlay, { once: true });

      return () => {
        // Only revoke blob URLs, not CDN URLs
        if (!currentTrack.url) {
          URL.revokeObjectURL(audioUrl);
        }
        audioRef.current?.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Initialize Web Audio API
  const initializeAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -85;
      analyserRef.current.maxDecibels = -25;

      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      console.log("✅ Web Audio API initialized successfully");
      console.log("   - FFT Size:", analyserRef.current.fftSize);
      console.log("   - Frequency Bin Count:", analyserRef.current.frequencyBinCount);
      console.log("   - AudioContext state:", audioContextRef.current.state);
    } catch (error) {
      console.error("❌ Web Audio API initialization failed:", error);
    }
  };

  // Start frequency visualization
  const startVisualization = () => {
    if (!analyserRef.current) {
      console.warn("⚠️ Analyser not available");
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    console.log("🎵 Starting visualization, buffer length:", bufferLength);

    let frameCount = 0;

    const updateFrequencyData = () => {
      if (!analyserRef.current || playerState !== "playing") return;

      analyserRef.current.getByteFrequencyData(dataArray);

      frameCount++;

      // Debug every 60 frames (~1 second at 60fps)
      if (frameCount % 60 === 0) {
        // Log first 20 frequency bins to see what we're getting
        const sample = Array.from(dataArray.slice(0, 20));
        console.log("📊 Raw frequency data (first 20 bins):", sample);

        const maxValue = Math.max(...dataArray);
        const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        console.log(`   Max: ${maxValue}, Avg: ${avgValue.toFixed(1)}`);
      }

      // Use very specific and distinct frequency ranges
      const newFrequencyData: number[] = [];

      // Bar 1: Deep Bass (20-60Hz) - bins 1-3
      let max1 = 0;
      for (let i = 1; i <= 3; i++) {
        if (dataArray[i] > max1) max1 = dataArray[i];
      }
      newFrequencyData[0] = max1 / 255;

      // Bar 2: Bass (60-250Hz) - bins 4-12
      let max2 = 0;
      for (let i = 4; i <= 12; i++) {
        if (dataArray[i] > max2) max2 = dataArray[i];
      }
      newFrequencyData[1] = max2 / 255;

      // Bar 3: Low-Mid (250-500Hz) - bins 13-25
      let max3 = 0;
      for (let i = 13; i <= 25; i++) {
        if (dataArray[i] > max3) max3 = dataArray[i];
      }
      newFrequencyData[2] = max3 / 255;

      // Bar 4: Mid (500-2kHz) - bins 26-100
      let max4 = 0;
      for (let i = 26; i <= 100; i++) {
        if (dataArray[i] > max4) max4 = dataArray[i];
      }
      newFrequencyData[3] = max4 / 255;

      // Bar 5: High (2kHz-6kHz) - bins 101-300
      let max5 = 0;
      for (let i = 101; i <= 300; i++) {
        if (dataArray[i] > max5) max5 = dataArray[i];
      }
      newFrequencyData[4] = max5 / 255;

      // Log calculated values every second
      if (frameCount % 60 === 0) {
        console.log("🎚️ Bar values:", newFrequencyData.map((v, i) => `Bar${i + 1}=${v.toFixed(3)}`).join(", "));
      }

      setFrequencyData(newFrequencyData);
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    };

    updateFrequencyData();
  };

  // Stop frequency visualization
  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setFrequencyData([0, 0, 0, 0, 0]);
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!audioRef.current || !currentTrack || playerState === "loading") return;

    console.log("🎮 Play/Pause clicked, current state:", playerState);
    setPlayerState("loading");

    // Initialize Web Audio API on first play
    if (!audioContextRef.current) {
      console.log("🔧 Initializing Web Audio API...");
      initializeAudioContext();
    }

    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === "suspended") {
      console.log("▶️ Resuming suspended AudioContext...");
      await audioContextRef.current.resume();
      console.log("   AudioContext state:", audioContextRef.current.state);
    }

    try {
      if (playerState === "playing") {
        audioRef.current.pause();
        setPlayerState("paused");
        stopVisualization();
        console.log("⏸️ Paused");
      } else {
        await audioRef.current.play();
        setPlayerState("playing");
        startVisualization();
        console.log("▶️ Playing, visualization started");
      }
    } catch (error) {
      console.error("❌ Error playing audio:", error);
      setPlayerState("paused");
    }
  };

  // Sync with external play state changes
  useEffect(() => {
    if (audioRef.current) {
      if (playerState === "playing" && audioRef.current.paused) {
        if (!audioContextRef.current) {
          initializeAudioContext();
        }
        audioRef.current.play().catch(() => setPlayerState("paused"));
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
        startVisualization();
      } else if (playerState === "paused" && !audioRef.current.paused) {
        audioRef.current.pause();
        stopVisualization();
      }
    }
  }, [playerState]);

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

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


  // Equalizer bar component
  const EqualizerBar = ({ index }: { index: number }) => {
    // Use real frequency data for height animation, scaled by volume
    let frequencyValue = frequencyData[index] || 0; // Get the frequency value for this bar (0-1)
    const minHeight = 15; // Minimum height percentage
    const maxHeight = 85; // Maximum height percentage
    
    if (index !== 0){
      if (frequencyData[index] === frequencyData[0]) {
        frequencyValue = Math.random() * 0.3; // Small random value to avoid uniformity
      }
    }
    
    // Calculate height: minHeight + (frequency * range)
    const barHeight = playerState === "playing"
      ? minHeight + (frequencyValue * (maxHeight - minHeight))
      : minHeight;

    return (
      <motion.div
        animate={{
          height: `${barHeight}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
          mass: 0.6
        }}
        className="w-5 bg-purple-500 rounded-t-sm"
        style={{ minHeight: "12px" }}
      />
    );
  };

  const displayTitle = currentTrack?.name || "No track selected";
  const displayArtist = currentTrack ? "Local File" : "Add music to play";

  return (
    <motion.div
      variants={containerVariants}
      animate={playerState}
      className="w-full rounded-3xl p-12 shadow-2xl"
    >
      {/* Album Artwork */}
      <div className="flex items-start gap-8 mb-8">
        <div
          className="relative w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden"
        >
          <Music2 size={56} className="text-gray-900 opacity-70" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold text-white mb-2 truncate">
            {displayTitle}
          </h2>
          <p className="text-lg text-gray-400 truncate">{displayArtist}</p>
        </div>
      </div>

      {/* Equalizer Bars */}
      <div className="flex items-end justify-start gap-3 h-32 mb-8">
        {[0, 1, 2, 3, 4].map((index) => (
          <EqualizerBar key={index} index={index} />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div
          className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background:
                playerState === "playing"
                  ? "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)"
                  : "#6b7280",
            }}
            initial={{ width: `${(progress / duration) * 100}%` }}
            animate={{ width: `${(progress / duration) * 100 || 0}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400 font-medium">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Shuffle"
        >
          <Shuffle size={24} />
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          onClick={onPrevious}
          disabled={!onPrevious}
          className={`transition-colors ${onPrevious ? "text-gray-400" : "text-gray-600 cursor-not-allowed"
            }`}
          aria-label="Previous"
        >
          <SkipBack size={32} />
        </motion.button>

        <motion.button
          whileHover={
            playerState !== "loading" && currentTrack ? { scale: 1.05 } : undefined
          }
          whileTap={
            playerState !== "loading" && currentTrack ? { scale: 0.95 } : undefined
          }
          onClick={handlePlayPause}
          disabled={playerState === "loading" || !currentTrack}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${playerState === "loading" || !currentTrack
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
                transition={{
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                }}
              >
                <div className="w-8 h-8 border-3 border-gray-400 border-t-white rounded-full" />
              </motion.div>
            ) : playerState === "playing" ? (
              <motion.div
                key="pause"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Pause size={36} className="text-white" fill="white" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Play size={36} className="text-white ml-1" fill="white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          onClick={onNext}
          disabled={!onNext}
          className={`transition-colors ${onNext ? "text-gray-400" : "text-gray-600 cursor-not-allowed"
            }`}
          aria-label="Next"
        >
          <SkipForward size={32} />
        </motion.button>

        <motion.button
          whileHover={{ color: "#ffffff" }}
          className="text-gray-400 transition-colors"
          aria-label="Repeat"
        >
          <Repeat size={24} />
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4">
        <Volume2 size={24} className="text-gray-400 shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={(value) => setVolume(value[0])}
          max={100}
          step={1}
          className="flex-1"
        />
      </div>
    </motion.div>
  );
}
