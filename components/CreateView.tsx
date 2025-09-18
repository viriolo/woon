import React, { useState, useCallback } from 'react';
import type { SpecialDay } from '../types';
import { generateDecorationIdeasStream } from '../services/geminiService';
import { SparklesIcon } from './icons';

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
        
        const typeWriter = async (text: string) => {
            for (const char of text) {
                setSuggestion(prev => prev + char);
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        };

        try {
            for await (const chunk of generateDecorationIdeasStream(theme, items, skill, time)) {
                await typeWriter(chunk);
            }
        } catch (err) {
            setError('Failed to generate ideas. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [theme, items, skill, time]);

    return (
        <div className="p-4 rounded-2xl bg-neutral-800/50 border border-neutral-700 space-y-4">
            <div className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-special-primary" />
                <h3 className="text-lg font-bold text-special-secondary">Need some inspiration?</h3>
            </div>
            <p className="text-sm text-neutral-400">
                Describe what you have at home, and our creative AI will suggest some decoration ideas for {theme}!
            </p>
            <textarea
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="e.g., color paper, scissors, glue, old jars..."
                className="w-full p-2 bg-neutral-700 rounded-md placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
                <select value={skill} onChange={e => setSkill(e.target.value)} className="w-full p-2 bg-neutral-700 rounded-md focus:ring-2 focus:ring-special-primary focus:outline-none transition">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Expert</option>
                </select>
                <select value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 bg-neutral-700 rounded-md focus:ring-2 focus:ring-special-primary focus:outline-none transition">
                    <option>Under 30 minutes</option>
                    <option>1-2 hours</option>
                    <option>A whole afternoon</option>
                </select>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-special-primary text-neutral-900 font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Thinking...' : 'Generate Ideas'}
            </button>
            {(suggestion || isLoading) && (
                 <div className="mt-4 p-4 bg-neutral-800 rounded-lg whitespace-pre-wrap font-mono text-sm text-neutral-300 min-h-[5rem]">
                    {suggestion}{isLoading && <span className="inline-block w-2 h-4 ml-1 bg-special-primary animate-blink" />}
                </div>
            )}
            {error && <p className="mt-2 text-red-400">{error}</p>}
        </div>
    );
};


export const CreateView: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    return (
        <div className="h-full overflow-y-auto pb-24 p-4 animate-fade-in space-y-6">
            <div className="pt-16 text-center">
                 <h2 className="text-3xl font-display font-bold text-special-primary">Share Your Creation</h2>
                 <p className="text-neutral-300">for {specialDay.title}</p>
            </div>
            
            <AIGenerator theme={specialDay.title} />

            <div>
                <input
                    type="text"
                    placeholder="Title for your display"
                    className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                />
            </div>
            <div>
                 <textarea
                    placeholder="Add a short description..."
                    className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                    rows={4}
                />
            </div>
            <div>
                 <label className="block w-full cursor-pointer border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-special-primary transition">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                    ) : (
                        <span className="text-neutral-400">Tap to upload a photo</span>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
            </div>

            <button className="w-full py-3 px-4 bg-special-secondary text-neutral-900 font-bold rounded-lg hover:opacity-90 transition">
                Post Celebration
            </button>
        </div>
    );
};