"""Base interfaces and exceptions for data parsers."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Union
from pathlib import Path


class ParsingError(Exception):
    """Raised when parsing fails due to syntax or file format issues."""

    def __init__(self, message: str, line_number: int = None):
        super().__init__(message)
        self.line_number = line_number


class BaseParser(ABC):
    """Abstract base class for all file parsers."""

    @abstractmethod
    def parse_file(self, file_path: Union[str, Path]) -> List[Dict[str, Any]]:
        """Parse a file from disk into a list of raw team/member dictionaries."""
        pass

    @abstractmethod
    def parse_string(self, content: str) -> List[Dict[str, Any]]:
        """Parse raw string content into a list of raw team/member dictionaries."""
        pass
