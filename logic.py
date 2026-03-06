def get_room_by_id(home, room_id):
    for room in home["rooms"]:
        if room["id"] == room_id:
            return room
    return None


def next_room_id(home):
    if not home["rooms"]:
        return 1
    return max(room["id"] for room in home["rooms"]) + 1


def task_key(room_id, task_name):
    return f"{room_id}::{task_name}"


def ensure_task_statuses(room, task_statuses):
    for task in room["tasks"]:
        key = task_key(room["id"], task["task"])
        if key not in task_statuses:
            task_statuses[key] = "not_started"


def pause_other_tasks(room, task_statuses):
    for task in room["tasks"]:
        key = task_key(room["id"], task["task"])
        if task_statuses.get(key) == "active":
            task_statuses[key] = "paused"


def room_progress(room, task_statuses):
    done = 0
    total = len(room["tasks"])

    for task in room["tasks"]:
        key = task_key(room["id"], task["task"])
        if task_statuses.get(key) == "done":
            done += 1

    return done, total