import React, { useState, useCallback, useRef, useEffect } from "react";
import type { SpecialDay, User, Celebration } from "../types";
import { generateDecorationIdeasStream, generateCelebrationDetailsFromImage } from "../services/geminiService";
import { celebrationService } from "../services/celebrationService";
import { SparklesIcon, LoadingSpinner, CheckCircleIcon, CameraIcon, XIcon } from "./icons";

const SectionShell: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <section className="rounded-3xl bg-surface-light px-6 py-6 shadow-brand ring-1 ring-white/50">
        {(title || subtitle) && (
            <header className="mb-4 space-y-1">
                {title && <h2 className="text-lg font-semibold text-ink-900">{title}</h2>}
                {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
            </header>
        )}
        {children}
    </section>
);

const AIGenerator: React.FC<{ theme: string }> = ({ theme }) => {
    const [items, setItems] = useState("");
    const [skill, setSkill] = useState("Beginner");
    const [time, setTime] = useState("Under 30 minutes");
    const [suggestion, setSuggestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError("");
        setSuggestion("");

        try {
            let fullText = "";
            for await (const chunk of generateDecorationIdeasStream(theme, items, skill, time)) {
                fullText += chunk;
                setSuggestion(fullText);
            }
        } catch (err) {
            setError("Failed to generate ideas. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [theme, items, skill, time]);

    return (
        <SectionShell
            title="Need a little inspiration?"
            subtitle={`Describe what you have on hand and we'll dream up ${theme.toLowerCase()} ideas.`}
        >
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
                    <SparklesIcon className="h-4 w-4" />
                    Creative mode
                </div>
                <textarea
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    placeholder="Color paper, string lights, mason jars..."
                    className="w-full rounded-2xl border border-transparent bg-white/70 p-4 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    rows={3}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <select
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-white/70 px-4 py-3 text-sm font-medium text-ink-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Expert</option>
                    </select>
                    <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-white/70 px-4 py-3 text-sm font-medium text-ink-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option>Under 30 minutes</option>
                        <option>1-2 hours</option>
                        <option>Make it an afternoon</option>
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                    {isLoading ? "Thinking..." : "Generate decoration ideas"}
                </button>
                {(suggestion || isLoading) && (
                    <div className="min-h-[5rem] rounded-2xl bg-white/70 p-4 font-mono text-sm text-ink-700">
                        {suggestion}
                        {isLoading && !suggestion && (
                            <span className="ml-1 inline-block h-4 w-2 animate-blink bg-primary" />
                        )}
                    </div>
                )}
                {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            </div>
        </SectionShell>
    );
};

const CameraView: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices?.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                    }
                } else {
                    setError("Camera not supported on this device.");
                }
            } catch (err) {
                setError("Could not access camera. Check permissions.");
                console.error(err);
            }
        };

        startCamera();
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            onCapture(canvas.toDataURL("image/jpeg"));
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900/80 backdrop-blur">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            {error && <p className="absolute top-4 rounded-full bg-red-500/80 px-4 py-2 text-sm text-white">{error}</p>}
            <button onClick={onClose} className="absolute right-6 top-6 text-white">
                <XIcon className="h-8 w-8" />
            </button>
            <button onClick={handleCapture} className="absolute bottom-10 h-20 w-20 rounded-full border-4 border-white bg-white/70 shadow-brand" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

