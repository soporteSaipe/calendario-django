from django import forms
from django.contrib.auth.models import User
from .models import Recurso, Reserva

class ReservaForm(forms.ModelForm):
    class Meta:
        model = Reserva
        fields = ['recurso', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control-modern',
                'placeholder': 'Título de la reserva'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control-modern',
                'rows': 3,
                'placeholder': 'Descripción de la reserva'
            }),
            'fecha_inicio': forms.DateTimeInput(attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '16:00'
            }),
            'fecha_fin': forms.DateTimeInput(attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '16:00'
            }),
            'recurso': forms.Select(attrs={
                'class': 'form-control-modern'
            })
        }
        labels = {
            'titulo': 'Título',
            'descripcion': 'Descripción',
            'fecha_inicio': 'Fecha de inicio',
            'fecha_fin': 'Fecha de fin',
            'recurso': 'Recurso'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['recurso'].queryset = Recurso.objects.filter(activo=True)
    
    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        recurso = cleaned_data.get('recurso')
        
        # Validar fechas
        if fecha_inicio and fecha_fin:
            if fecha_fin <= fecha_inicio:
                raise forms.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio.")
            
            # Verificar conflictos de horarios solo si hay recurso
            if recurso:
                self._check_schedule_conflicts(fecha_inicio, fecha_fin, recurso)
        
        return cleaned_data
    
    def _check_schedule_conflicts(self, fecha_inicio, fecha_fin, recurso):
        """Verificar conflictos de horarios para un recurso"""
        reservas_existentes = Reserva.objects.filter(
            recurso=recurso,
            estado__in=['confirmada'] 
        ).exclude(pk=self.instance.pk if self.instance else None)
        
        for reserva in reservas_existentes:
            if (fecha_inicio < reserva.fecha_fin and fecha_fin > reserva.fecha_inicio):
                raise forms.ValidationError(
                    f"Ya existe una reserva para este recurso en el horario seleccionado: "
                    f"{reserva.titulo} ({reserva.fecha_inicio.strftime('%d/%m/%Y %H:%M')} - "
                    f"{reserva.fecha_fin.strftime('%d/%m/%Y %H:%M')})"
                )
