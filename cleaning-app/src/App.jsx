import { useEffect, useState } from "react";
import RoomBuilder from "./components/RoomBuilder";
import { createEmptyRoom } from "./data/roomTypes";
import AuthScreen from "./screens/AuthScreen";
import CleaningScreen from "./screens/CleaningScreen";
import CleaningSetupScreen from "./screens/CleaningSetupScreen";
import CreateRoomScreen from "./screens/CreateRoomScreen";
import RoomsScreen from "./screens/RoomsScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [rooms, setRooms] = useState(() => {
    const savedRooms = localStorage.getItem("rooms");
    return savedRooms ? JSON.parse(savedRooms) : [];
  });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [cleaningRoomId, setCleaningRoomId] = useState(null);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [cleaningSession, setCleaningSession] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");

    if (savedName) {
      setUserName(savedName);
      setScreen("rooms");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }, [rooms]);

  function handleLogin(name) {
    setUserName(name);
    setScreen("rooms");
  }

  function handleLogout() {
    localStorage.removeItem("userName");
    setUserName("");
    setScreen("welcome");
  }

  function handleCreateRoom(data) {
    const newRoom = createEmptyRoom(data.type, data.title);
    setRooms((currentRooms) => [...currentRooms, newRoom]);
    setEditingRoomId(newRoom.id);
    setScreen("editor");
  }

  function handleDeleteRoom(roomId) {
    setRooms((currentRooms) =>
      currentRooms.filter((room) => room.id !== roomId)
    );
  }

  function handleSaveRoom(updatedRoom) {
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === updatedRoom.id ? updatedRoom : room
      )
    );
  }

  function handleOpenCleaningSetup(roomId) {
    setCleaningRoomId(roomId);
    setSelectedTargets([]);
    setCleaningSession(null);
    setScreen("cleaning-setup");
  }

  function handleStartFullCleaning(room) {
    const targets = room.tiles
      .filter((tile) => tile.item)
      .map((tile) => ({
        x: tile.x,
        y: tile.y,
        item: tile.item,
        done: false,
      }));

    if (targets.length === 0) {
      alert("В комнате нет элементов для уборки");
      return;
    }

    setCleaningSession({
      roomId: room.id,
      mode: "full",
      targets,
    });

    setScreen("cleaning");
  }

  function handleStartPartialCleaning(room) {
    const targets = room.tiles
      .filter((tile) => tile.item)
      .filter((tile) => selectedTargets.includes(`${tile.x}-${tile.y}`))
      .map((tile) => ({
        x: tile.x,
        y: tile.y,
        item: tile.item,
        done: false,
      }));

    if (targets.length === 0) {
      alert("Выбери хотя бы один элемент");
      return;
    }

    setCleaningSession({
      roomId: room.id,
      mode: "partial",
      targets,
    });

    setScreen("cleaning");
  }

  function handleToggleCleaningDone(x, y) {
    setCleaningSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        targets: currentSession.targets.map((target) => {
          if (target.x === x && target.y === y) {
            return { ...target, done: !target.done };
          }

          return target;
        }),
      };
    });
  }

  function handleFinishCleaning() {
    if (!cleaningSession || !cleaningRoomId) {
      setScreen("rooms");
      return;
    }

    const room = rooms.find((item) => item.id === cleaningRoomId);

    if (!room) {
      setCleaningSession(null);
      setSelectedTargets([]);
      setCleaningRoomId(null);
      setScreen("rooms");
      return;
    }

    const allRoomTargets = room.tiles.filter((tile) => tile.item);
    const doneTargets = cleaningSession.targets.filter((target) => target.done);

    let nextStatus = "partial";

    if (
      allRoomTargets.length > 0 &&
      doneTargets.length === allRoomTargets.length &&
      cleaningSession.mode === "full"
    ) {
      nextStatus = "full";
    }

    setRooms((currentRooms) =>
      currentRooms.map((currentRoom) =>
        currentRoom.id === room.id
          ? { ...currentRoom, cleaningStatus: nextStatus }
          : currentRoom
      )
    );

    alert(
      nextStatus === "full"
        ? "Проведена полная уборка"
        : "Проведена частичная уборка"
    );

    setCleaningSession(null);
    setSelectedTargets([]);
    setCleaningRoomId(null);
    setScreen("rooms");
  }

  const editingRoom = rooms.find((room) => room.id === editingRoomId);
  const cleaningRoom = rooms.find((room) => room.id === cleaningRoomId);

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

  if (screen === "create-room") {
    return (
      <CreateRoomScreen
        onCreate={handleCreateRoom}
        onBack={() => setScreen("rooms")}
      />
    );
  }

  if (screen === "editor" && editingRoom) {
    return (
      <RoomBuilder
        room={editingRoom}
        onBack={() => {
          setEditingRoomId(null);
          setScreen("rooms");
        }}
        onSave={handleSaveRoom}
      />
    );
  }

  if (screen === "cleaning-setup" && cleaningRoom) {
    return (
      <CleaningSetupScreen
        room={cleaningRoom}
        selectedTargets={selectedTargets}
        setSelectedTargets={setSelectedTargets}
        onStartFullCleaning={() => handleStartFullCleaning(cleaningRoom)}
        onStartPartialCleaning={() => handleStartPartialCleaning(cleaningRoom)}
        onBack={() => {
          setCleaningRoomId(null);
          setSelectedTargets([]);
          setScreen("rooms");
        }}
      />
    );
  }

  if (screen === "cleaning" && cleaningRoom && cleaningSession) {
    return (
      <CleaningScreen
        room={cleaningRoom}
        cleaningSession={cleaningSession}
        onToggleDone={handleToggleCleaningDone}
        onFinish={handleFinishCleaning}
        onBack={() => setScreen("cleaning-setup")}
      />
    );
  }

  return (
    <RoomsScreen
      userName={userName}
      rooms={rooms}
      onCreateRoom={() => setScreen("create-room")}
      onEditRoom={(roomId) => {
        setEditingRoomId(roomId);
        setScreen("editor");
      }}
      onCleanRoom={handleOpenCleaningSetup}
      onDeleteRoom={handleDeleteRoom}
      logout={handleLogout}
    />
  );
}