import json
import streamlit as st
from streamlit_autorefresh import st_autorefresh

st.set_page_config(page_title="Менеджер уборки", page_icon="🧹")

st.title("Менеджер уборки")

# -------- загрузка данных --------

with open("rooms.json", "r", encoding="utf-8") as file:
    rooms = json.load(file)

# -------- состояние --------

if "task_statuses" not in st.session_state:
    st.session_state.task_statuses = {}

if "mascot_step" not in st.session_state:
    st.session_state.mascot_step = 0

def get_task_key(room, task):
    return f"{room}::{task}"

def ensure_room_tasks(room):
    for t in rooms[room]:
        key = get_task_key(room, t["task"])
        if key not in st.session_state.task_statuses:
            st.session_state.task_statuses[key] = "not_started"

def status_label(s):
    return {
        "not_started": "⚪ не начато",
        "active": "🔵 в процессе",
        "paused": "🟡 пауза",
        "done": "🟢 выполнено"
    }[s]

# -------- выбор комнаты --------

room = st.selectbox("Комната", list(rooms.keys()))
ensure_room_tasks(room)

room_tasks = rooms[room]
task_names = [t["task"] for t in room_tasks]

# -------- layout: две панели --------

left, right = st.columns([1,1])

# =========================================================
# ЛЕВАЯ ПАНЕЛЬ — список элементов
# =========================================================

with left:

    st.subheader("Элементы")

    selected_task_name = st.radio(
        "Выбери элемент",
        task_names,
        label_visibility="collapsed"
    )

    st.markdown("### Статусы")

    for t in room_tasks:
        key = get_task_key(room, t["task"])
        st.write(f"{t['task']} — {status_label(st.session_state.task_statuses[key])}")

# =========================================================
# ПРАВАЯ ПАНЕЛЬ — процесс
# =========================================================

with right:

    task_data = next(t for t in room_tasks if t["task"] == selected_task_name)

    task_key = get_task_key(room, selected_task_name)
    status = st.session_state.task_statuses[task_key]

    st.subheader(f"Элемент: {selected_task_name}")

    action = task_data["action"]
    phrases = task_data["phrases"]

    # -----------------------------------------------------

    if status == "not_started":

        st.write("Готов начать работу.")

        if st.button("Старт"):
            st.session_state.task_statuses[task_key] = "active"
            st.session_state.mascot_step = 0
            st.rerun()

    # -----------------------------------------------------

    elif status == "active":

        st_autorefresh(interval=2000, key="mascot")

        step = st.session_state.mascot_step % len(phrases)

        st.info(f"Маскот {action} — {phrases[step]}")

        st.session_state.mascot_step += 1

        col1, col2 = st.columns(2)

        with col1:
            if st.button("Пауза"):
                st.session_state.task_statuses[task_key] = "paused"
                st.session_state.mascot_step = 0
                st.rerun()

        with col2:
            if st.button("Завершить"):
                st.session_state.task_statuses[task_key] = "done"
                st.session_state.mascot_step = 0
                st.rerun()

    # -----------------------------------------------------

    elif status == "paused":

        st.warning("Работа приостановлена")

        col1, col2 = st.columns(2)

        with col1:
            if st.button("Продолжить"):
                st.session_state.task_statuses[task_key] = "active"
                st.session_state.mascot_step = 0
                st.rerun()

        with col2:
            if st.button("Прекратить без завершения"):
                st.session_state.task_statuses[task_key] = "not_started"
                st.rerun()

    # -----------------------------------------------------

    elif status == "done":

        st.success("Элемент завершён.")

# =========================================================
# ПРОГРЕСС КОМНАТЫ
# =========================================================

done = 0

for t in room_tasks:
    key = get_task_key(room, t["task"])
    if st.session_state.task_statuses[key] == "done":
        done += 1

st.markdown("---")
st.write(f"Выполнено: {done} из {len(room_tasks)}")

if done == len(room_tasks):
    st.success("Комната полностью убрана ✨")