export const ROOM_TYPES = [
  { value: "kitchen", label: "Кухня" },
  { value: "bathroom", label: "Ванная" },
  { value: "bedroom", label: "Спальня" },
  { value: "livingroom", label: "Гостиная" },
  { value: "hallway", label: "Прихожая" },
  { value: "other", label: "Другое" },
];

export const ROOM_ITEMS = {
  kitchen: [
    { value: "sink", label: "Раковина" },
    { value: "trash", label: "Урна" },
    { value: "table", label: "Стол" },
    { value: "cabinet", label: "Тумба" },
  ],
  bathroom: [
    { value: "sink", label: "Раковина" },
    { value: "cabinet", label: "Тумба" },
  ],
  bedroom: [
    { value: "table", label: "Стол" },
    { value: "cabinet", label: "Тумба" },
  ],
  livingroom: [
    { value: "table", label: "Стол" },
    { value: "cabinet", label: "Тумба" },
  ],
  hallway: [
    { value: "cabinet", label: "Тумба" },
    { value: "trash", label: "Урна" },
  ],
  other: [
    { value: "sink", label: "Раковина" },
    { value: "trash", label: "Урна" },
    { value: "table", label: "Стол" },
    { value: "cabinet", label: "Тумба" },
  ],
};

export function getDefaultRoomTitle(type) {
  const found = ROOM_TYPES.find((roomType) => roomType.value === type);
  return found ? found.label : "Комната";
}

export function getCleaningStatusLabel(status) {
  if (status === "partial") return "Проведена частичная уборка";
  if (status === "full") return "Проведена полная уборка";
  return "Уборка не проводилась";
}

export function createEmptyRoom(type, title) {
  const safeTitle = title.trim() || getDefaultRoomTitle(type);

  return {
    id: crypto.randomUUID(),
    type,
    title: safeTitle,
    cleaningStatus: "none",
    tiles: [{ x: 0, y: 0, isRoot: true, item: null }],
  };
}