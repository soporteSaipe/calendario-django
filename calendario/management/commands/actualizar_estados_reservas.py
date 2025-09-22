"""
Comando para actualizar automáticamente los estados de las reservas
basado en la fecha y hora actual.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from calendario.models import Reserva
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Actualiza automáticamente los estados de las reservas'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Reservas que deben estar "En curso"
        reservas_en_curso = Reserva.objects.filter(
            estado='confirmada',
            fecha_inicio__lte=now,
            fecha_fin__gte=now
        )
        
        # Reservas que deben estar "Terminadas"
        reservas_terminadas = Reserva.objects.filter(
            estado__in=['confirmada', 'en_curso'],
            fecha_fin__lt=now
        )
        
        # Actualizar estados
        count_en_curso = reservas_en_curso.update(estado='en_curso')
        count_terminadas = reservas_terminadas.update(estado='terminada')
        
        total_actualizadas = count_en_curso + count_terminadas
        
        if total_actualizadas > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Estados actualizados: {count_en_curso} "En curso", {count_terminadas} "Terminadas"'
                )
            )
            logger.info(f'Estados de reservas actualizados: {total_actualizadas} reservas')
        else:
            self.stdout.write('No hay reservas que requieran actualización de estado')
            logger.debug('No hay reservas que requieran actualización de estado')