def status_icon(status):
    icons = {
        "not_started": "⚪",
        "active": "🔵",
        "paused": "🟡",
        "done": "🟢"
    }
    return icons.get(status, "⚪")


def status_text(status):
    texts = {
        "not_started": "не начато",
        "active": "в процессе",
        "paused": "пауза",
        "done": "выполнено"
    }
    return texts.get(status, "не начато")