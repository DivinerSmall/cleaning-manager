export default function WelcomeScreen({ goToAuth }) {
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