export type Feature =
  | 'brand-dna-questionnaire'
  | 'brand-dna-harvest'
  | 'content-generation'
  | 'ethical-firewall'
  | 'prompt-library'
  | 'personas'
  | 'campaign-simulator'
  | 'product-design-canvas';

export type UserPhase = 'phase_1' | 'phase_2' | 'phase_3';

export const FeatureTiers: Record<Feature, UserPhase> = {
  'brand-dna-questionnaire': 'phase_1',
  'brand-dna-harvest': 'phase_1',
  'content-generation': 'phase_1',
  'ethical-firewall': 'phase_1',
  'prompt-library': 'phase_2',
  'personas': 'phase_2',
  'campaign-simulator': 'phase_2',
  'product-design-canvas': 'phase_3'
};

export class FeatureFlagService {
  private static cache: Record<string, { phase: UserPhase; expiresAt: number }> = {};

  /**
   * Evaluates if a user can access a specific feature based on their current phase.
   */
  static async userCan(
    userId: string,
    feature: Feature,
    getUserPhase: (userId: string) => Promise<UserPhase>
  ): Promise<boolean> {
    const now = Date.now();
    let userPhase: UserPhase;

    const cached = this.cache[userId];
    if (cached && cached.expiresAt > now) {
      userPhase = cached.phase;
    } else {
      userPhase = await getUserPhase(userId);
      this.cache[userId] = {
        phase: userPhase,
        expiresAt: now + 60000 // 60 seconds TTL
      };
    }

    const requiredTier = FeatureTiers[feature];

    if (userPhase === 'phase_3') {
      return true;
    }
    if (userPhase === 'phase_2') {
      return requiredTier !== 'phase_3';
    }
    return requiredTier === 'phase_1';
  }
}
