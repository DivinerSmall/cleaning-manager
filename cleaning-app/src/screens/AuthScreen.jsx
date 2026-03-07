import { useState } from "react";

export default function AuthScreen({ onLogin, goBack }) {
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