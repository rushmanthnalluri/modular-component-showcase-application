"""Database dependencies for async patterns in gateway composition layer."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class DatabaseDependency:
    driver: str
    url: str
    connected: bool

    def to_dict(self) -> dict:
        return {
            "driver": self.driver,
            "url": self.url,
            "connected": self.connected,
        }


@asynccontextmanager
async def get_sqlalchemy_session() -> AsyncIterator[dict]:
    yield DatabaseDependency(
        driver="sqlalchemy",
        url=os.getenv("DATABASE_URL", ""),
        connected=bool(os.getenv("DATABASE_URL", "")),
    ).to_dict()


@asynccontextmanager
async def get_motor_database() -> AsyncIterator[dict]:
    yield DatabaseDependency(
        driver="motor",
        url=os.getenv("MONGODB_URI", ""),
        connected=bool(os.getenv("MONGODB_URI", "")),
    ).to_dict()
