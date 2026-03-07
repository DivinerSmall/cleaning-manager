import { getElementLabel } from "../data/roomTypes";

function getRenderUnits(room) {
  const units = [];

  for (const element of room.elements || []) {
    units.push({
      id: `element:${element.id}`,
      x: element.x,
      y: element.y,
      width: element.width || 1,
      height: element.height || 1,
      type: element.type,
      label: getElementLabel(element.type),
      kind: "base",
    });

    if (element.attachments?.top) {
      units.push({
        id: `attachment:${element.id}:top`,
        x: element.x,
        y: element.y,
        width: 1,
        height: 1,
        type: element.attachments.top,
        label: getElementLabel(element.attachments.top),
        kind: "attachment",
      });
    }

    if (element.attachments?.inside) {
      units.push({
        id: `attachment:${element.id}:inside`,
        x: element.x,
        y: element.y,
        width: 1,
        height: 1,
        type: element.attachments.inside,
        label: getElementLabel(element.attachments.inside),
        kind: "attachment",
      });
    }
  }

  return units;
}

export default function CleaningScreen({
  room,
  cleaningSession,
  onToggleDone,
  onFinish,
  onBack,
}) {
  const tiles = room.tiles;
  const units = getRenderUnits(room);

  const minX = Math.min(...tiles.map((tile) => tile.x));
  const minY = Math.min(...tiles.map((tile) => tile.y));

  const normalizedTiles = tiles.map((tile) => ({
    ...tile,
    gridX: tile.x - minX,
    gridY: tile.y - minY,
  }));

  const tileWidth = 88;
  const tileHeight = 44;
  const floorThickness = 14;

  const hasTile = (x, y) =>
    normalizedTiles.some((tile) => tile.gridX === x && tile.gridY === y);

  const isoTiles = normalizedTiles
    .map((tile) => {
      const isoX = (tile.gridX - tile.gridY) * (tileWidth / 2);
      const isoY = (tile.gridX + tile.gridY) * (tileHeight / 2);

      return {
        ...tile,
        isoX,
        isoY,
        exposedTop: !hasTile(tile.gridX, tile.gridY - 1),
        exposedRight: !hasTile(tile.gridX + 1, tile.gridY),
        exposedBottom: !hasTile(tile.gridX, tile.gridY + 1),
        exposedLeft: !hasTile(tile.gridX - 1, tile.gridY),
      };
    })
    .sort((a, b) => a.isoY - b.isoY || a.isoX - b.isoX);

  const minIsoX = Math.min(...isoTiles.map((tile) => tile.isoX));
  const maxIsoX = Math.max(...isoTiles.map((tile) => tile.isoX));
  const maxIsoY = Math.max(...isoTiles.map((tile) => tile.isoY));

  const sceneWidth = maxIsoX - minIsoX + tileWidth + 140;
  const sceneHeight = maxIsoY + tileHeight + floorThickness + 140;

  const total = cleaningSession.targets.length;
  const doneCount = cleaningSession.targets.filter((target) => target.done).length;
  const isFinished = total > 0 && doneCount === total;

  function findTargetsByCell(x, y) {
    return cleaningSession.targets.filter(
      (target) => target.x === x && target.y === y
    );
  }

  function isUnitDone(unit) {
    const target = cleaningSession.targets.find((item) => item.id === unit.id);
    return Boolean(target?.done);
  }

  const isoUnits = units
    .map((unit) => {
      const gridX = unit.x - minX;
      const gridY = unit.y - minY;
      const isoX = (gridX - gridY) * (tileWidth / 2);
      const isoY = (gridX + gridY) * (tileHeight / 2);

      return {
        ...unit,
        isoX,
        isoY,
        done: isUnitDone(unit),
      };
    })
    .sort((a, b) => a.isoY - b.isoY || a.isoX - b.isoX);

  return (
    <div className="screen cleaning-screen">
      <h1>Уборка: {room.title}</h1>
      <p>
        Выполнено: {doneCount} / {total}
      </p>

      <div className="cleaning-actions">
        <button onClick={onBack}>Назад</button>
        {isFinished && <button onClick={onFinish}>Завершить уборку</button>}
      </div>

      <div className="cleaning-layout cleaning-layout-iso">
        <div className="cleaning-sidebar">
          <div className="cleaning-panel">
            <h3>Задачи</h3>

            <div className="cleaning-list">
              {cleaningSession.targets.map((target) => (
                <div
                  key={target.id}
                  className={`cleaning-progress-item ${target.done ? "done" : ""}`}
                >
                  <span className="task-mark">{target.done ? "✓" : "○"}</span>
                  <span>{target.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cleaning-stage">
          <div
            className="iso-scene-card"
            style={{
              width: `${sceneWidth}px`,
              height: `${sceneHeight}px`,
            }}
          >
            <div className="iso-room-shadow" />

            {isoTiles.map((tile, index) => {
              const left = tile.isoX - minIsoX + 70;
              const top = tile.isoY + 36;
              const targets = findTargetsByCell(tile.x, tile.y);
              const isTarget = targets.length > 0;
              const isDone = isTarget && targets.every((target) => target.done);

              return (
                <button
                  key={`${tile.x}-${tile.y}`}
                  className={`iso-floor-tile ${isTarget ? "is-target" : ""} ${
                    isDone ? "is-done" : ""
                  }`}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    zIndex: 10 + index,
                    width: `${tileWidth}px`,
                    height: `${tileHeight + floorThickness}px`,
                  }}
                  onClick={() => {
                    for (const target of targets) {
                      onToggleDone(target.id);
                    }
                  }}
                >
                  <svg
                    className="iso-floor-svg"
                    viewBox={`0 0 ${tileWidth} ${tileHeight + floorThickness}`}
                  >
                    {tile.exposedRight && (
                      <polygon
                        className="iso-floor-right"
                        points={`
                          ${tileWidth / 2},${tileHeight / 2}
                          ${tileWidth},${tileHeight}
                          ${tileWidth},${tileHeight + floorThickness}
                          ${tileWidth / 2},${tileHeight / 2 + floorThickness}
                        `}
                      />
                    )}

                    {tile.exposedBottom && (
                      <polygon
                        className="iso-floor-bottom"
                        points={`
                          0,${tileHeight}
                          ${tileWidth / 2},${tileHeight / 2}
                          ${tileWidth / 2},${tileHeight / 2 + floorThickness}
                          0,${tileHeight + floorThickness}
                        `}
                      />
                    )}

                    <polygon
                      className="iso-floor-top"
                      points={`
                        ${tileWidth / 2},0
                        ${tileWidth},${tileHeight / 2}
                        ${tileWidth / 2},${tileHeight}
                        0,${tileHeight / 2}
                      `}
                    />
                  </svg>
                </button>
              );
            })}

            {isoUnits.map((unit, index) => {
              const left = unit.isoX - minIsoX + 70;
              const top = unit.isoY + 18;

              return (
                <button
                  key={unit.id}
                  className={`iso-unit ${unit.kind} ${unit.type} ${
                    unit.done ? "done" : ""
                  }`}
                  style={{
                    left: `${left + 24}px`,
                    top: `${top + 18}px`,
                    zIndex: 300 + index,
                  }}
                  onClick={() => onToggleDone(unit.id)}
                  title={unit.label}
                >
                  <span className="iso-unit-label">{unit.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}