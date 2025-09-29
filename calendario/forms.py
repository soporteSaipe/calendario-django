from django import forms
from django.contrib.auth.models import User
from .models import Recurso, Reserva

class ReservaForm(forms.ModelForm):
    class Meta:
        model = Reserva
        fields = ['recurso', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'responsable', 'destino']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control-modern',
                'placeholder': 'Título de la reserva',
                'autocomplete': 'off',
                'data-autocomplete': 'titulo'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control-modern',
                'rows': 3,
                'placeholder': 'Descripción de la reserva',
                'autocomplete': 'off'
            }),
            'fecha_inicio': forms.DateTimeInput(attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '16:00',
                'data-validation': 'datetime'
            }),
            'fecha_fin': forms.DateTimeInput(attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '16:00',
                'data-validation': 'datetime'
            }),
            'recurso': forms.Select(attrs={
                'class': 'form-control-modern',
                'data-validation': 'required'
            }),
            'responsable': forms.TextInput(attrs={
                'class': 'form-control-modern',
                'placeholder': 'Nombre del responsable',
                'autocomplete': 'off'
            }),
            'destino': forms.TextInput(attrs={
                'class': 'form-control-modern',
                'placeholder': 'Destino del viaje',
                'autocomplete': 'off'
            })
        }
        labels = {
            'titulo': 'Título',
            'descripcion': 'Descripción',
            'fecha_inicio': 'Fecha de inicio',
            'fecha_fin': 'Fecha de fin',
            'recurso': 'Recurso',
            'responsable': 'Responsable',
            'destino': 'Destino'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['recurso'].queryset = Recurso.objects.filter(activo=True)
        
        # Configurar campos según el tipo de recurso
        if self.instance and self.instance.pk:
            recurso = self.instance.recurso
        else:
            # Para nuevas reservas, intentar obtener el recurso de los datos del formulario
            recurso = None
            if 'recurso' in self.data:
                try:
                    recurso_id = self.data.get('recurso')
                    if recurso_id:
                        recurso = Recurso.objects.get(id=recurso_id)
                except (Recurso.DoesNotExist, ValueError):
                    pass
        
        self._configure_fields_for_resource_type(recurso)
    
    def _configure_fields_for_resource_type(self, recurso):
        """Configurar campos según el tipo de recurso"""
        if recurso and recurso.es_vehiculo():
            # Para vehículos: hacer obligatorios responsable y destino
            self.fields['responsable'].required = True
            self.fields['destino'].required = True
            self.fields['titulo'].required = False
            self.fields['titulo'].widget.attrs['placeholder'] = 'Título opcional'
        else:
            # Para salas: hacer obligatorio título
            self.fields['titulo'].required = True
            self.fields['responsable'].required = False
            self.fields['destino'].required = False
            self.fields['titulo'].widget.attrs['placeholder'] = 'Título de la reserva'
    
    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        recurso = cleaned_data.get('recurso')
        responsable = cleaned_data.get('responsable')
        destino = cleaned_data.get('destino')
        titulo = cleaned_data.get('titulo')
        
        # Validar fechas
        if fecha_inicio and fecha_fin:
            if fecha_fin <= fecha_inicio:
                raise forms.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio.")
            
            # Verificar conflictos de horarios solo si hay recurso
            if recurso:
                self._check_schedule_conflicts(fecha_inicio, fecha_fin, recurso)
        
        # Validaciones específicas por tipo de recurso
        if recurso:
            if recurso.es_vehiculo():
                if not responsable:
                    raise forms.ValidationError("El campo 'Responsable' es obligatorio para vehículos.")
                if not destino:
                    raise forms.ValidationError("El campo 'Destino' es obligatorio para vehículos.")
            else:
                if not titulo:
                    raise forms.ValidationError("El campo 'Título' es obligatorio para salas.")
        
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
        
        # Validar restricciones específicas del comedor
        if recurso.es_sala() and recurso.nombre.lower() == 'comedor':
            self._validate_comedor_schedule(fecha_inicio, fecha_fin)
    
    def _validate_comedor_schedule(self, fecha_inicio, fecha_fin):
        """Validar horarios específicos del comedor"""
        from datetime import datetime, time
        
        # Convertir a objetos time para comparación
        hora_inicio = fecha_inicio.time()
        hora_fin = fecha_fin.time()
        
        # Horario de almuerzo restringido (12:00-14:30)
        hora_almuerzo_inicio = time(12, 0)  # 12:00
        hora_almuerzo_fin = time(14, 30)    # 14:30
        
        # Verificar si la reserva se extiende durante el horario de almuerzo
        if (hora_inicio < hora_almuerzo_fin and hora_fin > hora_almuerzo_inicio):
            raise forms.ValidationError(
                "No se pueden hacer reservas en el comedor durante el horario de almuerzo (12:00-14:30). "
                "Por favor, selecciona un horario fuera de este rango."
            )
