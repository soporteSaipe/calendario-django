"""Importación explícita de usuarios desde Excel, sin cambios implícitos de claves."""
from pathlib import Path

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from openpyxl import load_workbook


class Command(BaseCommand):
    help = 'Crea usuarios desde Excel (columnas usuario y contraseña); conserva las cuentas existentes.'

    def add_arguments(self, parser):
        parser.add_argument('--archivo', default='credenciales.xlsx', help='Ruta del archivo Excel.')
        parser.add_argument(
            '--actualizar-existentes', action='store_true',
            help='Autoriza actualizar contraseñas de usuarios existentes, conservando sus permisos y datos.',
        )

    def handle(self, *args, **options):
        source = Path(options['archivo'])
        if not source.is_file():
            raise CommandError('El archivo Excel indicado no existe.')

        user_model = get_user_model()
        created_count = updated_count = skipped_count = error_count = 0
        workbook = None
        try:
            workbook = load_workbook(source, read_only=True)
            sheet = workbook.active
            if sheet is None:
                raise CommandError('El archivo no tiene una hoja de usuarios.')
            for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                if not row or all(value is None for value in row):
                    continue
                try:
                    if len(row) < 2 or row[0] is None or not str(row[0]).strip():
                        raise ValidationError('La fila debe incluir usuario y contraseña.')
                    username = str(row[0]).strip()
                    with transaction.atomic():
                        user = user_model.objects.select_for_update().filter(username=username).first()
                        created = user is None
                        if not created and not options['actualizar_existentes']:
                            skipped_count += 1
                            self.stdout.write(f'Fila {row_num}: cuenta existente conservada.')
                            continue
                        if row[1] is None or not str(row[1]).strip():
                            raise ValidationError('La contraseña no puede estar vacía.')
                        # Preserve the exact password; whitespace can be intentional.
                        password = str(row[1])
                        if created:
                            user = user_model(username=username, email=f'{username}@saipe.com.ar',
                                              is_staff=False, is_superuser=False)
                        validate_password(password, user=user)
                        user.set_password(password)
                        user.full_clean()
                        if created:
                            user.save()
                        else:
                            # Existing email, permissions and profile are untouched.
                            user.save(update_fields=['password'])
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Fila {row_num}: cuenta guardada.'))
                except ValidationError as exc:
                    error_count += 1
                    self.stderr.write(self.style.ERROR(f'Fila {row_num}: ' + '; '.join(exc.messages)))
                except IntegrityError:
                    error_count += 1
                    self.stderr.write(self.style.ERROR(f'Fila {row_num}: la cuenta ya existe o contiene datos inválidos.'))
        finally:
            if workbook is not None:
                workbook.close()

        self.stdout.write(f'Usuarios creados: {created_count}; actualizados: {updated_count}; '
                          f'conservados: {skipped_count}; errores: {error_count}.')
        if error_count:
            raise CommandError('La importación terminó con filas rechazadas; revisa los errores indicados.')
