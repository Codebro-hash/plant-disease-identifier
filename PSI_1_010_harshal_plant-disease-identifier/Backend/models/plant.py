from sqlalchemy import Column, Integer, String, Text, DateTime
from database.db import Base
from datetime import datetime

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String)
    analysis = Column(Text)
    image_hash = Column(String, index=True)
    user_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
