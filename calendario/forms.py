from django import forms
from django.contrib.auth.models import User
from .models import Recurso, Reserva

class ReservaForm(forms.ModelForm):
    class Meta:
        model = Reserva
        fields = ['recurso', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'fecha_vuelta', 'responsable', 'destino']
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
            'fecha_inicio': forms.DateTimeInput(format='%Y-%m-%dT%H:%M', attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '20:00',
                'data-validation': 'datetime'
            }),
            'fecha_fin': forms.DateTimeInput(format='%Y-%m-%dT%H:%M', attrs={
                'class': 'form-control-modern',
                'type': 'datetime-local',
                'min': '07:00',
                'max': '20:00',
                'data-validation': 'datetime'
            }),
            'fecha_vuelta': forms.DateInput(format='%Y-%m-%d', attrs={
                'class': 'form-control-modern',
                'type': 'date',
                'data-validation': 'date'
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
        
        # Hacer todos los campos opcionales por defecto
        # La validación real se hará en clean() según el tipo de recurso
        self.fields['titulo'].required = False
        self.fields['responsable'].required = False
        self.fields['destino'].required = False
        self.fields['fecha_vuelta'].required = False
        
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
        
        # Si no hay recurso específico, configurar por defecto para salas
        if not recurso:
            self._configure_fields_for_resource_type(None)
    
    def _configure_fields_for_resource_type(self, recurso):
        """Configurar campos según el tipo de recurso - solo para UI, validación en clean()"""
        if recurso and recurso.es_vehiculo():
            # Para vehículos: configurar placeholders y widgets
            self.fields['titulo'].widget.attrs['placeholder'] = 'Título opcional'
            self.fields['fecha_fin'].label = 'Fecha y hora de regreso'
        else:
            # Para salas: configurar placeholders y widgets
            self.fields['titulo'].widget.attrs['placeholder'] = 'Título de la reserva'
            # Ocultar fecha_vuelta para salas
            self.fields['fecha_vuelta'].widget = forms.HiddenInput()
    
    def clean(self):
        from .utils import ReservaService
        from .exceptions import ConflictoReservaError, FechaInvalidaError, HorarioTrabajoError, RestriccionHorarioError

        cleaned_data = super().clean()
        recurso = cleaned_data.get('recurso')
        inicio = cleaned_data.get('fecha_inicio')
        fin = cleaned_data.get('fecha_fin')
        if recurso and recurso.es_vehiculo() and inicio and fin:
            vuelta = cleaned_data.get('fecha_vuelta')
            if vuelta:
                from datetime import datetime
                from django.utils import timezone
                fin = timezone.make_aware(datetime.combine(vuelta, timezone.localtime(fin).time()))
                cleaned_data['fecha_fin'] = fin
        if recurso and inicio and fin:
            try:
                ReservaService.validar_reserva_completa(recurso, inicio, fin, self.instance.pk)
            except (ConflictoReservaError, FechaInvalidaError, HorarioTrabajoError, RestriccionHorarioError) as exc:
                raise forms.ValidationError(str(exc)) from exc
        return cleaned_data
