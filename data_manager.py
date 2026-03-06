import json

TEMPLATES_FILE = "templates.json"
USER_HOME_FILE = "user_home.json"


def load_json(path, default_value):
    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return default_value


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def load_templates():
    return load_json(TEMPLATES_FILE, {})


def load_user_home():
    return load_json(USER_HOME_FILE, {"rooms": []})


def save_user_home(home):
    save_json(USER_HOME_FILE, home)