function getItemLabel(itemType) {
  if (itemType === "sink") return "Раковина";
  if (itemType === "trash") return "Урна";
  if (itemType === "table") return "Стол";
  if (itemType === "cabinet") return "Тумба";
  return "Элемент";
}

export default function CleaningSetupScreen({
  room,
  selectedTargets,
  setSelectedTargets,
  onStartFullCleaning,
  onStartPartialCleaning,
  onBack,
}) {
  const roomItems = room.tiles
    .filter((tile) => tile.item)
    .map((tile) => ({
      key: `${tile.x}-${tile.y}`,
      x: tile.x,
      y: tile.y,
      item: tile.item,
      label: getItemLabel(tile.item),
    }));

  function toggleTarget(targetKey) {
    setSelectedTargets((current) => {
      if (current.includes(targetKey)) {
        return current.filter((key) => key !== targetKey);
      }

      return [...current, targetKey];
    });
  }

  return (
    <div className="screen">
      <h1>Уборка: {room.title}</h1>
      <p>Выбери, что именно хочешь убрать</p>

      <div className="cleaning-actions">
        <button onClick={onStartFullCleaning}>Полная уборка</button>
        <button
          onClick={onStartPartialCleaning}
          disabled={selectedTargets.length === 0}
        >
          Начать частичную уборку
        </button>
        <button onClick={onBack}>Назад</button>
      </div>

      <div className="cleaning-list">
        {roomItems.length === 0 && <p>В комнате пока нет элементов для уборки</p>}

        {roomItems.map((target) => {
          const checked = selectedTargets.includes(target.key);

          return (
            <label key={target.key} className="cleaning-item">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTarget(target.key)}
              />
              <span>
                {target.label} — ({target.x}, {target.y})
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}