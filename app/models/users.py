from sqlalchemy import Boolean, Column, Integer, String, Date
from sqlalchemy.sql import text

from app.db.base_class import Base


class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    timezone = Column(String(255), nullable=True, server_default="UTC")
    current_streak = Column(Integer, nullable=False, server_default=text("0"))
    last_active_date = Column(Date, nullable=True)
