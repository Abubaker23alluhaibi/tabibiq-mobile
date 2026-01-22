import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../contexts/NotificationContext';
import { theme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import DeepLinkHandler from '../components/DeepLinkHandler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// استيراد الشاشات
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import UserSignUpScreen from '../screens/UserSignUpScreen';
import UserHomeScreen from '../screens/UserHomeScreen';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import DoctorDetailsScreen from '../screens/DoctorDetailsScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import DoctorAppointmentsScreen from '../screens/DoctorAppointmentsScreen';
import MedicineReminderScreen from '../screens/MedicineReminderScreen';
import CenterHomeScreen from '../screens/CenterHomeScreen';
import DoctorCalendarScreen from '../screens/DoctorCalendarScreen';
import DoctorAnalyticsScreen from '../screens/DoctorAnalyticsScreen';
import AppointmentDurationEditorScreen from '../screens/AppointmentDurationEditorScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DoctorProfileEditScreen from '../screens/DoctorProfileEditScreen';
import UserProfileEditScreen from '../screens/UserProfileEditScreen';
import AllDoctorsScreen from '../screens/AllDoctorsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TopRatedDoctorsScreen from '../screens/TopRatedDoctorsScreen';
import DoctorReviewsScreen from '../screens/DoctorReviewsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';

import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator();

// --- دالة مساعدة لإنشاء أيقونة مع نص ---
const renderTab = (focused: boolean, color: string, routeName: string, label: string) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

  // تحديد الأيقونة حسب اسم الشاشة
  if (routeName === 'UserHome' || routeName === 'DoctorDashboard') iconName = focused ? 'home' : 'home-outline';
  else if (routeName === 'TopRatedDoctors') iconName = focused ? 'star' : 'star-outline';
  else if (routeName === 'MyAppointments' || routeName === 'DoctorAppointments') iconName = focused ? 'calendar' : 'calendar-outline';
  else if (routeName === 'AllDoctors') iconName = focused ? 'people' : 'people-outline';
  else if (routeName === 'MedicineReminder') iconName = focused ? 'medical' : 'medical-outline';
  else if (routeName === 'DoctorCalendar') iconName = focused ? 'calendar-number' : 'calendar-number-outline';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <Ionicons name={iconName} size={26} color={color} style={{ marginBottom: 2 }} />
      <Text style={{ fontSize: 10, color: color, fontWeight: focused ? 'bold' : 'normal' }}>
        {label}
      </Text>
    </View>
  );
};

// --- إعدادات التاب بار المشتركة (معدلة للأيفون) ---
const commonTabOptions = (insets: any) => ({
  tabBarPosition: 'bottom',
  swipeEnabled: true,       
  animationEnabled: true,
  tabBarBounces: true,
  
  tabBarShowLabel: false, 
  tabBarShowIcon: true,

  tabBarIndicatorStyle: {
    height: 0, 
    backgroundColor: 'transparent',
  },

  tabBarStyle: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    elevation: 10, 
    shadowOpacity: 0.05,
    // ✅ تم تعديل الارتفاع هنا ليكون مناسباً للأيفون (50 + insets) وللأندرويد (70)
    height: Platform.OS === 'android' ? 70 : 50 + insets.bottom, 
    paddingBottom: Platform.OS === 'android' ? 5 : insets.bottom,
    paddingTop: 8,
  },
  
  tabBarPressColor: 'transparent',
});


// --- شريط المريض ---
const UserTabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="UserHome"
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        ...commonTabOptions(insets),
        tabBarIcon: ({ focused, color }) => {
          let label = '';
          if (route.name === 'UserHome') label = t('user_home.title');
          else if (route.name === 'TopRatedDoctors') label = t('rating.top_rated_doctors');
          else if (route.name === 'MyAppointments') label = t('appointments.title');
          else if (route.name === 'AllDoctors') label = t('common.see_all');
          else if (route.name === 'MedicineReminder') label = t('medicine_reminder.title');

          return renderTab(focused, color, route.name, label);
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#9e9e9e',
      })}
    >
      <Tab.Screen name="UserHome" component={UserHomeScreen} />
      <Tab.Screen name="TopRatedDoctors" component={TopRatedDoctorsScreen} />
      <Tab.Screen name="MyAppointments" component={MyAppointmentsScreen} />
      <Tab.Screen name="AllDoctors" component={AllDoctorsScreen} />
      <Tab.Screen name="MedicineReminder" component={MedicineReminderScreen} />
    </Tab.Navigator>
  );
};

