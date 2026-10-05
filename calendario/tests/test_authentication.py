from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import Client, TestCase


class AuthenticationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('login-test', password='local-test-password')

    def test_login_attempts_are_limited_but_login_page_remains_available(self):
        for _ in range(10):
            response = self.client.post('/accounts/login/', {'username': 'login-test', 'password': 'incorrect'})
            self.assertEqual(response.status_code, 200)
        response = self.client.post('/accounts/login/', {'username': 'login-test', 'password': 'incorrect'})
        self.assertEqual(response.status_code, 429)
        self.assertIn('Retry-After', response)
        self.assertEqual(self.client.get('/accounts/login/').status_code, 200)

    def test_mutations_and_login_require_csrf(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post('/accounts/login/', {'username': 'login-test', 'password': 'local-test-password'}).status_code, 403)
        client.force_login(self.user)
        self.assertEqual(client.post('/calendario/crear/', {}).status_code, 403)
        self.assertEqual(client.get('/calendario/crear/').status_code, 405)

    def test_nonstaff_cannot_export_or_access_metrics(self):
        self.client.force_login(self.user)
        for url in ('/calendario/export/', '/calendario/metrics/', '/calendario/dashboard/'):
            response = self.client.get(url)
            self.assertIn(response.status_code, (302, 403))
