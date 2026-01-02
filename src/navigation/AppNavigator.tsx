import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../contexts/NotificationContext';
import { theme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import DeepLinkHandler from '../components/DeepLinkHandler';

// تجاهل تحذيرات shadow* من React Navigation
// @ts-ignore

// Custom transition animation for smooth fade + slide
const customTransition = {
  cardStyleInterpolator: ({ current, next, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
      },
    },
  },
};

// الشاشات
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import DoctorLoginScreen from '../screens/DoctorLoginScreen';
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

// أنواع التنقل
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// شريط التنقل السفلي للمريض
const UserTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'UserHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TopRatedDoctors') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'MyAppointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AllDoctors') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'MedicineReminder') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'UserProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginTop: -4, marginBottom: 2 },
        tabBarIconStyle: { marginTop: -10, marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: Platform.OS === 'android' ? 25 : 8,
          paddingTop: 16,
          height: Platform.OS === 'android' ? 70 : 55,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="UserHome"
        component={UserHomeScreen}
        options={{ tabBarLabel: t('user_home.title') }}
      />
      <Tab.Screen
        name="TopRatedDoctors"
        component={TopRatedDoctorsScreen}
        options={{ tabBarLabel: t('rating.top_rated_doctors') }}
      />
      <Tab.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{ tabBarLabel: t('appointments.title') }}
      />
      <Tab.Screen
        name="AllDoctors"
        component={AllDoctorsScreen}
        options={{ tabBarLabel: t('common.see_all') }}
      />
      <Tab.Screen
        name="MedicineReminder"
        component={MedicineReminderScreen}
        options={{ tabBarLabel: t('medicine_reminder.title') }}
      />
      {/* إزالة تبويبات الإشعارات والملف الشخصي والمراكز الصحية لتبسيط الشريط */}
      {/* HealthCenters و Notifications و UserProfile محذوفة من الشريط */}
    </Tab.Navigator>
  );
};

// شريط التنقل السفلي للطبيب
const DoctorTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="DoctorDashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'DoctorDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DoctorAppointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'DoctorCalendar') {
            iconName = focused ? 'calendar-number' : 'calendar-number-outline';
          } else if (route.name === 'DoctorAnalytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'DoctorProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginTop: -8, marginBottom: 2 },
        tabBarIconStyle: { marginTop: -2 },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: Platform.OS === 'android' ? 25 : 3,
          paddingTop: 8,
          height: Platform.OS === 'android' ? 70 : 50,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{ tabBarLabel: t('doctor.profile') }}
      />
      <Tab.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsScreen}
        options={{ tabBarLabel: t('appointments.title') }}
      />
      <Tab.Screen
        name="DoctorCalendar"
        component={DoctorCalendarScreen}
        options={{ tabBarLabel: t('doctor.calendar') }}
      />
      {/* إزالة تبويبات الإشعارات والملف الشخصي للطبيب لتبسيط الشريط */}
      {/* DoctorAnalytics و Notifications و DoctorProfile محذوفة من الشريط */}
    </Tab.Navigator>
  );
};


