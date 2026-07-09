"""Slot planning: hand out the next publish time, respecting a daily cap.

Given `posts_per_day` between `first_slot_hour` and `last_slot_hour`, slots are
spread evenly across each day, starting `start_in_days` from now. The cursor is
persisted between runs so a second batch continues where the first left off.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo


class SlotPlanner:
    def __init__(self, cfg: dict, last_slot_iso: str | None):
        self.tz = ZoneInfo(cfg["timezone"])
        self.per_day = max(1, int(cfg["posts_per_day"]))
        self.first = int(cfg["first_slot_hour"])
        self.last = int(cfg["last_slot_hour"])
        self.start_in_days = int(cfg.get("start_in_days", 1))
        self._cursor = datetime.fromisoformat(last_slot_iso) if last_slot_iso else None

    def _day_times(self, day: datetime) -> list[datetime]:
        """The publish times for a given local day."""
        if self.per_day == 1:
            hours = [self.first]
        else:
            step = (self.last - self.first) / (self.per_day - 1)
            hours = [self.first + step * i for i in range(self.per_day)]
        out = []
        for h in hours:
            hour = int(h)
            minute = int(round((h - hour) * 60))
            out.append(day.replace(hour=hour, minute=minute, second=0, microsecond=0))
        return out

    def next_slot(self) -> datetime:
        """Return the next available slot (timezone-aware) and advance the cursor."""
        now = datetime.now(self.tz)
        start_day = (now + timedelta(days=self.start_in_days)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Walk days from the later of (start_day) and (cursor's day) until we find
        # a slot strictly after the cursor and in the future.
        day = start_day
        if self._cursor and self._cursor.date() > start_day.date():
            day = self._cursor.replace(hour=0, minute=0, second=0, microsecond=0)

        for _ in range(400):  # ~13 months of headroom
            for slot in self._day_times(day):
                if slot <= now:
                    continue
                if self._cursor and slot <= self._cursor:
                    continue
                self._cursor = slot
                return slot
            day += timedelta(days=1)
        raise RuntimeError("Could not find a slot; check schedule config.")

    @property
    def cursor_iso(self) -> str | None:
        return self._cursor.isoformat() if self._cursor else None

    def to_utc(self, dt: datetime) -> datetime:
        return dt.astimezone(timezone.utc)
