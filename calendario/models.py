from django.db import models
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
                    'hora_fin': '16:00',
                    'descripcion': 'Horario laboral (excepto 12:00-14:30 para almuerzo)'
                }
            else:
                return {
                    'hora_inicio': '07:00',
                    'hora_fin': '16:00',
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
        import logging
        logger = logging.getLogger(__name__)
        
        # Para vehículos, usar fecha_vuelta para validación
        if self.recurso and self.recurso.es_vehiculo():
            if self.fecha_vuelta and str(self.fecha_vuelta).strip():
                # Si hay fecha_vuelta, debe ser posterior o igual a fecha_inicio
                # Convertir fecha_vuelta a date si es string
                if isinstance(self.fecha_vuelta, str):
                    from datetime import datetime
                    fecha_vuelta_str = self.fecha_vuelta.strip()
                    if fecha_vuelta_str:  # Verificar que no esté vacío después del strip
                        fecha_vuelta_date = datetime.strptime(fecha_vuelta_str, "%Y-%m-%d").date()
                    else:
                        return  # Si está vacío, no validar
                else:
                    fecha_vuelta_date = self.fecha_vuelta
                
                if fecha_vuelta_date < self.fecha_inicio.date():
                    raise ValidationError("La fecha de vuelta debe ser posterior o igual a la fecha de salida")
        else:
            # Para salas, validar que fecha fin sea posterior a fecha inicio
            if self.fecha_fin <= self.fecha_inicio:
                raise ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Limpiar cache de recursos cuando se actualiza un recurso
        cache.delete('recursos_activos')
