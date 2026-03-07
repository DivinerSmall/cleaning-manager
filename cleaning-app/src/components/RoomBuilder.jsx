import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAttachmentsForRoom,
  getBaseElementsForRoom,
  getDefaultRoomTitle,
  getElementLabel,
} from "../data/roomTypes";

function createElementFromDef(def, x, y) {
  return {
    id: crypto.randomUUID(),
    type: def.type,
    definitionId: def.id,
    x,
    y,
    width: def.width,
    height: def.height,
    minWidth: def.minWidth || def.width || 1,
    maxWidth: def.maxWidth || def.width || 1,
    behavior: def.behavior,
    attachments: {},
  };
}

function getElementCells(element) {
  const cells = [];

  for (let dy = 0; dy < (element.height || 1); dy += 1) {
    for (let dx = 0; dx < (element.width || 1); dx += 1) {
      cells.push({
        x: element.x + dx,
        y: element.y + dy,
      });
    }
  }

  return cells;
}

function getRoomTileMap(tiles) {
  const map = new Set();
  for (const tile of tiles) {
    map.add(`${tile.x}-${tile.y}`);
  }
  return map;
}

function canPlaceElementAt(defOrSize, x, y, tiles, elements) {
  const tileMap = getRoomTileMap(tiles);
  const width = defOrSize.width || 1;
  const height = defOrSize.height || 1;

  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      const cellX = x + dx;
      const cellY = y + dy;

      if (!tileMap.has(`${cellX}-${cellY}`)) {
        return false;
      }

      for (const element of elements) {
        const occupied = getElementCells(element).some(
          (cell) => cell.x === cellX && cell.y === cellY
        );

        if (occupied) {
          return false;
        }
      }
    }
  }

  return true;
}

function findElementAtCell(elements, x, y) {
  return (
    elements.find((element) =>
      getElementCells(element).some((cell) => cell.x === x && cell.y === y)
    ) || null
  );
}

function getElementDisplayClass(type) {
  if (type === "cabinet") return "placed-cabinet";
  if (type === "table") return "placed-table";
  if (type === "bed") return "placed-bed";
  if (type === "sofa") return "placed-sofa";
  return "";
}

