import pytest

from gateway.dependencies.database import get_motor_database, get_sqlalchemy_session


@pytest.mark.asyncio
async def test_get_sqlalchemy_session_dependency():
    async with get_sqlalchemy_session() as session:
        assert session["driver"] == "sqlalchemy"


@pytest.mark.asyncio
async def test_get_motor_database_dependency():
    async with get_motor_database() as db:
        assert db["driver"] == "motor"
