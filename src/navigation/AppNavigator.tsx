import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

// تجاهل تحذيرات shadow* من React Navigation
// @ts-ignore

// الشاشات
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import UserSignUpScreen from '../screens/UserSignUpScreen';
import DoctorSignUpScreen from '../screens/DoctorSignUpScreen';
import UserHomeScreen from '../screens/UserHomeScreen';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import DoctorDetailsScreen from '../screens/DoctorDetailsScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import DoctorAppointmentsScreen from '../screens/DoctorAppointmentsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import MedicineReminderScreen from '../screens/MedicineReminderScreen';
import HealthCentersScreen from '../screens/HealthCentersScreen';
import CenterLoginScreen from '../screens/CenterLoginScreen';
import CenterHomeScreen from '../screens/CenterHomeScreen';
import DoctorCalendarScreen from '../screens/DoctorCalendarScreen';
import DoctorAnalyticsScreen from '../screens/DoctorAnalyticsScreen';
import WorkTimesEditorScreen from '../screens/WorkTimesEditorScreen';
import AppointmentDurationEditorScreen from '../screens/AppointmentDurationEditorScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import DoctorProfileEditScreen from '../screens/DoctorProfileEditScreen';
import UserProfileEditScreen from '../screens/UserProfileEditScreen';

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'UserHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyAppointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MedicineReminder') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'HealthCenters') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'UserProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
        name="MyAppointments" 
        component={MyAppointmentsScreen}
        options={{ tabBarLabel: t('appointments.title') }}
      />
      <Tab.Screen 
        name="MedicineReminder" 
        component={MedicineReminderScreen}
        options={{ tabBarLabel: t('medicine_reminder.title') }}
      />
      <Tab.Screen 
        name="HealthCenters" 
        component={HealthCentersScreen}
        options={{ tabBarLabel: t('health_centers.title') }}
      />
      <Tab.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ tabBarLabel: t('profile.title') }}
      />
    </Tab.Navigator>
  );
};

// شريط التنقل السفلي للطبيب
const DoctorTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'DoctorDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DoctorAppointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'DoctorCalendar') {
            iconName = focused ? 'calendar-number' : 'calendar-number-outline';
          } else if (route.name === 'DoctorAnalytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'DoctorProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
      <Tab.Screen 
        name="DoctorAnalytics" 
        component={DoctorAnalyticsScreen}
        options={{ tabBarLabel: t('doctor.analytics') }}
      />
      <Tab.Screen 
        name="DoctorProfile" 
        component={DoctorProfileScreen}
        options={{ tabBarLabel: t('profile.title') }}
      />
    </Tab.Navigator>
  );
};

// شريط التنقل الجانبي للأدمن
const AdminDrawerNavigator = () => {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ 
          title: t('admin.dashboard'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// التنقل الرئيسي
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    // يمكن إضافة شاشة تحميل هنا
    return null;
  }

  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.background,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!user ? (
          // شاشات غير مسجل الدخول
          <>
            <Stack.Screen 
              name="Landing" 
              component={LandingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ title: t('auth.login') }}
            />
            <Stack.Screen 
              name="UserSignUp" 
              component={UserSignUpScreen}
              options={{ title: t('auth.signup') }}
            />
            <Stack.Screen 
              name="DoctorSignUp" 
              component={DoctorSignUpScreen}
              options={{ title: t('auth.signup_as_doctor') }}
            />
            <Stack.Screen 
              name="AdminLogin" 
              component={AdminLoginScreen}
              options={{ title: t('admin.login') }}
            />
            <Stack.Screen 
              name="CenterLogin" 
              component={CenterLoginScreen}
              options={{ title: t('center.login') }}
            />
          </>
        ) : (
          // شاشات مسجل الدخول
          <>
            {user.user_type === 'user' && (
              <>
                <Stack.Screen 
                  name="UserHome" 
                  component={UserTabNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="DoctorDetails" 
                  component={DoctorDetailsScreen}
                  options={{ title: t('doctor.details') }}
                />
                <Stack.Screen 
                  name="NotificationSettings" 
                  component={NotificationSettingsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="UserProfileEdit" 
                  component={UserProfileEditScreen}
                  options={{ title: t('profile.edit_profile') }}
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
                  name="WorkTimesEditor" 
                  component={WorkTimesEditorScreen}
                  options={{ title: 'أوقات الدوام' }}
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
              </>
            )}
            
            {user.user_type === 'admin' && (
              <>
                <Stack.Screen 
                  name="AdminDashboard" 
                  component={AdminDrawerNavigator}
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
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 