import { RANK_CONFIG, RANKS } from '../../constants';
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
}

interface AchievementInput {
  xp: number;
  level: number;
  streak: number;
  scanCount: number;
  hasSharedProgress: boolean;
}

export function getAchievements(input: AchievementInput): Achievement[] {
  const { xp, level, streak, scanCount, hasSharedProgress } = input;

  const rankAchievements: Achievement[] = RANKS.map((r) => ({
    id: `rank-${r}`,
    title: `${r} Rank`,
    description: `Reach ${RANK_CONFIG[r].minXP} XP`,
    icon: RANK_CONFIG[r].icon,
    unlocked: xp >= RANK_CONFIG[r].minXP,
    progress: xp >= RANK_CONFIG[r].minXP ? undefined : `${xp}/${RANK_CONFIG[r].minXP} XP`,
  }));

  const milestones: Achievement[] = [
    {
      id: 'first-scan',
      title: 'First Scan',
      description: 'Complete your first physique scan',
      icon: 'scan-outline',
      unlocked: scanCount >= 1,
      progress: scanCount >= 1 ? undefined : '0/1 scans',
    },
    {
      id: 'scan-5',
      title: 'Regular Tracker',
      description: 'Complete 5 physique scans',
      icon: 'albums-outline',
      unlocked: scanCount >= 5,
      progress: scanCount >= 5 ? undefined : `${Math.min(scanCount, 5)}/5 scans`,
    },
    {
      id: 'scan-10',
      title: 'Dedicated Athlete',
      description: 'Complete 10 physique scans',
      icon: 'fitness-outline',
      unlocked: scanCount >= 10,
      progress: scanCount >= 10 ? undefined : `${Math.min(scanCount, 10)}/10 scans`,
    },
    {
      id: 'streak-3',
      title: '3-Day Streak',
      description: 'Scan 3 days in a row',
      icon: 'flame-outline',
      unlocked: streak >= 3,
      progress: streak >= 3 ? undefined : `${Math.min(streak, 3)}/3 days`,
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day scan streak',
      icon: 'flame',
      unlocked: streak >= 7,
      progress: streak >= 7 ? undefined : `${Math.min(streak, 7)}/7 days`,
    },
    {
      id: 'streak-30',
      title: 'Monthly Machine',
      description: 'Maintain a 30-day scan streak',
      icon: 'bonfire',
      unlocked: streak >= 30,
      progress: streak >= 30 ? undefined : `${Math.min(streak, 30)}/30 days`,
    },
    {
      id: 'level-5',
      title: 'Level 5',
      description: 'Reach level 5',
      icon: 'arrow-up-circle-outline',
      unlocked: level >= 5,
      progress: level >= 5 ? undefined : `Lv. ${level}/5`,
    },
    {
      id: 'level-10',
      title: 'Level 10',
      description: 'Reach level 10',
      icon: 'arrow-up-circle',
      unlocked: level >= 10,
      progress: level >= 10 ? undefined : `Lv. ${level}/10`,
    },
    {
      id: 'share-progress',
      title: 'Share the Gains',
      description: 'Share your progress with friends',
      icon: 'share-social-outline',
      unlocked: hasSharedProgress,
    },
  ];

  return [...milestones, ...rankAchievements];
}
