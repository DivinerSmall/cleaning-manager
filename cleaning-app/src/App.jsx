import { useEffect, useMemo, useRef, useState } from "react";

function WelcomeScreen({ goToAuth }) {
  const now = new Date();

  const time = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = now.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="screen">
      <h1>Добро пожаловать</h1>
      <p>Сегодня {time}, {date}</p>
      <button onClick={goToAuth}>Войти</button>
    </div>
  );
}

function AuthScreen({ onLogin, goBack }) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Введите имя");
      return;
    }

    localStorage.setItem("userName", trimmedName);
    onLogin(trimmedName);
  }

  return (
    <div className="screen">
      <h1>Аккаунт</h1>

      <input
        type="text"
        placeholder="Введите имя"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <button onClick={handleSubmit}>Создать аккаунт</button>
      <button onClick={goBack}>Назад</button>
    </div>
  );
}

function RoomBuilder() {
  const [tiles, setTiles] = useState([{ x: 0, y: 0, isRoot: true, item: null }]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const holdTimerRef = useRef(null);
  const dragModeRef = useRef(null);
  const didDragRef = useRef(false);
  const dragAccumRef = useRef(0);

  function getTileKey(x, y) {
    return `${x},${y}`;
  }

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
      const key = getTileKey(current.x, current.y);

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      const neighbors = getNeighbors(current, remainingTiles);

      for (const neighbor of neighbors) {
        const neighborKey = getTileKey(neighbor.x, neighbor.y);

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

      return [...currentTiles, { x, y, isRoot: false, item: null }];
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
          item: null,
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

  function setItemOnTile(x, y, itemName) {
    setTiles((currentTiles) =>
      currentTiles.map((tile) => {
        if (tile.x === x && tile.y === y) {
          return { ...tile, item: itemName };
        }

        return tile;
      })
    );
  }

  function handleTileClick(tile) {
    if (didDragRef.current) {
      return;
    }

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

  function openContextMenu(tile, event) {
    setSelectedTile({ x: tile.x, y: tile.y });
    setContextMenu({
      tile,
      x: event.clientX + 8,
      y: event.clientY + 8,
    });
  }

  function startHold(event, tile) {
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

      return [...currentTiles, { x: nextX, y: nextY, isRoot: false, item: null }];
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

  useEffect(() => {
    function handlePointerMove(event) {
      if (!dragModeRef.current) {
        return;
      }

      const drag = dragModeRef.current;
      const movement = drag.dx !== 0 ? event.movementX : event.movementY;
      const alignedMovement =
        (drag.dx !== 0 ? drag.dx : drag.dy) * movement;

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
  }, [selectedTile]);

  useEffect(() => {
    function handleWindowMouseDown(event) {
      const insideMenu = event.target.closest(".context-menu");
      const insideTile = event.target.closest(".tile");
      const insideArrow = event.target.closest(".stretch-arrow");
      const insideGlobalControl = event.target.closest(".global-control");

      if (!insideMenu && !insideTile && !insideArrow && !insideGlobalControl) {
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
    <div className="room-builder">
      <h2>Собери форму комнаты</h2>

      <p className="hint">
        Клик — выбрать тайл. Клик по стрелке — добавить 1 тайл. Потянуть стрелку
        — протянуть дальше. Долгое нажатие — меню тайла.
      </p>

      <div className="grid-area">
        {!selectedTile && (
          <>
            <button
              className="global-control expand top"
              onClick={() => handleGlobalControl(0, -1, "expand")}
              onMouseDown={(event) => startGlobalDrag(0, -1, "expand", event)}
              title="Расширить вверх"
            >
              ↑
            </button>

            <button
              className="global-control expand right"
              onClick={() => handleGlobalControl(1, 0, "expand")}
              onMouseDown={(event) => startGlobalDrag(1, 0, "expand", event)}
              title="Расширить вправо"
            >
              →
            </button>

            <button
              className="global-control expand bottom"
              onClick={() => handleGlobalControl(0, 1, "expand")}
              onMouseDown={(event) => startGlobalDrag(0, 1, "expand", event)}
              title="Расширить вниз"
            >
              ↓
            </button>

            <button
              className="global-control expand left"
              onClick={() => handleGlobalControl(-1, 0, "expand")}
              onMouseDown={(event) => startGlobalDrag(-1, 0, "expand", event)}
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
          className="grid"
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

            return (
              <div
                key={`${tile.x}-${tile.y}`}
                className="tile-wrapper"
                style={{
                  gridColumn: col,
                  gridRow: row,
                }}
              >
                {isSelected && !hasTile(tile.x, tile.y - 1) && (
                  <button
                    className="stretch-arrow top"
                    onClick={() => addFromSelected(0, -1)}
                    onMouseDown={(event) => startStretch(tile, 0, -1, event)}
                  >
                    ↑
                  </button>
                )}

                {isSelected && !hasTile(tile.x + 1, tile.y) && (
                  <button
                    className="stretch-arrow right"
                    onClick={() => addFromSelected(1, 0)}
                    onMouseDown={(event) => startStretch(tile, 1, 0, event)}
                  >
                    →
                  </button>
                )}

                {isSelected && !hasTile(tile.x, tile.y + 1) && (
                  <button
                    className="stretch-arrow bottom"
                    onClick={() => addFromSelected(0, 1)}
                    onMouseDown={(event) => startStretch(tile, 0, 1, event)}
                  >
                    ↓
                  </button>
                )}

                {isSelected && !hasTile(tile.x - 1, tile.y) && (
                  <button
                    className="stretch-arrow left"
                    onClick={() => addFromSelected(-1, 0)}
                    onMouseDown={(event) => startStretch(tile, -1, 0, event)}
                  >
                    ←
                  </button>
                )}

                <button
                  className={`tile ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTileClick(tile)}
                  onMouseDown={(event) => startHold(event, tile)}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                >
                  {tile.item && <div className={`item ${tile.item}`}></div>}
                </button>
              </div>
            );
          })}
        </div>
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

          <button
            onClick={() => {
              setItemOnTile(contextMenu.tile.x, contextMenu.tile.y, "sink");
              closeContextMenu();
            }}
          >
            Раковина
          </button>

          <button
            onClick={() => {
              setItemOnTile(contextMenu.tile.x, contextMenu.tile.y, "trash");
              closeContextMenu();
            }}
          >
            Урна
          </button>

          <button
            onClick={() => {
              setItemOnTile(contextMenu.tile.x, contextMenu.tile.y, "table");
              closeContextMenu();
            }}
          >
            Стол
          </button>

          <button
            onClick={() => {
              setItemOnTile(contextMenu.tile.x, contextMenu.tile.y, "cabinet");
              closeContextMenu();
            }}
          >
            Тумба
          </button>

          <button
            onClick={() => {
              setItemOnTile(contextMenu.tile.x, contextMenu.tile.y, null);
              closeContextMenu();
            }}
          >
            Очистить элемент
          </button>
        </div>
      )}
    </div>
  );
}

function HomeScreen({ userName, logout }) {
  return (
    <div className="screen">
      <h1>Привет, {userName}!</h1>
      <RoomBuilder />
      <button onClick={logout}>Выйти</button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("userName");

    if (savedName) {
      setUserName(savedName);
      setScreen("home");
    }
  }, []);

  function handleLogin(name) {
    setUserName(name);
    setScreen("home");
  }

  function handleLogout() {
    localStorage.removeItem("userName");
    setUserName("");
    setScreen("welcome");
  }

  if (screen === "welcome") {
    return <WelcomeScreen goToAuth={() => setScreen("auth")} />;
  }

  if (screen === "auth") {
    return (
      <AuthScreen
        onLogin={handleLogin}
        goBack={() => setScreen("welcome")}
      />
    );
  }

  return <HomeScreen userName={userName} logout={handleLogout} />;
}