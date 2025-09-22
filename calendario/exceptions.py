"""
Excepciones personalizadas para el sistema de calendario
"""
from django.core.exceptions import ValidationError


class ReservaValidationError(ValidationError):
    """
    Excepción personalizada para errores de validación de reservas
    """
    def __init__(self, message, code=None, params=None):
        super().__init__(message, code, params)
        self.error_code = code


class RecursoNotFoundError(Exception):
    """
    Excepción cuando un recurso no existe o no está activo
    """
    def __init__(self, recurso_id):
        self.recurso_id = recurso_id
        super().__init__(f"Recurso con ID {recurso_id} no encontrado o no está activo")


class ConflictoReservaError(Exception):
    """
    Excepción cuando hay conflicto con una reserva existente
    """
    def __init__(self, reserva_conflicto, message=None):
        self.reserva_conflicto = reserva_conflicto
        if not message:
            message = (
                f'Ya existe una reserva para este recurso en el horario seleccionado: '
                f'{reserva_conflicto.titulo} '
                f'({reserva_conflicto.fecha_inicio.strftime("%d/%m/%Y %H:%M")} - '
                f'{reserva_conflicto.fecha_fin.strftime("%d/%m/%Y %H:%M")})'
            )
        super().__init__(message)


class RestriccionHorarioError(Exception):
    """
    Excepción cuando se viola una restricción de horario
    """
    def __init__(self, restriccion, recurso):
        self.restriccion = restriccion
        self.recurso = recurso
        message = (
            f'No se puede reservar en el horario de {restriccion["inicio"]} a '
            f'{restriccion["fin"]} para {recurso.nombre}: {restriccion["motivo"]}'
        )
        super().__init__(message)


class FechaInvalidaError(Exception):
    """
    Excepción para fechas inválidas
    """
    def __init__(self, message):
        super().__init__(message)


class HorarioTrabajoError(Exception):
    """
    Excepción cuando se intenta reservar fuera del horario de trabajo
    """
    def __init__(self, message):
        super().__init__(message)
