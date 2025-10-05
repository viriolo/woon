import type { Celebration } from '../types';
import { USER_LOCATION } from '../constants';
import { supabaseCelebrationService } from './supabaseCelebrationService';

type MinimalUser = { id: string };

const randomizePositionNearUser = () => {
  const variance = 0.08;
  return {
    lng: USER_LOCATION.lng + (Math.random() - 0.5) * variance,
    lat: USER_LOCATION.lat + (Math.random() - 0.5) * variance,
  };
};

export const celebrationService = {
  async getCelebrations(): Promise<Celebration[]> {
    return supabaseCelebrationService.getCelebrations();
  },

  async getCelebrationById(id: number): Promise<Celebration | null> {
    return supabaseCelebrationService.getCelebrationById(id);
  },

  async getCelebrationsByUserId(userId: string): Promise<Celebration[]> {
    return supabaseCelebrationService.getCelebrationsByUserId(userId);
  },

  async createCelebration(
    celebrationData: Pick<Celebration, 'title' | 'description' | 'imageUrl'>,
    user: MinimalUser,
    position?: { lng: number; lat: number }
  ): Promise<Celebration> {
    if (!user?.id) {
      throw new Error('Authentication required to create a celebration.');
    }

    const submissionPosition = position ?? randomizePositionNearUser();

    return supabaseCelebrationService.createCelebration(
      celebrationData,
      user,
      submissionPosition
    );
  },

  async updateLikeCount(celebrationId: number): Promise<Celebration> {
    const celebration = await supabaseCelebrationService.getCelebrationById(celebrationId);
    if (!celebration) {
      throw new Error('Celebration not found.');
    }
    return celebration;
  },

  async incrementCommentCount(celebrationId: number): Promise<Celebration> {
    const celebration = await supabaseCelebrationService.getCelebrationById(celebrationId);
    if (!celebration) {
      throw new Error('Celebration not found.');
    }
    return celebration;
  },

  subscribeToNewCelebrations: supabaseCelebrationService.subscribeToNewCelebrations,
};
