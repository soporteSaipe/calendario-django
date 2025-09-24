"""
Sistema de Exportación de Calendarios
Implementa Factory y Strategy patterns para diferentes formatos de exportación
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from io import BytesIO
from typing import List, Dict, Any

from django.http import HttpResponse, JsonResponse
from django.core.exceptions import ValidationError

from .models import Reserva

logger = logging.getLogger('calendario')


class ExportStrategy(ABC):
    """Interfaz abstracta para estrategias de exportación"""
    
    @abstractmethod
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """
        Exporta las reservas en el formato específico
        
        Args:
            reservas: Lista de reservas a exportar
            fecha_inicio: Fecha de inicio del rango
            fecha_fin: Fecha de fin del rango
            options: Opciones de exportación
            
        Returns:
            HttpResponse con el archivo generado
        """
        pass
    
    @abstractmethod
    def get_content_type(self) -> str:
        """Retorna el content type del formato"""
        pass
    
    @abstractmethod
    def get_file_extension(self) -> str:
        """Retorna la extensión del archivo"""
        pass


class PDFExportStrategy(ExportStrategy):
    """Estrategia para exportación en formato PDF"""
    
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """Generar exportación PDF del calendario"""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            from reportlab.lib.utils import simpleSplit
            
            # Crear buffer para el PDF
            buffer = BytesIO()
            
            # Crear documento PDF con márgenes optimizados
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4, 
                rightMargin=50, 
                leftMargin=50, 
                topMargin=50, 
                bottomMargin=50
            )
            
            # Estilos mejorados
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#2c3e50')
            )
            
            header_style = ParagraphStyle(
                'CustomHeader',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=10,
                textColor=colors.HexColor('#34495e')
            )
            
            # Contenido del PDF
            story = []
            
            # Título
            title = Paragraph("Sistema de Reservas de Salas SAIPE", title_style)
            story.append(title)
            
            # Información del reporte
            info_text = f"""
            <b>Período:</b> {fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}<br/>
            <b>Total de reservas:</b> {len(reservas)}<br/>
            <b>Generado el:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}
            """
            info = Paragraph(info_text, styles['Normal'])
            story.append(info)
            story.append(Spacer(1, 20))
            
            # Agrupar reservas por fecha
            reservas_por_fecha = {}
            for reserva in reservas:
                fecha_str = reserva.fecha_inicio.date().strftime('%d/%m/%Y')
                if fecha_str not in reservas_por_fecha:
                    reservas_por_fecha[fecha_str] = []
                reservas_por_fecha[fecha_str].append(reserva)
            
            # Crear tabla para cada fecha
            for fecha_str, reservas_fecha in reservas_por_fecha.items():
                # Encabezado de fecha
                fecha_header = Paragraph(f"<b>{fecha_str}</b>", header_style)
                story.append(fecha_header)
                
                # Crear tabla de reservas con columnas dinámicas
                table_data = [['Hora', 'Sala', 'Título', 'Usuario']]
                
                if options.get('include_descriptions', False):
                    table_data[0].append('Descripción')
                if options.get('include_location', False):
                    table_data[0].append('Ubicación')
                
                for reserva in reservas_fecha:
                    row = [
                        f"{reserva.fecha_inicio.strftime('%H:%M')} - {reserva.fecha_fin.strftime('%H:%M')}",
                        reserva.recurso.nombre,
                        reserva.titulo[:30] + '...' if len(reserva.titulo) > 30 else reserva.titulo,
                        reserva.usuario.username
                    ]
                    
                    if options.get('include_descriptions', False):
                        descripcion = reserva.descripcion or 'Sin descripción'
                        # Truncar descripción para evitar superposición
                        descripcion = descripcion[:40] + '...' if len(descripcion) > 40 else descripcion
                        row.append(descripcion)
                    
                    if options.get('include_location', False):
                        ubicacion = f"Capacidad: {reserva.recurso.capacidad}"
                        row.append(ubicacion)
                    
                    table_data.append(row)
                
                # Calcular anchos de columna dinámicamente
                num_cols = len(table_data[0])
                if num_cols == 4:
                    col_widths = [1.2*inch, 1.0*inch, 2.0*inch, 1.0*inch]
                elif num_cols == 5:
                    col_widths = [1.0*inch, 0.8*inch, 1.5*inch, 0.8*inch, 1.2*inch]
                elif num_cols == 6:
                    col_widths = [0.8*inch, 0.7*inch, 1.2*inch, 0.7*inch, 1.0*inch, 0.8*inch]
                else:
                    col_widths = [1.0*inch] * num_cols
                
                # Crear tabla
                table = Table(table_data, colWidths=col_widths, repeatRows=1)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                
                story.append(table)
                story.append(Spacer(1, 15))
            
            # Construir PDF
            doc.build(story)
            
            # Obtener contenido del buffer
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            # Crear respuesta
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="calendario_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.pdf"'
            
            return response
            
        except ImportError as e:
            logger.error(f'ReportLab no está instalado: {str(e)}')
            return JsonResponse({'error': 'ReportLab no está instalado. Instala con: pip install reportlab'}, status=500)
        except Exception as e:
            logger.error(f'Error al generar PDF: {str(e)}', exc_info=True)
            return JsonResponse({'error': f'Error al generar PDF: {str(e)}'}, status=500)
    
    def get_content_type(self) -> str:
        return 'application/pdf'
    
    def get_file_extension(self) -> str:
        return 'pdf'


class ExcelExportStrategy(ExportStrategy):
    """Estrategia para exportación en formato Excel"""
    
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """Generar exportación Excel del calendario"""
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
            from openpyxl.utils import get_column_letter
            
            # Crear workbook
            wb = Workbook()
            ws = wb.active
            ws.title = "Reservas de Salas"
            
            # Estilos
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="3498db", end_color="3498db", fill_type="solid")
            border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            center_alignment = Alignment(horizontal='center', vertical='center')
            
            # Encabezados
            headers = ['Fecha', 'Hora Inicio', 'Hora Fin', 'Sala', 'Título', 'Usuario']
            col = 1
            
            if options.get('include_descriptions', False):
                headers.append('Descripción')
            if options.get('include_location', False):
                headers.append('Ubicación')
            if options.get('include_attendees', False):
                headers.append('Asistentes')
            
            # Escribir encabezados
            for header in headers:
                cell = ws.cell(row=1, column=col, value=header)
                cell.font = header_font
                cell.fill = header_fill
                cell.border = border
                cell.alignment = center_alignment
                col += 1
            
            # Escribir datos
            row = 2
            for reserva in reservas:
                col = 1
                
                # Datos básicos
                ws.cell(row=row, column=col, value=reserva.fecha_inicio.date()).border = border
                col += 1
                ws.cell(row=row, column=col, value=reserva.fecha_inicio.time()).border = border
                col += 1
                ws.cell(row=row, column=col, value=reserva.fecha_fin.time()).border = border
                col += 1
                ws.cell(row=row, column=col, value=reserva.recurso.nombre).border = border
                col += 1
                ws.cell(row=row, column=col, value=reserva.titulo).border = border
                col += 1
                ws.cell(row=row, column=col, value=reserva.usuario.username).border = border
                col += 1
                
                # Datos opcionales
                if options.get('include_descriptions', False):
                    ws.cell(row=row, column=col, value=reserva.descripcion or '').border = border
                    col += 1
                
                if options.get('include_location', False):
                    ubicacion = f"Sala {reserva.recurso.nombre} - Capacidad: {reserva.recurso.capacidad}"
                    ws.cell(row=row, column=col, value=ubicacion).border = border
                    col += 1
                
                if options.get('include_attendees', False):
                    # Por ahora vacío, se puede expandir en el futuro
                    ws.cell(row=row, column=col, value='').border = border
                    col += 1
                
                row += 1
            
            # Ajustar ancho de columnas
            for column in ws.columns:
                max_length = 0
                column_letter = get_column_letter(column[0].column)
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)  # Máximo 50 caracteres
                ws.column_dimensions[column_letter].width = adjusted_width
            
            # Crear buffer
            buffer = BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            excel_content = buffer.getvalue()
            buffer.close()
            
            # Crear respuesta
            response = HttpResponse(excel_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="calendario_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.xlsx"'
            
            return response
            
        except ImportError as e:
            logger.error(f'OpenPyXL no está instalado: {str(e)}')
            return JsonResponse({'error': 'OpenPyXL no está instalado. Instala con: pip install openpyxl'}, status=500)
        except Exception as e:
            logger.error(f'Error al generar Excel: {str(e)}', exc_info=True)
            return JsonResponse({'error': f'Error al generar Excel: {str(e)}'}, status=500)
    
    def get_content_type(self) -> str:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    
    def get_file_extension(self) -> str:
        return 'xlsx'


class ICalExportStrategy(ExportStrategy):
    """Estrategia para exportación en formato iCalendar"""
    
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """Generar exportación iCal del calendario"""
        try:
            from icalendar import Calendar, Event
            import pytz
            
            # Crear calendario iCal
            cal = Calendar()
            cal.add('prodid', '-//SAIPE//Sistema de Reservas//ES')
            cal.add('version', '2.0')
            cal.add('calscale', 'GREGORIAN')
            cal.add('method', 'PUBLISH')
            cal.add('X-WR-CALNAME', 'Reservas de Salas SAIPE')
            cal.add('X-WR-CALDESC', f'Reservas de salas del {fecha_inicio.strftime("%d/%m/%Y")} al {fecha_fin.strftime("%d/%m/%Y")}')
            cal.add('X-WR-TIMEZONE', 'America/Argentina/Buenos_Aires')
            
            # Zona horaria
            tz = pytz.timezone('America/Argentina/Buenos_Aires')
            
            # Crear evento para cada reserva
            for reserva in reservas:
                event = Event()
                
                # ID único del evento
                event.add('uid', f'reserva-{reserva.id}@saipe.com')
                
                # Fecha y hora de inicio
                dtstart = reserva.fecha_inicio
                if dtstart.tzinfo is None:
                    dtstart = tz.localize(dtstart)
                event.add('dtstart', dtstart)
                
                # Fecha y hora de fin
                dtend = reserva.fecha_fin
                if dtend.tzinfo is None:
                    dtend = tz.localize(dtend)
                event.add('dtend', dtend)
                
                # Título
                event.add('summary', reserva.titulo)
                
                # Descripción
                descripcion_parts = [f"Sala: {reserva.recurso.nombre}"]
                if options.get('include_descriptions', False) and reserva.descripcion:
                    descripcion_parts.append(f"Descripción: {reserva.descripcion}")
                if options.get('include_location', False):
                    descripcion_parts.append(f"Capacidad: {reserva.recurso.capacidad} personas")
                if options.get('include_attendees', False):
                    descripcion_parts.append(f"Reservado por: {reserva.usuario.get_full_name() or reserva.usuario.username}")
                
                event.add('description', '\n'.join(descripcion_parts))
                
                # Ubicación
                if options.get('include_location', False):
                    event.add('location', f"Sala {reserva.recurso.nombre}")
                
                # Organizador
                event.add('organizer', f"MAILTO:{reserva.usuario.email or 'noreply@saipe.com'}")
                
                # Estado
                event.add('status', 'CONFIRMED')
                
                # Creado y modificado
                event.add('created', reserva.fecha_creacion)
                event.add('last-modified', reserva.fecha_modificacion or reserva.fecha_creacion)
                
                # Agregar evento al calendario
                cal.add_component(event)
            
            # Generar contenido iCal
            ical_content = cal.to_ical().decode('utf-8')
            
            # Crear respuesta
            response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="calendario_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.ics"'
            
            return response
            
        except ImportError as e:
            logger.error(f'iCalendar no está instalado: {str(e)}')
            return JsonResponse({'error': 'icalendar no está instalado. Instala con: pip install icalendar'}, status=500)
        except Exception as e:
            logger.error(f'Error al generar iCal: {str(e)}', exc_info=True)
            return JsonResponse({'error': f'Error al generar iCal: {str(e)}'}, status=500)
    
    def get_content_type(self) -> str:
        return 'text/calendar; charset=utf-8'
    
    def get_file_extension(self) -> str:
        return 'ics'


class ExportFactory:
    """Factory para crear exportadores según el formato solicitado"""
    
    _exporters = {
        'pdf': PDFExportStrategy(),
        'xlsx': ExcelExportStrategy(),
        'excel': ExcelExportStrategy(),  # Alias para compatibilidad
        'ical': ICalExportStrategy(),
        'ics': ICalExportStrategy(),     # Alias para compatibilidad
    }
    
    @classmethod
    def create_exporter(cls, format_type: str) -> ExportStrategy:
        """
        Crea un exportador para el formato especificado
        
        Args:
            format_type: Tipo de formato ('pdf', 'xlsx', 'ical', etc.)
            
        Returns:
            Instancia de ExportStrategy
            
        Raises:
            ValueError: Si el formato no es soportado
        """
        format_type = format_type.lower()
        exporter = cls._exporters.get(format_type)
        
        if not exporter:
            supported_formats = ', '.join(cls._exporters.keys())
            raise ValueError(f'Formato no soportado: {format_type}. Formatos disponibles: {supported_formats}')
        
        return exporter
    
    @classmethod
    def get_supported_formats(cls) -> List[str]:
        """Retorna la lista de formatos soportados"""
        return list(cls._exporters.keys())
    
    @classmethod
    def is_format_supported(cls, format_type: str) -> bool:
        """Verifica si un formato es soportado"""
        return format_type.lower() in cls._exporters
