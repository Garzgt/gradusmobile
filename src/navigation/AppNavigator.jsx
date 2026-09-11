import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import StudentTabNavigator from './StudentTabNavigator';
import NotificationInbox from '../screens/Notifications/NotificationInbox';
import MyRecognition from '../screens/Recognition/MyRecognition';
import RecognitionCriteria from '../screens/Recognition/RecognitionCriteria';
import BrandedLoader from '../components/BrandedLoader';
import { hideSplash } from '../config/splash';
import routes from '../config/routes';
import { screenTransitions } from '../animations/transitions';
import DomainBlocked from '../screens/Auth/DomainBlocked';
import AccountDeactivated from '../screens/Auth/AccountDeactivated';
import ProfileSetup from '../screens/ProfileSetup/ProfileSetup';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoading, isAuthenticated, isProfileComplete, isDomainBlocked, isDeactivated } = useAuth();

  // Hold the native splash until auth has resolved, so the common path goes
  // straight from splash to the real screen with no loading state in between.
  useEffect(() => {
    if (!isLoading) hideSplash();
  }, [isLoading]);

  if (isLoading) return <BrandedLoader />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, ...screenTransitions.push }}>
        {isDomainBlocked ? (
          <Stack.Screen name={routes.DOMAIN_BLOCKED} component={DomainBlocked} />
        ) : isDeactivated ? (
          <Stack.Screen name={routes.ACCOUNT_DEACTIVATED} component={AccountDeactivated} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !isProfileComplete ? (
          <Stack.Screen name={routes.PROFILE_SETUP} component={ProfileSetup} />
        ) : (
          <>
            <Stack.Screen name="StudentApp" component={StudentTabNavigator} />
            <Stack.Screen
              name={routes.NOTIFICATIONS}
              component={NotificationInbox}
              options={screenTransitions.modal}
            />
            <Stack.Screen name={routes.MY_RECOGNITION} component={MyRecognition} />
            <Stack.Screen name={routes.RECOGNITION_CRITERIA} component={RecognitionCriteria} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
