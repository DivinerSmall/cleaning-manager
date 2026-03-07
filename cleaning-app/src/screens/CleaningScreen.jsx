function getItemLabel(itemType) {
  if (itemType === "sink") return "Раковина";
  if (itemType === "trash") return "Урна";
  if (itemType === "table") return "Стол";
  if (itemType === "cabinet") return "Тумба";
  return "Элемент";
}

export default function CleaningScreen({
  room,
  cleaningSession,
  onToggleDone,
  onFinish,
  onBack,
}) {
  const minX = Math.min(...room.tiles.map((tile) => tile.x));
  const maxX = Math.max(...room.tiles.map((tile) => tile.x));
  const minY = Math.min(...room.tiles.map((tile) => tile.y));
  const maxY = Math.max(...room.tiles.map((tile) => tile.y));

  const columns = maxX - minX + 1;
  const rows = maxY - minY + 1;

  const total = cleaningSession.targets.length;
  const doneCount = cleaningSession.targets.filter((target) => target.done).length;
  const isFinished = total > 0 && doneCount === total;

  function findTarget(tile) {
    return cleaningSession.targets.find(
      (target) => target.x === tile.x && target.y === tile.y
    );
  }

  return (
    <div className="screen">
      <h1>Уборка: {room.title}</h1>
      <p>
        Выполнено: {doneCount} / {total}
      </p>

      <div className="cleaning-actions">
        <button onClick={onBack}>Назад</button>
        {isFinished && <button onClick={onFinish}>Завершить уборку</button>}
      </div>

      <div className="cleaning-layout">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 50px)`,
            gridTemplateRows: `repeat(${rows}, 50px)`,
          }}
        >
          {room.tiles.map((tile) => {
            const col = tile.x - minX + 1;
            const row = tile.y - minY + 1;
            const target = findTarget(tile);
            const isTarget = Boolean(target);
            const isDone = target?.done;

            return (
              <button
                key={`${tile.x}-${tile.y}`}
                className={`tile cleaning-tile ${isTarget ? "is-target" : ""} ${
                  isDone ? "is-done" : ""
                }`}
                style={{
                  gridColumn: col,
                  gridRow: row,
                }}
                onClick={() => {
                  if (isTarget) {
                    onToggleDone(tile.x, tile.y);
                  }
                }}
              >
                {tile.item && <div className={`item ${tile.item}`}></div>}
              </button>
            );
          })}
        </div>

        <div className="cleaning-list">
          {cleaningSession.targets.map((target) => (
            <div
              key={`${target.x}-${target.y}`}
              className={`cleaning-progress-item ${target.done ? "done" : ""}`}
            >
              {target.done ? "✓" : "○"} {getItemLabel(target.item)} — ({target.x},{" "}
              {target.y})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}