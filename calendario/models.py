from django.db import models, transaction, router
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.cache import cache

class Recurso(models.Model):
    """Modelo para representar los recursos que se pueden reservar"""
    TIPOS = [
        ('sala', 'Sala de Reunión'),
        ('vehiculo', 'Vehículo'),
    ]
    
    nombre = models.CharField(max_length=100, verbose_name="Nombre del recurso")
    tipo = models.CharField(max_length=20, choices=TIPOS, default='sala', verbose_name="Tipo de recurso")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    capacidad = models.PositiveIntegerField(default=1, verbose_name="Capacidad")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    color = models.CharField(max_length=7, default="#007bff", verbose_name="Color")
    
    # Campos específicos para vehículos
    marca = models.CharField(max_length=50, blank=True, verbose_name="Marca")
    modelo = models.CharField(max_length=50, blank=True, verbose_name="Modelo")
    patente = models.CharField(max_length=10, blank=True, unique=True, null=True, verbose_name="Patente")
    
    # Campos adicionales para características detalladas
    descripcion_detallada = models.TextField(
        blank=True, 
        verbose_name="Descripción detallada",
        help_text="Descripción completa de la sala con características y equipamiento"
    )
    horario_uso = models.CharField(
        max_length=200, 
        blank=True, 
        verbose_name="Horario de uso",
        help_text="Ej: Lunes a Viernes de 7:00 AM a 4:00 PM"
    )
    tiene_proyector = models.BooleanField(default=False, verbose_name="Proyector HD")
    tiene_pizarra = models.BooleanField(default=False, verbose_name="Pizarra blanca")
    tiene_audio = models.BooleanField(default=False, verbose_name="Sistema de audio")
    tiene_videoconferencia = models.BooleanField(default=False, verbose_name="Videoconferencia")
    tiene_wifi = models.BooleanField(default=False, verbose_name="WiFi de alta velocidad")
    tiene_climatizacion = models.BooleanField(default=False, verbose_name="Climatización")
    
    class Meta:
        verbose_name = "Recurso"
        verbose_name_plural = "Recursos"
        ordering = ['nombre']
    
    def __str__(self):
        if self.tipo == 'vehiculo' and self.patente:
            return f"{self.nombre} - {self.patente}"
        return self.nombre

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        from .utils import CacheService
        transaction.on_commit(CacheService.invalidar_cache_recursos)

    def delete(self, *args, **kwargs):
        result = super().delete(*args, **kwargs)
        from .utils import CacheService
        transaction.on_commit(CacheService.invalidar_cache_recursos)
        return result
    
    def get_horarios_restringidos(self):
        """Obtener horarios restringidos específicos para este recurso"""
        horarios_restringidos = []
        
        # Los vehículos no tienen restricciones de horario (24/7)
        if self.es_vehiculo():
            return horarios_restringidos
        
        # Restricción especial para la sala Comedor
        if self.nombre.lower() == 'comedor':
            horarios_restringidos.append({
                'inicio': '12:00',
                'fin': '14:30',
                'motivo': 'Horario de almuerzo'
            })
        
        return horarios_restringidos
    
    def get_caracteristicas_activas(self):
        """Obtener lista de características activas de la sala"""
        caracteristicas = []
        
        if self.tiene_proyector:
            caracteristicas.append('Proyector HD')
        if self.tiene_pizarra:
            caracteristicas.append('Pizarra blanca')
        if self.tiene_audio:
            caracteristicas.append('Sistema de audio')
        if self.tiene_videoconferencia:
            caracteristicas.append('Videoconferencia')
        if self.tiene_wifi:
            caracteristicas.append('WiFi de alta velocidad')
        if self.tiene_climatizacion:
            caracteristicas.append('Climatización')
        
        return caracteristicas
    
    def get_descripcion_completa(self):
        """Obtener descripción completa del recurso"""
        if self.descripcion_detallada:
            return self.descripcion_detallada
        elif self.descripcion:
            return self.descripcion
        else:
            if self.tipo == 'vehiculo':
                return f'Vehículo {self.marca} {self.modelo} - {self.patente}. Capacidad para {self.capacidad} pasajeros.'
            else:
                return 'Sala de reunión equipada con proyector, pizarra y sistema de videoconferencia. Ideal para reuniones de equipo y presentaciones.'
    
    def es_vehiculo(self):
        """Verificar si el recurso es un vehículo"""
        return self.tipo == 'vehiculo'
    
    def es_sala(self):
        """Verificar si el recurso es una sala"""
        return self.tipo == 'sala'
    
    def get_horario_disponible(self):
        """Obtener el rango de horarios disponibles según el tipo de recurso"""
        if self.es_vehiculo():
            # Vehículos disponibles 24/7 (hasta 00:00 del día siguiente)
            return {
                'hora_inicio': '00:00',
                'hora_fin': '00:00',
                'descripcion': 'Disponible 24/7 (hasta 00:00 del día siguiente)'
            }
        else:
            # Salas con horario laboral
            if self.nombre.lower() == 'comedor':
                return {
                    'hora_inicio': '07:00',
                    'hora_fin': '19:00',
                    'descripcion': 'Horario laboral (excepto 12:00-14:30 para almuerzo)'
                }
            else:
                return {
                    'hora_inicio': '07:00',
                    'hora_fin': '19:00',
                    'descripcion': 'Horario laboral'
                }

