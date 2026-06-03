import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Subtle selection-style feedback when switching tabs */
export function triggerTabHaptic() {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync();
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
