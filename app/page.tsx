"use client";

import React, { useState, useEffect, useRef } from "react";

// Premium simulated AI checkpoints matching our luxury archival pipeline
const ANALYSIS_CHECKPOINTS = [
  { id: 1, text: "Checking image blur variance..." },
  { id: 2, text: "Verifying exposure thresholds..." },
  { id: 3, text: "Analyzing face metadata..." },
  { id: 4, text: "Running color harmony assessment..." },
  { id: 5, text: "Structuring archival metadata..." },
];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  progress: number; // 0 to 100
  checkpointIndex: number; // 0 to 4
  status: "idle" | "uploading" | "analyzing" | "completed" | "error";
  errorMessage?: string;
  backendResult?: {
    is_blurry: boolean;
    blur_score: number;
    exposure: string;
    passed_quality: boolean;
    agent_metrics?: {
      face_count: number;
      eyes_closed: boolean;
      is_smiling: boolean;
      scene_context: string;
      suggested_caption: string;
    };
  };
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [useLocalBackend, setUseLocalBackend] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated backend processing triggers with luxury rolling status checkpoints
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    files.forEach((file) => {
      if (file.status === "analyzing") {
        const interval = setInterval(() => {
          setFiles((prevFiles) =>
            prevFiles.map((f) => {
              if (f.id !== file.id) return f;

              // If the file is no longer analyzing (e.g. backend completed or errored), stop simulation
              if (f.status !== "analyzing") {
                clearInterval(interval);
                return f;
              }

              const nextCheckpointIndex = f.checkpointIndex + 1;
              if (nextCheckpointIndex >= ANALYSIS_CHECKPOINTS.length) {
                // Completed premium archival processing!
                clearInterval(interval);
                return {
                  ...f,
                  checkpointIndex: ANALYSIS_CHECKPOINTS.length - 1,
                  progress: 100,
                  status: "completed",
                  backendResult: {
                    is_blurry: false,
                    blur_score: 135.2,
                    exposure: "normal",
                    passed_quality: true,
                    agent_metrics: {
                      face_count: 1,
                      eyes_closed: false,
                      is_smiling: true,
                      scene_context: "An elegant portrait with warm visual lighting and deep sepia accents.",
                      suggested_caption: "A timeless visage, bathed in twilight's gentle grace, immortalized in the grand registry of memory."
                    }
                  }
                };
              }

              return {
                ...f,
                checkpointIndex: nextCheckpointIndex,
                progress: Math.min(95, (nextCheckpointIndex / ANALYSIS_CHECKPOINTS.length) * 100),
              };
            })
          );
        }, 1600); // 1.6 seconds per checkpoint for a deliberate, luxurious processing flow

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach((i) => clearInterval(i));
    };
  }, [files]);

  // Drag-and-drop handers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFileList = (fileList: FileList) => {
    const rawFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));

    const newFiles: UploadedFile[] = rawFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      checkpointIndex: 0,
      status: "analyzing",
    }));

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      addLog(`Enqueued ${newFiles.length} luxury asset(s) for archival preservation.`);

      if (useLocalBackend) {
        newFiles.forEach((fileObj, index) => {
          triggerLocalBackendAnalysis(fileObj, rawFiles[index]);
        });
      }
    }
  };

  const triggerLocalBackendAnalysis = async (fileObj: UploadedFile, file: File) => {
    addLog(`[Local Bridge] Sending payload for ${fileObj.name} to /api/analyze...`);
    try {
      const formData = new FormData();
      formData.append("pipeline", "quality-check");
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned status code ${response.status}`);
      }

      const data = await response.json();
      addLog(`[Local Bridge] OpenCV analysis completed for ${fileObj.name}: ${JSON.stringify(data)}`);

      setFiles((prevFiles) =>
        prevFiles.map((f) => {
          if (f.id !== fileObj.id) return f;
          return {
            ...f,
            status: "completed",
            progress: 100,
            checkpointIndex: ANALYSIS_CHECKPOINTS.length - 1,
            backendResult: {
              is_blurry: data.is_blurry,
              blur_score: data.blur_score,
              exposure: data.exposure,
              passed_quality: data.passed_quality,
              agent_metrics: data.agent_metrics,
            },
          };
        })
      );
    } catch (err: any) {
      const errMsg = err.message || "Connection failed";
      addLog(`[Local Bridge] Connection to /api/analyze failed (Check backend): ${errMsg}`);
      setFiles((prevFiles) =>
        prevFiles.map((f) => {
          if (f.id !== fileObj.id) return f;
          return {
            ...f,
            status: "error",
            errorMessage: errMsg,
          };
        })
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(e.target.files);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const clearQueue = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setApiLogs([]);
    addLog("Archival workspace and logs successfully cleared.");
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiLogs((prev) => [`[${timestamp}] ${msg}`, ...prev]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream font-sans antialiased text-navy">

      {/* Premium Minimalist Header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-gold/15 px-6 py-4 md:px-12 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Elegant Serif Logo Container */}
          <div className="flex items-center gap-3.5 group">
            <div className="h-10 w-10 rounded-full bg-navy flex items-center justify-center border border-gold/40 shadow-inner group-hover:border-gold transition-all duration-300">
              <span className="font-serif text-cream font-semibold text-lg tracking-widest">M</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif font-medium text-2xl tracking-wide text-navy flex items-center gap-1">
                Memory<span className="text-gold italic font-normal">Lane</span>
              </h1>
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-navy/60 -mt-0.5">
                AI Preservation Suite
              </span>
            </div>
          </div>

          {/* Right Controls - Toggle & Premium Profile Indicator */}
          <div className="flex items-center gap-6">

            {/* Simulation/Local Pipeline Mode Switcher */}
            <div className="flex items-center gap-3 bg-white/50 py-1.5 px-3.5 rounded-full border border-gold/20 shadow-sm">
              <span className="text-xs font-medium text-navy/80 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${useLocalBackend ? "bg-emerald-500 animate-pulse" : "bg-gold animate-pulse"}`} />
                {useLocalBackend ? "Local Pipeline" : "Simulation"}
              </span>
              <button
                onClick={() => {
                  setUseLocalBackend(!useLocalBackend);
                  addLog(`Switched pipeline engine to ${!useLocalBackend ? "Local OpenCV Pipeline (/api/analyze)" : "Internal Simulated Neural Engine"}`);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${useLocalBackend ? "bg-emerald-600" : "bg-gold"
                  }`}
                aria-label="Toggle pipeline engine"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-cream shadow-sm transition duration-300 ease-in-out ${useLocalBackend ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            {/* Smooth Premium Profile Indicator */}
            <div className="relative group">
              <div className="h-9 w-9 rounded-full border border-gold/30 hover:border-gold cursor-pointer transition-all duration-300 flex items-center justify-center bg-white shadow-sm overflow-hidden hover:scale-105 active:scale-95">
                <svg className="w-4 h-4 text-navy/70 group-hover:text-gold transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute right-0 top-11 bg-white border border-gold/25 p-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[120px] z-50 text-center">
                <span className="text-[10px] font-semibold text-navy uppercase tracking-wider">Archivist Profile</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Primary Dashboard Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 md:px-12 flex flex-col gap-12">

        {/* Editorial Studio Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gold/15 pb-8">
          <div>
            <span className="text-[11px] uppercase tracking-[0.4em] font-semibold text-gold mb-1 block">Luxury Photographic Vault</span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-navy tracking-tight leading-none">
              Aesthetic Archive <span className="italic text-gold font-normal">Studio</span>
            </h2>
            <p className="text-navy/70 mt-3.5 max-w-xl text-sm md:text-base leading-relaxed">
              Upload files to initiate our computer vision scanning sequence. The high-fidelity system verifies clarity, evaluates chromatic balance, and structures metadata.
            </p>
          </div>
          {files.length > 0 && (
            <button
              onClick={clearQueue}
              className="px-5 py-2.5 rounded-lg border border-gold/30 text-gold bg-navy hover:bg-charcoal text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md self-start md:self-auto hover:border-gold hover:-translate-y-0.5 active:translate-y-0"
            >
              Reset Workspace
            </button>
          )}
        </div>

        {/* Dashboard Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main workspace section (Dropzone & Cards Grid) */}
          <div className="lg:col-span-2 flex flex-col gap-10">

            {/* Interactive Drag-and-Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerSelect}
              className={`relative border border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-500 flex flex-col items-center justify-center min-h-[340px] overflow-hidden group shadow-sm bg-white/70 backdrop-blur-sm ${isDragging
                ? "border-gold bg-gold/5 scale-[0.99] ring-4 ring-gold/10"
                : "border-gold/30 hover:border-gold hover:bg-gold/[0.02]"
                }`}
            >
              {/* Elegant Luxury Corner Brackets */}
              <div className="absolute top-5 left-5 w-5 h-5 border-t border-l border-gold/40 group-hover:border-gold transition-colors duration-300" />
              <div className="absolute top-5 right-5 w-5 h-5 border-t border-r border-gold/40 group-hover:border-gold transition-colors duration-300" />
              <div className="absolute bottom-5 left-5 w-5 h-5 border-b border-l border-gold/40 group-hover:border-gold transition-colors duration-300" />
              <div className="absolute bottom-5 right-5 w-5 h-5 border-b border-r border-gold/40 group-hover:border-gold transition-colors duration-300" />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*"
                className="hidden"
              />

              <div className="h-16 w-16 rounded-full bg-cream border border-gold/25 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:border-gold transition-all duration-500">
                <svg className="w-6 h-6 text-gold group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" />
                </svg>
              </div>

              <h3 className="font-serif text-2xl font-normal text-navy mb-2 tracking-wide">
                Deposit Premium Imagery
              </h3>
              <p className="text-xs md:text-sm text-navy/60 max-w-sm mb-6 leading-relaxed">
                Drag and drop JPG, PNG or WEBP legacy assets directly onto this area, or browse local directories.
              </p>

              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gold bg-gold/5 px-5 py-2.5 rounded-md border border-gold/20 group-hover:bg-gold group-hover:text-navy transition-all duration-300">
                Browse System Files
              </div>
            </div>

            {/* Active uploading grid */}
            {files.length > 0 && (
              <div className="flex flex-col gap-6">
                <h3 className="font-serif text-2xl font-normal text-navy flex items-center gap-3">
                  <span>Archival Registry Ledger</span>
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                    {files.length} active process{files.length > 1 ? "es" : ""}
                  </span>
                </h3>

                {/* Grid of responsive progress cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {files.map((file) => {
                    const activeCheckpoint = ANALYSIS_CHECKPOINTS[file.checkpointIndex];

                    return (
                      <div
                        key={file.id}
                        className="bg-white rounded-xl overflow-hidden border border-gold/15 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col group"
                      >
                        {/* Placeholder/Actual Image Thumbnail Frame */}
                        <div className="relative h-48 w-full bg-charcoal overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-1000 ease-out"
                          />
                          {/* Rich dark gradient vignette overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/10 to-transparent" />

                          {/* Top Premium Badge Status */}
                          <div className="absolute top-4 right-4">
                            <span
                              className={`text-[9px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${file.status === "completed"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                                : file.status === "error"
                                  ? "bg-red-950/80 text-red-300 border-red-500/30"
                                  : "bg-navy/90 text-gold border-gold/30 animate-pulse"
                                }`}
                            >
                              {file.status === "completed" ? "Preserved" : file.status === "error" ? "Failed" : "Analyzing"}
                            </span>
                          </div>

                          {/* Card Footer overlay containing asset info */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-cream">
                            <div className="truncate max-w-[80%]">
                              <p className="font-serif text-base truncate pr-2 tracking-wide font-medium">{file.name}</p>
                              <p className="text-[10px] text-cream/60 mt-0.5 tracking-wider">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB • RAW Asset
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Analysis progress body with loading animations */}
                        <div className="p-6 flex-grow flex flex-col gap-4 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {file.status === "error" ? (
                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              ) : file.status !== "completed" ? (
                                // Premium luxury loading spinner animation
                                <div className="h-4 w-4 rounded-full border border-gold border-t-transparent animate-spin" />
                              ) : (
                                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="text-[10px] font-bold text-navy uppercase tracking-widest">
                                {file.status === "completed" ? "Analysis Archived" : file.status === "error" ? "Evaluation Failed" : "Pipeline Evaluation"}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gold font-mono">{Math.round(file.progress)}%</span>
                          </div>

                          {/* Premium Progress Bar with Gold Gradient */}
                          <div className="w-full h-[3px] bg-cream rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ease-out rounded-full ${file.status === "error"
                                ? "bg-red-500"
                                : "bg-gradient-to-r from-gold to-yellow-600"
                                }`}
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>

                          {/* Animated Checkpoints display */}
                          <div className="bg-cream/40 p-4 rounded-lg border border-gold/10 flex flex-col gap-2 mt-1">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-navy/40 block">Current Status Checkpoint</span>
                            <div className="text-xs font-serif italic text-navy/90 transition-all duration-300 min-h-[1.5rem] flex flex-col justify-center">
                              {file.status === "error" ? (
                                <span className="text-red-600 font-sans not-italic text-[11px] font-semibold leading-relaxed">
                                  Error: {file.errorMessage || "Analysis failed."}
                                </span>
                              ) : (
                                <p>{activeCheckpoint ? activeCheckpoint.text : "Awaiting scanner calibration..."}</p>
                              )}
                            </div>

                            {/* Rolling timeline steps indicator */}
                            <div className="flex gap-1.5 mt-2.5">
                              {ANALYSIS_CHECKPOINTS.map((cp, idx) => (
                                <div
                                  key={cp.id}
                                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${file.status === "error"
                                    ? "bg-red-200"
                                    : idx <= file.checkpointIndex
                                      ? file.status === "completed"
                                        ? "bg-emerald-500"
                                        : "bg-gold"
                                      : "bg-navy/10"
                                    }`}
                                />
                              ))}
                            </div>

                            {/* Real OpenCV metrics display */}
                            {file.backendResult && file.status === "completed" && (
                              <div className="mt-3 pt-3 border-t border-gold/10 grid grid-cols-2 gap-3 text-[10px] font-mono">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold">Blur Score</span>
                                  <span className={file.backendResult.is_blurry ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                                    {file.backendResult.blur_score} ({file.backendResult.is_blurry ? "Blurry" : "Sharp"})
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold">Exposure</span>
                                  <span className={file.backendResult.exposure === "normal" ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"}>
                                    {file.backendResult.exposure.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5 col-span-2">
                                  <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold">Preservation Verdict</span>
                                  <span className={file.backendResult.passed_quality ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"}>
                                    {file.backendResult.passed_quality ? "PASSED QUALITY CONTROLS" : "FAILED QUALITY CONTROLS"}
                                  </span>
                                </div>

                                {/* Luxury Agent Metrics Row & Caption */}
                                {file.backendResult.agent_metrics && (
                                  <>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold">Detected Faces</span>
                                      <span className="text-navy font-bold">
                                        {file.backendResult.agent_metrics.face_count}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold">Expressions</span>
                                      <span className="text-navy font-bold">
                                        {file.backendResult.agent_metrics.is_smiling ? "Smiling" : "Neutral"} / {file.backendResult.agent_metrics.eyes_closed ? "Closed Eyes" : "Open Eyes"}
                                      </span>
                                    </div>
                                    {file.backendResult.agent_metrics.suggested_caption && (
                                      <div className="flex flex-col gap-1 col-span-2 mt-2 pt-2 border-t border-gold/15 border-dashed font-sans">
                                        <span className="text-navy/50 uppercase tracking-wider text-[8px] font-bold font-mono">Suggested Caption</span>
                                        <p className="font-serif italic text-navy/95 text-[11px] leading-relaxed border-l-2 border-gold/40 pl-2">
                                          &ldquo;{file.backendResult.agent_metrics.suggested_caption}&rdquo;
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Luxury Sidebar: Settings & System Pipeline Logs */}
          <div className="flex flex-col gap-10">

            {/* Fine settings panel */}
            <div className="bg-white rounded-2xl p-6 border border-gold/15 shadow-sm flex flex-col gap-5">
              <h3 className="font-serif text-lg font-normal text-navy tracking-wide border-b border-gold/15 pb-3">
                Archival Configuration
              </h3>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-cream/50 border border-gold/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy">OpenCV Bridge Link</span>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${useLocalBackend ? "bg-emerald-100 text-emerald-800" : "bg-gold/10 text-gold"}`}>
                      {useLocalBackend ? "Online" : "Simulated"}
                    </span>
                  </div>
                  <p className="text-[11px] text-navy/70 leading-relaxed">
                    Redirects payloads through the local Python computer vision pipeline to isolate metrics at <code>/api/analyze</code>.
                  </p>
                </div>

                <div className="text-[11px] text-navy/60 flex flex-col gap-2 bg-cream/20 p-3 rounded-lg border border-gold/5">
                  <span className="font-semibold uppercase tracking-widest text-navy/80 text-[10px]">Active Filters:</span>
                  <ul className="space-y-1.5 list-none">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gold" />
                      {"Laplacian Blur Threshold > 100"}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gold" />
                      Luminance Range Checker
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gold" />
                      Haar Feature Face Vectoring
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Premium Dark Terminal Stream */}
            <div className="bg-charcoal text-cream rounded-2xl p-6 shadow-xl border border-gold/25 flex flex-col h-[380px]">
              <div className="flex items-center justify-between border-b border-cream/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
                  <span className="text-[10px] font-mono font-semibold tracking-widest text-cream/80">PIPELINE TELEMETRY</span>
                </div>
                <button
                  onClick={() => setApiLogs([])}
                  className="text-[9px] text-gold/60 hover:text-gold transition-colors uppercase font-mono font-bold"
                >
                  Reset Stream
                </button>
              </div>

              <div className="font-mono text-[11px] overflow-y-auto flex-grow space-y-2.5 pr-2 select-none">
                {apiLogs.length === 0 ? (
                  <p className="text-cream/30 italic text-center py-12">System idle. Ready to analyze incoming assets...</p>
                ) : (
                  apiLogs.map((log, index) => (
                    <div key={index} className="border-l border-gold/30 pl-2 leading-relaxed text-cream/90">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Luxury Footer */}
      <footer className="mt-auto border-t border-gold/10 py-8 text-center text-[10px] text-navy/40 bg-white/40 backdrop-blur-sm">
        <p className="uppercase tracking-[0.2em] font-medium">&copy; {new Date().getFullYear()} MemoryLane Premium AI Platform. Localized OpenCV Photometric Suite.</p>
      </footer>
    </div>
  );
}
