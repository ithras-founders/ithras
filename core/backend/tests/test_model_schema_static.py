import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_FILE = ROOT / "app/modules/shared/models/core.py"
SCHEMA_FILES = [
    ROOT / "app/modules/shared/schemas/core.py",
    ROOT / "app/modules/shared/schemas/organizations.py",
]


def _class_assignment_names(class_node: ast.ClassDef) -> list[str]:
    names: list[str] = []
    for node in class_node.body:
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            names.append(node.target.id)
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    names.append(target.id)
    return names


def test_no_duplicate_class_field_names_in_models_and_schemas() -> None:
    for file_path in [MODEL_FILE, *SCHEMA_FILES]:
        tree = ast.parse(file_path.read_text(), filename=str(file_path))
        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue
            names = _class_assignment_names(node)
            duplicates = sorted({name for name in names if names.count(name) > 1})
            assert not duplicates, f"{file_path}:{node.name} has duplicate fields: {duplicates}"


def test_sqlalchemy_mutable_defaults_are_callables() -> None:
    tree = ast.parse(MODEL_FILE.read_text(), filename=str(MODEL_FILE))
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        if not isinstance(node.func, ast.Name) or node.func.id != "Column":
            continue
        for kw in node.keywords:
            if kw.arg != "default":
                continue
            assert not isinstance(
                kw.value, (ast.List, ast.Dict)
            ), f"Mutable literal default found in SQLAlchemy Column at line {node.lineno}"


def test_pydantic_mutable_defaults_use_default_factory() -> None:
    for file_path in SCHEMA_FILES:
        tree = ast.parse(file_path.read_text(), filename=str(file_path))
        for node in ast.walk(tree):
            if not isinstance(node, ast.AnnAssign) or node.value is None:
                continue
            assert not isinstance(
                node.value, (ast.List, ast.Dict)
            ), f"Mutable literal default found in schema at {file_path}:{node.lineno}"
