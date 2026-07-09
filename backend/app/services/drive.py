"""Google Drive upload via a service account.

Setup: create a Google Cloud project, enable the Drive API, create a service
account, download its JSON key, and share your target Drive folder (ideally a
Shared Drive so quota isn't your personal 15 GB) with the service account email.
"""
from __future__ import annotations

import os
from pathlib import Path

from app.config import settings

_SCOPES = ["https://www.googleapis.com/auth/drive"]


def _service():
    # Imported lazily so the API process doesn't need Google libs to boot.
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        settings.google_service_account_file, scopes=_SCOPES
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _ensure_folder(service, name: str, parent_id: str) -> str:
    """Return the id of a subfolder named `name` under `parent_id`, creating it if needed."""
    q = (
        f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' "
        f"and '{parent_id}' in parents and trashed = false"
    )
    res = service.files().list(q=q, fields="files(id)", supportsAllDrives=True,
                               includeItemsFromAllDrives=True).execute()
    files = res.get("files", [])
    if files:
        return files[0]["id"]
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
    folder = service.files().create(body=meta, fields="id", supportsAllDrives=True).execute()
    return folder["id"]


def upload_video(filepath: Path, source_username: str) -> str:
    """Upload a video into Drive under Source/<username>/ and return its file id."""
    from googleapiclient.http import MediaFileUpload

    service = _service()
    parent = _ensure_folder(service, source_username, settings.gdrive_root_folder_id)
    media = MediaFileUpload(str(filepath), mimetype="video/mp4", resumable=True)
    meta = {"name": filepath.name, "parents": [parent]}
    created = service.files().create(
        body=meta, media_body=media, fields="id", supportsAllDrives=True
    ).execute()
    return created["id"]
