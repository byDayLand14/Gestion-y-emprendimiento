"""Pruebas locales del catálogo público; no conectan con Supabase."""
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

from build_catalog import build, load_catalog


class CatalogBuildTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.source = self.root / 'catalog.json'
        self.output = self.root / 'output'
        self.catalog = {
            'exercises': [{'id': 'squat', 'name': "O'Brien: sentadilla", 'steps': ['Paso 1', 'Paso 2'], 'source': 'https://example.com'}],
            'recipes': [{'id': 'oats', 'name': 'Avena', 'ingredients': [{'name': 'avena', 'amount': 40}]}],
            'plans': [{'id': 'start', 'name': 'Comenzar', 'days': [{'exercise': 'squat'}]}],
        }
        self.write()

    def tearDown(self):
        self.directory.cleanup()

    def write(self):
        self.source.write_text(json.dumps(self.catalog, ensure_ascii=False), encoding='utf-8')

    def test_build_preserves_objects_and_has_valid_sqlite(self):
        counts = build(self.source, self.output)
        self.assertEqual(counts, {'exercises': 1, 'recipes': 1, 'plans': 1})
        with sqlite3.connect(self.output / 'catalog.db') as db:
            self.assertEqual(db.execute('pragma integrity_check').fetchone()[0], 'ok')
            payload = db.execute('select payload from exercise_catalog where id=?', ('squat',)).fetchone()[0]
            self.assertEqual(json.loads(payload), self.catalog['exercises'][0])
        seed = (self.output / 'seed_catalog.sql').read_text(encoding='utf-8')
        self.assertIn("O''Brien", seed)
        self.assertIn('ON CONFLICT (id) DO UPDATE', seed)
        self.assertNotIn('athlete_data', seed)

    def test_rebuild_updates_instead_of_duplicating(self):
        build(self.source, self.output)
        self.catalog['exercises'][0]['name'] = 'Sentadilla actualizada'
        self.write()
        build(self.source, self.output)
        with sqlite3.connect(self.output / 'catalog.db') as db:
            self.assertEqual(db.execute('select count(*) from exercise_catalog').fetchone()[0], 1)
            self.assertEqual(db.execute('select name from exercise_catalog').fetchone()[0], 'Sentadilla actualizada')

    def test_duplicate_id_is_rejected_and_existing_database_survives(self):
        build(self.source, self.output)
        before = (self.output / 'catalog.db').read_bytes()
        self.catalog['exercises'].append(dict(self.catalog['exercises'][0]))
        self.write()
        with self.assertRaisesRegex(ValueError, 'duplicado'):
            build(self.source, self.output)
        self.assertEqual((self.output / 'catalog.db').read_bytes(), before)

    def test_unknown_exercise_reference_is_rejected(self):
        self.catalog['plans'][0]['workouts'] = [
            {'id': 'day-1', 'exercises': [{'id': 'missing-exercise'}]}
        ]
        self.write()
        with self.assertRaisesRegex(ValueError, 'inexistente'):
            load_catalog(self.source)

    def test_missing_or_escaping_local_image_is_rejected(self):
        for image in ('assets/missing.jpg', '../outside.jpg', 'file:///outside.jpg'):
            self.catalog['exercises'][0]['images'] = [image]
            self.write()
            with self.assertRaises(ValueError):
                load_catalog(self.source)

    def test_incomplete_or_incompatible_content_is_rejected(self):
        for value in [
            {'exercises': [], 'recipes': []},
            {**self.catalog, 'recipes': [{'id': 'x', 'name': ''}]},
            {**self.catalog, 'plans': [{'id': 'x', 'name': 'a\x00b'}]},
            {**self.catalog, 'exercises': [{'id': 'x', 'name': 'x', 'time': float('nan')}]},
        ]:
            self.source.write_text(json.dumps(value), encoding='utf-8')
            with self.assertRaises(ValueError):
                load_catalog(self.source)


if __name__ == '__main__':
    unittest.main(verbosity=2)
