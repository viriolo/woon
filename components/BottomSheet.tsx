import React, { useRef, useCallback } from 'react';

// FIX: Refactored to a controlled component to be managed by parent.
interface BottomSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onStateChange: (isOpen: boolean) => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children, isOpen, onStateChange }) => {
    const dragStartRef = useRef<{ y: number } | null>(null);

    const PEEKING_HEIGHT = 160; // The visible height when collapsed, increased to show card previews.

    const toggleSheet = useCallback(() => onStateChange(!isOpen), [isOpen, onStateChange]);

    const handleDragStart = (e: React.TouchEvent) => {
        dragStartRef.current = { y: e.touches[0].clientY };
    };

    const handleDragEnd = (e: React.TouchEvent) => {
        if (!dragStartRef.current) return;
        const deltaY = e.changedTouches[0].clientY - dragStartRef.current.y;
        if (Math.abs(deltaY) > 50) { // Threshold to prevent accidental swipes
            const shouldOpen = deltaY < 0; // Swipe up opens, swipe down closes
            if (isOpen !== shouldOpen) {
                onStateChange(shouldOpen);
            }
        }
        dragStartRef.current = null;
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-20 rounded-t-[2rem] bg-background-light/95 shadow-brand backdrop-blur-xl transition-transform duration-300 ease-in-out ring-1 ring-white/55"
            style={{
                height: '70vh',
                transform: isOpen ? 'translateY(0)' : `translateY(calc(100% - ${PEEKING_HEIGHT}px))`,
                touchAction: 'pan-y'
            }}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
        >
            <div
                className="w-full h-8 flex justify-center items-center flex-shrink-0 cursor-pointer"
                onClick={toggleSheet}
            >
                <div className="h-1.5 w-10 rounded-full bg-ink-300" />
            </div>
            <div className="h-full overflow-y-auto px-6 pb-28">
                {children}
            </div>
        </div>
    );
};
