import threading
from typing import Optional


class JobStore:
    def __init__(self):
        self._store: dict = {}
        self._lock = threading.Lock()

    def create(self, job_id: str, meta: dict) -> dict:
        job = {"job_id": job_id, "status": "queued", "progress": 0, **meta}
        with self._lock:
            self._store[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[dict]:
        with self._lock:
            return self._store.get(job_id)

    def update(self, job_id: str, updates: dict):
        with self._lock:
            if job_id in self._store:
                self._store[job_id].update(updates)
