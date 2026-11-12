/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Підключення'],
  ['administration_server_configuration_settings_ai', 'ШІ'],
  ['administration_server_configuration_settings_cloud', 'Хмара'],
  ['administration_server_configuration_settings_workspace', 'Робочий простір'],
  ['administration_server_configuration_tab_drivers', 'Драйвери'],
  ['administration_server_configuration_save_confirmation_title', 'Оновлення налаштувань сервера'],
  ['administration_server_configuration_save_confirmation_message', 'Ви збираєтеся змінити критичні налаштування. Продовжити?'],
  ['administration_configuration_wizard_welcome', 'Вітаємо'],
  ['administration_configuration_wizard_welcome_step_description', 'Вітаємо в {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Вітаємо в {alias:product_full_name}, хмарній системі керування базами даних'],
  [
    'administration_configuration_wizard_welcome_message',
    'Майстер простого налаштування проведе вас кількома простими кроками налаштування сервера. Потрібно вказати відомості про сервер та облікові дані адміністратора. Додаткові параметри сервера можна налаштувати після завершення простого налаштування.',
  ],
  ['administration_configuration_wizard_welcome_note', 'Примітка: ці параметри можна буде змінити пізніше на панелі адміністрування.'],
  ['administration_configuration_wizard_configuration', 'Конфігурація сервера'],
  ['administration_configuration_wizard_configuration_step_description', 'Основна конфігурація сервера'],
  [
    'administration_configuration_wizard_configuration_description',
    'Налаштуйте основні параметри сервера. Після завершення налаштування можна додати інші служби.',
  ],
  ['administration_configuration_wizard_configuration_password_warning', "Запам'ятайте пароль адміністратора. Його неможливо відновити автоматично."],
  ['administration_configuration_wizard_configuration_save_error', 'Не вдалося зберегти конфігурацію сервера'],
  ['administration_configuration_tools_save_tooltip', 'Зберегти конфігурацію'],
  ['administration_configuration_tools_cancel_tooltip', 'Скинути зміни'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'Примусово використовувати HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    "Увімкніть примусове використання HTTPS для захисту зв'язку між сервером і клієнтом. Рекомендовано для робочого середовища. Для належної роботи застосунку переконайтеся, що ваш HTTPS-проксі правильно налаштовано",
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Якщо примусовий режим HTTPS вимкнено, дані не шифруватимуться. Це робить їх уразливими',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Документація з налаштування проксі-сервера'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'Дозволені URL сервера'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Можна вказати кілька URL сервера, кожен із нового рядка. Порожнє значення означає, що дозволено всі URL. Доступ за IP-адресами дозволено завжди.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'Неможливо видалити поточний домен ({arg:host}). Щоб його видалити, відкрийте конфігурацію сервера з іншого дозволеного домену або IP-адреси.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Відомості про сервер'],
  ['administration_configuration_wizard_configuration_server_name', 'Назва сервера'],
  ['administration_configuration_wizard_configuration_server_url', 'URL сервера'],
  ['administration_configuration_wizard_configuration_server_url_description', 'URL глобального доступу до сервера'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Незбережені налаштування'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', 'Налаштування можна зберегти на сторінці конфігурації сервера'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Відкрити'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Час існування сеансу, хв'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Тут можна вказати кількість хвилин бездіяльності, після якої сеанс завершиться',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Можливості'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Увімкнути приватні підключення'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Дозволяє користувачам створювати приватні підключення'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Спрощений вигляд навігатора'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'Типово всі нові підключення користувача міститимуть лише основні відомості в дереві навігації',
  ],
  ['administration_configuration_wizard_configuration_security', 'Безпека'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Зберігати облікові дані'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Дозволяє зберігати облікові дані для попередньо налаштованих баз даних',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Зберігати облікові дані користувачів'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Дозволяє зберігати облікові дані користувачів без прав адміністратора',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'Дозволити зміну пароля користувача бази даних'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    "Дозволяє користувачам змінювати пароль користувача, пов'язаного з підключенням до бази даних",
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Навігатор'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Приховати теки'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Приховати схеми'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Приховати віртуальну модель'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', "Об'єднати сутності"],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Лише сутності'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', "Системні об'єкти"],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', "Допоміжні об'єкти"],
  ['administration_configuration_wizard_step_validation_message', 'Не вдалося перейти до наступного кроку'],
  ['administration_configuration_wizard_finish', 'Підтвердження'],
  ['administration_configuration_wizard_finish_step_description', 'Підтвердження'],
  ['administration_configuration_wizard_finish_title', 'Майже готово.'],
  [
    'administration_configuration_wizard_finish_message',
    'Натисніть кнопку «Завершити», щоб завершити налаштування сервера. Можна повернутися до попередніх сторінок, якщо потрібно щось змінити або додати.\nПісля завершення налаштування всі введені параметри буде застосовано до сервера. Вас буде перенаправлено на головну сторінку для початку роботи.\nВи завжди можете ввійти в систему як адміністратор, щоб змінити налаштування сервера.',
  ],
  ['administration_disabled_drivers_title', 'Вимкнені драйвери'],
  ['administration_disabled_drivers_search_placeholder', 'Пошук драйвера...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Увімкнення цього драйвера бази даних може надати доступ до файлів на сервері, де працює застосунок. Це може розкрити конфіденційні системні файли або інші захищені дані.\n\nПродовжуйте лише тоді, коли повністю розумієте наслідки та довіряєте конфігурації бази даних. Несанкціоноване або неналежне використання цього драйвера може спричинити ризики для безпеки.\n\nУвімкнути драйвер «{arg:driverName}»?',
  ],
];
