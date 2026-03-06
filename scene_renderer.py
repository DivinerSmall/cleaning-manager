import streamlit.components.v1 as components


SCENE_POSITIONS = {
    "Кухня": {
        "Раковина": {"left": "10%", "top": "20%"},
        "Плита": {"left": "65%", "top": "20%"},
        "Стол": {"left": "35%", "top": "60%"},
    },
    "Спальня": {
        "Кровать": {"left": "20%", "top": "25%"},
        "Тумбочка": {"left": "65%", "top": "30%"},
        "Шкаф": {"left": "40%", "top": "65%"},
    },
    "Комната": {
        "Стол": {"left": "20%", "top": "25%"},
        "Пол": {"left": "40%", "top": "65%"},
        "Полка": {"left": "65%", "top": "25%"},
    },
    "Ванная": {
        "Зеркало": {"left": "20%", "top": "20%"},
        "Раковина": {"left": "60%", "top": "35%"},
        "Полотенца": {"left": "35%", "top": "65%"},
    }
}


def render_room_scene(room_name, room_tasks, selected_task_name, selected_task_status):
    positions = SCENE_POSITIONS.get(room_name, {})

    active_task_name = None
    if selected_task_status in ["active", "paused", "done", "not_started"]:
        active_task_name = selected_task_name

    objects_html = ""

    for task in room_tasks:
        task_name = task["task"]
        pos = positions.get(task_name, {"left": "40%", "top": "40%"})

        is_active = task_name == active_task_name
        background = "#fff7cc" if is_active else "#f4f4f4"
        border = "2px solid #f0b400" if is_active else "1px solid #cccccc"

        objects_html += f"""
        <div style="
            position:absolute;
            left:{pos['left']};
            top:{pos['top']};
            transform:translate(-50%, -50%);
            background:{background};
            border:{border};
            border-radius:12px;
            padding:10px 14px;
            font-size:14px;
            box-shadow:0 2px 6px rgba(0,0,0,0.08);
            font-family:Arial, sans-serif;
        ">
            {task_name}
        </div>
        """

    mascot_html = ""
    if active_task_name:
        mascot_pos = positions.get(active_task_name, {"left": "50%", "top": "50%"})
        mascot_html = f"""
        <div style="
            position:absolute;
            left:calc({mascot_pos['left']} + 10%);
            top:calc({mascot_pos['top']} + 10%);
            transform:translate(-50%, -50%);
            font-size:38px;
        ">
            🧸
        </div>
        """

    html = f"""
    <div style="
        position:relative;
        width:100%;
        height:420px;
        border-radius:20px;
        background:linear-gradient(180deg, #faf7f2 0%, #f1ebe2 100%);
        border:1px solid #ddd;
        overflow:hidden;
        box-shadow:0 4px 12px rgba(0,0,0,0.06);
        font-family:Arial, sans-serif;
    ">
        <div style="
            position:absolute;
            top:18px;
            left:20px;
            font-size:20px;
            font-weight:600;
            color:#333;
        ">
            {room_name}
        </div>

        <div style="
            position:absolute;
            left:50%;
            bottom:18px;
            transform:translateX(-50%);
            width:85%;
            height:110px;
            background:rgba(255,255,255,0.35);
            border-radius:16px;
            border:1px dashed rgba(0,0,0,0.1);
        "></div>

        {objects_html}
        {mascot_html}
    </div>
    """

    components.html(html, height=440)