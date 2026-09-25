"""
In-memory activity log for tracking agentic workflow events.
Persists as a JSON file for session continuity.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

LOG_FILE = Path(__file__).parent.parent / "outputs" / "activity_log.json"


def _load_log() -> List[Dict]:
    try:
        if LOG_FILE.exists():
            with open(LOG_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def _save_log(log: List[Dict]):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)


def add_event(event_type: str, description: str, detail: str = "") -> Dict:
    """Add an event to the activity log."""
    log = _load_log()
    event = {
        "id": len(log) + 1,
        "timestamp": datetime.now().strftime("%H:%M"),
        "full_timestamp": datetime.now().isoformat(),
        "type": event_type,
        "description": description,
        "detail": detail,
    }
    log.append(event)
    _save_log(log)
    return event


def get_log() -> List[Dict]:
    """Return all activity log entries."""
    return _load_log()


def clear_log():
    """Clear the activity log (e.g. on new candidate upload)."""
    _save_log([])
