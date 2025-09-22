import React, { useState, useCallback, useRef, useEffect } from "react";
import type { SpecialDay, User, Celebration } from "../types";
import { generateDecorationIdeasStream, generateCelebrationDetailsFromImage } from "../services/geminiService";
import { celebrationService } from "../services/celebrationService";
import { SparklesIcon, LoadingSpinner, CheckCircleIcon, CameraIcon, XIcon } from "./icons";

const SectionCard: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; tone?: "default" | "muted" }> = ({ title, subtitle, children, tone = "default" }) => (
    <section className={`surface-card ${tone === "muted" ? "surface-card--tight" : ""} px-6 py-6 space-y-5`}>
        {(title || subtitle) && (
            <header className="space-y-1">
                {title && <h2 className="text-heading text-xl">{title}</h2>}
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
        <SectionCard title="Need a little inspiration?" subtitle={`Tell us what you have and we'll shape ${theme.toLowerCase()} ideas.`}>
            <div className="flex flex-col gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-primary">
                    <SparklesIcon className="h-4 w-4" /> Creative mode
                </span>
                <textarea
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    placeholder="Cardboard, string lights, chalk, mason jars..."
                    className="rounded-2xl border border-transparent bg-white/80 p-4 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    rows={3}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <select
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        className="rounded-xl border border-transparent bg-white/80 px-4 py-3 text-sm font-medium text-ink-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Expert</option>
                    </select>
                    <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="rounded-xl border border-transparent bg-white/80 px-4 py-3 text-sm font-medium text-ink-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option>Under 30 minutes</option>
                        <option>1-2 hours</option>
                        <option>Make it an afternoon</option>
                    </select>
                </div>
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="pill-button pill-accent w-full justify-center"
                >
                    {isLoading ? "Thinking..." : "Generate decoration ideas"}
                </button>
                {(suggestion || isLoading) && (
                    <div className="min-h-[5rem] rounded-2xl bg-white/80 p-4 font-mono text-sm leading-relaxed text-ink-700">
                        {suggestion}
                        {isLoading && !suggestion && <span className="ml-1 inline-block h-4 w-2 animate-blink bg-primary" />}
                    </div>
                )}
                {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            </div>
        </SectionCard>
    );
};

const CameraOverlay: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
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
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-ink-900/85 backdrop-blur">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            {error && <p className="absolute top-6 rounded-full bg-red-500/80 px-4 py-2 text-sm text-white">{error}</p>}
            <button onClick={onClose} className="absolute right-8 top-8 text-white">
                <XIcon className="h-8 w-8" />
            </button>
            <button onClick={handleCapture} className="absolute bottom-12 h-20 w-20 rounded-full border-4 border-white bg-white/80 shadow-brand" />
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
            <div className="flex w-full justify-center">
                <div className="glass-panel flex max-w-md flex-col items-center gap-4 px-10 py-12 text-center text-ink-900">
                    <CheckCircleIcon className="h-14 w-14 text-primary" />
                    <h2 className="text-heading text-2xl">Celebration posted!</h2>
                    <p className="text-sm text-ink-500">Jumping back to the neighborhood map so you can see it live.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-8 text-ink-900">
            {isCameraOpen && <CameraOverlay onCapture={setImagePreview} onClose={() => setIsCameraOpen(false)} />}

            <SectionCard tone="muted">
                <div className="flex flex-col items-center gap-4 text-center">
                    <span className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink-700 shadow-brand">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">{specialDay.title.charAt(0)}</span>
                        Today: {specialDay.title}
                    </span>
                    <h1 className="text-heading text-3xl">Share your celebration</h1>
                    <p className="max-w-md text-sm text-ink-500">
                        Post a moment from today and inspire neighbors to join in.
                    </p>
                </div>
            </SectionCard>

            <SectionCard title="What are you sharing?" subtitle="A photo helps your celebration pop to the top of the map.">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white/80 px-6 py-10 text-center">
                        {imagePreview ? (
                            <div className="relative w-full max-w-sm">
                                <img src={imagePreview} alt="Preview" className="w-full rounded-2xl object-cover shadow-brand" />
                                <button
                                    type="button"
                                    onClick={() => setImagePreview(null)}
                                    className="absolute -right-3 -top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/85 text-white shadow-lg"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-sm font-medium text-ink-500">Add a highlight from today</p>
                                <div className="flex flex-col items-center gap-3 sm:flex-row">
                                    <label className="pill-button pill-muted cursor-pointer">
                                        Upload from device
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />
                                    </label>
                                    <button type="button" onClick={() => setIsCameraOpen(true)} className="pill-button pill-muted">
                                        <CameraIcon className="h-5 w-5" /> Use camera
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
                            className="pill-button pill-muted w-full justify-center bg-accent-soft text-primary"
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
                            placeholder="Give it a name"
                            className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm font-medium text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            disabled={isLoading}
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Share the story, details, or invite..."
                            rows={4}
                            className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-center text-sm font-semibold text-red-500">{error}</p>}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="pill-button pill-accent w-full justify-center"
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
            </SectionCard>

            <AIGenerator theme={specialDay.title} />
        </div>
    );
};
