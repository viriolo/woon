import React from 'react';
import { XIcon, StarIcon, SparklesIcon } from './icons';

interface MissionViewProps {
  onClose: () => void;
}

export const MissionView: React.FC<MissionViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-heading text-2xl">Daily Missions</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-ink-100 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6 text-ink-600" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-accent-soft p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary p-2">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading font-semibold">Share Today's Celebration</h3>
                <p className="text-sm text-ink-600 mt-1">Post a celebration for today's special day</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0 transition-all" />
                  </div>
                  <span className="text-xs font-medium text-ink-600">+75 XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-ink-200 p-2">
                <StarIcon className="h-5 w-5 text-ink-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading font-semibold">Spread the Joy</h3>
                <p className="text-sm text-ink-600 mt-1">Like 5 celebrations from your community</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0 transition-all" />
                  </div>
                  <span className="text-xs font-medium text-ink-600">+25 XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-ink-200 p-2">
                <StarIcon className="h-5 w-5 text-ink-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading font-semibold">Connect with Neighbors</h3>
                <p className="text-sm text-ink-600 mt-1">RSVP to a local event</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0 transition-all" />
                  </div>
                  <span className="text-xs font-medium text-ink-600">+50 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-4">
          <p className="text-center text-sm text-ink-700">
            Complete daily missions to level up and unlock achievements!
          </p>
        </div>
      </div>
    </div>
  );
};
