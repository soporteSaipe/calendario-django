from datetime import datetime, timedelta, time, UTC
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase, RequestFactory, SimpleTestCase
from django.urls import reverse
from django.utils import timezone

from calendario.decorators import rate_limit
from calendario.exceptions import ConflictoReservaError, FechaInvalidaError
from calendario.forms import ReservaForm
from calendario.models import Recurso, Reserva
from calendario.utils import ReservaService, CacheService
from calendario.views import api_views


class ReservationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('ana', password='test-password')
        self.other = User.objects.create_user('juan', password='test-password')
        self.room = Recurso.objects.create(nombre='Sala Norte')
        self.vehicle = Recurso.objects.create(nombre='Auto', tipo='vehiculo', patente='TEST')
        self.start = timezone.make_aware(datetime.combine(timezone.localdate() + timedelta(days=2), time(10)))
        self.end = self.start + timedelta(hours=1)

    def reservation(self, **changes):
        values = dict(recurso=self.room, usuario=self.user, titulo='Reunión',
                      fecha_inicio=self.start, fecha_fin=self.end)
        values.update(changes)
        return Reserva.objects.create(**values)

    def post_data(self, **changes):
        values = {'recurso': self.room.pk, 'titulo': 'Reunión', 'fecha': self.start.date().isoformat(),
                  'hora_inicio': '10:00', 'hora_fin': '11:00'}
        values.update(changes)
        return values

    def test_in_progress_reservation_blocks_overlap_but_adjacent_is_allowed(self):
        self.reservation(estado='en_curso')
        with self.assertRaises(ConflictoReservaError):
            ReservaService.validar_conflictos_reserva(self.room, self.start, self.end)
        with self.assertRaises(ValidationError):
            self.reservation(titulo='Duplicada')
        self.reservation(fecha_inicio=self.end, fecha_fin=self.end + timedelta(hours=1))
        self.assertEqual(Reserva.objects.count(), 2)

    def test_cancelled_reservation_does_not_block_new_one(self):
        self.reservation(estado='cancelada')
        self.reservation()
        self.assertEqual(Reserva.objects.count(), 2)

    def test_vehicle_requires_positive_interval_and_required_fields(self):
        for end in (self.start, self.start - timedelta(hours=1)):
            with self.assertRaises(FechaInvalidaError):
                ReservaService.validar_fechas(self.start, end, self.vehicle)
            with self.assertRaises(ValidationError):
                self.reservation(recurso=self.vehicle, fecha_fin=end, responsable='Ana', destino='Oficina')
        with self.assertRaises(ValidationError):
            self.reservation(recurso=self.vehicle)

    def test_rooms_cannot_cross_days_and_use_local_hours(self):
        with self.assertRaises(FechaInvalidaError):
            ReservaService.validar_reserva_completa(self.room, self.start, self.end + timedelta(days=1))
        # 18:00 Buenos Aires = 21:00 UTC; UTC must not violate office hours.
        start = self.start.replace(hour=18)
        ReservaService.validar_reserva_completa(
            self.room, start.astimezone(UTC),
            (start + timedelta(hours=1)).astimezone(UTC))

    def test_create_validation_is_client_error_not_server_error(self):
        self.client.force_login(self.user)
        response = self.client.post(reverse('calendario:crear_reserva'), self.post_data(titulo=''),
                                    HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Reserva.objects.count(), 0)
        self.reservation()
        response = self.client.post(reverse('calendario:crear_reserva'), self.post_data(),
                                    HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 409)

    def test_unexpected_create_errors_do_not_leak_details(self):
        self.client.force_login(self.user)
        with patch.object(ReservaService, 'crear_reserva', side_effect=RuntimeError('private-database-host')):
            response = self.client.post(reverse('calendario:crear_reserva'), self.post_data(),
                                        HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 500)
        self.assertNotContains(response, 'private-database-host', status_code=500)

    def test_missing_form_dates_do_not_crash_model_clean(self):
        form = ReservaForm(data={'recurso': self.room.pk, 'titulo': 'Reunión'})
        self.assertFalse(form.is_valid())
        self.assertIn('fecha_inicio', form.errors)

    def test_edit_persists_vehicle_fields_and_resource(self):
        reservation = self.reservation()
        self.client.force_login(self.user)
        return_date = (self.start + timedelta(days=1)).date()
        response = self.client.post(reverse('calendario:editar_reserva', args=[reservation.pk]), {
            'recurso': self.vehicle.pk, 'titulo': '', 'descripcion': 'Viaje',
            'fecha_inicio': self.start.strftime('%Y-%m-%dT%H:%M'),
            'fecha_fin': self.end.strftime('%Y-%m-%dT%H:%M'),
            'fecha_vuelta': return_date.isoformat(), 'responsable': 'Responsable nuevo', 'destino': 'Rosario',
        }, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200, response.content)
        reservation.refresh_from_db()
        self.assertEqual(reservation.recurso, self.vehicle)
        self.assertEqual(reservation.responsable, 'Responsable nuevo')
        self.assertEqual(reservation.destino, 'Rosario')
        self.assertEqual(timezone.localtime(reservation.fecha_fin).date(), return_date)

    def test_other_user_cannot_edit_or_delete(self):
        reservation = self.reservation()
        self.client.force_login(self.other)
        for name in ('editar_reserva', 'eliminar_reserva'):
            response = self.client.post(reverse(f'calendario:{name}', args=[reservation.pk]))
            self.assertEqual(response.status_code, 404)
        self.assertTrue(Reserva.objects.filter(pk=reservation.pk).exists())

    def test_calendar_keeps_in_progress_and_finished_and_anonymizes_public_data(self):
        self.reservation(estado='en_curso', descripcion='Información interna')
        self.reservation(estado='terminada', fecha_inicio=self.start-timedelta(days=1), fecha_fin=self.end-timedelta(days=1))
        response = self.client.get(reverse('calendario:api_reservas'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(response.json()[0]['title'], 'Reservado')
        self.assertNotIn('Información interna', response.content.decode())
        self.client.force_login(self.user)
        response = self.client.get(reverse('calendario:api_reservas'))
        self.assertEqual(response.json()[0]['title'], 'Reunión')

    def test_invalid_api_parameters_are_400(self):
        for params in ({'start': 'invalid', 'end': 'invalid'}, {'start': self.start.isoformat()},
                       {'sala': 'abc'}, {'start': self.end.isoformat(), 'end': self.start.isoformat()}):
            response = self.client.get(reverse('calendario:api_reservas'), params)
            self.assertEqual(response.status_code, 400)

    def test_busy_hours_include_multiday_vehicles_and_use_local_time(self):
        self.reservation(recurso=self.vehicle, responsable='Ana', destino='Rosario',
                         fecha_fin=self.end+timedelta(days=2), estado='en_curso')
        url = reverse('calendario:api_horarios_ocupados')
        response = self.client.get(url, {'recurso_id': self.vehicle.pk, 'fecha': self.start.date().isoformat()})
        self.assertEqual(response.json()['horarios_ocupados'][0],
                         {'inicio': '10:00', 'fin': '24:00', 'tipo': 'reserva'})
        response = self.client.get(url, {'recurso_id': self.vehicle.pk,
                                        'fecha': (self.start+timedelta(days=1)).date().isoformat()})
        self.assertEqual(response.json()['horarios_ocupados'][0],
                         {'inicio': '00:00', 'fin': '24:00', 'tipo': 'reserva'})

    def test_conflict_api_accepts_vehicle_return_date(self):
        response = self.client.get(reverse('calendario:api_validar_conflicto'), {
            'sala': self.vehicle.pk, 'fecha': self.start.date().isoformat(),
            'hora_inicio': '18:00', 'hora_fin': '09:00',
            'fecha_vuelta': (self.start+timedelta(days=1)).date().isoformat(),
        })
        self.assertEqual(response.status_code, 200, response.content)

    def test_resource_change_invalidates_both_caches_on_commit(self):
        CacheService.get_recursos_activos()
        with self.captureOnCommitCallbacks(execute=True):
            self.room.activo = False
            self.room.save()
        self.assertNotIn(self.room.pk, [r.pk for r in CacheService.get_recursos_activos()])

    def test_public_conflict_response_does_not_disclose_title(self):
        self.reservation(titulo='Reunión privada de personal')
        response = self.client.get(reverse('calendario:api_validar_conflicto'), {
            'sala': self.room.pk, 'fecha': self.start.date().isoformat(),
            'hora_inicio': '10:00', 'hora_fin': '11:00',
        })
        self.assertEqual(response.status_code, 422)
        self.assertNotContains(response, 'Reunión privada', status_code=422)

    def test_calendar_refuses_to_present_incomplete_availability(self):
        self.reservation()
        self.reservation(fecha_inicio=self.end, fecha_fin=self.end+timedelta(hours=1))
        with patch.object(api_views.APIConfig, 'API_MAX_RESERVAS', 1):
            response = self.client.get(reverse('calendario:api_reservas'))
        self.assertEqual(response.status_code, 422)

    def test_invalid_calendar_resource_does_not_crash(self):
        response = self.client.get(reverse('calendario:calendario'), {'sala': 'invalid'})
        self.assertEqual(response.status_code, 200)

    def test_model_applies_room_rules_to_admin_writes(self):
        with self.assertRaises(ValidationError):
            self.reservation(fecha_inicio=self.start.replace(hour=22), fecha_fin=self.end.replace(hour=23))
        comedor = Recurso.objects.create(nombre='Comedor')
        with self.assertRaises(ValidationError):
            self.reservation(recurso=comedor, fecha_inicio=self.start.replace(hour=12),
                             fecha_fin=self.end.replace(hour=13))

    def test_cancel_legacy_invalid_reservation_without_repairing_its_schedule(self):
        reservation = self.reservation()
        Reserva.objects.filter(pk=reservation.pk).update(fecha_fin=self.start-timedelta(hours=1))
        reservation.refresh_from_db()
        reservation.estado = 'cancelada'
        reservation.full_clean()
        reservation.save()
        reservation.refresh_from_db()
        self.assertEqual(reservation.estado, 'cancelada')
        self.assertLess(reservation.fecha_fin, reservation.fecha_inicio)

    def test_partial_cancel_does_not_validate_or_persist_unrelated_instance_edits(self):
        reservation = self.reservation()
        reservation.estado = 'cancelada'
        reservation.fecha_fin = self.start-timedelta(hours=1)
        reservation.titulo = ''
        reservation.save(update_fields=['estado'])
        reservation.refresh_from_db()
        self.assertEqual(reservation.estado, 'cancelada')
        self.assertEqual(reservation.titulo, 'Reunión')
        self.assertEqual(reservation.fecha_fin, self.end)

    def test_partial_reactivation_validates_persisted_schedule(self):
        cancelled = self.reservation(estado='cancelada')
        self.reservation()
        cancelled.estado = 'confirmada'
        cancelled.fecha_inicio = self.end
        cancelled.fecha_fin = self.end+timedelta(hours=1)
        with self.assertRaises(ValidationError):
            cancelled.save(update_fields=['estado'])
        cancelled.refresh_from_db()
        self.assertEqual(cancelled.estado, 'cancelada')

    def test_missing_resource_is_validation_error_in_model_and_form(self):
        for resource_id in (999999, 'invalid'):
            reservation = Reserva(usuario=self.user, recurso_id=resource_id, titulo='Reunión',
                                  fecha_inicio=self.start, fecha_fin=self.end)
            with self.assertRaises(ValidationError):
                reservation.full_clean()
            with self.assertRaises(ValidationError):
                reservation.save()
            form = ReservaForm(data={
                'recurso': resource_id, 'titulo': 'Reunión',
                'fecha_inicio': self.start.isoformat(), 'fecha_fin': self.end.isoformat(),
            })
            self.assertFalse(form.is_valid())
            self.assertIn('recurso', form.errors)

    def test_staff_export_includes_trip_that_started_before_range(self):
        from django.http import HttpResponse
        self.user.is_staff = True
        self.user.save()
        reservation = self.reservation(recurso=self.vehicle, responsable='Ana', destino='Rosario',
                                       fecha_fin=self.end+timedelta(days=2))
        self.client.force_login(self.user)
        day = (self.start+timedelta(days=1)).date().isoformat()
        with patch('calendario.views.export_views.ExportFactory.create_exporter') as factory:
            factory.return_value.export.return_value = HttpResponse('exported')
            response = self.client.get(reverse('calendario:export_calendar'),
                                       {'date_from': day, 'date_to': day, 'format': 'xlsx'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(list(factory.return_value.export.call_args.args[0]), [reservation])


class RateLimitTests(SimpleTestCase):
    def test_limit_counts_requests_and_returns_retry_header(self):
        from django.http import JsonResponse
        from django.contrib.auth.models import AnonymousUser
        cache.clear()
        request = RequestFactory().get('/')
        request.user = AnonymousUser()
        view = rate_limit(requests_per_minute=2)(lambda request: JsonResponse({'ok': True}))
        self.assertEqual(view(request).status_code, 200)
        self.assertEqual(view(request).status_code, 200)
        response = view(request)
        self.assertEqual(response.status_code, 429)
        self.assertIn('Retry-After', response)
