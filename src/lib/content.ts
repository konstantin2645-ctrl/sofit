// Editable site content. Stored in the `settings` table under these keys;
// these defaults are used by the seed and as a fallback.

export type HeroContent = {
  title: string;
  lead: string;
  video: string;
  poster: string;
  primaryCta: string;
  secondaryCta: string;
};

export type AboutContent = {
  manifesto: string;
  text: string;
  stats: { value: string; label: string }[];
};

export type Service = {
  slug: string;
  title: string;
  lead: string;
  points: string[];
  image: string;
};

export type ContactsContent = {
  phone: string;
  email: string;
  pressEmail: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  hours: string;
  socials: { name: string; url: string }[];
};

export type Partner = { name: string; kind: string };

export type SiteContent = {
  hero: HeroContent;
  about: AboutContent;
  services: Service[];
  contacts: ContactsContent;
  partners: Partner[];
};

export const defaultContent: SiteContent = {
  hero: {
    title: "Ставим свет на главное",
    lead: "SOFIT — концертное агентство полного цикла. С 2009 года превращаем выступления артистов в события: от клубного сета на 300 человек до стадионного тура в 40 городах.",
    video: "/media/hero.mp4",
    poster: "/media/hero-poster.jpg",
    primaryCta: "Смотреть афишу",
    secondaryCta: "Обсудить проект",
  },
  about: {
    manifesto:
      "Зритель запоминает не райдер и не смету. Он запоминает момент, когда гаснет зал и луч находит артиста. Мы отвечаем за всё, что приводит к этой секунде, — и за всё, что происходит после неё.",
    text: "Мы — команда из 64 продюсеров, инженеров, художников по свету и промоутеров. Собственный парк оборудования, склад в Москве и подрядчики в 30 городах позволяют нам запускать гастроли за шесть недель и проводить фестивали без посредников.",
    stats: [
      { value: "17", label: "лет на рынке живой музыки" },
      { value: "2 400+", label: "концертов и шоу" },
      { value: "3,8 млн", label: "зрителей в залах и на стадионах" },
      { value: "11", label: "стран гастрольной географии" },
    ],
  },
  services: [
    {
      slug: "festivals",
      title: "Концерты и фестивали",
      lead: "Берём на себя событие целиком: концепцию, площадку, лайнап, билеты, безопасность и отчёт для партнёров.",
      points: [
        "Поиск и бронирование площадок от клубов до стадионов",
        "Формирование лайнапа и букинг хедлайнеров",
        "Билетная стратегия, ценообразование и контроль продаж",
        "Генеральный план, логистика, безопасность и волонтёры",
      ],
      image: "/media/stage-03.jpg",
    },
    {
      slug: "artists",
      title: "Работа с артистами",
      lead: "Строим гастрольную карьеру: от первого сольного концерта до арены. Ведём переговоры, райдеры и сопровождение тура.",
      points: [
        "Букинг и маршрутизация туров по России и зарубежью",
        "Технический и бытовой райдер, travel-менеджмент",
        "Стратегия выхода на новые города и залы",
        "Тур-менеджер и продакшн-менеджер в каждой поездке",
      ],
      image: "/media/stage-02.jpg",
    },
    {
      slug: "corporate",
      title: "Корпоративные мероприятия",
      lead: "Частные концерты, годовые собрания и юбилеи компаний с артистами первой величины и продакшеном уровня арены.",
      points: [
        "Подбор артистов под бюджет и аудиторию",
        "Сценарий, режиссура и ведущие",
        "Полная конфиденциальность и NDA",
        "Площадки в России, ОАЭ, Турции и Армении",
      ],
      image: "/media/stage-12.jpg",
    },
    {
      slug: "production",
      title: "Техническое производство",
      lead: "Собственный парк света, звука и видео, сценические конструкции и команда инженеров, которая едет вместе с шоу.",
      points: [
        "Звук: системы линейных массивов и мониторинг",
        "Свет: 600+ приборов, пульты и художники по свету",
        "LED-экраны, медиасерверы и видеоконтент",
        "Сцена, граунд-сапорт, подвес и спецэффекты",
      ],
      image: "/media/stage-08.jpg",
    },
    {
      slug: "promotion",
      title: "Продвижение мероприятий",
      lead: "Продаём залы: от наружной рекламы до таргета и работы с медиа. Отчитываемся продажами, а не охватами.",
      points: [
        "Медиапланы и сквозная аналитика продаж билетов",
        "Креатив, ключевой визуал и видеотизеры",
        "PR, аккредитация прессы и работа с блогерами",
        "Спонсорские интеграции и партнёрские пакеты",
      ],
      image: "/media/stage-06.jpg",
    },
  ],
  contacts: {
    phone: "+7 495 120-46-46",
    email: "hello@sofit.live",
    pressEmail: "press@sofit.live",
    address: "Москва, Бережковская набережная, 20, стр. 19",
    city: "Москва",
    lat: 55.7365,
    lng: 37.5513,
    hours: "Пн–Пт, 10:00–20:00",
    socials: [
      { name: "Telegram", url: "https://t.me/sofit_live" },
      { name: "ВКонтакте", url: "https://vk.com/sofit_live" },
      { name: "YouTube", url: "https://youtube.com/@sofit_live" },
      { name: "Instagram", url: "https://instagram.com/sofit.live" },
    ],
  },
  partners: [
    { name: "Квант Банк", kind: "Генеральный партнёр" },
    { name: "Северный поток ТВ", kind: "Медиапартнёр" },
    { name: "Радио Волна 104", kind: "Радиопартнёр" },
    { name: "Билетная система «Ряд»", kind: "Билетный оператор" },
    { name: "Аэро Линия", kind: "Авиаперевозчик" },
    { name: "Гостиницы «Маяк»", kind: "Отели" },
    { name: "Лабиринт Звука", kind: "Технический партнёр" },
    { name: "Город Медиа", kind: "Наружная реклама" },
  ],
};

export const contentKeys = Object.keys(defaultContent) as (keyof SiteContent)[];
