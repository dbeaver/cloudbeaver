/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', '연결'],
  ['administration_server_configuration_settings_ai', 'AI'],
  ['administration_server_configuration_settings_cloud', '클라우드'],
  ['administration_server_configuration_settings_workspace', '작업 공간'],
  ['administration_server_configuration_tab_drivers', '드라이버'],
  ['administration_server_configuration_save_confirmation_title', '서버 설정 업데이트'],
  ['administration_server_configuration_save_confirmation_message', '중요한 설정을 변경하려고 합니다. 계속하시겠습니까?'],
  ['administration_configuration_wizard_welcome', '환영합니다'],
  ['administration_configuration_wizard_welcome_step_description', '{alias:product_full_name}에 오신 것을 환영합니다'],
  ['administration_configuration_wizard_welcome_title', '클라우드 데이터베이스 관리 시스템 {alias:product_full_name}에 오신 것을 환영합니다'],
  [
    'administration_configuration_wizard_welcome_message',
    '간편 구성 마법사가 몇 가지 간단한 단계로 서버 설정을 안내합니다. 서버 정보와 관리자 자격 증명을 설정해야 합니다. 간편 구성을 완료한 후 추가 서버 매개변수를 설정할 수 있습니다.',
  ],
  ['administration_configuration_wizard_welcome_note', '참고: 이 구성 매개변수는 나중에 관리 패널에서 변경할 수 있습니다.'],
  ['administration_configuration_wizard_configuration', '서버 구성'],
  ['administration_configuration_wizard_configuration_step_description', '기본 서버 구성'],
  [
    'administration_configuration_wizard_configuration_description',
    '기본 서버 매개변수를 구성하세요. 설정이 완료되면 서비스를 더 추가할 수 있습니다.',
  ],
  ['administration_configuration_wizard_configuration_password_warning', '관리자 비밀번호를 기억해 두세요. 자동으로 복구할 수 없습니다.'],
  ['administration_configuration_wizard_configuration_save_error', '서버 구성 저장에 실패했습니다'],
  ['administration_configuration_tools_save_tooltip', '구성 저장'],
  ['administration_configuration_tools_cancel_tooltip', '변경 사항 재설정'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'HTTPS 모드 강제 적용'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'HTTPS 강제 적용을 활성화하여 서버와 클라이언트 간 통신을 보호하세요. 운영 환경에 권장합니다. 앱이 올바르게 작동하도록 HTTPS 프록시를 제대로 구성하세요',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'HTTPS 강제 모드를 비활성화하면 데이터가 암호화되지 않아 보안에 취약해집니다',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', '서버 프록시 구성 문서'],
  ['administration_configuration_wizard_configuration_supported_hosts', '허용된 서버 URL'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    '서버 URL을 줄 바꿈으로 구분하여 여러 개 지정할 수 있습니다. 비워 두면 모든 URL이 허용됩니다. IP 주소를 통한 액세스는 항상 허용됩니다.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    '현재 도메인({arg:host})은 제거할 수 없습니다. 이 도메인을 제거하려면 허용된 다른 도메인이나 IP 주소에서 서버 구성을 여세요.',
  ],
  ['administration_configuration_wizard_configuration_server_info', '서버 정보'],
  ['administration_configuration_wizard_configuration_server_name', '서버 이름'],
  ['administration_configuration_wizard_configuration_server_url', '서버 URL'],
  ['administration_configuration_wizard_configuration_server_url_description', '외부 액세스용 서버 URL'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', '저장하지 않은 설정'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', '서버 구성 페이지에서 설정을 저장할 수 있습니다'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', '열기'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', '세션 수명(분)'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    '세션이 유휴 상태로 유지될 수 있는 시간을 분 단위로 지정합니다',
  ],
  ['administration_configuration_wizard_configuration_plugins', '기능'],
  ['administration_configuration_wizard_configuration_custom_connections', '비공개 연결 활성화'],
  ['administration_configuration_wizard_configuration_custom_connections_description', '사용자의 비공개 연결 생성 허용'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', '탐색기 간단히 보기'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    '기본적으로 사용자의 모든 새 연결은 탐색 트리에 기본 정보만 표시합니다',
  ],
  ['administration_configuration_wizard_configuration_security', '보안'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', '자격 증명 저장'],
  ['administration_configuration_wizard_configuration_security_admin_credentials_description', '사전 구성된 데이터베이스의 자격 증명 저장 허용'],
  ['administration_configuration_wizard_configuration_security_public_credentials', '사용자 자격 증명 저장'],
  ['administration_configuration_wizard_configuration_security_public_credentials_description', '관리자가 아닌 사용자의 자격 증명 저장 허용'],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', '데이터베이스 사용자 비밀번호 변경 허용'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    '데이터베이스 연결에 연결된 사용자의 비밀번호 변경 허용',
  ],
  ['administration_configuration_wizard_configuration_navigator', '탐색기'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', '폴더 숨기기'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', '스키마 숨기기'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', '가상 모델 숨기기'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', '엔터티 병합'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', '엔터티만'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', '시스템 객체'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', '유틸리티 객체'],
  ['administration_configuration_wizard_step_validation_message', '다음 단계로 진행하지 못했습니다'],
  ['administration_configuration_wizard_finish', '확인'],
  ['administration_configuration_wizard_finish_step_description', '확인'],
  ['administration_configuration_wizard_finish_title', '거의 완료되었습니다.'],
  [
    'administration_configuration_wizard_finish_message',
    '완료 버튼을 눌러 서버 구성을 마치세요. 변경하거나 추가할 내용이 있으면 이전 페이지로 돌아갈 수 있습니다.\n구성이 완료되면 입력한 모든 설정이 서버에 적용되며, 작업을 시작할 수 있는 기본 페이지로 이동합니다.\n언제든지 관리자로 로그인하여 서버 설정을 변경할 수 있습니다.',
  ],
  ['administration_disabled_drivers_title', '비활성화된 드라이버'],
  ['administration_disabled_drivers_search_placeholder', '드라이버 검색...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    '이 데이터베이스 드라이버를 활성화하면 이 애플리케이션이 실행 중인 서버의 파일에 액세스할 수 있습니다. 중요한 시스템 파일이나 보호된 데이터가 노출될 수 있습니다.\n\n영향을 충분히 이해하고 데이터베이스 구성을 신뢰하는 경우에만 진행하세요. 이 드라이버를 무단으로 또는 부적절하게 사용하면 보안 위험이 발생할 수 있습니다.\n\n"{arg:driverName}" 드라이버를 활성화하시겠습니까?',
  ],
];
