import { useEffect, useState } from "react";
import RoomBuilder from "./components/RoomBuilder";
import {
  createEmptyRoom,
  getTaskLabel,
} from "./data/roomTypes";
import AuthScreen from "./screens/AuthScreen";
import CleaningScreen from "./screens/CleaningScreen";
import CleaningSetupScreen from "./screens/CleaningSetupScreen";
import CreateRoomScreen from "./screens/CreateRoomScreen";
import RoomsScreen from "./screens/RoomsScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

function normalizeRoom(room) {
  return {
    ...room,
    cleaningStatus: room.cleaningStatus || "none",
    tiles: room.tiles || [{ x: 0, y: 0, isRoot: true }],
    elements: room.elements || [],
  };
}

function getCleaningUnits(room) {
  const units = [];

  for (const element of room.elements || []) {
    units.push({
      id: `element:${element.id}`,
      type: element.type,
      label: getTaskLabel(element.type),
      x: element.x,
      y: element.y,
      done: false,
    });

    if (element.attachments?.top) {
      units.push({
        id: `attachment:${element.id}:top`,
        type: element.attachments.top,
        label: getTaskLabel(element.attachments.top),
        x: element.x,
        y: element.y,
        done: false,
      });
    }

    if (element.attachments?.inside) {
      units.push({
        id: `attachment:${element.id}:inside`,
        type: element.attachments.inside,
        label: getTaskLabel(element.attachments.inside),
        x: element.x,
        y: element.y,
        done: false,
      });
    }
  }

  return units;
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [rooms, setRooms] = useState(() => {
    const savedRooms = localStorage.getItem("rooms");
    if (!savedRooms) return [];
    return JSON.parse(savedRooms).map(normalizeRoom);
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
        room.id === updatedRoom.id ? normalizeRoom(updatedRoom) : room
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
    const targets = getCleaningUnits(room);

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
    const targets = getCleaningUnits(room).filter((target) =>
      selectedTargets.includes(target.id)
    );

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

  function handleToggleCleaningDone(targetId) {
    setCleaningSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        targets: currentSession.targets.map((target) => {
          if (target.id === targetId) {
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

    const allRoomTargets = getCleaningUnits(room);
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