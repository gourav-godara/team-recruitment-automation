"""Pipeline orchestrator coordinating parsing, mapping, normalization, and validation."""

from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from mapping.schema_mapper import SchemaMapper
from normalization.normalization_service import NormalizationService
from parsers.base import ParsingError
from parsers.csv_parser import CSVParser
from parsers.json_parser import JSONParser
from schemas.config import ImportConfig
from schemas.import_result import ImportResult
from validation.validation_service import ValidationService


class PipelineStage(str, Enum):
    """Enumeration of pipeline stages for clear error attribution."""

    INITIALIZATION = "Initialization"
    PARSING = "Parsing"
    MAPPING = "Mapping"
    NORMALIZATION = "Normalization"
    VALIDATION = "Validation"


class PipelineError(Exception):
    """Raised when an unrecoverable failure occurs in a pipeline stage."""

    def __init__(self, message: str, stage: PipelineStage = PipelineStage.INITIALIZATION):
        formatted_message = f"[{stage.value}] {message}"
        super().__init__(formatted_message)
        self.stage = stage
        self.message = message


class PipelineOrchestrator:
    """Orchestrates end-to-end data processing from raw files to validated teams."""

    def __init__(self, config: Optional[ImportConfig] = None):
        self.config = config or ImportConfig()
        self.csv_parser = CSVParser()
        self.json_parser = JSONParser()
        self.schema_mapper = SchemaMapper(config=self.config)
        self.normalization_service = NormalizationService()
        self.validation_service = ValidationService(config=self.config)

    def process_file(
        self,
        file_path: Union[str, Path],
        raise_on_error: bool = False,
    ) -> ImportResult:
        """Process an input CSV or JSON file through the full import pipeline.

        Args:
            file_path: Path to the input CSV or JSON file on disk.
            raise_on_error: If True, raises PipelineError on early failures.
                           If False, returns an ImportResult with global_errors.

        Returns:
            ImportResult containing processed teams and summary statistics.
        """
        path = Path(file_path)

        # 1. Verify file existence and accessibility
        if not path.exists() or not path.is_file():
            err_msg = f"File not found or unreadable: '{file_path}'"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING)
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)

        # 2. Determine file format by extension
        suffix = path.suffix.lower()
        if suffix == ".csv":
            parser = self.csv_parser
            fmt_name = "CSV"
        elif suffix == ".json":
            parser = self.json_parser
            fmt_name = "JSON"
        else:
            err_msg = (
                f"Unsupported file format '{suffix}'. "
                "Only CSV (.csv) and JSON (.json) files are supported."
            )
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING)
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)

        # 3. Stage 1: Parsing
        try:
            raw_teams = parser.parse_file(path)
        except ParsingError as e:
            err_msg = f"Failed to parse {fmt_name} file: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)
        except Exception as e:
            err_msg = f"Unexpected error while reading {file_path}: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)

        return self._run_downstream_stages(raw_teams, raise_on_error=raise_on_error)

    def process_string(
        self,
        content: str,
        file_format: str = "csv",
        raise_on_error: bool = False,
    ) -> ImportResult:
        """Process raw string content directly through the pipeline.

        Args:
            content: Raw CSV or JSON string content.
            file_format: Either 'csv' or 'json'.
            raise_on_error: If True, raises PipelineError on early failures.

        Returns:
            ImportResult containing processed teams and summary statistics.
        """
        fmt = file_format.strip().lower()
        if fmt == "csv":
            parser = self.csv_parser
        elif fmt == "json":
            parser = self.json_parser
        else:
            err_msg = f"Unsupported format '{file_format}'. Expected 'csv' or 'json'."
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING)
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)

        try:
            raw_teams = parser.parse_string(content)
        except ParsingError as e:
            err_msg = f"Failed to parse {fmt.upper()} content: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)
        except Exception as e:
            err_msg = f"Unexpected error during string parsing: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.PARSING) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.PARSING)

        return self._run_downstream_stages(raw_teams, raise_on_error=raise_on_error)

    def _run_downstream_stages(
        self,
        raw_teams: List[Dict[str, Any]],
        raise_on_error: bool = False,
    ) -> ImportResult:
        """Run Mapping, Normalization, and Validation stages sequentially."""
        # Stage 2: Schema Mapping
        try:
            mapped_teams = self.schema_mapper.map_teams(raw_teams)
        except Exception as e:
            err_msg = f"Schema mapping error: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.MAPPING) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.MAPPING)

        # Stage 3: Normalization
        try:
            normalized_teams = self.normalization_service.normalize_teams(mapped_teams)
        except Exception as e:
            err_msg = f"Normalization error: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.NORMALIZATION) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.NORMALIZATION)

        # Stage 4: Validation
        try:
            import_result = self.validation_service.validate_teams(normalized_teams)
        except Exception as e:
            err_msg = f"Validation error: {str(e)}"
            if raise_on_error:
                raise PipelineError(err_msg, stage=PipelineStage.VALIDATION) from e
            return self._create_failure_result(err_msg, stage=PipelineStage.VALIDATION)

        # Enrich summary with pipeline metadata
        import_result.summary["pipeline_status"] = "SUCCESS"
        import_result.summary["last_completed_stage"] = PipelineStage.VALIDATION.value
        import_result.summary["has_validation_errors"] = (import_result.invalid_teams_count > 0)
        import_result.summary["has_global_errors"] = (len(import_result.global_errors) > 0)

        return import_result

    def _create_failure_result(self, error_message: str, stage: PipelineStage) -> ImportResult:
        """Construct a structured ImportResult for fatal pipeline interruptions."""
        formatted_error = f"[{stage.value}] {error_message}"
        return ImportResult(
            total_records=0,
            total_teams=0,
            valid_teams_count=0,
            invalid_teams_count=0,
            teams=[],
            global_errors=[formatted_error],
            global_warnings=[],
            summary={
                "pipeline_status": "FAILED",
                "failed_stage": stage.value,
                "error": error_message,
            },
        )

    # Convenience alias
    run = process_file
