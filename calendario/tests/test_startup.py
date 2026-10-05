from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase

import init_db
import start_app


class StartupTests(TestCase):
    def test_startup_never_creates_users_or_resets_existing_credentials(self):
        user = User.objects.create_user('admin', password='existing-password', is_staff=False)
        original_password = user.password
        for module in (init_db, start_app):
            with self.subTest(module=module.__name__), patch.object(module, 'call_command') as command:
                module.initialize_database()
                user.refresh_from_db()
                self.assertEqual(User.objects.count(), 1)
                self.assertEqual(user.password, original_password)
                self.assertFalse(user.is_staff)
                self.assertFalse(user.is_superuser)
                self.assertEqual(command.call_args_list[0].args, ('migrate',))
                self.assertNotIn('cargar_usuarios_excel', [call.args[0] for call in command.call_args_list])
