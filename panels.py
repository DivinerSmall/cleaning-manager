import copy
import streamlit as st
from streamlit_autorefresh import st_autorefresh

from data_manager import save_user_home
from logic import (
    get_room_by_id,
    next_room_id,
    task_key,
    ensure_task_statuses,
    pause_other_tasks,
    room_progress,
)
from ui_helpers import status_icon, status_text
from scene_renderer import render_room_scene


def render_left_panel(home, templates):
    st.subheader("Мой дом")

    top_left, top_right = st.columns([6, 1])

    with top_right:
        if st.button("+", help="Добавить помещение"):
            st.session_state.show_add_room = not st.session_state.show_add_room

    if st.session_state.show_add_room:
        template_names = list(templates.keys())

        if not template_names:
            st.warning("В templates.json нет шаблонов помещений")
        else:
            template_name = st.selectbox(
                "Шаблон помещения",
                template_names,
                key="new_room_template"
            )

            custom_name = st.text_input(
                "Название помещения",
                value=template_name,
                key="new_room_custom_name"
            )

            if st.button("Добавить помещение"):
                room_name = custom_name.strip()

                if not room_name:
                    st.warning("Введите название помещения")
                else:
                    new_room = {
                        "id": next_room_id(home),
                        "template": template_name,
                        "name": room_name,
                        "tasks": copy.deepcopy(templates[template_name])
                    }

                    home["rooms"].append(new_room)
                    save_user_home(home)

                    st.session_state.selected_room_id = new_room["id"]
                    st.session_state.selected_task_name = None
                    st.session_state.show_add_room = False
                    st.rerun()

    if not home["rooms"]:
        st.info("Добавь первое помещение")
        return

    room_labels = [room["name"] for room in home["rooms"]]
    room_ids = [room["id"] for room in home["rooms"]]

    if st.session_state.selected_room_id not in room_ids:
        st.session_state.selected_room_id = room_ids[0]

    selected_index = room_ids.index(st.session_state.selected_room_id)

    selected_label = st.selectbox(
        "Помещение",
        room_labels,
        index=selected_index,
        key="room_selector"
    )

    selected_index = room_labels.index(selected_label)
    st.session_state.selected_room_id = room_ids[selected_index]

    room = get_room_by_id(home, st.session_state.selected_room_id)
    ensure_task_statuses(room, st.session_state.task_statuses)

    action1, action2 = st.columns(2)

    with action1:
        if st.button("Переименовать"):
            st.session_state.show_rename_room = not st.session_state.show_rename_room

    with action2:
        if st.button("Удалить помещение"):
            for task in room["tasks"]:
                key = task_key(room["id"], task["task"])
                if key in st.session_state.task_statuses:
                    del st.session_state.task_statuses[key]

            home["rooms"] = [r for r in home["rooms"] if r["id"] != room["id"]]
            save_user_home(home)

            if home["rooms"]:
                st.session_state.selected_room_id = home["rooms"][0]["id"]
            else:
                st.session_state.selected_room_id = None

            st.session_state.selected_task_name = None
            st.session_state.show_rename_room = False
            st.rerun()

    if st.session_state.show_rename_room:
        new_room_name = st.text_input(
            "Новое название",
            value=room["name"],
            key="rename_room_input"
        )

        if st.button("Сохранить название"):
            clean_name = new_room_name.strip()
            if clean_name:
                room["name"] = clean_name
                save_user_home(home)

            st.session_state.show_rename_room = False
            st.rerun()

    st.markdown("---")
    st.subheader("Элементы")

    task_names = [task["task"] for task in room["tasks"]]

    if task_names:
        if st.session_state.selected_task_name not in task_names:
            st.session_state.selected_task_name = task_names[0]

        for task in room["tasks"]:
            task_name = task["task"]
            key = task_key(room["id"], task_name)
            status = st.session_state.task_statuses.get(key, "not_started")

            row_left, row_right = st.columns([8, 1])

            with row_left:
                label = f"{task_name} {status_icon(status)}"
                if st.button(
                    label,
                    key=f"select_task_{room['id']}_{task_name}",
                    use_container_width=True
                ):
                    st.session_state.selected_task_name = task_name
                    st.session_state.mascot_step = 0
                    st.rerun()

            with row_right:
                st.write("")

    done_count, total_count = room_progress(room, st.session_state.task_statuses)
    st.markdown("---")
    st.write(f"Выполнено: {done_count} из {total_count}")


def render_right_panel(home):
    if not home["rooms"]:
        st.info("Сначала добавь помещение слева")
        return

    room = get_room_by_id(home, st.session_state.selected_room_id)

    if not room or not room["tasks"]:
        st.info("В этом помещении пока нет элементов")
        return

    task_names = [task["task"] for task in room["tasks"]]

    if st.session_state.selected_task_name not in task_names:
        st.session_state.selected_task_name = task_names[0]

    selected_task = next(
        task for task in room["tasks"]
        if task["task"] == st.session_state.selected_task_name
    )

    key = task_key(room["id"], selected_task["task"])
    status = st.session_state.task_statuses.get(key, "not_started")

    st.subheader(f"Помещение: {room['name']}")
    st.markdown(f"### {selected_task['task']}")
    st.write(f"Статус: {status_icon(status)} {status_text(status)}")

    render_room_scene(
        room_name=room["template"],
        room_tasks=room["tasks"],
        selected_task_name=selected_task["task"],
        selected_task_status=status
    )

    st.markdown("---")

    if status == "not_started":
        st.write("Готов начать работу.")

        if st.button("Старт"):
            pause_other_tasks(room, st.session_state.task_statuses)
            st.session_state.task_statuses[key] = "active"
            st.session_state.mascot_step = 0
            st.rerun()

    elif status == "active":
        phrases = selected_task["phrases"]
        action = selected_task["action"]

        st_autorefresh(
            interval=2000,
            key=f"refresh_{room['id']}_{selected_task['task']}"
        )

        step = st.session_state.mascot_step % len(phrases)
        st.info(f"Маскот {action} — {phrases[step]}")
        st.session_state.mascot_step += 1

        col1, col2 = st.columns(2)

        with col1:
            if st.button("Пауза"):
                st.session_state.task_statuses[key] = "paused"
                st.session_state.mascot_step = 0
                st.rerun()

        with col2:
            if st.button("Завершить"):
                st.session_state.task_statuses[key] = "done"
                st.session_state.mascot_step = 0
                st.rerun()

    elif status == "paused":
        st.warning("Работа приостановлена")

        col1, col2 = st.columns(2)

        with col1:
            if st.button("Продолжить"):
                pause_other_tasks(room, st.session_state.task_statuses)
                st.session_state.task_statuses[key] = "active"
                st.session_state.mascot_step = 0
                st.rerun()

        with col2:
            if st.button("Сбросить"):
                st.session_state.task_statuses[key] = "not_started"
                st.session_state.mascot_step = 0
                st.rerun()

    elif status == "done":
        st.success("Элемент выполнен")

    done_count, total_count = room_progress(room, st.session_state.task_statuses)
    st.markdown("---")
    st.write(f"Прогресс помещения: {done_count} / {total_count}")

    if total_count > 0 and done_count == total_count:
        st.success("Помещение полностью убрано ✨")