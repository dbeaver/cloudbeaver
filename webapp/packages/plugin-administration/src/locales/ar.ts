/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'الاتصالات'],
  ['administration_server_configuration_settings_ai', 'الذكاء الاصطناعي'],
  ['administration_server_configuration_settings_cloud', 'السحابة'],
  ['administration_server_configuration_settings_workspace', 'مساحة العمل'],
  ['administration_server_configuration_tab_drivers', 'برامج التشغيل'],
  ['administration_server_configuration_save_confirmation_title', 'تحديث إعدادات الخادم'],
  ['administration_server_configuration_save_confirmation_message', 'أنت على وشك تغيير إعدادات حساسة. هل أنت متأكد؟'],
  ['administration_configuration_wizard_welcome', 'مرحباً'],
  ['administration_configuration_wizard_welcome_step_description', 'مرحباً بك في {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'مرحباً بك في {alias:product_full_name}، نظام إدارة قواعد البيانات السحابي'],
  [
    'administration_configuration_wizard_welcome_message',
    'سيرشدك معالج الإعداد السهل عبر خطوات بسيطة لإعداد الخادم. ستحتاج إلى تحديد معلومات الخادم وبيانات اعتماد المسؤول. يمكنك إعداد معلمات إضافية للخادم بعد اكتمال الإعداد السهل.',
  ],
  ['administration_configuration_wizard_welcome_note', 'ملاحظة: يمكنك تغيير معلمات الإعداد هذه لاحقاً من لوحة الإدارة.'],
  ['administration_configuration_wizard_configuration', 'إعداد الخادم'],
  ['administration_configuration_wizard_configuration_step_description', 'الإعداد الرئيسي للخادم'],
  ['administration_configuration_wizard_configuration_description', 'اضبط المعلمات الرئيسية للخادم. يمكنك إضافة خدمات أخرى بعد اكتمال الإعداد.'],
  ['administration_configuration_wizard_configuration_password_warning', 'تذكر كلمة مرور المسؤول. لا يمكن استعادتها تلقائياً.'],
  ['administration_configuration_wizard_configuration_save_error', 'تعذر حفظ إعداد الخادم'],
  ['administration_configuration_tools_save_tooltip', 'حفظ الإعداد'],
  ['administration_configuration_tools_cancel_tooltip', 'إعادة تعيين التغييرات'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'فرض وضع HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'فعّل فرض HTTPS لتأمين الاتصال بين الخادم والعميل. يُوصى به للإنتاج. تأكد من إعداد وكيل HTTPS بشكل صحيح لضمان عمل التطبيق',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_warning', 'لن تُشفّر البيانات إذا عُطّل فرض وضع HTTPS، مما يجعلها عرضة للخطر'],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'توثيق إعداد وكيل الخادم'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'عناوين URL المسموح بها للخادم'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'يمكنك تحديد عدة عناوين URL للخادم، كل عنوان في سطر جديد. تعني القيمة الفارغة السماح بجميع العناوين. يُسمح دائماً بالوصول عبر عناوين IP.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'لا يمكنك إزالة نطاقك الحالي ({arg:host}). افتح إعداد الخادم من نطاق آخر مسموح به أو من عنوان IP لإزالة هذا النطاق.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'معلومات الخادم'],
  ['administration_configuration_wizard_configuration_server_name', 'اسم الخادم'],
  ['administration_configuration_wizard_configuration_server_url', 'عنوان URL للخادم'],
  ['administration_configuration_wizard_configuration_server_url_description', 'عنوان URL للوصول العام إلى الخادم'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'إعدادات غير محفوظة'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', 'يمكن حفظ الإعدادات في صفحة إعداد الخادم'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'فتح'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'مدة الجلسة، بالدقائق'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'يمكنك هنا تحديد عدد الدقائق التي يُسمح للجلسة بالبقاء خلالها خاملة قبل انتهاء صلاحيتها',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'الميزات'],
  ['administration_configuration_wizard_configuration_custom_connections', 'تمكين الاتصالات الخاصة'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'السماح للمستخدمين بإنشاء اتصالات خاصة'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'العرض المبسط للمستكشف'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'ستتضمن جميع اتصالات المستخدم الجديدة افتراضياً المعلومات الأساسية فقط في شجرة التنقل',
  ],
  ['administration_configuration_wizard_configuration_security', 'الأمان'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'حفظ بيانات الاعتماد'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'السماح بحفظ بيانات اعتماد قواعد البيانات المعدة مسبقاً',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'حفظ بيانات اعتماد المستخدمين'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'السماح بحفظ بيانات الاعتماد للمستخدمين غير المسؤولين',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'السماح بتغيير كلمة مرور مستخدم قاعدة البيانات'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'يتيح للمستخدمين تغيير كلمة مرور المستخدم المرتبط باتصال قاعدة البيانات',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'المستكشف'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'إخفاء المجلدات'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'إخفاء المخططات'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'إخفاء النموذج الافتراضي'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'دمج الكيانات'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'الكيانات فقط'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'كائنات النظام'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'الكائنات المساعدة'],
  ['administration_configuration_wizard_step_validation_message', 'تعذر الانتقال إلى الخطوة التالية'],
  ['administration_configuration_wizard_finish', 'التأكيد'],
  ['administration_configuration_wizard_finish_step_description', 'التأكيد'],
  ['administration_configuration_wizard_finish_title', 'أوشكنا على الانتهاء.'],
  [
    'administration_configuration_wizard_finish_message',
    'اضغط زر الإنهاء لإكمال إعداد الخادم. يمكنك العودة إلى الصفحات السابقة لتغيير شيء أو إضافته.\nعند اكتمال الإعداد، ستُطبق جميع الإعدادات المدخلة على خادمك. ستُوجّه إلى الصفحة الرئيسية لبدء العمل.\nيمكنك دائماً تسجيل الدخول بصفتك مسؤولاً لتغيير إعدادات الخادم.',
  ],
  ['administration_disabled_drivers_title', 'برامج التشغيل المعطلة'],
  ['administration_disabled_drivers_search_placeholder', 'البحث عن برنامج تشغيل...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'قد يتيح تمكين برنامج تشغيل قاعدة البيانات هذا الوصول إلى ملفات الخادم الذي يعمل عليه التطبيق، مما قد يكشف ملفات النظام الحساسة أو بيانات محمية أخرى.\n\nلا تتابع إلا إذا كنت تدرك العواقب تماماً وتثق بإعداد قاعدة البيانات. قد يؤدي الاستخدام غير المصرح به أو غير السليم لبرنامج التشغيل إلى مخاطر أمنية.\n\nهل تريد تمكين برنامج التشغيل "{arg:driverName}"؟',
  ],
];
