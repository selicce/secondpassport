import type { Language } from "@/lib/types";
import { DEFAULT_LOCALE } from "./config";

/**
 * Translation dictionaries.
 *
 * Only the shared application chrome (navigation, common actions, auth, key
 * disclaimers) is translated here to demonstrate the localization structure;
 * page-level strings can be migrated into these dictionaries incrementally.
 * `en` is the canonical key set — other locales must match its shape.
 */
export interface Dictionary {
  brand: { name: string; tagline: string };
  nav: {
    dashboard: string;
    companies: string;
    services: string;
    documents: string;
    invoices: string;
    messages: string;
    orderService: string;
    profile: string;
    adminDashboard: string;
    clients: string;
    cases: string;
    payments: string;
    tickets: string;
    users: string;
    auditLogs: string;
    settings: string;
  };
  common: {
    upload: string;
    download: string;
    view: string;
    cancel: string;
    submit: string;
    save: string;
    search: string;
    status: string;
    actions: string;
    dueDate: string;
    amount: string;
    signOut: string;
    nextAction: string;
    viewAll: string;
  };
  auth: {
    signIn: string;
    register: string;
    email: string;
    password: string;
    forgotPassword: string;
    welcomeBack: string;
    createAccount: string;
  };
  disclaimers: {
    bank: string;
    government: string;
    advice: string;
    accuracy: string;
    consent: string;
  };
}

const en: Dictionary = {
  brand: { name: "JR & Firm", tagline: "Client Portal" },
  nav: {
    dashboard: "Dashboard",
    companies: "My Companies",
    services: "My Services",
    documents: "Documents",
    invoices: "Invoices & Payments",
    messages: "Messages",
    orderService: "Order New Service",
    profile: "Profile",
    adminDashboard: "Admin Dashboard",
    clients: "Clients",
    cases: "Cases",
    payments: "Payments",
    tickets: "Tickets",
    users: "Users",
    auditLogs: "Audit Logs",
    settings: "Settings",
  },
  common: {
    upload: "Upload",
    download: "Download",
    view: "View",
    cancel: "Cancel",
    submit: "Submit",
    save: "Save",
    search: "Search",
    status: "Status",
    actions: "Actions",
    dueDate: "Due date",
    amount: "Amount",
    signOut: "Sign out",
    nextAction: "Next action",
    viewAll: "View all",
  },
  auth: {
    signIn: "Sign in",
    register: "Register",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    welcomeBack: "Welcome back",
    createAccount: "Create your account",
  },
  disclaimers: {
    bank: "Bank account approval is subject to the bank’s internal compliance review and is not guaranteed.",
    government:
      "Company registration, permits, licenses, immigration approvals, and government filings may be subject to review by the relevant authorities.",
    advice:
      "Information provided through the portal is for service coordination and administrative purposes only unless expressly confirmed in writing as formal legal, tax, or regulatory advice.",
    accuracy:
      "Clients are responsible for providing true, accurate, complete, and up-to-date information and documents.",
    consent:
      "By uploading documents, the client authorizes JR & Firm and its authorized staff, affiliates, and service partners to process the documents for the requested services, subject to applicable confidentiality and data protection obligations.",
  },
};

const zh: Dictionary = {
  brand: { name: "JR & Firm", tagline: "客户门户" },
  nav: {
    dashboard: "仪表盘",
    companies: "我的公司",
    services: "我的服务",
    documents: "文件中心",
    invoices: "发票与付款",
    messages: "消息",
    orderService: "订购新服务",
    profile: "个人资料",
    adminDashboard: "管理后台",
    clients: "客户",
    cases: "案件",
    payments: "付款",
    tickets: "工单",
    users: "用户",
    auditLogs: "审计日志",
    settings: "设置",
  },
  common: {
    upload: "上传",
    download: "下载",
    view: "查看",
    cancel: "取消",
    submit: "提交",
    save: "保存",
    search: "搜索",
    status: "状态",
    actions: "操作",
    dueDate: "到期日",
    amount: "金额",
    signOut: "退出登录",
    nextAction: "下一步",
    viewAll: "查看全部",
  },
  auth: {
    signIn: "登录",
    register: "注册",
    email: "电子邮箱",
    password: "密码",
    forgotPassword: "忘记密码？",
    welcomeBack: "欢迎回来",
    createAccount: "创建账户",
  },
  disclaimers: {
    bank: "银行开户须经银行内部合规审查，恕不保证一定成功。",
    government: "公司注册、许可证、执照、移民审批及政府备案均可能须经相关主管机关审查。",
    advice: "除非另有书面正式确认为法律、税务或监管意见，门户提供的信息仅供服务协调及行政用途。",
    accuracy: "客户有责任提供真实、准确、完整且最新的信息和文件。",
    consent: "上传文件即表示客户授权 JR & Firm 及其授权员工、关联方和服务伙伴在适用的保密及数据保护义务下，为所申请服务处理该等文件。",
  },
};