// التنقل الرئيسي
const AppNavigator = () => {
  const { user, loading: authLoading } = useAuth();
  const { isFirstLaunch, loading: appLoading } = useApp();
  const { t } = useTranslation();
  const {
    rescheduleAllNotificationsOnAppStart,
    checkAndRescheduleMissingNotifications,
    loadNotificationsForUser,
  } = useNotifications();

  useEffect(() => {
    const initializeApp = async () => {
      try {


        // تحميل الإشعارات المخزنة للمستخدم الحالي إن وُجد
        try {
          await loadNotificationsForUser();
        } catch {}
        
        // إعادة جدولة جميع الإشعارات عند بدء التطبيق
        try {
          await rescheduleAllNotificationsOnAppStart();
        } catch {}
        
        // فحص الإشعارات المفقودة فقط (بدون إعادة جدولة تلقائية)
        await checkAndRescheduleMissingNotifications();


      } catch (error) {
        // App initialization error handled silently
      }
    };

    // تأخير قصير لضمان تحميل البيانات
    const timer = setTimeout(initializeApp, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (authLoading || appLoading) {
    // يمكن إضافة شاشة تحميل هنا
    return null;
  }

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
        config: {
          screens: {
            DoctorDetails: {
              path: '/doctor/:doctorId',
              parse: {
                doctorId: (doctorId: string) => doctorId,
              },
            },
            MyAppointments: '/appointments',
            UserProfile: '/profile',
            Notifications: '/notifications',
          },
        },
      }}
    >
      <DeepLinkHandler>
        <Stack.Navigator
          initialRouteName={!user
            ? (isFirstLaunch ? 'Welcome' : 'Login')
            : (user.user_type === 'user'
                ? 'UserHomeStack'
                : user.user_type === 'doctor'
                  ? 'DoctorDashboard'
                  : user.user_type === 'admin'
                    ? 'UserHomeStack' // الإدارة تستخدم واجهة المستخدم العادي
                    : user.user_type === 'center'
                      ? 'CenterHome'
                      : 'Login')}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
              height: Platform.OS === 'ios' ? 60 : 56,
            },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        >
          {!user ? (
            // شاشات غير مسجل الدخول
            <>
              <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
                options={{ 
                  headerShown: false,
                  ...customTransition,
                }}
              />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ 
                  headerShown: false,
                  ...customTransition,
                }}
              />
              <Stack.Screen
                name="DoctorLogin"
                component={DoctorLoginScreen}
                options={{ 
                  headerShown: false,
                  ...customTransition,
                }}
              />
              <Stack.Screen
                name="UserSignUp"
                component={UserSignUpScreen}
                options={{ title: t('auth.login') }}
              />
              <Stack.Screen
                name="DoctorDetails"
                component={DoctorDetailsScreen}
                options={({ route }) => ({
                  title: t('doctor.details'),
                  headerShown: true,
                })}
              />
            </>
          ) : (
            // شاشات مسجل الدخول
            <>
              {user.user_type === 'user' && (
                <>
                  <Stack.Screen
                    name="UserHomeStack"
                    component={UserTabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="UserProfile"
                    component={UserProfileScreen}
                    options={{ title: t('profile.title') }}
                  />
                  <Stack.Screen
                    name="DoctorDetails"
                    component={DoctorDetailsScreen}
                    options={({ route }) => ({
                      title: t('doctor.details'),
                      headerShown: true,
                    })}
                  />
                  <Stack.Screen
                    name="AllDoctors"
                    component={AllDoctorsScreen}
                    options={{ title: t('user_home.recommended_doctors') }}
                  />
                  <Stack.Screen
                    name="NotificationSettings"
                    component={NotificationSettingsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="UserProfileEdit"
                    component={UserProfileEditScreen}
                    options={{ title: t('profile.edit_profile') }}
                  />
                  <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                    options={{ title: t('auth.change_password') }}
                  />
                  <Stack.Screen
                    name="PrivacySettings"
                    component={PrivacySettingsScreen}
                    options={{ title: t('privacy.settings') || 'إعدادات الخصوصية' }}
                  />
                  <Stack.Screen
                    name="TopRatedDoctors"
                    component={TopRatedDoctorsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="DoctorReviews"
                    component={DoctorReviewsScreen}
                    options={{ headerShown: false }}
                  />
                </>
              )}

              {user.user_type === 'doctor' && (
                <>
                  <Stack.Screen
                    name="DoctorDashboard"
                    component={DoctorTabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="DoctorProfile"
                    component={DoctorProfileScreen}
                    options={{ title: t('profile.title') }}
                  />
                  <Stack.Screen
                    name="DoctorAnalytics"
                    component={DoctorAnalyticsScreen}
                    options={{ title: t('doctor.analytics') }}
                  />
                  <Stack.Screen
                    name="AppointmentDurationEditor"
                    component={AppointmentDurationEditorScreen}
                    options={{ title: 'مدة الموعد' }}
                  />
                  <Stack.Screen
                    name="DoctorProfileEdit"
                    component={DoctorProfileEditScreen}
                    options={{ title: t('profile.edit_profile') }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="NotificationSettings"
                    component={NotificationSettingsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                    options={{ title: t('auth.change_password') }}
                  />
                  <Stack.Screen
                    name="DoctorReviews"
                    component={DoctorReviewsScreen}
                    options={{ headerShown: false }}
                  />
                </>
              )}

              {user.user_type === 'admin' && (
                <>
                  {/* الإدارة متاحة فقط من الموقع - التطبيق يتلقى الأوامر من الباك إند */}
                  <Stack.Screen
                    name="UserHomeStack"
                    component={UserTabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="UserProfile"
                    component={UserProfileScreen}
                    options={{ title: t('profile.title') }}
                  />
                  <Stack.Screen
                    name="DoctorDetails"
                    component={DoctorDetailsScreen}
                    options={({ route }) => ({
                      title: t('doctor.details'),
                      headerShown: true,
                    })}
                  />
                  <Stack.Screen
                    name="AllDoctors"
                    component={AllDoctorsScreen}
                    options={{ title: t('user_home.recommended_doctors') }}
                  />
                  <Stack.Screen
                    name="NotificationSettings"
                    component={NotificationSettingsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="UserProfileEdit"
                    component={UserProfileEditScreen}
                    options={{ title: t('profile.edit_profile') }}
                  />
                  <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                    options={{ title: t('auth.change_password') }}
                  />
                  <Stack.Screen
                    name="PrivacySettings"
                    component={PrivacySettingsScreen}
                    options={{ title: t('privacy.settings') || 'إعدادات الخصوصية' }}
                  />
                  <Stack.Screen
                    name="TopRatedDoctors"
                    component={TopRatedDoctorsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="DoctorReviews"
                    component={DoctorReviewsScreen}
                    options={{ headerShown: false }}
                  />
                </>
              )}

              {user.user_type === 'center' && (
                <>
                  <Stack.Screen
                    name="CenterHome"
                    component={CenterHomeScreen}
                    options={{ title: t('center.home') }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="NotificationSettings"
                    component={NotificationSettingsScreen}
                    options={{ headerShown: false }}
                  />
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
