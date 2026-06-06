import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateFromNotification(screen: string): void {
  if (!navigationRef.isReady()) return;

  if (screen === 'Upload') {
    navigationRef.navigate('Upload');
    return;
  }
  if (screen === 'Progress') {
    navigationRef.navigate('MainTabs', { screen: 'Progress' });
  }
}
