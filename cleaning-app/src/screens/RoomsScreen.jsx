import {
  getCleaningStatusLabel,
  getDefaultRoomTitle,
} from "../data/roomTypes";

export default function RoomsScreen({
  userName,
  rooms,
  onCreateRoom,
  onEditRoom,
  onCleanRoom,
  onDeleteRoom,
  logout,
}) {
  return (
    <div className="screen">
      <h1>Привет, {userName}!</h1>
      <p>Выбери комнату или создай новую</p>

      <button onClick={onCreateRoom}>Создать комнату</button>

      <div className="rooms-list">
        {rooms.length === 0 && <p>Комнат пока нет</p>}

        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <div>
              <strong>{room.title}</strong>

              <div className="room-type-label">
                Тип: {getDefaultRoomTitle(room.type)}
              </div>

              <div className="room-cleaning-status">
                Статус: {getCleaningStatusLabel(room.cleaningStatus)}
              </div>
            </div>

            <div className="room-card-actions">
              <button onClick={() => onEditRoom(room.id)}>Редактировать</button>
              <button onClick={() => onCleanRoom(room.id)}>Уборка</button>
              <button onClick={() => onDeleteRoom(room.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={logout}>Выйти</button>
    </div>
  );
}