const ru: Dictionary = {
  brand: { name: "JR & Firm", tagline: "Клиентский портал" },
  nav: {
    dashboard: "Панель",
    companies: "Мои компании",
    services: "Мои услуги",
    documents: "Документы",
    invoices: "Счета и платежи",
    messages: "Сообщения",
    orderService: "Заказать услугу",
    profile: "Профиль",
    adminDashboard: "Админ-панель",
    clients: "Клиенты",
    cases: "Дела",
    payments: "Платежи",
    tickets: "Обращения",
    users: "Пользователи",
    auditLogs: "Журнал аудита",
    settings: "Настройки",
  },
  common: {
    upload: "Загрузить",
    download: "Скачать",
    view: "Просмотр",
    cancel: "Отмена",
    submit: "Отправить",
    save: "Сохранить",
    search: "Поиск",
    status: "Статус",
    actions: "Действия",
    dueDate: "Срок оплаты",
    amount: "Сумма",
    signOut: "Выйти",
    nextAction: "Следующий шаг",
    viewAll: "Показать все",
  },
  auth: {
    signIn: "Войти",
    register: "Регистрация",
    email: "Эл. почта",
    password: "Пароль",
    forgotPassword: "Забыли пароль?",
    welcomeBack: "С возвращением",
    createAccount: "Создать аккаунт",
  },
  disclaimers: {
    bank: "Одобрение банковского счёта зависит от внутренней комплаенс-проверки банка и не гарантируется.",
    government:
      "Регистрация компании, разрешения, лицензии, иммиграционные одобрения и государственные подачи могут подлежать проверке соответствующими органами.",
    advice:
      "Информация портала предназначена только для координации услуг и административных целей, если иное прямо не подтверждено письменно как официальная юридическая, налоговая или регуляторная консультация.",
    accuracy: "Клиент обязан предоставлять достоверную, точную, полную и актуальную информацию и документы.",
    consent:
      "Загружая документы, клиент уполномочивает JR & Firm и её сотрудников, аффилированных лиц и партнёров обрабатывать документы для заказанных услуг с соблюдением применимых обязательств конфиденциальности и защиты данных.",
  },
};

const uz: Dictionary = {
  brand: { name: "JR & Firm", tagline: "Mijozlar portali" },
  nav: {
    dashboard: "Boshqaruv paneli",
    companies: "Mening kompaniyalarim",
    services: "Mening xizmatlarim",
    documents: "Hujjatlar",
    invoices: "Hisob-fakturalar va to‘lovlar",
    messages: "Xabarlar",
    orderService: "Yangi xizmat buyurtma qilish",
    profile: "Profil",
    adminDashboard: "Admin panel",
    clients: "Mijozlar",
    cases: "Ishlar",
    payments: "To‘lovlar",
    tickets: "Murojaatlar",
    users: "Foydalanuvchilar",
    auditLogs: "Audit jurnali",
    settings: "Sozlamalar",
  },
  common: {
    upload: "Yuklash",
    download: "Yuklab olish",
    view: "Ko‘rish",
    cancel: "Bekor qilish",
    submit: "Yuborish",
    save: "Saqlash",
    search: "Qidirish",
    status: "Holat",
    actions: "Amallar",
    dueDate: "To‘lov muddati",
    amount: "Summa",
    signOut: "Chiqish",
    nextAction: "Keyingi qadam",
    viewAll: "Hammasini ko‘rish",
  },
  auth: {
    signIn: "Kirish",
    register: "Ro‘yxatdan o‘tish",
    email: "Email",
    password: "Parol",
    forgotPassword: "Parolni unutdingizmi?",
    welcomeBack: "Xush kelibsiz",
    createAccount: "Hisob yaratish",
  },
  disclaimers: {
    bank: "Bank hisobini ochish bankning ichki komplayens tekshiruviga bog‘liq va kafolatlanmaydi.",
    government:
      "Kompaniya ro‘yxatga olinishi, ruxsatnomalar, litsenziyalar, migratsiya tasdiqlari va davlat hujjatlari tegishli organlar tomonidan ko‘rib chiqilishi mumkin.",
    advice:
      "Portal orqali taqdim etilgan ma’lumotlar, agar yozma ravishda rasmiy yuridik, soliq yoki tartibga soluvchi maslahat sifatida tasdiqlanmagan bo‘lsa, faqat xizmatlarni muvofiqlashtirish va ma’muriy maqsadlar uchundir.",
    accuracy: "Mijoz haqiqiy, aniq, to‘liq va dolzarb ma’lumot va hujjatlarni taqdim etishga javobgardir.",
    consent:
      "Hujjatlarni yuklash orqali mijoz JR & Firm va uning vakolatli xodimlari, hamkorlariga so‘ralgan xizmatlar uchun hujjatlarni qayta ishlashga ruxsat beradi (maxfiylik va ma’lumotlarni himoya qilish majburiyatlariga rioya qilgan holda).",
  },
};

const DICTIONARIES: Record<Language, Dictionary> = { en, zh, ru, uz };

export function getDictionary(locale: Language | string | undefined): Dictionary {
  return DICTIONARIES[(locale as Language) in DICTIONARIES ? (locale as Language) : DEFAULT_LOCALE];
}
