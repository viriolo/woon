import type { Celebration, User } from '../types';
import { USER_LOCATION } from '../constants';
import { supabaseCelebrationService } from './supabaseCelebrationService';

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
    user: User
  ): Promise<Celebration> {
    if (!user) {
      throw new Error('Authentication required to create a celebration.');
    }

    return supabaseCelebrationService.createCelebration(
      celebrationData,
      user,
      randomizePositionNearUser()
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
