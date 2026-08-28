import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { fetchUnreadCount } from '../../Notifications/services/notificationService';
import routes from '../../../config/routes';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardHeader({ student }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    if (!user) return;
    fetchUnreadCount(user.id).then(({ count }) => setUnreadCount(count));
  }, [user]);

  useFocusEffect(refreshUnreadCount);

  // Live-updates the badge the instant a push notification arrives while the app
  // is in the foreground, instead of waiting for the user to leave and re-enter
  // this screen (which is the only thing useFocusEffect above covers).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(refreshUnreadCount);
    return () => sub.remove();
  }, [refreshUnreadCount]);

  const firstName = student?.first_name ?? '';
  const lastName = student?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Student';
  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const studentNumber = student?.student_number ?? '';
  const programCode = student?.programs?.code ?? '';
  const initial = (firstName || 'S').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.decOrb} />

      <View style={styles.mainRow}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </View>

        {/* Right: info + bell on top, badges below */}
        <View style={styles.right}>
          <View style={styles.topRow}>
            <View style={styles.info}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate(routes.NOTIFICATIONS)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText} numberOfLines={1}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            {email ? (
              <View style={styles.badge}>
                <Ionicons name="mail-outline" size={10} color="rgba(255,255,255,0.45)" />
                <Text style={styles.badgeText} numberOfLines={1}>{email}</Text>
              </View>
            ) : null}
            {programCode ? (
              <View style={[styles.badge, styles.badgeBlue]}>
                <Ionicons name="school-outline" size={10} color="#FFFFFF" />
                <Text style={[styles.badgeText, styles.badgeBlueText]}>{programCode}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)',
    top: -60,
    right: -30,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A7AB6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  right: {
    flex: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#E4483A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1a3c5e',
  },
  unreadBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  badgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  badgeBlue: {
    backgroundColor: 'rgba(42,122,182,0.5)',
    borderColor: 'rgba(42,122,182,0.3)',
  },
  badgeBlueText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
