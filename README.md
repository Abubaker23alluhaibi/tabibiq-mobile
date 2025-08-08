# TabibiQ Mobile App

تطبيق TabibiQ المحمول - منصة طبيب العراق للجوال

## المميزات

### للمرضى
- ✅ تسجيل الدخول وإنشاء حساب
- ✅ البحث عن الأطباء حسب التخصص والمحافظة
- ✅ حجز المواعيد مع الأطباء
- ✅ عرض تفاصيل الأطباء والتقييمات
- ✅ إدارة المواعيد الشخصية
- ✅ تذكير الأدوية
- ✅ عرض المراكز الصحية
- ✅ الملف الشخصي مع إمكانية التعديل

### للأطباء
- ✅ تسجيل الدخول وإنشاء حساب طبيب
- ✅ لوحة تحكم الطبيب مع الإحصائيات
- ✅ إدارة المواعيد (قبول/رفض/إكمال)
- ✅ تقويم المواعيد اليومي
- ✅ تحليلات وإحصائيات الأداء
- ✅ الملف الشخصي للطبيب

### للإدارة
- ✅ تسجيل دخول الأدمن
- ✅ لوحة تحكم شاملة
- ✅ إدارة المستخدمين والأطباء
- ✅ إدارة المراكز الصحية
- ✅ إدارة المواعيد
- ✅ التحليلات والإحصائيات

### للمراكز الصحية
- ✅ تسجيل دخول المركز الصحي
- ✅ لوحة تحكم المركز
- ✅ إدارة الأطباء والمواعيد
- ✅ التقارير والإحصائيات

## التقنيات المستخدمة

- **React Native** - إطار العمل الأساسي
- **Expo** - منصة التطوير والنشر
- **TypeScript** - لغة البرمجة
- **React Navigation** - التنقل بين الشاشات
- **i18next** - الترجمة متعددة اللغات
- **AsyncStorage** - تخزين البيانات المحلي
- **Expo Vector Icons** - الأيقونات

## اللغات المدعومة

- العربية (ar)
- الإنجليزية (en)
- الكردية (ku)

## التثبيت والتشغيل

### المتطلبات

- Node.js (v16 أو أحدث)
- npm أو yarn
- Expo CLI
- Android Studio (للتطوير على Android)
- Xcode (للتطوير على iOS - macOS فقط)

### التثبيت

1. تثبيت التبعيات:
```bash
npm install
# أو
yarn install
```

2. تشغيل التطبيق:
```bash
npm start
# أو
yarn start
```

3. فتح التطبيق:
- على الهاتف: مسح رمز QR باستخدام تطبيق Expo Go
- على المحاكي: الضغط على `a` للـ Android أو `i` للـ iOS

### الأوامر المتاحة

```bash
# تشغيل التطبيق
npm start

# تشغيل على Android
npm run android

# تشغيل على iOS
npm run ios

# تشغيل على الويب
npm run web

# بناء التطبيق للإنتاج
npm run build:android
npm run build:ios

# اختبار الكود
npm test

# فحص الأخطاء
npm run lint
```

## هيكل المشروع

```
src/
├── components/          # المكونات المشتركة
├── contexts/           # React Context
│   └── AuthContext.tsx # سياق المصادقة
├── locales/            # ملفات الترجمة
│   ├── ar.ts          # العربية
│   ├── en.ts          # الإنجليزية
│   ├── ku.ts          # الكردية
│   └── index.ts       # إعداد الترجمة
├── navigation/         # التنقل
│   └── AppNavigator.tsx
├── screens/           # الشاشات
│   ├── LandingScreen.tsx
│   ├── LoginScreen.tsx
│   ├── UserSignUpScreen.tsx
│   ├── DoctorSignUpScreen.tsx
│   ├── UserHomeScreen.tsx
│   ├── DoctorDashboardScreen.tsx
│   ├── AdminDashboardScreen.tsx
│   ├── CenterHomeScreen.tsx
│   └── ... (شاشات أخرى)
├── services/          # خدمات API
│   └── api.ts
├── types/             # أنواع TypeScript
│   └── index.ts
└── utils/             # أدوات مساعدة
    └── theme.ts
```

## الشاشات المتاحة

### شاشات المصادقة
- `LandingScreen` - الصفحة الرئيسية
- `LoginScreen` - تسجيل الدخول
- `UserSignUpScreen` - تسجيل حساب مريض
- `DoctorSignUpScreen` - تسجيل حساب طبيب
- `AdminLoginScreen` - تسجيل دخول الأدمن
- `CenterLoginScreen` - تسجيل دخول المركز

### شاشات المريض
- `UserHomeScreen` - الصفحة الرئيسية للمريض
- `MyAppointmentsScreen` - مواعيدي
- `MedicineReminderScreen` - تذكير الأدوية
- `HealthCentersScreen` - المراكز الصحية
- `UserProfileScreen` - الملف الشخصي
- `DoctorDetailsScreen` - تفاصيل الطبيب

### شاشات الطبيب
- `DoctorDashboardScreen` - لوحة تحكم الطبيب
- `DoctorAppointmentsScreen` - مواعيد الطبيب
- `DoctorCalendarScreen` - تقويم الطبيب
- `DoctorAnalyticsScreen` - تحليلات الطبيب
- `DoctorProfileScreen` - ملف الطبيب الشخصي

### شاشات الإدارة
- `AdminDashboardScreen` - لوحة تحكم الأدمن

### شاشات المركز الصحي
- `CenterHomeScreen` - الصفحة الرئيسية للمركز

## API Integration

التطبيق يتصل بـ API الخادم على:
```
https://web-production-78766.up.railway.app/api
```

### النقاط النهائية الرئيسية

- `POST /auth/login` - تسجيل الدخول
- `POST /auth/register` - التسجيل
- `GET /doctors` - قائمة الأطباء
- `GET /appointments` - المواعيد
- `POST /appointments` - حجز موعد
- `GET /health-centers` - المراكز الصحية

## النشر

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

### التحديثات
```bash
npm run update
```

## المساهمة

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للدعم التقني أو الاستفسارات:
- البريد الإلكتروني: support@tabib-iq.com
- الموقع: https://tabib-iq.com

## الإصدارات

### v1.0.0
- ✅ جميع الشاشات الأساسية
- ✅ المصادقة والتنقل
- ✅ الترجمة متعددة اللغات
- ✅ التصميم المتجاوب
- ✅ التكامل مع API

### الميزات القادمة
- 🔄 الإشعارات الفورية
- 🔄 الدردشة مع الأطباء
- 🔄 الدفع الإلكتروني
- 🔄 التقارير الطبية
- 🔄 التصوير والملفات
- 🔄 الخرائط والموقع 