import React, { useRef, useCallback } from "react";

interface BottomSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onStateChange: (isOpen: boolean) => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children, isOpen, onStateChange }) => {
    const dragStartRef = useRef<{ y: number } | null>(null);
    const PEEKING_HEIGHT = 180;

    const toggleSheet = useCallback(() => onStateChange(!isOpen), [isOpen, onStateChange]);

    const handleDragStart = (event: React.TouchEvent) => {
        dragStartRef.current = { y: event.touches[0].clientY };
    };

    const handleDragEnd = (event: React.TouchEvent) => {
        if (!dragStartRef.current) return;
        const deltaY = event.changedTouches[0].clientY - dragStartRef.current.y;
        if (Math.abs(deltaY) > 50) {
            const shouldOpen = deltaY < 0;
            if (shouldOpen !== isOpen) {
                onStateChange(shouldOpen);
            }
        }
        dragStartRef.current = null;
    };

    return (
        <div
            className="bottom-sheet fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out"
            style={{
                height: "70vh",
                transform: isOpen ? "translateY(0)" : `translateY(calc(100% - ${PEEKING_HEIGHT}px))`,
                touchAction: "pan-y",
            }}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
        >
            <div className="flex h-10 w-full items-center justify-center" onClick={toggleSheet}>
                <span className="bottom-sheet__handle" />
            </div>
            <div className="h-full overflow-y-auto px-6 pb-28">
                {children}
            </div>
        </div>
    );
};
