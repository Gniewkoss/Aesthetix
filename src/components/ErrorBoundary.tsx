import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureException } from '../lib/errorTracking';
import { C, T, R, S, LAYOUT, E } from '../theme/obsidian';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/lifecycle crashes anywhere in the tree so a single component
 * error shows a recoverable screen instead of a white screen of death. Crashes
 * are forwarded to the error-tracking funnel.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack });
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning-outline" size={28} color={C.danger} />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The app hit an unexpected error. Your data is safe. Try again, and if it
          keeps happening, restart the app.
        </Text>

        {__DEV__ && this.state.error ? (
          <View style={styles.debugBox}>
            <Text style={styles.debug}>{this.state.error.message}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [styles.button, E.glow, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="refresh" size={16} color={C.voltInk} />
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenX,
    backgroundColor: C.canvas,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: R.lg,
    backgroundColor: 'rgba(255,92,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,92,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.lg,
  },
  title: { ...T.title, color: C.text, textAlign: 'center' },
  body: {
    ...T.body,
    color: C.text2,
    textAlign: 'center',
    marginTop: S.sm,
    lineHeight: 22,
    maxWidth: 320,
  },
  debugBox: {
    marginTop: S.base,
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    borderRadius: R.md,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    maxWidth: '100%',
  },
  debug: { ...T.caption, color: C.danger, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginTop: S['2xl'],
    height: 52,
    paddingHorizontal: S['2xl'],
    borderRadius: R.md,
    backgroundColor: C.volt,
  },
  buttonText: { ...T.label, color: C.voltInk, fontSize: 15 },
});
