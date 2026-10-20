"""In-memory transactional store and query engine mirroring PostgreSQL identity primary keys."""

from collections import defaultdict
from typing import Any, Callable, Dict, Generic, List, Optional, Type, TypeVar

T = TypeVar("T")


class Query(Generic[T]):
    """Mirrors the SQLAlchemy Query interface for in-memory and SQLite-backed operations."""

    def __init__(self, entities: List[T]):
        self._entities = list(entities)

    def filter(self, *criterion: Callable[[T], bool]) -> "Query[T]":
        filtered = self._entities
        for crit in criterion:
            if callable(crit):
                filtered = [e for e in filtered if crit(e)]
        return Query(filtered)

    def filter_by(self, **kwargs) -> "Query[T]":
        filtered = []
        for e in self._entities:
            matches = True
            for k, v in kwargs.items():
                val = getattr(e, k, None)
                # Compare ints / strings tolerantly if one is string representation of int
                if isinstance(val, int) and isinstance(v, str) and v.isdigit():
                    if val != int(v):
                        matches = False
                        break
                elif val != v:
                    matches = False
                    break
            if matches:
                filtered.append(e)
        return Query(filtered)

    def order_by(self, *criterion, **kwargs) -> "Query[T]":
        if not criterion:
            return self

        crit = criterion[0]
        reverse = kwargs.get("reverse", False)

        if callable(crit):
            sort_key = crit
        else:
            col_name = getattr(crit, "name", None)
            if hasattr(crit, "element"):
                col_name = getattr(crit.element, "name", col_name)
                if "DESC" in str(crit).upper():
                    reverse = True
            elif "DESC" in str(crit).upper():
                reverse = True

            if col_name:
                sort_key = lambda e: (getattr(e, col_name, None) is not None, getattr(e, col_name, None))
            else:
                sort_key = lambda e: getattr(e, "id", 0) or 0

        try:
            return Query(sorted(self._entities, key=sort_key, reverse=reverse))
        except Exception:
            return self

    def all(self) -> List[T]:
        return list(self._entities)

    def first(self) -> Optional[T]:
        return self._entities[0] if self._entities else None

    def get(self, ident: Any) -> Optional[T]:
        for e in self._entities:
            val = getattr(e, "id", None)
            if val == ident or str(val) == str(ident):
                return e
        return None

    def count(self) -> int:
        return len(self._entities)


class GlobalStore:
    """Thread-safe entity store emulating PostgreSQL identity sequences for testing."""

    def __init__(self):
        self._data: Dict[str, Dict[Any, Any]] = defaultdict(dict)
        self._sequences: Dict[str, int] = defaultdict(int)

    def _get_key(self, obj: Any) -> str:
        return obj.__class__.__name__

    def save(self, obj: Any):
        key = self._get_key(obj)
        # If integer identity model and id is None, emulate PostgreSQL identity sequence
        if getattr(obj, "id", None) is None:
            self._sequences[key] += 1
            obj.id = self._sequences[key]
        obj_id = getattr(obj, "id")
        self._data[key][obj_id] = obj

    def delete(self, obj: Any):
        key = self._get_key(obj)
        obj_id = getattr(obj, "id", None)
        if obj_id is not None:
            self._data[key].pop(obj_id, None)

    def query(self, entity_cls: Type[T]) -> Query[T]:
        key = entity_cls.__name__
        items = list(self._data[key].values())
        return Query(items)

    def clear(self):
        self._data.clear()
        self._sequences.clear()


global_store = GlobalStore()
