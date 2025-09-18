from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Recurso(models.Model):
    """Modelo para representar los recursos que se pueden reservar"""
    nombre = models.CharField(max_length=100, verbose_name="Nombre del recurso")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    capacidad = models.PositiveIntegerField(default=1, verbose_name="Capacidad")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    color = models.CharField(max_length=7, default="#007bff", verbose_name="Color")
    
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
                'inicio': '11:30',
                'fin': '14:30',
                'motivo': 'Horario de almuerzo'
            })
        
        return horarios_restringidos

class Reserva(models.Model):
    """Modelo para representar las reservas"""
    ESTADOS = [
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('completada', 'Completada'),
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
