// src/i18n/i18n.ts
export type Language = "en" | "ru" | "tk";

export interface TranslationKeys {
    // Common
    common: {
        loading: string;
        error: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        create: string;
        search: string;
        filter: string;
        export: string;
        refresh: string;
        close: string;
        logout: string;
        login: string;
        register: string;
        email: string;
        password: string;
        name: string;
        status: string;
        actions: string;
        details: string;
        yes: string;
        no: string;
    };

    // Header
    header: {
        searchPlaceholder: string;
        notifications: string;
        online: string;
        lastUpdate: string;
        unread: string;
        markAllRead: string;
        clearAll: string;
        noNotifications: string;
    };

    // Sidebar
    sidebar: {
        dashboard: string;
        logViewer: string;
        incidents: string;
        analytics: string;
        integrations: string;
        alerts: string;
        settings: string;
        systemStatus: string;
        cpuUsage: string;
        userProfile: string;
    };

    // Dashboard
    dashboard: {
        title: string;
        totalEvents: string;
        criticalAlerts: string;
        threatsBlocked: string;
        securityScore: string;
        excellent: string;
        good: string;
        fair: string;
        poor: string;
        eventsTimeline: string;
        threatDistribution: string;
        liveActivityFeed: string;
        criticalIncidents: string;
        lastHour: string;
        last24Hours: string;
        systems: string;
    };

    // Logs
    logs: {
        title: string;
        filters: string;
        createLog: string;
        exportCSV: string;
        searchPlaceholder: string;
        allSeverities: string;
        allSources: string;
        timestamp: string;
        severity: string;
        source: string;
        message: string;
        ipAddress: string;
        user: string;
        action: string;
        showing: string;
        to: string;
        of: string;
        previous: string;
        next: string;
        logDetails: string;
        createNewLog: string;
        additionalDetails: string;
        noUser: string;
    };

    // Incidents
    incidents: {
        title: string;
        openIncidents: string;
        investigating: string;
        resolved: string;
        closed: string;
        requiresAttention: string;
        inProgress: string;
        completed: string;
        allStatuses: string;
        allSeverities: string;
        createIncident: string;
        updateIncident: string;
        affectedSystems: string;
        assignedTo: string;
        tags: string;
        noIncidents: string;
        adjustFilters: string;
        description: string;
        condition: string;
    };

    // Analytics
    analytics: {
        title: string;
        totalEvents24h: string;
        uniqueSources: string;
        criticalEvents: string;
        avgEventsPerHour: string;
        activity24h: string;
        topSources: string;
        severityDistribution: string;
        commonActions: string;
        sourceBreakdown: string;
        events: string;
        percentage: string;
        trend: string;
    };

    // Alerts
    alerts: {
        title: string;
        manageRules: string;
        newAlertRule: string;
        totalRules: string;
        activeRules: string;
        inactiveRules: string;
        active: string;
        condition: string;
        action: string;
        enable: string;
        disable: string;
        notificationChannels: string;
        notConfigured: string;
    };

    // Settings
    settings: {
        title: string;
        subtitle: string;
        userProfile: string;
        fullName: string;
        role: string;
        department: string;
        notifications: string;
        emailNotifications: string;
        emailNotificationsDesc: string;
        slackNotifications: string;
        slackNotificationsDesc: string;
        pushNotifications: string;
        pushNotificationsDesc: string;
        security: string;
        twoFactor: string;
        twoFactorDesc: string;
        sessionTimeout: string;
        displaySettings: string;
        refreshInterval: string;
        itemsPerPage: string;
        dataRetention: string;
        logRetention: string;
        incidentRetention: string;
        resetToDefault: string;
        saveChanges: string;
        saved: string;
        language: string;
        selectLanguage: string;
    };

    // Login
    login: {
        title: string;
        subtitle: string;
        loginTab: string;
        registerTab: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        signIn: string;
        createAccount: string;
        processing: string;
        quickAccess: string;
        demoLogin: string;
        demoCredentials: string;
        protectedBy: string;
    };

