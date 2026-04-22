"""Security dependencies for JWT/OAuth2-style bearer handling and RBAC checks."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Callable

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/authservice/login", auto_error=False)


@dataclass
class SecurityPrincipal:
    user_id: str
    email: str
    role: str
    scopes: list[str] = field(default_factory=list)


def _jwt_secret() -> str:
    return os.getenv("JWT_SECRET") or os.getenv("SPRING_JWT_SECRET") or "development-secret"


def _jwt_decode_kwargs() -> dict:
    kwargs = {"algorithms": ["HS256"]}
    issuer = os.getenv("JWT_ISSUER", "").strip()
    audience = os.getenv("JWT_AUDIENCE", "").strip()
    if issuer:
        kwargs["issuer"] = issuer
    if audience:
        kwargs["audience"] = audience
    return kwargs


def _resolve_token(token: str | None, access_token_cookie: str | None, refresh_token_cookie: str | None) -> str | None:
    return (
        (token or "").strip()
        or (access_token_cookie or "").strip()
        or (refresh_token_cookie or "").strip()
        or None
    )


def get_current_principal(
    token: str | None = Depends(oauth2_scheme),
    access_token_cookie: str | None = Cookie(default=None, alias="accessToken"),
    refresh_token_cookie: str | None = Cookie(default=None, alias="refreshToken"),
) -> SecurityPrincipal:
    token = _resolve_token(token, access_token_cookie, refresh_token_cookie)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        payload = jwt.decode(token, _jwt_secret(), **_jwt_decode_kwargs())
        user_id = str(payload.get("userId") or payload.get("sub") or "")
        email = str(payload.get("email") or "")
        role = str(payload.get("role") or payload.get("authority") or "user").replace("ROLE_", "").lower()
        scopes = payload.get("scopes") or payload.get("scope") or []
        if isinstance(scopes, str):
            scopes = [entry for entry in scopes.split(" ") if entry]
        if not user_id:
            raise ValueError("Missing user id in token")
        return SecurityPrincipal(user_id=user_id, email=email, role=role, scopes=list(scopes))
    except Exception as exc:  # pragma: no cover - behavior tested at API boundary
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")


def require_roles(*roles: str) -> Callable[[SecurityPrincipal], SecurityPrincipal]:
    allowed = {role.lower() for role in roles}

    def _dependency(principal: SecurityPrincipal = Depends(get_current_principal)) -> SecurityPrincipal:
        if principal.role.lower() not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return principal

    return _dependency
