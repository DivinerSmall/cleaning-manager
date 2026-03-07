import { useState } from "react";
import { ROOM_TYPES, getDefaultRoomTitle } from "../data/roomTypes";

export default function CreateRoomScreen({ onCreate, onBack }) {
  const [roomType, setRoomType] = useState("kitchen");
  const [title, setTitle] = useState("");

  function handleCreate() {
    onCreate({
      type: roomType,
      title: title.trim() || getDefaultRoomTitle(roomType),
    });
  }

  return (
    <div className="screen">
      <h1>Создание комнаты</h1>

      <div className="create-room-form">
        <select
          value={roomType}
          onChange={(event) => setRoomType(event.target.value)}
          className="select-input"
        >
          {ROOM_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Персональное название"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <button onClick={handleCreate}>Создать</button>
        <button onClick={onBack}>Назад</button>
      </div>
    </div>
  );
}