import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import StudentTabNavigator from './StudentTabNavigator';
import NotificationInbox from '../screens/Notifications/NotificationInbox';
import MyRecognition from '../screens/Recognition/MyRecognition';
import RecognitionCriteria from '../screens/Recognition/RecognitionCriteria';
import colors from '../styles/colors';
import routes from '../config/routes';
import DomainBlocked from '../screens/Auth/DomainBlocked';
import ProfileSetup from '../screens/ProfileSetup/ProfileSetup';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPage }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, isProfileComplete, isDomainBlocked } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isDomainBlocked ? (
          <Stack.Screen name={routes.DOMAIN_BLOCKED} component={DomainBlocked} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !isProfileComplete ? (
          <Stack.Screen name={routes.PROFILE_SETUP} component={ProfileSetup} />
        ) : (
          <>
            <Stack.Screen name="StudentApp" component={StudentTabNavigator} />
            <Stack.Screen name={routes.NOTIFICATIONS} component={NotificationInbox} />
            <Stack.Screen name={routes.MY_RECOGNITION} component={MyRecognition} />
            <Stack.Screen name={routes.RECOGNITION_CRITERIA} component={RecognitionCriteria} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
