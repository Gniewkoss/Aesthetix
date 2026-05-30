import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { captureException } from '../lib/errorTracking';
import { COLORS, FONT_FAMILY, FONTS, RADIUS, SPACING } from '../theme';

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
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The app hit an unexpected error. Your data is safe. Try again, and if it
          keeps happening, restart the app.
        </Text>
        {__DEV__ && this.state.error ? (
          <Text style={styles.debug}>{this.state.error.message}</Text>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={this.reset} accessibilityRole="button">
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.bg.primary,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONT_FAMILY.display,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  body: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: FONTS.sizes.sm * 1.6,
  },
  debug: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.red,
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accent,
  },
  buttonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONT_FAMILY.bodySemibold,
    color: COLORS.bg.primary,
  },
});
