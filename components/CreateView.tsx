
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SpecialDay, User, Celebration } from '../types';
import { generateDecorationIdeasStream, generateCelebrationDetailsFromImage } from '../services/geminiService';
import { celebrationService } from '../services/celebrationService';
import { SparklesIcon, LoadingSpinner, CheckCircleIcon, CameraIcon, XIcon } from './icons';

const AIGenerator: React.FC<{ theme: string }> = ({ theme }) => {
    const [items, setItems] = useState('');
    const [skill, setSkill] = useState('Beginner');
    const [time, setTime] =useState('Under 30 minutes');
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setSuggestion('');
        
        try {
            let fullText = "";
            for await (const chunk of generateDecorationIdeasStream(theme, items, skill, time)) {
                fullText += chunk;
                setSuggestion(fullText);
            }
        } catch (err) {
            setError('Failed to generate ideas. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [theme, items, skill, time]);

    return (
        <div className="p-4 rounded-2xl bg-neutral-100/50 border border-neutral-200 space-y-4">
            <div className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-special-primary" />
                <h3 className="text-lg font-bold text-special-secondary">Need some inspiration?</h3>
            </div>
            <p className="text-sm text-neutral-500">
                Describe what you have at home, and our creative AI will suggest some decoration ideas for {theme}!
            </p>
            <textarea
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="e.g., color paper, scissors, glue, old jars..."
                className="w-full p-2 bg-white rounded-md placeholder-neutral-500 border border-neutral-300 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
                <select value={skill} onChange={e => setSkill(e.target.value)} className="w-full p-2 bg-white rounded-md border border-neutral-300 focus:ring-2 focus:ring-special-primary focus:outline-none transition">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Expert</option>
                </select>
                <select value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 bg-white rounded-md border border-neutral-300 focus:ring-2 focus:ring-special-primary focus:outline-none transition">
                    <option>Under 30 minutes</option>
                    <option>1-2 hours</option>
                    <option>A whole afternoon</option>
                </select>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-special-primary text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Thinking...' : 'Generate Ideas'}
            </button>
            {(suggestion || isLoading) && (
                 <div className="mt-4 p-4 bg-neutral-100 rounded-lg whitespace-pre-wrap font-mono text-sm text-neutral-700 min-h-[5rem]">
                    {suggestion}{isLoading && !suggestion && <span className="inline-block w-2 h-4 ml-1 bg-special-primary animate-blink" />}
                </div>
            )}
            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );
};

const CameraView: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void; }> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    if(videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                    }
                } else {
                    setError('Camera not supported on this device.');
                }
            } catch(err) {
                setError('Could not access camera. Please check permissions.');
                console.error(err);
            }
        };
        startCamera();
        
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        }
    }, []);
    
    const handleCapture = () => {
        if(videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            onCapture(canvas.toDataURL('image/jpeg'));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            {error && <p className="absolute top-4 text-white bg-red-500/80 p-2 rounded">{error}</p>}
            <button onClick={onClose} className="absolute top-4 right-4 text-white"><XIcon className="w-8 h-8"/></button>
            <button onClick={handleCapture} className="absolute bottom-8 w-20 h-20 rounded-full bg-white/50 border-4 border-white"></button>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};


interface CreateViewProps {
    user: User;
    specialDay: SpecialDay;
    onCelebrationCreated: (celebration: Celebration) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({ user, specialDay, onCelebrationCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateDetails = async () => {
        if (!imagePreview) return;
        setIsGeneratingDetails(true);
        setError('');
        try {
            const [metadata, base64Data] = imagePreview.split(',');
            const mimeType = metadata.match(/:(.*?);/)?.[1];
            if (!mimeType || !base64Data) throw new Error("Invalid image format");
            
            const result = await generateCelebrationDetailsFromImage(base64Data, mimeType, specialDay.title);
            setTitle(result.title);
            setDescription(result.description);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI generation failed.');
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !imagePreview) {
            setError("Please fill out all fields and upload a photo.");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const newCelebration = await celebrationService.createCelebration({
                title,
                description,
                imageUrl: imagePreview,
            }, user);
            setIsSuccess(true);
            setTimeout(() => {
                onCelebrationCreated(newCelebration);
            }, 2000); // Wait 2 seconds before navigating
        } catch (err) {
            setError("Failed to post celebration. Please try again.");
            console.error(err);
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-display font-bold text-special-primary">
                    Celebration Posted!
                </h2>
                <p className="text-neutral-500 mt-2">
                    Taking you to the map to see your creation...
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pb-24 p-4 animate-fade-in space-y-6">
            {isCameraOpen && <CameraView onCapture={setImagePreview} onClose={() => setIsCameraOpen(false)} />}
            <div className="pt-16 text-center">
                 <h2 className="text-3xl font-display font-bold text-special-primary">Share Your Creation</h2>
                 <p className="text-neutral-700">for {specialDay.title}</p>
            </div>
            
            <AIGenerator theme={specialDay.title} />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center">
                    {imagePreview ? (
                        <div className="relative">
                            <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                            <button type="button" onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"><XIcon className="w-4 h-4 text-neutral-600"/></button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-neutral-500">Add a photo to your celebration</span>
                            <div className="flex gap-4">
                                <label className="cursor-pointer px-4 py-2 bg-white border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-100 transition">
                                    Upload File
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />
                                </label>
                                <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-100 transition">
                                    <CameraIcon className="w-5 h-5"/>
                                    Take Photo
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
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-special-primary/10 text-special-secondary font-bold rounded-lg hover:bg-special-primary/20 transition disabled:opacity-50"
                    >
                        {isGeneratingDetails ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isGeneratingDetails ? 'Generating...' : 'AI-generate Title & Description'}
                    </button>
                )}

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title for your display"
                    className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                    disabled={isLoading}
                />
                 <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a short description..."
                    className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                    rows={4}
                    disabled={isLoading}
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button 
                    type="submit"
                    className="w-full py-3 px-4 bg-special-secondary text-white font-bold rounded-lg hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50"
                    disabled={isLoading || !imagePreview}
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner className="h-5 w-5" />
                            <span>Posting...</span>
                        </>
                    ) : 'Post Celebration'}
                </button>
            </form>
        </div>
    );
};
