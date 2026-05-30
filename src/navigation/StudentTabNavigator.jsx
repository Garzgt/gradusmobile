import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import routes from '../config/routes';
import HomeDashboard from '../screens/Home/HomeDashboard';
import WeeklySchedule from '../screens/Schedule/WeeklySchedule';
import GradesStackNavigator from './GradesStackNavigator';
import NotificationInbox from '../screens/Notifications/NotificationInbox';
import Profile from '../screens/Profile/Profile';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [routes.HOME]:          { on: 'home',          off: 'home-outline' },
  [routes.SCHEDULE]:      { on: 'calendar',      off: 'calendar-outline' },
  [routes.GRADES]:        { on: 'bar-chart',     off: 'bar-chart-outline' },
  [routes.NOTIFICATIONS]: { on: 'notifications', off: 'notifications-outline' },
  [routes.PROFILE]:       { on: 'person',        off: 'person-outline' },
};

function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrapper, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={s.bar}>
        {state.routes.map((route) => {
          const focused = state.index === state.routes.indexOf(route);
          const icons = TAB_ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={s.item}
              activeOpacity={0.75}
            >
              <View style={[s.circle, focused && s.circleActive]}>
                <Ionicons
                  name={focused ? icons.on : icons.off}
                  size={22}
                  color={focused ? '#FFFFFF' : '#9DB5CC'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#0a1e30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: '#1a3c5e',
  },
});

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={routes.HOME}          component={HomeDashboard} />
      <Tab.Screen name={routes.SCHEDULE}      component={WeeklySchedule} />
      <Tab.Screen name={routes.GRADES}        component={GradesStackNavigator} />
      <Tab.Screen name={routes.NOTIFICATIONS} component={NotificationInbox} />
      <Tab.Screen name={routes.PROFILE}       component={Profile} />
    </Tab.Navigator>
  );
}
