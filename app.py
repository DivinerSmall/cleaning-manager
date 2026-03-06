import streamlit as st

from data_manager import load_templates, load_user_home
from panels import render_left_panel, render_right_panel

st.set_page_config(page_title="Менеджер уборки", page_icon="🧹", layout="wide")

templates = load_templates()
home = load_user_home()

if "task_statuses" not in st.session_state:
    st.session_state.task_statuses = {}

if "mascot_step" not in st.session_state:
    st.session_state.mascot_step = 0

if "show_add_room" not in st.session_state:
    st.session_state.show_add_room = False

if "show_rename_room" not in st.session_state:
    st.session_state.show_rename_room = False

if "selected_room_id" not in st.session_state:
    if home["rooms"]:
        st.session_state.selected_room_id = home["rooms"][0]["id"]
    else:
        st.session_state.selected_room_id = None

if "selected_task_name" not in st.session_state:
    st.session_state.selected_task_name = None

st.title("Менеджер уборки")

left, right = st.columns([1, 1.2])

with left:
    render_left_panel(home, templates)

with right:
    render_right_panel(home)