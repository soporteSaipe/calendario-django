"""Regresiones de configuración; no se conecta a PostgreSQL."""
import json
import os
import subprocess
import sys

from django.test import SimpleTestCase

from .db_config import configure_database


class DeploymentSettingsTests(SimpleTestCase):
    def run_settings(self, overrides=None):
        env = {key: value for key, value in os.environ.items() if not key.startswith(
            ('SECRET_KEY', 'DATABASE_URL', 'SUPABASE_', 'VERCEL', 'RAILWAY_', 'RENDER_',
             'ALLOWED_HOSTS', 'CSRF_TRUSTED_ORIGINS', 'REDIS_URL', 'DJANGO_SETTINGS_MODULE'))}
        env.update(DJANGO_SKIP_DOTENV='1', SECRET_KEY='x' * 60,
                   DATABASE_URL='postgresql://test:test@localhost:5432/test',
                   VERCEL_URL='preview.example.vercel.app')
        env.update(overrides or {})
        return subprocess.run([sys.executable, '-c',
            'import json; from calendario_reservas import settings_production as s; '
            'print(json.dumps({"hosts": s.ALLOWED_HOSTS, "debug": s.DEBUG, '
            '"secure": s.SESSION_COOKIE_SECURE, "storage": s.STORAGES["staticfiles"]["BACKEND"]}))'],
            env=env, capture_output=True, text=True, timeout=20)

    def test_production_is_secure_and_does_not_print_database_credentials(self):
        result = self.run_settings({'DEBUG': 'True'})
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        self.assertFalse(data['debug'])
        self.assertTrue(data['secure'])
        self.assertEqual(data['hosts'], ['preview.example.vercel.app'])
        self.assertIn('CompressedManifest', data['storage'])
        self.assertNotIn('postgresql://', result.stdout + result.stderr)

    def test_missing_secret_and_provider_wildcards_fail_closed(self):
        for values in ({'SECRET_KEY': ''}, {'ALLOWED_HOSTS': '*.vercel.app'}, {'ALLOWED_HOSTS': '.vercel.app'},
                       {'CSRF_TRUSTED_ORIGINS': 'https://*.vercel.app'}):
            with self.subTest(values=values):
                result = self.run_settings(values)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('ImproperlyConfigured', result.stderr)

    def test_database_port_and_options_are_preserved(self):
        config = configure_database('postgresql://user:pass@db.example.supabase.co:5432/postgres?application_name=calendar')
        self.assertEqual(str(config['PORT']), '5432')
        self.assertEqual(config['OPTIONS']['application_name'], 'calendar')
        self.assertEqual(config['OPTIONS']['sslmode'], 'require')
        self.assertTrue(config['DISABLE_SERVER_SIDE_CURSORS'])
        self.assertEqual(config['CONN_MAX_AGE'], 0)
