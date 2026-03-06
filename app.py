import streamlit as st

st.title("Менеджер уборки")

rooms = {
    "Кухня": [
        "Протереть стол",
        "Помыть раковину",
        "Протереть плиту"
    ],
    "Ванная": [
        "Помыть зеркало",
        "Помыть раковину",
        "Разложить полотенца"
    ],
    "Спальня": [
        "Заправить кровать",
        "Убрать вещи",
        "Протереть тумбочку"
    ]
}

if "cleaning_state" not in st.session_state:
    st.session_state.cleaning_state = "not_started"

selected_room = st.selectbox("Выбери помещение", list(rooms.keys()))
tasks = rooms[selected_room]

st.subheader(f"Комната: {selected_room}")

state = st.session_state.cleaning_state

if state == "not_started":
    st.write("Уборка ещё не начата.")
    if st.button("Начать уборку"):
        st.session_state.cleaning_state = "in_progress"
        st.rerun()

elif state == "in_progress":
    st.write("Маскот убирается вместе с тобой 🧹")

    completed = 0
    total = len(tasks)

    for task in tasks:
        checked = st.checkbox(task, key=f"{selected_room}_{task}")
        if checked:
            completed += 1

    st.write(f"Выполнено задач: {completed} из {total}")

    if completed == total:
        st.session_state.cleaning_state = "finished"
        st.rerun()

    if st.button("Прервать уборку"):
        st.session_state.cleaning_state = "paused"
        st.rerun()

elif state == "paused":
    st.warning("Уборка прервана. Ничего страшного, можно вернуться позже.")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("Продолжить уборку"):
            st.session_state.cleaning_state = "in_progress"
            st.rerun()

    with col2:
        if st.button("Начать заново"):
            for task in tasks:
                key = f"{selected_room}_{task}"
                if key in st.session_state:
                    del st.session_state[key]

            st.session_state.cleaning_state = "not_started"
            st.rerun()

elif state == "finished":
    st.success("Уборка завершена! Отличная работа ✨")
    st.write("Маскот доволен и хвалит тебя за завершённую уборку.")

    if st.button("Убрать другую комнату"):
        st.session_state.cleaning_state = "not_started"
        st.rerun()