interface CreateViewProps {
    user: User;
    specialDay: SpecialDay;
    onCelebrationCreated: (celebration: Celebration) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({ user, specialDay, onCelebrationCreated }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerateDetails = async () => {
        if (!imagePreview) return;
        setIsGeneratingDetails(true);
        setError("");
        try {
            const [metadata, base64Data] = imagePreview.split(",");
            const mimeType = metadata.match(/:(.*?);/)?.[1];
            if (!mimeType || !base64Data) throw new Error("Invalid image format");

            const result = await generateCelebrationDetailsFromImage(base64Data, mimeType, specialDay.title);
            setTitle(result.title);
            setDescription(result.description);
        } catch (err) {
            setError(err instanceof Error ? err.message : "AI generation failed.");
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    const handleSubmit = async () => {
        e.preventDefault();
        if (!title || !description || !imagePreview) {
            setError("Please add a photo, title, and description.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const newCelebration = await celebrationService.createCelebration({
                title,
                description,
                imageUrl: imagePreview,
            }, user);

            setIsSuccess(true);
            setTimeout(() => onCelebrationCreated(newCelebration), 2000);
        } catch (err) {
            setError("Failed to post celebration. Please try again.");
            console.error(err);
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background-light px-6 text-center text-ink-900">
                <CheckCircleIcon className="mb-6 h-16 w-16 text-primary" />
                <h2 className="text-3xl font-semibold">Celebration posted!</h2>
                <p className="mt-2 text-sm text-ink-500">Jumping back to the neighborhood map so you can see it live.</p>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light text-ink-900">
            {isCameraOpen && <CameraView onCapture={setImagePreview} onClose={() => setIsCameraOpen(false)} />}

            <header className="sticky top-0 z-20 border-b border-white/60 bg-background-light/90 px-5 py-4 backdrop-blur">
                <div className="flex items-center justify-center">
                    <h1 className="text-base font-semibold uppercase tracking-[0.3em] text-ink-500">Create</h1>
                </div>
            </header>

            <main className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-6">
                <SectionShell>
                    <div className="space-y-5 text-center">
                        <div className="inline-flex items-center gap-3 rounded-full bg-primary/15 px-5 py-2 text-sm font-semibold text-primary">
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">{specialDay.title.charAt(0)}</span>
                            <span>Today: {specialDay.title}</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold text-ink-900">Share your celebration</h2>
                            <p className="text-sm text-ink-500">Snap a photo, add a few details, and inspire neighbors to join in.</p>
                        </div>
                    </div>
                </SectionShell>

                <AIGenerator theme={specialDay.title} />

                <SectionShell title="Tell the neighborhood" subtitle="A photo helps your celebration pop to the top of the map.">
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white/70 px-6 py-10 text-center">
                            {imagePreview ? (
                                <div className="relative w-full max-w-sm">
                                    <img src={imagePreview} alt="Preview" className="w-full rounded-2xl object-cover shadow-brand" />
                                    <button
                                        type="button"
                                        onClick={() => setImagePreview(null)}
                                        className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-white shadow-lg"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-ink-500">Feature a photo from today's celebration</p>
                                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-700 shadow-brand transition hover:-translate-y-0.5">
                                            Upload from device
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCameraOpen(true)}
                                            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-700 shadow-brand transition hover:-translate-y-0.5"
                                        >
                                            <CameraIcon className="h-5 w-5" />
                                            Use camera
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {imagePreview && (
                            <button
                                type="button"
                                onClick={handleGenerateDetails}
                                disabled={isGeneratingDetails}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary/15 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
                            >
                                {isGeneratingDetails ? <LoadingSpinner className="h-4 w-4" /> : <SparklesIcon className="h-5 w-5" />}
                                {isGeneratingDetails ? "Generating..." : "Let AI suggest a title & description"}
                            </button>
                        )}

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What should we call it?"
                                className="w-full rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm font-medium text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                                disabled={isLoading}
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Share a quick story, tip, or invitation..."
                                rows={4}
                                className="w-full rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                                disabled={isLoading}
                            />
                        </div>

                        {error && <p className="text-center text-sm font-semibold text-red-500">{error}</p>}

                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-60"
                            disabled={isLoading || !imagePreview}
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="h-5 w-5" />
                                    Posting...
                                </>
                            ) : (
                                "Post celebration"
                            )}
                        </button>
                    </div>
                </SectionShell>
            </main>
        </div>
    );
};