class Reserva(models.Model):
    """Modelo para representar las reservas"""
    ESTADOS = [
        ('confirmada', 'Confirmada'),
        ('en_curso', 'En curso'),
        ('terminada', 'Terminada'),
        ('cancelada', 'Cancelada'),
    ]
    
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE, verbose_name="Recurso")
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Usuario")
    titulo = models.CharField(max_length=200, blank=True, verbose_name="Título")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    fecha_inicio = models.DateTimeField(verbose_name="Fecha de inicio")
    fecha_fin = models.DateTimeField(verbose_name="Fecha de fin")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='confirmada', verbose_name="Estado")
    
    # Campos específicos para vehículos
    responsable = models.CharField(max_length=200, blank=True, verbose_name="Responsable")
    destino = models.CharField(max_length=300, blank=True, verbose_name="Destino")
    fecha_vuelta = models.DateField(null=True, blank=True, verbose_name="Fecha de vuelta")
    
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de actualización")
    
    class Meta:
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
            models.Index(fields=['recurso', 'estado']),
            models.Index(fields=['usuario', 'fecha_inicio']),
        ]
    
    def __str__(self):
        if self.recurso.es_vehiculo():
            return f"{self.responsable} - {self.recurso.nombre} ({self.destino})"
        return f"{self.titulo} - {self.recurso.nombre}"
    
    def clean(self):
        from django.core.exceptions import ValidationError

        super().clean()
        if not self.fecha_inicio or not self.fecha_fin or not self.recurso_id:
            return  # ModelForm reports missing/invalid fields itself.
        try:
            self.recurso
        except (Recurso.DoesNotExist, ValueError, TypeError):
            raise ValidationError({'recurso': 'El recurso seleccionado no existe.'})
        if self.pk and self.estado == 'cancelada':
            # Allow cancelling legacy records without first repairing their old
            # dates/required fields. Changing reservation data still validates.
            fields = ('recurso_id', 'usuario_id', 'titulo', 'descripcion', 'fecha_inicio',
                      'fecha_fin', 'fecha_vuelta', 'responsable', 'destino')
            previous = type(self).objects.filter(pk=self.pk).values(*fields).first()
            if previous and all(previous[field] == getattr(self, field) for field in fields):
                return
        if self.fecha_fin <= self.fecha_inicio:
            raise ValidationError({'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'})
        if self.recurso.es_vehiculo():
            errors = {}
            if not self.responsable.strip():
                errors['responsable'] = 'El responsable es obligatorio para vehículos.'
            if not self.destino.strip():
                errors['destino'] = 'El destino es obligatorio para vehículos.'
            if self.fecha_vuelta and self.fecha_vuelta != timezone.localtime(self.fecha_fin).date():
                errors['fecha_vuelta'] = 'La fecha de vuelta debe coincidir con la fecha de fin.'
            if errors:
                raise ValidationError(errors)
            if not self.titulo.strip():
                self.titulo = f'{self.responsable.strip()} - {self.destino.strip()}'[:200]
        elif not self.titulo.strip():
            raise ValidationError({'titulo': 'El título es obligatorio para salas.'})

        if self.estado in ('confirmada', 'en_curso'):
            from .utils import ReservaService
            from .exceptions import ConflictoReservaError, HorarioTrabajoError, RestriccionHorarioError
            if not self.recurso.activo:
                raise ValidationError('El recurso no está activo.')
            inicio = timezone.localtime(self.fecha_inicio)
            fin = timezone.localtime(self.fecha_fin)
            try:
                if self.recurso.es_sala():
                    if inicio.date() != fin.date():
                        raise ValidationError('Las reservas de salas deben comenzar y terminar el mismo día.')
                    ReservaService.validar_horarios_trabajo(inicio, fin)
                ReservaService.validar_restricciones_recurso(self.recurso, inicio, fin)
                ReservaService.validar_conflictos_reserva(self.recurso, inicio, fin, self.pk)
            except (ConflictoReservaError, HorarioTrabajoError, RestriccionHorarioError) as exc:
                raise ValidationError(str(exc)) from exc

    def save(self, *args, **kwargs):
        # Lock the resource, including when it has no reservations yet. On
        # PostgreSQL this serializes availability checks across Vercel workers.
        using = kwargs.get('using') or router.db_for_write(type(self), instance=self)
        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            update_fields = set(update_fields)
            if not update_fields:
                return
            kwargs['update_fields'] = update_fields
            if self.pk and self.estado == 'cancelada' and update_fields <= {'estado', 'fecha_actualizacion'}:
                # A partial cancellation does not persist any scheduling fields;
                # validate only the field being written, not stale instance data.
                self._meta.get_field('estado').clean(self.estado, self)
                return super().save(*args, **kwargs)
        with transaction.atomic(using=using):
            validation_instance = self
            if self.pk and update_fields is not None:
                # Validate the values that will actually be persisted. A caller
                # may have changed other attributes without including them in
                # update_fields; those must not conceal an existing conflict.
                validation_instance = type(self).objects.using(using).get(pk=self.pk)
                for field_name in update_fields:
                    field = self._meta.get_field(field_name)
                    setattr(validation_instance, field.attname, getattr(self, field.attname))
            try:
                recurso = Recurso.objects.using(using).select_for_update().get(pk=validation_instance.recurso_id)
            except (Recurso.DoesNotExist, ValueError, TypeError):
                from django.core.exceptions import ValidationError
                raise ValidationError({'recurso': 'El recurso seleccionado no existe.'})
            validation_instance.recurso = recurso
            validation_instance.full_clean()
            if validation_instance is not self:
                for field_name in update_fields:
                    field = self._meta.get_field(field_name)
                    setattr(self, field.attname, getattr(validation_instance, field.attname))
            super().save(*args, **kwargs)
