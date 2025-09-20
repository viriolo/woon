import React from 'react';
import type { Celebration } from '../types';
import { ShareIcon } from './icons';

interface ShareButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    celebration: Celebration;
    onShared?: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    celebration,
    onShared,
    className = '',
    type,
    ...rest
}) => {
    const handleShare = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = origin ? `${origin}/celebration/${celebration.id}` : `/celebration/${celebration.id}`;
        const shareData = {
            title: celebration.title,
            text: `Check out this celebration by ${celebration.author}`,
            url,
        };

        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share(shareData);
                onShared?.();
                return;
            }

            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                if (typeof window !== 'undefined') {
                    window.alert('Celebration link copied to clipboard!');
                }
                onShared?.();
                return;
            }

            if (typeof window !== 'undefined') {
                window.prompt('Copy this celebration link', shareData.url);
            }
        } catch (error) {
            console.error('Failed to share celebration', error);
        }
    };

    const baseClasses = 'p-2 rounded-full hover:bg-neutral-200 transition-colors group';
    const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

    return (
        <button
            type={type ?? 'button'}
            onClick={handleShare}
            className={combinedClasses}
            aria-label={`Share celebration ${celebration.title}`}
            {...rest}
        >
            <ShareIcon className="w-6 h-6 text-neutral-500 group-hover:text-special-secondary" />
        </button>
    );
};
