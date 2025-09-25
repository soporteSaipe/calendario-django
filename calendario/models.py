from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.cache import cache

class Recurso(models.Model):
    """Modelo para representar los recursos que se pueden reservar"""
    nombre = models.CharField(max_length=100, verbose_name="Nombre del recurso")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    capacidad = models.PositiveIntegerField(default=1, verbose_name="Capacidad")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    color = models.CharField(max_length=7, default="#007bff", verbose_name="Color")
    
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
        return self.nombre
    
    def get_horarios_restringidos(self):
        """Obtener horarios restringidos específicos para este recurso"""
        horarios_restringidos = []
        
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
        """Obtener descripción completa de la sala"""
        if self.descripcion_detallada:
            return self.descripcion_detallada
        elif self.descripcion:
            return self.descripcion
        else:
            return 'Sala de reunión equipada con proyector, pizarra y sistema de videoconferencia. Ideal para reuniones de equipo y presentaciones.'

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
    titulo = models.CharField(max_length=200, verbose_name="Título")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    fecha_inicio = models.DateTimeField(verbose_name="Fecha de inicio")
    fecha_fin = models.DateTimeField(verbose_name="Fecha de fin")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='confirmada', verbose_name="Estado")
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
        return f"{self.titulo} - {self.recurso.nombre}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.fecha_fin <= self.fecha_inicio:
            raise ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Limpiar cache de recursos cuando se actualiza un recurso
        cache.delete('recursos_activos')
