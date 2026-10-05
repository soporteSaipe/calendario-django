"""Execute against a disposable PostgreSQL test database to verify row locking.

SQLite explicitly skips this test because it does not support SELECT FOR UPDATE.
Never point the test configuration at a production database.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from threading import Barrier

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import close_old_connections, connections
from django.test import TransactionTestCase, skipUnlessDBFeature
from django.utils import timezone

from calendario.models import Recurso, Reserva


@skipUnlessDBFeature('has_select_for_update')
class ConcurrentReservationTests(TransactionTestCase):
    def test_two_simultaneous_writers_cannot_reserve_the_same_empty_resource(self):
        user = User.objects.create_user('concurrent-user')
        resource = Recurso.objects.create(nombre='Sala concurrencia')
        start = timezone.make_aware(datetime.combine(timezone.localdate() + timedelta(days=1), time(10)))
        barrier = Barrier(2)

        def reserve():
            # Django connections are thread-local: each worker must use its own
            # transaction, rather than inheriting an outer TestCase transaction.
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                try:
                    Reserva.objects.create(
                        usuario_id=user.pk, recurso_id=resource.pk, titulo='Simultánea',
                        fecha_inicio=start, fecha_fin=start + timedelta(hours=1),
                    )
                except ValidationError:
                    return 'conflict'
                return 'created'
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(reserve) for _ in range(2)]
            results = [future.result(timeout=20) for future in futures]

        self.assertCountEqual(results, ['created', 'conflict'])
        self.assertEqual(Reserva.objects.filter(recurso=resource).count(), 1)
