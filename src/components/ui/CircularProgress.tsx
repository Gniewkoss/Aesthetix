import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONT_FAMILY, getScoreColor, getScoreLabelLines } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showScore?: boolean;
  subtitle?: string;
  animated?: boolean;
  color?: string;
}

export function CircularProgress({
  score,
  size = 200,
  strokeWidth = 12,
  showLabel = true,
  showScore = true,
  subtitle,
  animated = true,
  color,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const isCompact = size < 140;
  // Inner area inside the ring (circle size unchanged) — roomier box for display font ascenders
  const contentSize = Math.floor(radius * 2 - 4);
  const scoreFontSize = size * (isCompact ? 0.24 : 0.22);
  const labelFontSize = isCompact ? Math.max(7, size * 0.07) : Math.max(9, size * 0.085);
  const labelLines = getScoreLabelLines(score);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(score / 100, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = score / 100;
    }
  }, [score, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor = color ?? getScoreColor(score);
  const gradientId = `grad_${score}_${size}`;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={scoreColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={scoreColor} stopOpacity="0.55" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      <View
        style={[
          styles.content,
          {
            width: contentSize,
            height: contentSize,
            paddingVertical: isCompact ? 8 : 6,
            paddingHorizontal: 6,
          },
        ]}
      >
        {showScore && (
          <Text
            style={[
              styles.score,
              {
                color: scoreColor,
                fontSize: scoreFontSize,
                lineHeight: scoreFontSize * 1.2,
                minHeight: scoreFontSize * 1.25,
                width: contentSize - 12,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {score}
          </Text>
        )}
        {showLabel && (
          <View style={[styles.labelWrap, { width: contentSize - 12 }]}>
            {labelLines.map((line) => (
              <Text
                key={line}
                style={[
                  styles.label,
                  {
                    color: scoreColor,
                    fontSize: labelFontSize,
                    lineHeight: labelFontSize * 1.25,
                    width: contentSize - 12,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {line}
              </Text>
            ))}
          </View>
        )}
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { fontSize: Math.max(8, size * 0.065), width: contentSize - 12 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: FONT_FAMILY.display,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' as const },
      default: {},
    }),
  },
  labelWrap: {
    alignItems: 'center',
    marginTop: 2,
  },
  label: {
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 0.4,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text.disabled,
    marginTop: 2,
    textAlign: 'center',
  },
});
