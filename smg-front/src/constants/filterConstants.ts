// 定数定義
export const EVENT_TYPES = {
  REGULAR: 'regular',
  PDCA_MEETING: 'pdcaMeeting',
  GROUP_CONSULTATION: 'groupConsultation',
  ONLINE_SEMINAR: 'onlineSeminar',
  SPECIAL_SEMINAR: 'specialSeminar',
} as const;

export const LOCATIONS = {
  TOKYO: 'tokyo',
  OSAKA: 'osaka',
  FUKUOKA: 'fukuoka',
  SENDAI: 'sendai',
  NAGOYA: 'nagoya',
  ONLINE: 'online',
} as const;

export const FORMATS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
} as const;

// 型定義
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export type Location = typeof LOCATIONS[keyof typeof LOCATIONS];
export type Format = typeof FORMATS[keyof typeof FORMATS];

// 表示名のマッピング
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EVENT_TYPES.REGULAR]: '定例会',
  [EVENT_TYPES.PDCA_MEETING]: 'PDCA実践会議',
  [EVENT_TYPES.GROUP_CONSULTATION]: '5大都市グループ相談会&交流会',
  [EVENT_TYPES.ONLINE_SEMINAR]: 'オンラインセミナー',
  [EVENT_TYPES.SPECIAL_SEMINAR]: '特別セミナー',
};

export const LOCATION_LABELS: Record<Location, string> = {
  [LOCATIONS.TOKYO]: '東京',
  [LOCATIONS.OSAKA]: '大阪',
  [LOCATIONS.FUKUOKA]: '福岡',
  [LOCATIONS.SENDAI]: '仙台',
  [LOCATIONS.NAGOYA]: '名古屋',
  [LOCATIONS.ONLINE]: 'オンライン',
};

export const FORMAT_LABELS: Record<Format, string> = {
  [FORMATS.ONLINE]: 'オンライン',
  [FORMATS.OFFLINE]: 'オフライン',
}; 