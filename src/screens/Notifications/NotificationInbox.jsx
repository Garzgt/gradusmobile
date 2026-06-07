import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import SkeletonBox from '../../components/SkeletonLoader';
import {
  fetchNotifications,
  markOneAsRead,
  markAllAsRead,
} from './services/notificationService';
import NotificationCard from './components/NotificationCard';
import NotificationFilterTabs from './components/NotificationFilterTabs';

export default function NotificationInbox() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');

    const { data, error: err } = await fetchNotifications(user.id);
    if (err) {
      setError('Could not load notifications. Pull down to retry.');
    } else {
      setNotifications(data);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handleCardPress = async (item) => {
    if (item.is_read) return;
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
    );
    await markOneAsRead(item.id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllAsRead(user.id);
  };

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  const displayed = useMemo(
    () => filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications,
    [notifications, filter]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerLabel}>NOTIFICATIONS</Text>
        <View style={styles.headerBottom}>
          <Text style={styles.headerTitle}>Inbox</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSub}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2A7AB6"
            colors={['#2A7AB6']}
          />
        }
      >
        <NotificationFilterTabs
          active={filter}
          onSelect={setFilter}
          unreadCount={unreadCount}
        />

        <View style={{ marginTop: 10 }}>
          {loading ? (
            <NotificationSkeleton />
          ) : error ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={32} color="#C8DFF0" />
              <Text style={styles.emptyTitle}>{error}</Text>
            </View>
          ) : displayed.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={36} color="#C8DFF0" />
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptyText}>
                {filter === 'unread'
                  ? "You're all caught up."
                  : 'Notifications about your grades, enrollment, and advising will appear here.'}
              </Text>
            </View>
          ) : (
            displayed.map(item => (
              <NotificationCard key={item.id} item={item} onPress={handleCardPress} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationSkeleton() {
  return (
    <View style={{ paddingHorizontal: 10, gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <SkeletonBox key={i} width="100%" height={72} borderRadius={14} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a3c5e',
  },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  headerTop: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  scroll: {
    backgroundColor: '#F2F6FA',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginTop: 12,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    elevation: 1,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2A3A',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8BA4BC',
    textAlign: 'center',
    lineHeight: 19,
  },
});
