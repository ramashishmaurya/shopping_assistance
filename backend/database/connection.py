"""Database Connection & Multi-Database Engine Registry.

Supports:
1. Single PostgreSQL database via DATABASE_URL
2. Multiple databases via CATALOG_DATABASE_URL, ORDERS_DATABASE_URL, etc.
3. Automatic fallback to local SQLite when PostgreSQL is offline or unconfigured.
"""

import os
import logging
from typing import Dict, Generator, Optional
from sqlalchemy import create_engine, Engine, text
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

logger = logging.getLogger("database")

# Registry of database engines & session factories
ENGINES: Dict[str, Engine] = {}
SESSION_FACTORIES: Dict[str, sessionmaker] = {}


def _resolve_url(env_var: str, fallback_sqlite_name: str) -> str:
    """Get database URL from environment or fallback to SQLite."""
    url = os.getenv(env_var)
    if url and url.strip():
        # Ensure postgresql:// prefix (some providers use postgres://)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    
    # Fallback to local SQLite if not configured
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    os.makedirs(data_dir, exist_ok=True)
    sqlite_path = os.path.join(data_dir, f"{fallback_sqlite_name}.db")
    return f"sqlite:///{sqlite_path}"


def create_db_engine(url: str, bind_name: str) -> Engine:
    """Create engine with connection pooling and dialect options."""
    if url.startswith("sqlite"):
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=False
        )
    else:
        # PostgreSQL with pooling
        engine = create_engine(
            url,
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True,
            echo=False
        )
    return engine


def init_db():
    """Initialize engines for default and any secondary databases."""
    global ENGINES, SESSION_FACTORIES

    # 1. Primary / Default Database
    primary_url = _resolve_url("DATABASE_URL", "shopping_assistant")
    
    # 2. Check for optional multi-databases
    catalog_url = os.getenv("CATALOG_DATABASE_URL")
    orders_url = os.getenv("ORDERS_DATABASE_URL")

    binds = {
        "default": primary_url,
    }
    if catalog_url and catalog_url.strip():
        binds["catalog"] = catalog_url
    if orders_url and orders_url.strip():
        binds["orders"] = orders_url

    for name, url in binds.items():
        try:
            # Normalize postgres url if driver is not specified
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://") and "+psycopg" not in url:
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

            engine = create_db_engine(url, name)
            # Test connectivity
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            ENGINES[name] = engine
            SESSION_FACTORIES[name] = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            
            # Create tables if not exist
            Base.metadata.create_all(bind=engine)
            logger.info("Initialized database '%s' at: %s", name, url.split("@")[-1] if "@" in url else url)

        except Exception as e:
            logger.warning("Could not connect to PostgreSQL for '%s': %s", name, e)
            data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
            os.makedirs(data_dir, exist_ok=True)
            fallback_path = os.path.join(data_dir, "shopping_assistant.db")
            logger.info("Falling back to local SQLite at %s...", fallback_path)
            
            fallback_url = f"sqlite:///{fallback_path}"
            engine = create_db_engine(fallback_url, name)
            ENGINES[name] = engine
            SESSION_FACTORIES[name] = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            Base.metadata.create_all(bind=engine)


def get_db(bind: str = "default") -> Generator[Session, None, None]:
    """Dependency / context provider for database sessions.
    
    Usage:
        with next(get_db("default")) as session:
            ...
    Or in FastAPI:
        def route(db: Session = Depends(get_db)):
            ...
    """
    if not SESSION_FACTORIES:
        init_db()

    factory = SESSION_FACTORIES.get(bind) or SESSION_FACTORIES.get("default")
    if not factory:
        init_db()
        factory = SESSION_FACTORIES.get("default")

    session: Session = factory()
    try:
        yield session
    finally:
        session.close()


def get_session(bind: str = "default") -> Session:
    """Helper to get a direct Session instance."""
    if not SESSION_FACTORIES:
        init_db()
    factory = SESSION_FACTORIES.get(bind) or SESSION_FACTORIES.get("default")
    return factory()