    // Severity levels
    severity: {
        critical: string;
        high: string;
        medium: string;
        low: string;
        info: string;
    };

    // Status
    statuses: {
        open: string;
        investigating: string;
        resolved: string;
        closed: string;
    };

    // Roles
    roles: {
        admin: string;
        analyst: string;
        viewer: string;
    };

    // Notifications
    notificationTypes: {
        logCreated: string;
        logCreatedMessage: string;
        settingsSaved: string;
        settingsSavedMessage: string;
        dataRefreshed: string;
        dataRefreshedMessage: string;
        welcome: string;
        welcomeMessage: string;
        newSecurityEvent: string;
        newSecurityIncident: string;
    };

    // Time units
    time: {
        seconds: string;
        minutes: string;
        hours: string;
        days: string;
        justNow: string;
    };
}

export const translations: Record<Language, TranslationKeys> = {
    en: {
        common: {
            loading: "Loading",
            error: "Error",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            create: "Create",
            search: "Search",
            filter: "Filter",
            export: "Export",
            refresh: "Refresh",
            close: "Close",
            logout: "Logout",
            login: "Login",
            register: "Register",
            email: "Email",
            password: "Password",
            name: "Name",
            status: "Status",
            actions: "Actions",
            details: "Details",
            yes: "Yes",
            no: "No",
        },
        header: {
            searchPlaceholder: "Search logs, incidents, IPs...",
            notifications: "Notifications",
            online: "Online",
            lastUpdate: "Last updated",
            unread: "unread",
            markAllRead: "Mark all read",
            clearAll: "Clear all",
            noNotifications: "No notifications",
        },
        sidebar: {
            dashboard: "Dashboard",
            logViewer: "Log Viewer",
            incidents: "Incidents",
            analytics: "Analytics",
            integrations: "Integrations",
            alerts: "Alerts",
            settings: "Settings",
            systemStatus: "System Status",
            cpuUsage: "CPU Usage",
            userProfile: "User Profile",
        },
        dashboard: {
            title: "Security Dashboard",
            totalEvents: "Total Events",
            criticalAlerts: "Critical Alerts",
            threatsBlocked: "Threats Blocked",
            securityScore: "Security Score",
            excellent: "Excellent",
            good: "Good",
            fair: "Fair",
            poor: "Poor",
            eventsTimeline: "Events Timeline (Last 24 Hours)",
            threatDistribution: "Threat Distribution by Severity",
            liveActivityFeed: "Live Activity Feed",
            criticalIncidents: "Critical & High Severity Incidents",
            lastHour: "vs last hour",
            last24Hours: "Last 24 Hours",
            systems: "systems",
        },
        logs: {
            title: "Log Viewer",
            filters: "Filters",
            createLog: "Create Log",
            exportCSV: "Export CSV",
            searchPlaceholder: "Search logs...",
            allSeverities: "All Severities",
            allSources: "All Sources",
            timestamp: "Timestamp",
            severity: "Severity",
            source: "Source",
            message: "Message",
            ipAddress: "IP Address",
            user: "User",
            action: "Action",
            showing: "Showing",
            to: "to",
            of: "of",
            previous: "Previous",
            next: "Next",
            logDetails: "Log Details",
            createNewLog: "Create New Log",
            additionalDetails: "Additional Details",
            noUser: "N/A",
        },
        incidents: {
            title: "Incidents",
            openIncidents: "Open Incidents",
            investigating: "Investigating",
            resolved: "Resolved",
            closed: "Closed",
            requiresAttention: "Requires attention",
            inProgress: "In progress",
            completed: "Completed",
            allStatuses: "All Statuses",
            allSeverities: "All Severities",
            createIncident: "Create Incident",
            updateIncident: "Update Incident",
            affectedSystems: "Affected Systems",
            assignedTo: "Assigned To",
            tags: "Tags",
            noIncidents: "No incidents found",
            adjustFilters: "Try adjusting your filters",
            description: "Description",
            condition: "Condition",
        },
        analytics: {
            title: "Analytics",
            totalEvents24h: "Total Events (24h)",
            uniqueSources: "Unique Sources",
            criticalEvents: "Critical Events",
            avgEventsPerHour: "Avg Events/Hour",
            activity24h: "24-Hour Activity Overview",
            topSources: "Top Event Sources",
            severityDistribution: "Severity Distribution",
            commonActions: "Most Common Actions",
            sourceBreakdown: "Source Breakdown",
            events: "Events",
            percentage: "Percentage",
            trend: "Trend",
        },
        alerts: {
            title: "Alert Rules",
            manageRules: "Manage detection rules and notification settings",
            newAlertRule: "New Alert Rule",
            totalRules: "Total Rules",
            activeRules: "Active Rules",
            inactiveRules: "Inactive Rules",
            active: "ACTIVE",
            condition: "Condition",
            action: "Action",
            enable: "Enable",
            disable: "Disable",
            notificationChannels: "Notification Channels",
            notConfigured: "Not configured",
        },
        settings: {
            title: "Settings",
            subtitle: "Configure system preferences and security options",
            userProfile: "User Profile",
            fullName: "Full Name",
            role: "Role",
            department: "Department",
            notifications: "Notifications",
            emailNotifications: "Email Notifications",
            emailNotificationsDesc: "Receive alerts via email",
            slackNotifications: "Slack Notifications",
            slackNotificationsDesc: "Post alerts to Slack channel",
            pushNotifications: "Push Notifications",
            pushNotificationsDesc: "Browser push notifications",
            security: "Security",
            twoFactor: "Two-Factor Authentication",
            twoFactorDesc: "Add an extra layer of security",
            sessionTimeout: "Session Timeout (minutes)",
            displaySettings: "Display Settings",
            refreshInterval: "Auto-Refresh Interval (seconds)",
            itemsPerPage: "Items Per Page",
            dataRetention: "Data Retention",
            logRetention: "Log Retention (days)",
            incidentRetention: "Incident Retention (days)",
            resetToDefault: "Reset to Default",
            saveChanges: "Save Changes",
            saved: "Saved!",
            language: "Language",
            selectLanguage: "Select Language",
        },
        login: {
            title: "SIEM Light",
            subtitle: "Security Information & Event Management",
            loginTab: "Login",
            registerTab: "Register",
            emailPlaceholder: "admin@siem.local",
            passwordPlaceholder: "••••••••",
            signIn: "Sign In",
            createAccount: "Create Account",
            processing: "Processing...",
            quickAccess: "Quick Access",
            demoLogin: "Login as Demo Admin",
            demoCredentials: "Email: admin@siem.local | Password: REDACTED-ROTATE-ADMIN-PASSWORD",
            protectedBy: "Protected by enterprise-grade security",
        },
        severity: {
            critical: "Critical",
            high: "High",
            medium: "Medium",
            low: "Low",
            info: "Info",
        },
        statuses: {
            open: "Open",
            investigating: "Investigating",
            resolved: "Resolved",
            closed: "Closed",
        },
        roles: {
            admin: "Administrator",
            analyst: "Analyst",
            viewer: "Viewer",
        },
        notificationTypes: {
            logCreated: "Log Created",
            logCreatedMessage: "New log created successfully",
            settingsSaved: "Settings Saved",
            settingsSavedMessage:
                "Your preferences have been updated successfully",
            dataRefreshed: "Data Refreshed",
            dataRefreshedMessage: "All data has been updated",
            welcome: "Welcome!",
            welcomeMessage: "Logged in as",
            newSecurityEvent: "Security Event",
            newSecurityIncident: "New Security Incident",
        },
        time: {
            seconds: "seconds",
            minutes: "minutes",
            hours: "hours",
            days: "days",
            justNow: "Just now",
        },
    },

    ru: {
        common: {
            loading: "Загрузка",
            error: "Ошибка",
            save: "Сохранить",
            cancel: "Отмена",
            delete: "Удалить",
            edit: "Редактировать",
            create: "Создать",
            search: "Поиск",
            filter: "Фильтр",
            export: "Экспорт",
            refresh: "Обновить",
            close: "Закрыть",
            logout: "Выход",
            login: "Вход",
            register: "Регистрация",
            email: "Email",
            password: "Пароль",
            name: "Имя",
            status: "Статус",
            actions: "Действия",
            details: "Детали",
            yes: "Да",
            no: "Нет",
        },
        header: {
            searchPlaceholder: "Поиск логов, инцидентов, IP...",
            notifications: "Уведомления",
            online: "Онлайн",
            lastUpdate: "Последнее обновление",
            unread: "непрочитанных",
            markAllRead: "Отметить все прочитанным",
            clearAll: "Очистить все",
            noNotifications: "Нет уведомлений",
        },
        sidebar: {
            dashboard: "Панель управления",
            logViewer: "Просмотр логов",
            incidents: "Инциденты",
            analytics: "Аналитика",
            integrations: "Интеграции",
            alerts: "Оповещения",
            settings: "Настройки",
            systemStatus: "Статус системы",
            cpuUsage: "Использование ЦП",
            userProfile: "Профиль пользователя",
        },
        dashboard: {
            title: "Панель безопасности",
            totalEvents: "Всего событий",
            criticalAlerts: "Критические оповещения",
            threatsBlocked: "Угрозы заблокированы",
            securityScore: "Оценка безопасности",
            excellent: "Отлично",
            good: "Хорошо",
            fair: "Удовлетворительно",
            poor: "Плохо",
            eventsTimeline: "Хронология событий (последние 24 часа)",
            threatDistribution: "Распределение угроз по серьезности",
            liveActivityFeed: "Лента активности",
            criticalIncidents:
                "Критические инциденты и инциденты высокой важности",
            lastHour: "за последний час",
            last24Hours: "Последние 24 часа",
            systems: "систем",
        },
        logs: {
            title: "Просмотр логов",
            filters: "Фильтры",
            createLog: "Создать лог",
            exportCSV: "Экспорт CSV",
            searchPlaceholder: "Поиск логов...",
            allSeverities: "Все уровни",
            allSources: "Все источники",
            timestamp: "Время",
            severity: "Серьезность",
            source: "Источник",
            message: "Сообщение",
            ipAddress: "IP адрес",
            user: "Пользователь",
            action: "Действие",
            showing: "Показано",
            to: "до",
            of: "из",
            previous: "Предыдущая",
            next: "Следующая",
            logDetails: "Детали лога",
            createNewLog: "Создать новый лог",
            additionalDetails: "Дополнительные детали",
            noUser: "Н/Д",
        },
        incidents: {
            title: "Инциденты",
            openIncidents: "Открытые инциденты",
            investigating: "Расследование",
            resolved: "Решено",
            closed: "Закрыто",
            requiresAttention: "Требует внимания",
            inProgress: "В процессе",
            completed: "Завершено",
            allStatuses: "Все статусы",
            allSeverities: "Все уровни",
            createIncident: "Создать инцидент",
            updateIncident: "Обновить инцидент",
            affectedSystems: "Затронутые системы",
            assignedTo: "Назначено",
            tags: "Теги",
            noIncidents: "Инциденты не найдены",
            adjustFilters: "Попробуйте изменить фильтры",
            description: "Описание",
            condition: "Условие",
        },
        analytics: {
            title: "Аналитика",
            totalEvents24h: "Всего событий (24ч)",
            uniqueSources: "Уникальные источники",
            criticalEvents: "Критические события",
            avgEventsPerHour: "Среднее событий/час",
            activity24h: "Обзор активности за 24 часа",
            topSources: "Основные источники событий",
            severityDistribution: "Распределение по серьезности",
            commonActions: "Наиболее частые действия",
            sourceBreakdown: "Разбивка по источникам",
            events: "События",
            percentage: "Процент",
            trend: "Тенденция",
        },
        alerts: {
            title: "Правила оповещений",
            manageRules:
                "Управление правилами обнаружения и настройками уведомлений",
            newAlertRule: "Новое правило",
            totalRules: "Всего правил",
            activeRules: "Активные правила",
            inactiveRules: "Неактивные правила",
            active: "АКТИВНО",
            condition: "Условие",
            action: "Действие",
            enable: "Включить",
            disable: "Отключить",
            notificationChannels: "Каналы уведомлений",
            notConfigured: "Не настроено",
        },
        settings: {
            title: "Настройки",
            subtitle: "Настройка параметров системы и безопасности",
            userProfile: "Профиль пользователя",
            fullName: "Полное имя",
            role: "Роль",
            department: "Отдел",
            notifications: "Уведомления",
            emailNotifications: "Email уведомления",
            emailNotificationsDesc: "Получать оповещения по email",
            slackNotifications: "Slack уведомления",
            slackNotificationsDesc: "Отправлять оповещения в Slack",
            pushNotifications: "Push уведомления",
            pushNotificationsDesc: "Уведомления в браузере",
            security: "Безопасность",
            twoFactor: "Двухфакторная аутентификация",
            twoFactorDesc: "Добавить дополнительный уровень безопасности",
            sessionTimeout: "Тайм-аут сеанса (минуты)",
            displaySettings: "Настройки отображения",
            refreshInterval: "Интервал автообновления (секунды)",
            itemsPerPage: "Элементов на странице",
            dataRetention: "Хранение данных",
            logRetention: "Хранение логов (дни)",
            incidentRetention: "Хранение инцидентов (дни)",
            resetToDefault: "Сбросить по умолчанию",
            saveChanges: "Сохранить изменения",
            saved: "Сохранено!",
            language: "Язык",
            selectLanguage: "Выбрать язык",
        },
        login: {
            title: "SIEM Light",
            subtitle: "Система управления информацией о безопасности",
            loginTab: "Вход",
            registerTab: "Регистрация",
            emailPlaceholder: "admin@siem.local",
            passwordPlaceholder: "••••••••",
            signIn: "Войти",
            createAccount: "Создать аккаунт",
            processing: "Обработка...",
            quickAccess: "Быстрый доступ",
            demoLogin: "Войти как демо администратор",
            demoCredentials: "Email: admin@siem.local | Пароль: REDACTED-ROTATE-ADMIN-PASSWORD",
            protectedBy: "Защищено корпоративной безопасностью",
        },
        severity: {
            critical: "Критический",
            high: "Высокий",
            medium: "Средний",
            low: "Низкий",
            info: "Информация",
        },
        statuses: {
            open: "Открыт",
            investigating: "Расследование",
            resolved: "Решено",
            closed: "Закрыто",
        },
        roles: {
            admin: "Администратор",
            analyst: "Аналитик",
            viewer: "Наблюдатель",
        },
        notificationTypes: {
            logCreated: "Лог создан",
            logCreatedMessage: "Новый лог успешно создан",
            settingsSaved: "Настройки сохранены",
            settingsSavedMessage: "Ваши настройки успешно обновлены",
            dataRefreshed: "Данные обновлены",
            dataRefreshedMessage: "Все данные обновлены",
            welcome: "Добро пожаловать!",
            welcomeMessage: "Вошли как",
            newSecurityEvent: "Событие безопасности",
            newSecurityIncident: "Новый инцидент безопасности",
        },
        time: {
            seconds: "секунд",
            minutes: "минут",
            hours: "часов",
            days: "дней",
            justNow: "Только что",
        },
    },

    tk: {
        common: {
            loading: "Ýüklenýär",
            error: "Ýalňyşlyk",
            save: "Ýatda sakla",
            cancel: "Ýatyr",
            delete: "Poz",
            edit: "Düzet",
            create: "Döret",
            search: "Gözle",
            filter: "Süzgüç",
            export: "Eksport",
            refresh: "Täzele",
            close: "Ýap",
            logout: "Çyk",
            login: "Gir",
            register: "Hasaba dur",
            email: "Email",
            password: "Parol",
            name: "At",
            status: "Status",
            actions: "Hereketler",
            details: "Jikme-jiklikler",
            yes: "Hawa",
            no: "Ýok",
        },
        header: {
            searchPlaceholder: "Žurnallary, hadysalary, IP-leri gözle...",
            notifications: "Habarnamalar",
            online: "Onlaýn",
            lastUpdate: "Soňky täzelenme",
            unread: "okalmadyk",
            markAllRead: "Ählisini okaldy diýip bellemek",
            clearAll: "Ählisini arassala",
            noNotifications: "Habarnamalar ýok",
        },
        sidebar: {
            dashboard: "Dolandyryş paneli",
            logViewer: "Žurnal görnüşi",
            incidents: "Hadysalar",
            analytics: "Analitika",
            integrations: "Integrasiýalar",
            alerts: "Duýduryşlar",
            settings: "Sazlamalar",
            systemStatus: "Ulgam ýagdaýy",
            cpuUsage: "CPU ulanylyşy",
            userProfile: "Ulanyjy profili",
        },
        dashboard: {
            title: "Howpsuzlyk paneli",
            totalEvents: "Jemi wakalary",
            criticalAlerts: "Kritiki duýduryşlar",
            threatsBlocked: "Howplar bloklandy",
            securityScore: "Howpsuzlyk bahasy",
            excellent: "Ajaýyp",
            good: "Gowy",
            fair: "Kadaly",
            poor: "Erbet",
            eventsTimeline: "Wakalaryň wagty (soňky 24 sagat)",
            threatDistribution: "Howplaryň ähmiýetine görä paýlanyşy",
            liveActivityFeed: "Göni işjeňlik",
            criticalIncidents: "Kritiki we ýokary ähmiýetli hadysalar",
            lastHour: "soňky sagat",
            last24Hours: "Soňky 24 sagat",
            systems: "ulgamlar",
        },
        logs: {
            title: "Žurnal görnüşi",
            filters: "Süzgüçler",
            createLog: "Žurnal döret",
            exportCSV: "CSV eksport",
            searchPlaceholder: "Žurnallary gözle...",
            allSeverities: "Ähli derejeler",
            allSources: "Ähli çeşmeler",
            timestamp: "Wagt",
            severity: "Ähmiýet",
            source: "Çeşme",
            message: "Habar",
            ipAddress: "IP salgysy",
            user: "Ulanyjy",
            action: "Hereket",
            showing: "Görkezilýär",
            to: "çenli",
            of: "jemi",
            previous: "Öňki",
            next: "Indiki",
            logDetails: "Žurnal jikme-jiklikleri",
            createNewLog: "Täze žurnal döret",
            additionalDetails: "Goşmaça jikme-jiklikler",
            noUser: "Ýok",
        },
        incidents: {
            title: "Hadysalar",
            openIncidents: "Açyk hadysalar",
            investigating: "Derňelýär",
            resolved: "Çözüldi",
            closed: "Ýapyk",
            requiresAttention: "Üns talap edýär",
            inProgress: "Dowam edýär",
            completed: "Tamamlandy",
            allStatuses: "Ähli statuslar",
            allSeverities: "Ähli derejeler",
            createIncident: "Hadysa döret",
            updateIncident: "Hadysany täzele",
            affectedSystems: "Täsir eden ulgamlar",
            assignedTo: "Bellenilen",
            tags: "Bellikler",
            noIncidents: "Hadysalar tapylmady",
            adjustFilters: "Süzgüçleri üýtgediň",
            description: "Beýany",
            condition: "Şert",
        },
        analytics: {
            title: "Analitika",
            totalEvents24h: "Jemi wakalary (24s)",
            uniqueSources: "Özboluşly çeşmeler",
            criticalEvents: "Kritiki wakalary",
            avgEventsPerHour: "Ortaça waka/sagat",
            activity24h: "24 sagatlyk işjeňlik",
            topSources: "Esasy çeşmeler",
            severityDistribution: "Ähmiýet boýunça paýlaşyş",
            commonActions: "Iň köp hereketler",
            sourceBreakdown: "Çeşme boýunça paýlaşyş",
            events: "Wakalary",
            percentage: "Göterim",
            trend: "Tendensiýa",
        },
        alerts: {
            title: "Duýduryş düzgünleri",
            manageRules:
                "Ýüze çykaryş düzgünlerini we habarnamalary dolandyryň",
            newAlertRule: "Täze düzgün",
            totalRules: "Jemi düzgünler",
            activeRules: "Işjeň düzgünler",
            inactiveRules: "Işjeň däl düzgünler",
            active: "IŞJEŇ",
            condition: "Şert",
            action: "Hereket",
            enable: "Goşmak",
            disable: "Öçürmek",
            notificationChannels: "Habar kanallary",
            notConfigured: "Sazlanmadyk",
        },
        settings: {
            title: "Sazlamalar",
            subtitle: "Ulgam sazlamalaryny we howpsuzlyk opsiýalaryny sazlaň",
            userProfile: "Ulanyjy profili",
            fullName: "Doly ady",
            role: "Roly",
            department: "Bölüm",
            notifications: "Habarnamalar",
            emailNotifications: "Email habarnamalary",
            emailNotificationsDesc: "Email arkaly habar almak",
            slackNotifications: "Slack habarnamalary",
            slackNotificationsDesc: "Slack-a habar ibermek",
            pushNotifications: "Push habarnamalary",
            pushNotificationsDesc: "Brauzerde habarnamalar",
            security: "Howpsuzlyk",
            twoFactor: "Iki faktorly tassyklama",
            twoFactorDesc: "Goşmaça howpsuzlyk gatlagy goşuň",
            sessionTimeout: "Sessiýa wagty (minutlar)",
            displaySettings: "Görkeziş sazlamalary",
            refreshInterval: "Awto-täzelenme wagty (sekundlar)",
            itemsPerPage: "Sahypada elementler",
            dataRetention: "Maglumatlary saklamak",
            logRetention: "Žurnallary saklamak (günler)",
            incidentRetention: "Hadysalary saklamak (günler)",
            resetToDefault: "Deslapky ýagdaýa getir",
            saveChanges: "Üýtgetmeleri ýatda sakla",
            saved: "Ýatda saklandy!",
            language: "Dil",
            selectLanguage: "Dil saýlaň",
        },
        login: {
            title: "SIEM Light",
            subtitle: "Howpsuzlyk maglumatlary we wakalar dolandyryş ulgamy",
            loginTab: "Giriş",
            registerTab: "Hasaba durmak",
            emailPlaceholder: "admin@siem.local",
            passwordPlaceholder: "••••••••",
            signIn: "Gir",
            createAccount: "Hasap döret",
            processing: "Işlenýär...",
            quickAccess: "Çalt giriş",
            demoLogin: "Demo admin hökmünde gir",
            demoCredentials: "Email: admin@siem.local | Parol: REDACTED-ROTATE-ADMIN-PASSWORD",
            protectedBy: "Korporatiw howpsuzlyk bilen goralýar",
        },
        severity: {
            critical: "Kritiki",
            high: "Ýokary",
            medium: "Orta",
            low: "Pes",
            info: "Maglumat",
        },
        statuses: {
            open: "Açyk",
            investigating: "Derňelýär",
            resolved: "Çözüldi",
            closed: "Ýapyk",
        },
        roles: {
            admin: "Administrator",
            analyst: "Analitik",
            viewer: "Synçy",
        },
        notificationTypes: {
            logCreated: "Žurnal döredildi",
            logCreatedMessage: "Täze žurnal üstünlikli döredildi",
            settingsSaved: "Sazlamalar ýatda saklandy",
            settingsSavedMessage: "Siziň sazlamalar üstünlikli täzelendi",
            dataRefreshed: "Maglumatlar täzelendi",
            dataRefreshedMessage: "Ähli maglumatlar täzelendi",
            welcome: "Hoş geldiňiz!",
            welcomeMessage: "Giriş hökmünde",
            newSecurityEvent: "Howpsuzlyk wakasy",
            newSecurityIncident: "Täze howpsuzlyk hadysasy",
        },
        time: {
            seconds: "sekunt",
            minutes: "minut",
            hours: "sagat",
            days: "gün",
            justNow: "Häzir",
        },
    },
};