// --- شريط الطبيب ---
const DoctorTabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="DoctorDashboard"
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        ...commonTabOptions(insets),
        tabBarIcon: ({ focused, color }) => {
          let label = '';
          if (route.name === 'DoctorDashboard') label = t('doctor.profile');
          else if (route.name === 'DoctorAppointments') label = t('appointments.title');
          else if (route.name === 'DoctorCalendar') label = t('doctor.calendar');

          return renderTab(focused, color, route.name, label);
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#9e9e9e',
      })}
    >
      <Tab.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <Tab.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Tab.Screen name="DoctorCalendar" component={DoctorCalendarScreen} />
    </Tab.Navigator>
  );
};

// --- النافيجيشن الرئيسي ---
const AppNavigator = () => {
  const { user, loading: authLoading } = useAuth();
  const { isFirstLaunch, loading: appLoading } = useApp();
  const { t } = useTranslation();
  const { loadNotificationsForUser } = useNotifications();

  useEffect(() => {
    const init = async () => { try { await loadNotificationsForUser(); } catch {} };
    init();
  }, []);

  if (authLoading || appLoading) return null;

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.background,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
      linking={{
        prefixes: ['tabibiq://', 'https://tabib-iq.com'],
        config: { screens: { DoctorDetails: 'doctor/:doctorId' } },
      }}
    >
      <DeepLinkHandler>
        <Stack.Navigator
          initialRouteName={!user ? (isFirstLaunch ? 'Welcome' : 'UserHomeStack') : (user.user_type === 'doctor' ? 'DoctorDashboard' : 'UserHomeStack')}
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary, height: Platform.OS === 'ios' ? 60 : 56 },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        >
          {!user ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="UserSignUp" component={UserSignUpScreen} options={{ title: t('auth.login') }} />
              <Stack.Screen name="UserHomeStack" component={UserTabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} options={{ title: t('doctor.details'), headerShown: true }} />
            </>
          ) : (
            <>
              {user.user_type === 'user' && (
                <>
                  <Stack.Screen name="UserHomeStack" component={UserTabNavigator} options={{ headerShown: false }} />
                  <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: t('profile.title') }} />
                  <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} options={{ title: t('doctor.details'), headerShown: true }} />
                  <Stack.Screen name="AllDoctors" component={AllDoctorsScreen} options={{ title: t('user_home.recommended_doctors') }} />
                  <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="UserProfileEdit" component={UserProfileEditScreen} options={{ title: t('profile.edit_profile') }} />
                  <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('auth.change_password') }} />
                  <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: t('privacy.settings') }} />
                  <Stack.Screen name="TopRatedDoctors" component={TopRatedDoctorsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="DoctorReviews" component={DoctorReviewsScreen} options={{ headerShown: false }} />
                </>
              )}
              {user.user_type === 'doctor' && (
                <>
                  <Stack.Screen name="DoctorDashboard" component={DoctorTabNavigator} options={{ headerShown: false }} />
                  <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ title: t('profile.title') }} />
                  <Stack.Screen name="DoctorAnalytics" component={DoctorAnalyticsScreen} options={{ title: t('doctor.analytics') }} />
                  <Stack.Screen name="AppointmentDurationEditor" component={AppointmentDurationEditorScreen} options={{ title: 'مدة الموعد' }} />
                  <Stack.Screen name="DoctorProfileEdit" component={DoctorProfileEditScreen} options={{ title: t('profile.edit_profile') }} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('auth.change_password') }} />
                  <Stack.Screen name="DoctorReviews" component={DoctorReviewsScreen} options={{ headerShown: false }} />
                </>
              )}
              {user.user_type === 'admin' && (
                <>
                  <Stack.Screen name="UserHomeStack" component={UserTabNavigator} options={{ headerShown: false }} />
                  <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: t('profile.title') }} />
                  <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} options={{ title: t('doctor.details'), headerShown: true }} />
                  <Stack.Screen name="AllDoctors" component={AllDoctorsScreen} options={{ title: t('user_home.recommended_doctors') }} />
                  <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="UserProfileEdit" component={UserProfileEditScreen} options={{ title: t('profile.edit_profile') }} />
                  <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('auth.change_password') }} />
                  <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: t('privacy.settings') }} />
                  <Stack.Screen name="TopRatedDoctors" component={TopRatedDoctorsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="DoctorReviews" component={DoctorReviewsScreen} options={{ headerShown: false }} />
                </>
              )}
              {user.user_type === 'center' && (
                <>
                  <Stack.Screen name="CenterHome" component={CenterHomeScreen} options={{ title: t('center.home') }} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </DeepLinkHandler>
    </NavigationContainer>
  );
};

export default AppNavigator;