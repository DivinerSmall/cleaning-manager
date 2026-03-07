import { getElementLabel } from "../data/roomTypes";

function getTargetsFromRoom(room) {
  const targets = [];

  for (const element of room.elements || []) {
    targets.push({
      id: `element:${element.id}`,
      label: getElementLabel(element.type),
      x: element.x,
      y: element.y,
    });

    if (element.attachments?.top) {
      targets.push({
        id: `attachment:${element.id}:top`,
        label: getElementLabel(element.attachments.top),
        x: element.x,
        y: element.y,
      });
    }

    if (element.attachments?.inside) {
      targets.push({
        id: `attachment:${element.id}:inside`,
        label: getElementLabel(element.attachments.inside),
        x: element.x,
        y: element.y,
      });
    }
  }

  return targets;
}

export default function CleaningSetupScreen({
  room,
  selectedTargets,
  setSelectedTargets,
  onStartFullCleaning,
  onStartPartialCleaning,
  onBack,
}) {
  const roomTargets = getTargetsFromRoom(room);

  function toggleTarget(targetId) {
    setSelectedTargets((current) => {
      if (current.includes(targetId)) {
        return current.filter((id) => id !== targetId);
      }

      return [...current, targetId];
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
        {roomTargets.length === 0 && <p>В комнате пока нет элементов для уборки</p>}

        {roomTargets.map((target) => {
          const checked = selectedTargets.includes(target.id);

          return (
            <label key={target.id} className="cleaning-item">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTarget(target.id)}
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