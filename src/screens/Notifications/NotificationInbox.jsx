import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import SkeletonBox from '../../components/SkeletonLoader';
import {
  fetchNotifications,
  markOneAsRead,
  markAllAsRead,
  deleteNotifications,
} from './services/notificationService';
import NotificationCard from './components/NotificationCard';
import NotificationFilterTabs from './components/NotificationFilterTabs';
import NotificationDetailModal from './components/NotificationDetailModal';

export default function NotificationInbox() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { show: showAlert } = useAlert();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [viewingItem, setViewingItem] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');

    const { data, error: err } = await fetchNotifications(user.id);
    if (err) {
      setError('Could not load notifications. Pull down to retry.');
    } else {
      setNotifications(data);
      // Jump straight to the Unread tab whenever the inbox is freshly opened (not on a
      // manual pull-to-refresh, so we don't yank the user away from a tab they picked).
      if (!isRefresh) setFilter(data.some(n => !n.is_read) ? 'unread' : 'all');
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const toggleSelected = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  };

  const handleCardPress = async (item) => {
    if (selectMode) { toggleSelected(item.id); return; }
    setViewingItem(item);
    if (item.is_read) return;
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
    );
    await markOneAsRead(item.id);
  };

  const handleLongPress = (item) => {
    setSelectMode(true);
    setSelectedIds(prev => new Set(prev).add(item.id));
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    showAlert({
      type: 'warning',
      title: `Delete ${ids.length} notification${ids.length > 1 ? 's' : ''}?`,
      message: 'This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const removed = notifications.filter(n => selectedIds.has(n.id));
            setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
            handleCancelSelect();
            const { error: delErr } = await deleteNotifications(ids);
            if (delErr) {
              setNotifications(prev => [...prev, ...removed]);
              toast.show({ type: 'error', title: 'Could not delete', message: delErr.message });
            }
          },
        },
      ],
    });
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

  const allSelected = displayed.length > 0 && displayed.every(n => selectedIds.has(n.id));

  const handleToggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allSelected) {
        const next = new Set(prev);
        displayed.forEach(n => next.delete(n.id));
        if (next.size === 0) setSelectMode(false);
        return next;
      }
      return new Set([...prev, ...displayed.map(n => n.id)]);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={selectMode ? handleCancelSelect : () => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name={selectMode ? 'close' : 'arrow-back'} size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerLabel}>NOTIFICATIONS</Text>
        <View style={styles.headerBottom}>
          <Text style={styles.headerTitle}>
            {selectMode ? `${selectedIds.size} selected` : 'Inbox'}
          </Text>
          {selectMode ? (
            <TouchableOpacity onPress={handleToggleSelectAll} activeOpacity={0.7}>
              <Text style={styles.markAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
            </TouchableOpacity>
          ) : unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSub}>
          {selectMode ? 'Tap to select more' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
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
              <NotificationCard
                key={item.id}
                item={item}
                onPress={handleCardPress}
                onLongPress={handleLongPress}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {selectMode && (
        <View style={[styles.selectBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.selectBarCancel} onPress={handleCancelSelect} activeOpacity={0.7}>
            <Text style={styles.selectBarCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectBarDelete, selectedIds.size === 0 && styles.selectBarDeleteDisabled]}
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.selectBarDeleteText}>Delete ({selectedIds.size})</Text>
          </TouchableOpacity>
        </View>
      )}

      <NotificationDetailModal item={viewingItem} onClose={() => setViewingItem(null)} />
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
  selectBar: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF4FA',
    elevation: 8,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  selectBarCancel: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#EEF4FA',
  },
  selectBarCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A7490',
  },
  selectBarDelete: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3c5e',
  },
  selectBarDeleteDisabled: {
    backgroundColor: '#8BA4BC',
  },
  selectBarDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