export default function RoomBuilder({ room, onBack, onSave }) {
  const [tiles, setTiles] = useState(room.tiles);
  const [elements, setElements] = useState(room.elements || []);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [dragHoverKey, setDragHoverKey] = useState(null);

  const holdTimerRef = useRef(null);
  const dragModeRef = useRef(null);
  const didDragRef = useRef(false);
  const dragAccumRef = useRef(0);

  const baseElements = getBaseElementsForRoom(room.type);
  const attachments = getAttachmentsForRoom(room.type);

  const selectedElement =
    elements.find((element) => element.id === selectedElementId) || null;

  function hasTile(x, y, customTiles = tiles) {
    return customTiles.some((tile) => tile.x === x && tile.y === y);
  }

  function getTile(x, y, customTiles = tiles) {
    return customTiles.find((tile) => tile.x === x && tile.y === y);
  }

  function getNeighbors(tile, customTiles) {
    const neighborCoords = [
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x + 1, y: tile.y },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x - 1, y: tile.y },
    ];

    return neighborCoords
      .map(({ x, y }) => getTile(x, y, customTiles))
      .filter(Boolean);
  }

  function isRoomConnectedAfterRemoval(x, y, customTiles = tiles) {
    const tileToRemove = getTile(x, y, customTiles);

    if (!tileToRemove || tileToRemove.isRoot) {
      return false;
    }

    const remainingTiles = customTiles.filter(
      (tile) => !(tile.x === x && tile.y === y)
    );

    if (remainingTiles.length <= 1) {
      return true;
    }

    const visited = new Set();
    const stack = [remainingTiles[0]];

    while (stack.length > 0) {
      const current = stack.pop();
      const key = `${current.x}-${current.y}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      const neighbors = getNeighbors(current, remainingTiles);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x}-${neighbor.y}`;

        if (!visited.has(neighborKey)) {
          stack.push(neighbor);
        }
      }
    }

    return visited.size === remainingTiles.length;
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function addTile(x, y) {
    setTiles((currentTiles) => {
      if (currentTiles.some((tile) => tile.x === x && tile.y === y)) {
        return currentTiles;
      }

      return [...currentTiles, { x, y, isRoot: false }];
    });
  }

  function addFromSelected(dx, dy) {
    if (!selectedTile) {
      return;
    }

    const newX = selectedTile.x + dx;
    const newY = selectedTile.y + dy;

    if (hasTile(newX, newY)) {
      return;
    }

    addTile(newX, newY);
    setSelectedTile({ x: newX, y: newY });
  }

  function expandSide(dx, dy) {
    setTiles((currentTiles) => {
      let edgeTiles = [];

      if (dx === -1) {
        const minX = Math.min(...currentTiles.map((tile) => tile.x));
        edgeTiles = currentTiles.filter((tile) => tile.x === minX);
      }

      if (dx === 1) {
        const maxX = Math.max(...currentTiles.map((tile) => tile.x));
        edgeTiles = currentTiles.filter((tile) => tile.x === maxX);
      }

      if (dy === -1) {
        const minY = Math.min(...currentTiles.map((tile) => tile.y));
        edgeTiles = currentTiles.filter((tile) => tile.y === minY);
      }

      if (dy === 1) {
        const maxY = Math.max(...currentTiles.map((tile) => tile.y));
        edgeTiles = currentTiles.filter((tile) => tile.y === maxY);
      }

      const newTiles = edgeTiles
        .map((tile) => ({
          x: tile.x + dx,
          y: tile.y + dy,
          isRoot: false,
        }))
        .filter(
          (tile) =>
            !currentTiles.some(
              (currentTile) =>
                currentTile.x === tile.x && currentTile.y === tile.y
            )
        );

      if (newTiles.length === 0) {
        return currentTiles;
      }

      return [...currentTiles, ...newTiles];
    });
  }

  function shrinkSide(dx, dy) {
    setTiles((currentTiles) => {
      let sideTiles = [];

      if (dx === -1) {
        const minX = Math.min(...currentTiles.map((tile) => tile.x));
        sideTiles = currentTiles.filter((tile) => tile.x === minX && !tile.isRoot);
      }

      if (dx === 1) {
        const maxX = Math.max(...currentTiles.map((tile) => tile.x));
        sideTiles = currentTiles.filter((tile) => tile.x === maxX && !tile.isRoot);
      }

      if (dy === -1) {
        const minY = Math.min(...currentTiles.map((tile) => tile.y));
        sideTiles = currentTiles.filter((tile) => tile.y === minY && !tile.isRoot);
      }

      if (dy === 1) {
        const maxY = Math.max(...currentTiles.map((tile) => tile.y));
        sideTiles = currentTiles.filter((tile) => tile.y === maxY && !tile.isRoot);
      }

      if (sideTiles.length === 0) {
        return currentTiles;
      }

      let testTiles = [...currentTiles];

      for (const tile of sideTiles) {
        if (!isRoomConnectedAfterRemoval(tile.x, tile.y, testTiles)) {
          return currentTiles;
        }

        const blockedByElement = elements.some((element) =>
          getElementCells(element).some(
            (cell) => cell.x === tile.x && cell.y === tile.y
          )
        );

        if (blockedByElement) {
          return currentTiles;
        }

        testTiles = testTiles.filter(
          (testTile) => !(testTile.x === tile.x && testTile.y === tile.y)
        );
      }

      if (
        selectedTile &&
        sideTiles.some(
          (tile) => tile.x === selectedTile.x && tile.y === selectedTile.y
        )
      ) {
        setSelectedTile(null);
      }

      return currentTiles.filter(
        (tile) =>
          !sideTiles.some(
            (sideTile) => sideTile.x === tile.x && sideTile.y === tile.y
          )
      );
    });
  }

  function handleGlobalControl(dx, dy, mode) {
    if (mode === "expand") {
      expandSide(dx, dy);
      return;
    }

    shrinkSide(dx, dy);
  }

  function removeTile(x, y) {
    const occupied = elements.some((element) =>
      getElementCells(element).some((cell) => cell.x === x && cell.y === y)
    );

    if (occupied) {
      alert("Сначала убери мебель с этого тайла");
      return;
    }

    setTiles((currentTiles) => {
      const tileToRemove = currentTiles.find(
        (tile) => tile.x === x && tile.y === y
      );

      if (!tileToRemove || tileToRemove.isRoot) {
        return currentTiles;
      }

      if (!isRoomConnectedAfterRemoval(x, y, currentTiles)) {
        alert("Нельзя удалить этот тайл: форма комнаты распадётся");
        return currentTiles;
      }

      return currentTiles.filter((tile) => !(tile.x === x && tile.y === y));
    });

    if (selectedTile && selectedTile.x === x && selectedTile.y === y) {
      setSelectedTile(null);
    }
  }

  function placeBaseElement(def, x, y) {
    if (!canPlaceElementAt(def, x, y, tiles, elements)) {
      alert("Элемент сюда не помещается");
      return false;
    }

    const nextElement = createElementFromDef(def, x, y);
    setElements((current) => [...current, nextElement]);
    return true;
  }

  function placeAttachmentOnElement(def, parentId) {
    const parent = elements.find((element) => element.id === parentId);

    if (!parent) {
      return false;
    }

    if (!def.allowedParents.includes(parent.type)) {
      alert("Этот модуль нельзя встроить в выбранный элемент");
      return false;
    }

    if (parent.attachments?.[def.slot]) {
      alert("Этот слот уже занят");
      return false;
    }

    setElements((current) =>
      current.map((element) =>
        element.id === parent.id
          ? {
              ...element,
              attachments: {
                ...element.attachments,
                [def.slot]: def.type,
              },
            }
          : element
      )
    );

    return true;
  }

  function placeAttachmentByCell(def, x, y) {
    const parent = findElementAtCell(elements, x, y);

    if (!parent) {
      alert("Этот модуль нужно ставить на подходящую мебель");
      return false;
    }

    return placeAttachmentOnElement(def, parent.id);
  }

  function removeSelectedElement() {
    if (!selectedElement) return;

    setElements((current) =>
      current.filter((element) => element.id !== selectedElement.id)
    );
    setSelectedElementId(null);
  }

  function removeAttachment(slot) {
    if (!selectedElement) return;

    setElements((current) =>
      current.map((element) =>
        element.id === selectedElement.id
          ? {
              ...element,
              attachments: {
                ...element.attachments,
                [slot]: null,
              },
            }
          : element
      )
    );
  }

  function stretchSelectedElement() {
    if (!selectedElement) return;
    if (selectedElement.behavior !== "base-stretch") return;
    if (selectedElement.width >= selectedElement.maxWidth) return;

    const cloneElements = elements.filter(
      (element) => element.id !== selectedElement.id
    );

    const canStretch = canPlaceElementAt(
      {
        width: selectedElement.width + 1,
        height: selectedElement.height,
      },
      selectedElement.x,
      selectedElement.y,
      tiles,
      cloneElements
    );

    if (!canStretch) {
      alert("Нельзя растянуть элемент дальше");
      return;
    }

    setElements((current) =>
      current.map((element) =>
        element.id === selectedElement.id
          ? { ...element, width: element.width + 1 }
          : element
      )
    );
  }

  function shrinkSelectedElement() {
    if (!selectedElement) return;
    if (selectedElement.behavior !== "base-stretch") return;
    if (selectedElement.width <= selectedElement.minWidth) return;

    setElements((current) =>
      current.map((element) =>
        element.id === selectedElement.id
          ? { ...element, width: element.width - 1 }
          : element
      )
    );
  }

  function handleTileClick(tile) {
    if (didDragRef.current) {
      return;
    }

    closeContextMenu();
    setSelectedElementId(null);

    const isSameTile =
      selectedTile &&
      selectedTile.x === tile.x &&
      selectedTile.y === tile.y;

    if (isSameTile) {
      setSelectedTile(null);
      return;
    }

    setSelectedTile({ x: tile.x, y: tile.y });
  }

  function handleElementClick(elementId) {
    closeContextMenu();
    setSelectedTile(null);

    if (selectedElementId === elementId) {
      setSelectedElementId(null);
      return;
    }

    setSelectedElementId(elementId);
  }

  function openContextMenu(tile, event) {
    setSelectedTile({ x: tile.x, y: tile.y });
    setSelectedElementId(null);
    setContextMenu({
      tile,
      x: event.clientX + 8,
      y: event.clientY + 8,
    });
  }

  function startHold(event, tile) {
    if (draggedAsset) {
      return;
    }

    event.preventDefault();
    clearHoldTimer();

    holdTimerRef.current = setTimeout(() => {
      openContextMenu(tile, event);
    }, 700);
  }

  function endHold() {
    clearHoldTimer();
  }

  function addNextStretchTile(startX, startY, dx, dy) {
    setTiles((currentTiles) => {
      let lastX = startX;
      let lastY = startY;

      while (
        currentTiles.some(
          (tile) => tile.x === lastX + dx && tile.y === lastY + dy
        )
      ) {
        lastX += dx;
        lastY += dy;
      }

      const nextX = lastX + dx;
      const nextY = lastY + dy;

      if (currentTiles.some((tile) => tile.x === nextX && tile.y === nextY)) {
        return currentTiles;
      }

      return [...currentTiles, { x: nextX, y: nextY, isRoot: false }];
    });
  }

  function startStretch(tile, dx, dy, event) {
    event.preventDefault();
    event.stopPropagation();

    closeContextMenu();
    clearHoldTimer();

    dragModeRef.current = {
      kind: "selected-stretch",
      startX: tile.x,
      startY: tile.y,
      dx,
      dy,
    };

    dragAccumRef.current = 0;
    didDragRef.current = false;
  }

  function startGlobalDrag(dx, dy, mode, event) {
    event.preventDefault();
    event.stopPropagation();

    closeContextMenu();
    clearHoldTimer();

    dragModeRef.current = {
      kind: "global-side",
      dx,
      dy,
      mode,
    };

    dragAccumRef.current = 0;
    didDragRef.current = false;
  }

  function handlePaletteDragStart(asset) {
    setDraggedAsset(asset);
    closeContextMenu();
    clearHoldTimer();
  }

  function handlePaletteDragEnd() {
    setDraggedAsset(null);
    setDragHoverKey(null);
  }

  function handleTileDragOver(event, tile) {
    if (!draggedAsset) return;

    event.preventDefault();
    setDragHoverKey(`${tile.x}-${tile.y}`);
  }

  function handleTileDragLeave() {
    setDragHoverKey(null);
  }

  function handleTileDrop(event, tile) {
    event.preventDefault();

    if (!draggedAsset) return;

    if (draggedAsset.kind === "base") {
      placeBaseElement(draggedAsset.def, tile.x, tile.y);
    }

    if (draggedAsset.kind === "attachment") {
      placeAttachmentByCell(draggedAsset.def, tile.x, tile.y);
    }

    setDraggedAsset(null);
    setDragHoverKey(null);
  }

  function handleElementDragOver(event, element) {
    if (!draggedAsset) return;
    if (draggedAsset.kind !== "attachment") return;

    event.preventDefault();
    event.stopPropagation();
    setDragHoverKey(`element:${element.id}`);
  }

  function handleElementDragLeave() {
    setDragHoverKey(null);
  }

  function handleElementDrop(event, element) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedAsset) return;
    if (draggedAsset.kind !== "attachment") return;

    placeAttachmentOnElement(draggedAsset.def, element.id);
    setDraggedAsset(null);
    setDragHoverKey(null);
  }

  useEffect(() => {
    setTiles(room.tiles);
    setElements(room.elements || []);
    setSelectedTile(null);
    setSelectedElementId(null);
    setContextMenu(null);
    setDraggedAsset(null);
    setDragHoverKey(null);
  }, [room.id, room.tiles, room.elements]);

  useEffect(() => {
    onSave({
      ...room,
      tiles,
      elements,
    });
  }, [tiles, elements]);

  useEffect(() => {
    function handlePointerMove(event) {
      if (!dragModeRef.current) {
        return;
      }

      const drag = dragModeRef.current;
      const movement = drag.dx !== 0 ? event.movementX : event.movementY;
      const alignedMovement = (drag.dx !== 0 ? drag.dx : drag.dy) * movement;

      if (alignedMovement <= 0) {
        return;
      }

      dragAccumRef.current += alignedMovement;

      const stepSize = 24;

      while (dragAccumRef.current >= stepSize) {
        if (drag.kind === "selected-stretch") {
          addNextStretchTile(drag.startX, drag.startY, drag.dx, drag.dy);
        }

        if (drag.kind === "global-side") {
          handleGlobalControl(drag.dx, drag.dy, drag.mode);
        }

        dragAccumRef.current -= stepSize;
        didDragRef.current = true;
      }
    }

    function handlePointerUp() {
      dragModeRef.current = null;
      dragAccumRef.current = 0;
      endHold();

      setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    }

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [selectedTile, elements]);

  useEffect(() => {
    function handleWindowMouseDown(event) {
      const insideMenu = event.target.closest(".context-menu");
      const insideTile = event.target.closest(".tile");
      const insideArrow = event.target.closest(".stretch-arrow");
      const insideGlobalControl = event.target.closest(".global-control");
      const insidePalette = event.target.closest(".item-palette");
      const insidePlacedElement = event.target.closest(".placed-element");

      if (
        !insideMenu &&
        !insideTile &&
        !insideArrow &&
        !insideGlobalControl &&
        !insidePalette &&
        !insidePlacedElement
      ) {
        closeContextMenu();
      }
    }

    window.addEventListener("mousedown", handleWindowMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleWindowMouseDown);
    };
  }, []);

  const bounds = useMemo(() => {
    const minX = Math.min(...tiles.map((tile) => tile.x));
    const maxX = Math.max(...tiles.map((tile) => tile.x));
    const minY = Math.min(...tiles.map((tile) => tile.y));
    const maxY = Math.max(...tiles.map((tile) => tile.y));

    return {
      minX,
      maxX,
      minY,
      maxY,
      columns: maxX - minX + 1,
      rows: maxY - minY + 1,
    };
  }, [tiles]);

  return (
    <div className="screen">
      <h1>{room.title}</h1>
      <p>Тип: {getDefaultRoomTitle(room.type)}</p>

      <button onClick={onBack}>Назад к комнатам</button>

      <div className="room-builder">
        <div className="item-palette">
          <p className="palette-title">Базовые элементы</p>

          <div className="palette-list">
            {baseElements.map((item) => (
              <div
                key={item.id}
                className="palette-item"
                draggable
                onDragStart={() => handlePaletteDragStart({ kind: "base", def: item })}
                onDragEnd={handlePaletteDragEnd}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <p className="palette-title">Встраиваемые модули</p>

          <div className="palette-list">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="palette-item attachment-item"
                draggable
                onDragStart={() =>
                  handlePaletteDragStart({ kind: "attachment", def: item })
                }
                onDragEnd={handlePaletteDragEnd}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedElement && (
          <div className="selected-element-panel">
            <strong>Выбран элемент: {getElementLabel(selectedElement.type)}</strong>

            <div className="selected-element-actions">
              {selectedElement.behavior === "base-stretch" && (
                <>
                  <button onClick={stretchSelectedElement}>Растянуть вправо</button>
                  <button onClick={shrinkSelectedElement}>Сузить справа</button>
                </>
              )}

              <button onClick={removeSelectedElement}>Удалить элемент</button>

              {selectedElement.attachments?.top && (
                <button onClick={() => removeAttachment("top")}>
                  Убрать раковину
                </button>
              )}

              {selectedElement.attachments?.inside && (
                <button onClick={() => removeAttachment("inside")}>
                  Убрать урну
                </button>
              )}
            </div>
          </div>
        )}

        <p className="hint">
          Перетащи базовый элемент на пол. Раковину и урну перетаскивай прямо на
          тумбу. Стол и тумбу можно выделить и растягивать.
        </p>

        <div className="grid-area">
          {!selectedTile && !selectedElement && (
            <>
              <button
                className="global-control expand top"
                onClick={() => handleGlobalControl(0, -1, "expand")}
                onMouseDown={(event) =>
                  startGlobalDrag(0, -1, "expand", event)
                }
                title="Расширить вверх"
              >
                ↑
              </button>

              <button
                className="global-control expand right"
                onClick={() => handleGlobalControl(1, 0, "expand")}
                onMouseDown={(event) =>
                  startGlobalDrag(1, 0, "expand", event)
                }
                title="Расширить вправо"
              >
                →
              </button>

              <button
                className="global-control expand bottom"
                onClick={() => handleGlobalControl(0, 1, "expand")}
                onMouseDown={(event) =>
                  startGlobalDrag(0, 1, "expand", event)
                }
                title="Расширить вниз"
              >
                ↓
              </button>

              <button
                className="global-control expand left"
                onClick={() => handleGlobalControl(-1, 0, "expand")}
                onMouseDown={(event) =>
                  startGlobalDrag(-1, 0, "expand", event)
                }
                title="Расширить влево"
              >
                ←
              </button>

              <button
                className="global-control shrink top"
                onClick={() => handleGlobalControl(0, -1, "shrink")}
                title="Сузить сверху"
              >
                −
              </button>

              <button
                className="global-control shrink right"
                onClick={() => handleGlobalControl(1, 0, "shrink")}
                title="Сузить справа"
              >
                −
              </button>

              <button
                className="global-control shrink bottom"
                onClick={() => handleGlobalControl(0, 1, "shrink")}
                title="Сузить снизу"
              >
                −
              </button>

              <button
                className="global-control shrink left"
                onClick={() => handleGlobalControl(-1, 0, "shrink")}
                title="Сузить слева"
              >
                −
              </button>
            </>
          )}

          <div
            className="grid editor-grid"
            style={{
              gridTemplateColumns: `repeat(${bounds.columns}, 50px)`,
              gridTemplateRows: `repeat(${bounds.rows}, 50px)`,
            }}
          >
            {tiles.map((tile) => {
              const col = tile.x - bounds.minX + 1;
              const row = tile.y - bounds.minY + 1;

              const isSelected =
                selectedTile &&
                selectedTile.x === tile.x &&
                selectedTile.y === tile.y;

              const isDragHover = dragHoverKey === `${tile.x}-${tile.y}`;

              return (
                <button
                  key={`${tile.x}-${tile.y}`}
                  className={`tile ${isSelected ? "selected" : ""} ${
                    isDragHover ? "drag-hover" : ""
                  }`}
                  style={{
                    gridColumn: col,
                    gridRow: row,
                  }}
                  onClick={() => handleTileClick(tile)}
                  onMouseDown={(event) => startHold(event, tile)}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onDragOver={(event) => handleTileDragOver(event, tile)}
                  onDragLeave={handleTileDragLeave}
                  onDrop={(event) => handleTileDrop(event, tile)}
                />
              );
            })}

            {elements.map((element) => {
              const col = element.x - bounds.minX + 1;
              const row = element.y - bounds.minY + 1;
              const isSelected = selectedElementId === element.id;
              const isAttachmentHover = dragHoverKey === `element:${element.id}`;

              return (
                <div
                  key={element.id}
                  className={`placed-element ${getElementDisplayClass(element.type)} ${
                    isSelected ? "placed-element-selected" : ""
                  } ${isAttachmentHover ? "placed-element-hover" : ""}`}
                  style={{
                    gridColumn: `${col} / span ${element.width || 1}`,
                    gridRow: `${row} / span ${element.height || 1}`,
                  }}
                  onClick={() => handleElementClick(element.id)}
                  onDragOver={(event) => handleElementDragOver(event, element)}
                  onDragLeave={handleElementDragLeave}
                  onDrop={(event) => handleElementDrop(event, element)}
                >
                  <div className="placed-element-label">
                    {getElementLabel(element.type)}
                  </div>

                  {element.attachments?.top && (
                    <div className="placed-element-attachment top">
                      {getElementLabel(element.attachments.top)}
                    </div>
                  )}

                  {element.attachments?.inside && (
                    <div className="placed-element-attachment inside">
                      {getElementLabel(element.attachments.inside)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedTile && !selectedElement && (
            <>
              {!hasTile(selectedTile.x, selectedTile.y - 1) && (
                <button
                  className="stretch-arrow top"
                  onClick={() => addFromSelected(0, -1)}
                  onMouseDown={(event) =>
                    startStretch(selectedTile, 0, -1, event)
                  }
                >
                  ↑
                </button>
              )}

              {!hasTile(selectedTile.x + 1, selectedTile.y) && (
                <button
                  className="stretch-arrow right"
                  onClick={() => addFromSelected(1, 0)}
                  onMouseDown={(event) =>
                    startStretch(selectedTile, 1, 0, event)
                  }
                >
                  →
                </button>
              )}

              {!hasTile(selectedTile.x, selectedTile.y + 1) && (
                <button
                  className="stretch-arrow bottom"
                  onClick={() => addFromSelected(0, 1)}
                  onMouseDown={(event) =>
                    startStretch(selectedTile, 0, 1, event)
                  }
                >
                  ↓
                </button>
              )}

              {!hasTile(selectedTile.x - 1, selectedTile.y) && (
                <button
                  className="stretch-arrow left"
                  onClick={() => addFromSelected(-1, 0)}
                  onMouseDown={(event) =>
                    startStretch(selectedTile, -1, 0, event)
                  }
                >
                  ←
                </button>
              )}
            </>
          )}
        </div>

        {contextMenu && (
          <div
            className="context-menu"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => {
                removeTile(contextMenu.tile.x, contextMenu.tile.y);
                closeContextMenu();
              }}
            >
              Удалить тайл
            </button>
          </div>
        )}
      </div>
    </div>
  );
}