export const ROOM_TYPES = [
  { value: "kitchen", label: "Кухня" },
  { value: "bathroom", label: "Ванная" },
  { value: "bedroom", label: "Спальня" },
  { value: "livingroom", label: "Гостиная" },
  { value: "hallway", label: "Прихожая" },
  { value: "other", label: "Другое" },
];

export const BASE_ELEMENT_DEFS = [
  {
    id: "cabinet",
    type: "cabinet",
    label: "Тумба",
    behavior: "base-stretch",
    width: 1,
    height: 1,
    minWidth: 1,
    maxWidth: 6,
    allowedRoomTypes: ["kitchen", "bathroom", "hallway", "other"],
  },
  {
    id: "table",
    type: "table",
    label: "Стол",
    behavior: "base-stretch",
    width: 1,
    height: 1,
    minWidth: 1,
    maxWidth: 4,
    allowedRoomTypes: ["kitchen", "livingroom", "bedroom", "other"],
  },
  {
    id: "bed-double",
    type: "bed",
    label: "Кровать 2×2",
    behavior: "base-single",
    width: 2,
    height: 2,
    allowedRoomTypes: ["bedroom", "other"],
  },
  {
    id: "sofa-straight",
    type: "sofa",
    label: "Диван 2×1",
    behavior: "base-single",
    width: 2,
    height: 1,
    allowedRoomTypes: ["livingroom", "other"],
  },
];

export const ATTACHMENT_DEFS = [
  {
    id: "sink",
    type: "sink",
    label: "Раковина",
    slot: "top",
    allowedParents: ["cabinet"],
    allowedRoomTypes: ["kitchen", "bathroom", "other"],
  },
  {
    id: "trash",
    type: "trash",
    label: "Урна",
    slot: "inside",
    allowedParents: ["cabinet"],
    allowedRoomTypes: ["kitchen", "hallway", "other"],
  },
];

export function getDefaultRoomTitle(type) {
  const found = ROOM_TYPES.find((roomType) => roomType.value === type);
  return found ? found.label : "Комната";
}

export function getCleaningStatusLabel(status) {
  if (status === "partial") return "Проведена частичная уборка";
  if (status === "full") return "Проведена полная уборка";
  return "Уборка не проводилась";
}

export function getBaseElementsForRoom(roomType) {
  return BASE_ELEMENT_DEFS.filter((item) =>
    item.allowedRoomTypes.includes(roomType)
  );
}

export function getAttachmentsForRoom(roomType) {
  return ATTACHMENT_DEFS.filter((item) =>
    item.allowedRoomTypes.includes(roomType)
  );
}

export function getElementLabel(type) {
  if (type === "cabinet") return "Тумба";
  if (type === "table") return "Стол";
  if (type === "bed") return "Кровать";
  if (type === "sofa") return "Диван";
  if (type === "sink") return "Раковина";
  if (type === "trash") return "Мусорка";
  return "Элемент";
}

export function getTaskLabel(type) {
  if (type === "cabinet") return "Протереть тумбу";
  if (type === "table") return "Протереть стол";
  if (type === "bed") return "Привести в порядок кровать";
  if (type === "sofa") return "Пропылесосить диван";
  if (type === "sink") return "Помыть раковину";
  if (type === "trash") return "Вынести мусор";
  return "Убрать элемент";
}

export function createEmptyRoom(type, title) {
  const safeTitle = title.trim() || getDefaultRoomTitle(type);

  return {
    id: crypto.randomUUID(),
    type,
    title: safeTitle,
    cleaningStatus: "none",
    tiles: [{ x: 0, y: 0, isRoot: true }],
    elements: [],
  };
}