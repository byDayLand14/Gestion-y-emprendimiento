#!/usr/bin/env python3
"""Construye SQLite y un seed de Supabase desde el catálogo público, sin dependencias.

No contiene ni lee datos personales, cuentas, claves ni variables de entorno.
Ejecutar: python3 database/build_catalog.py [ruta/a/catalog.json]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sqlite3
import tempfile
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
COLLECTIONS = {
    "exercises": "exercise_catalog",
    "recipes": "recipe_catalog",
    "plans": "plan_catalog",
}


def reject_nulls(value: object) -> None:
    if isinstance(value, str) and "\x00" in value:
        raise ValueError("El catálogo contiene un carácter NUL, no compatible con PostgreSQL JSONB.")
    if isinstance(value, dict):
        for key, child in value.items():
            reject_nulls(key)
            reject_nulls(child)
    elif isinstance(value, list):
        for child in value:
            reject_nulls(child)


def load_catalog(path: Path) -> dict[str, list[dict]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise ValueError("El catálogo debe ser un objeto JSON.")
    reject_nulls(document)
    result = {}
    for collection in COLLECTIONS:
        rows = document.get(collection)
        if not isinstance(rows, list):
            raise ValueError(f"Falta la lista {collection}.")
        seen = set()
        for index, item in enumerate(rows, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"{collection}, elemento {index}: se esperaba un objeto.")
            for field in ("id", "name"):
                if not isinstance(item.get(field), str) or not item[field].strip():
                    raise ValueError(f"{collection}, elemento {index}: {field} debe ser texto no vacío.")
            if item["id"] in seen:
                raise ValueError(f"{collection}: id duplicado {item['id']!r}.")
            seen.add(item["id"])
            # Detecta también números NaN/Infinity, que no admite JSONB.
            json.dumps(item, ensure_ascii=False, allow_nan=False)
        result[collection] = rows
    validate_links(result, path.parent.parent)
    return result


def validate_links(catalog: dict[str, list[dict]], asset_root: Path) -> None:
    """Comprueba referencias internas y archivos locales; no consulta la red."""
    ids = {item["id"] for item in catalog["exercises"]}
    workout_ids = set()
    for plan in catalog["plans"]:
        workouts = plan.get("workouts", [])
        if not isinstance(workouts, list):
            raise ValueError(f"El plan {plan['id']} debe tener workouts en una lista.")
        for workout in workouts:
            if not isinstance(workout, dict):
                raise ValueError(f"El plan {plan['id']} contiene un workout no válido.")
            workout_id = workout.get("id")
            if not isinstance(workout_id, str) or not workout_id.strip():
                raise ValueError(f"El plan {plan['id']} tiene un workout sin id.")
            if workout_id in workout_ids:
                raise ValueError(f"Workout duplicado: {workout_id}.")
            workout_ids.add(workout_id)
            exercises = workout.get("exercises", [])
            if not isinstance(exercises, list):
                raise ValueError(f"Workout {workout_id}: exercises debe ser una lista.")
            for exercise in exercises:
                if not isinstance(exercise, dict) or exercise.get("id") not in ids:
                    raise ValueError(f"Workout {workout_id}: referencia a un ejercicio inexistente.")
    root = asset_root.resolve()
    for exercise in catalog["exercises"]:
        images = exercise.get("images", [])
        if not isinstance(images, list):
            raise ValueError(f"Ejercicio {exercise['id']}: images debe ser una lista.")
        for image in images:
            if not isinstance(image, str) or not image.strip():
                raise ValueError(f"Ejercicio {exercise['id']}: ruta de imagen no válida.")
            url = urlsplit(image)
            if url.scheme in {"https", "http"}:
                continue  # No se establece disponibilidad remota sin comprobarla.
            if url.scheme or url.netloc:
                raise ValueError(f"Ejercicio {exercise['id']}: esquema de imagen no permitido.")
            file = (root / image).resolve()
            if not file.is_relative_to(root) or not file.is_file():
                raise ValueError(f"Ejercicio {exercise['id']}: falta la imagen local {image}.")


def build(catalog_path: Path, output_dir: Path) -> dict[str, int]:
    catalog = load_catalog(catalog_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    statements = [
        "-- Generado desde data/catalog.json. Ejecutar después de supabase.sql.",
        "-- Actualiza por id sin borrar otros contenidos ni datos privados.",
        "begin;",
        "set standard_conforming_strings = on;",
    ]
    with tempfile.TemporaryDirectory(prefix="catalog-build-", dir=output_dir) as temp:
        sqlite_path = Path(temp) / "catalog.db"
        with sqlite3.connect(sqlite_path) as db:
            for collection, table in COLLECTIONS.items():
                db.execute(
                    f"CREATE TABLE {table} (id TEXT PRIMARY KEY NOT NULL "
                    "CHECK(length(trim(id)) > 0), name TEXT NOT NULL "
                    "CHECK(length(trim(name)) > 0), payload TEXT NOT NULL "
                    "CHECK(json_valid(payload) AND json_type(payload) = 'object'))"
                )
                for item in catalog[collection]:
                    db.execute(
                        f"INSERT INTO {table} (id,name,payload) VALUES (?,?,?)",
                        (item["id"], item["name"], json.dumps(item, ensure_ascii=False, allow_nan=False)),
                    )
                encoded = json.dumps(catalog[collection], ensure_ascii=False, allow_nan=False).replace("'", "''")
                statements.append(
                    f"INSERT INTO public.{table} (id,name,payload)\n"
                    f"SELECT value->>'id', value->>'name', value FROM jsonb_array_elements('{encoded}'::jsonb)\n"
                    "ON CONFLICT (id) DO UPDATE SET name = excluded.name, payload = excluded.payload, updated_at = now();"
                )
            check = db.execute("PRAGMA integrity_check").fetchone()[0]
            if check != "ok":
                raise RuntimeError(f"La validación de SQLite falló: {check}")
        statements += ["commit;", ""]
        seed_path = Path(temp) / "seed_catalog.sql"
        seed_path.write_text("\n\n".join(statements), encoding="utf-8")
        # Reemplaza solo los dos archivos generados. No modifica el catálogo ni usuarios.
        sqlite_path.replace(output_dir / "catalog.db")
        seed_path.replace(output_dir / "seed_catalog.sql")
    return {key: len(rows) for key, rows in catalog.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog", nargs="?", type=Path, default=ROOT / "data" / "catalog.json")
    parser.add_argument("--output", type=Path, default=ROOT / "database")
    args = parser.parse_args()
    try:
        counts = build(args.catalog.resolve(), args.output.resolve())
    except (OSError, ValueError, sqlite3.Error, RuntimeError) as error:
        parser.exit(1, f"No se pudo preparar el catálogo: {error}\n")
    print("Catálogo creado: " + ", ".join(f"{key}={count}" for key, count in counts.items()))
    print(f"SQLite: {args.output / 'catalog.db'}")
    print(f"Supabase: {args.output / 'seed_catalog.sql'}")


if __name__ == "__main__":
    main()
