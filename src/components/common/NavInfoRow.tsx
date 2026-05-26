import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InfoRow } from './InfoRow';
import { Badge } from '../ui/Badge';
import { COLORS, LAYOUT, RADIUS, SPACING } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface NavInfoRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  badge?: string;
  onPress?: () => void;
  showBorder?: boolean;
  rightContent?: React.ReactNode;
  titleStyle?: object;
}

/** Settings row with optional icon and chevron — Apple Settings navigation style */
export function NavInfoRow({
  title,
  subtitle,
  icon,
  iconColor = COLORS.accent,
  badge,
  onPress,
  showBorder = false,
  rightContent,
  titleStyle,
}: NavInfoRowProps) {
  return (
    <InfoRow
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      showBorder={showBorder}
      titleStyle={titleStyle}
      leftContent={
        icon ? (
          <View style={[styles.iconBox, { backgroundColor: iconColor + '14', borderColor: iconColor + '28' }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        ) : undefined
      }
      rightContent={
        rightContent ?? (
          <View style={styles.right}>
            {badge ? (
              <Badge variant="success" size="sm" style={styles.badge}>
                {badge}
              </Badge>
            ) : null}
            {onPress ? (
              <Ionicons name="chevron-forward" size={14} color={COLORS.text.disabled} />
            ) : null}
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: LAYOUT.minTouchTarget,
    justifyContent: 'flex-end',
  },
  badge: {
    marginRight: 2,
  },
});
