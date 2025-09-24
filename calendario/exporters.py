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
    """Estrategia para exportación en formato PDF con columnas fijas"""
    
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """Generar exportación PDF del calendario con columnas fijas y texto adaptativo"""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
            from datetime import datetime as dt
            
            # Crear buffer para el PDF
            buffer = BytesIO()
            
            # Crear documento PDF con márgenes optimizados
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4, 
                rightMargin=40, 
                leftMargin=40, 
                topMargin=40, 
                bottomMargin=40
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
            
            # Estilo para texto en celdas con wrap automático
            cell_style = ParagraphStyle(
                'CellStyle',
                parent=styles['Normal'],
                fontSize=8,
                alignment=TA_LEFT,
                leftIndent=2,
                rightIndent=2,
                spaceAfter=2,
                spaceBefore=2
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
            <b>Generado el:</b> {dt.now().strftime('%d/%m/%Y %H:%M')}
            """
            info = Paragraph(info_text, styles['Normal'])
            story.append(info)
            story.append(Spacer(1, 20))
            
            # === DEFINIR COLUMNAS FIJAS ===
            # Determinar qué columnas incluir
            include_desc = options.get('include_descriptions', False)
            include_ubic = options.get('include_location', False)
            
            # Crear encabezados y anchos fijos
            headers = ['Hora', 'Sala', 'Título', 'Usuario']
            widths = [1.0, 0.8, 2.2, 0.8]  # Anchos fijos en pulgadas
            
            if include_desc:
                headers.append('Descripción')
                widths.append(2.0)
            if include_ubic:
                headers.append('Ubicación')
                widths.append(1.0)
            
            # Ajustar anchos si hay demasiadas columnas
            total_width = sum(widths)
            max_width = 7.0  # Ancho máximo disponible
            
            if total_width > max_width:
                # Escalar proporcionalmente
                scale_factor = max_width / total_width
                widths = [w * scale_factor for w in widths]
            
            # Asegurar anchos mínimos
            widths = [max(w, 0.5) for w in widths]
            
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
                
                # Crear tabla de reservas
                table_data = [headers]
                
                for reserva in reservas_fecha:
                    # Crear fila con Paragraphs para wrap automático
                    row = []
                    
                    # Hora
                    hora_text = f"{reserva.fecha_inicio.strftime('%H:%M')} - {reserva.fecha_fin.strftime('%H:%M')}"
                    row.append(Paragraph(hora_text, cell_style))
                    
                    # Sala
                    row.append(Paragraph(reserva.recurso.nombre, cell_style))
                    
                    # Título (con wrap automático)
                    row.append(Paragraph(reserva.titulo, cell_style))
                    
                    # Usuario
                    row.append(Paragraph(reserva.usuario.username, cell_style))
                    
                    # Descripción (si se incluye)
                    if include_desc:
                        descripcion = reserva.descripcion or 'Sin descripción'
                        row.append(Paragraph(descripcion, cell_style))
                    
                    # Ubicación (si se incluye)
                    if include_ubic:
                        ubicacion = f"Capacidad: {reserva.recurso.capacidad}"
                        row.append(Paragraph(ubicacion, cell_style))
                    
                    table_data.append(row)
                
                # Crear tabla sin anchos específicos para evitar problemas
                table = Table(table_data, repeatRows=1)
                
                # Estilo de tabla mejorado
                table_style = [
                    # Encabezados
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                    
                    # Datos
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                    ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                    ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                    
                    # Bordes
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                    ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2c3e50')),
                    
                    # Padding
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ]
                
                table.setStyle(TableStyle(table_style))
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
            response['Content-Disposition'] = f'attachment; filename="reporte_salas_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.pdf"'
            
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
    """Estrategia para exportación en formato Excel con análisis para RRHH"""
    
    def export(self, reservas: List[Reserva], fecha_inicio: datetime, fecha_fin: datetime, options: Dict[str, Any]) -> HttpResponse:
        """Generar exportación Excel del calendario con análisis visual"""
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, NamedStyle
            from openpyxl.utils import get_column_letter
            from openpyxl.chart import BarChart, Reference
            from openpyxl.formatting.rule import ColorScaleRule
            from collections import defaultdict, Counter
            import datetime as dt
            
            # Crear workbook
            wb = Workbook()
            
            # === HOJA 1: RESUMEN EJECUTIVO ===
            ws_summary = wb.active
            ws_summary.title = "Resumen Ejecutivo"
            
            # Estilos personalizados
            title_style = Font(name='Arial', size=16, bold=True, color='2F4F4F')
            subtitle_style = Font(name='Arial', size=12, bold=True, color='4682B4')
            header_style = Font(name='Arial', size=11, bold=True, color='FFFFFF')
            data_style = Font(name='Arial', size=10)
            
            # Colores
            header_fill = PatternFill(start_color='4682B4', end_color='4682B4', fill_type='solid')
            title_fill = PatternFill(start_color='E6F3FF', end_color='E6F3FF', fill_type='solid')
            border = Border(
                left=Side(style='thin', color='000000'),
                right=Side(style='thin', color='000000'),
                top=Side(style='thin', color='000000'),
                bottom=Side(style='thin', color='000000')
            )
            
            # Título principal
            ws_summary.merge_cells('A1:H1')
            ws_summary['A1'] = f"REPORTE DE UTILIZACIÓN DE SALAS - SAIPE"
            ws_summary['A1'].font = title_style
            ws_summary['A1'].fill = title_fill
            ws_summary['A1'].alignment = Alignment(horizontal='center', vertical='center')
            
            # Información del período
            ws_summary['A3'] = f"Período: {fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}"
            ws_summary['A3'].font = subtitle_style
            ws_summary['A4'] = f"Generado: {dt.datetime.now().strftime('%d/%m/%Y %H:%M')}"
            ws_summary['A4'].font = data_style
            
            # === ESTADÍSTICAS PRINCIPALES ===
            row = 6
            
            # Calcular estadísticas
            total_reservas = len(reservas)
            salas_utilizadas = len(set(r.recurso.nombre for r in reservas))
            usuarios_activos = len(set(r.usuario.username for r in reservas))
            horas_totales = sum((r.fecha_fin - r.fecha_inicio).total_seconds() / 3600 for r in reservas)
            
            # Estadísticas por sala
            uso_por_sala = Counter(r.recurso.nombre for r in reservas)
            sala_mas_usada = uso_por_sala.most_common(1)[0] if uso_por_sala else ("N/A", 0)
            
            # Estadísticas por usuario
            uso_por_usuario = Counter(r.usuario.username for r in reservas)
            usuario_mas_activo = uso_por_usuario.most_common(1)[0] if uso_por_usuario else ("N/A", 0)
            
            # Escribir estadísticas
            stats_data = [
                ['MÉTRICA', 'VALOR', 'DETALLE'],
                ['Total de Reservas', total_reservas, f'En {salas_utilizadas} salas diferentes'],
                ['Salas Utilizadas', salas_utilizadas, f'De un total disponible'],
                ['Usuarios Activos', usuarios_activos, f'Realizaron reservas'],
                ['Horas Totales', f'{horas_totales:.1f}h', f'De utilización'],
                ['Sala Más Usada', sala_mas_usada[0], f'{sala_mas_usada[1]} reservas'],
                ['Usuario Más Activo', usuario_mas_activo[0], f'{usuario_mas_activo[1]} reservas'],
            ]
            
            for i, (metric, value, detail) in enumerate(stats_data):
                ws_summary[f'A{row}'] = metric
                ws_summary[f'B{row}'] = value
                ws_summary[f'C{row}'] = detail
                
                # Aplicar estilos
                if i == 0:  # Header
                    for col in ['A', 'B', 'C']:
                        cell = ws_summary[f'{col}{row}']
                        cell.font = header_style
                        cell.fill = header_fill
                        cell.border = border
                        cell.alignment = Alignment(horizontal='center', vertical='center')
                else:
                    for col in ['A', 'B', 'C']:
                        cell = ws_summary[f'{col}{row}']
                        cell.font = data_style
                        cell.border = border
                        cell.alignment = Alignment(horizontal='left', vertical='center')
                
                row += 1
            
            # === HOJA 2: DETALLE DE RESERVAS ===
            ws_detail = wb.create_sheet("Detalle de Reservas")
            
            # Encabezados detallados
            headers = [
                'Fecha', 'Día Semana', 'Hora Inicio', 'Hora Fin', 'Duración (h)',
                'Sala', 'Capacidad', 'Título', 'Usuario', 'Email', 'Departamento'
            ]
            
            if options.get('include_descriptions', False):
                headers.append('Descripción')
            
            # Escribir encabezados
            for col, header in enumerate(headers, 1):
                cell = ws_detail.cell(row=1, column=col, value=header)
                cell.font = header_style
                cell.fill = header_fill
                cell.border = border
                cell.alignment = Alignment(horizontal='center', vertical='center')
            
            # Escribir datos detallados
            row = 2
            for reserva in reservas:
                duracion_horas = (reserva.fecha_fin - reserva.fecha_inicio).total_seconds() / 3600
                dia_semana = reserva.fecha_inicio.strftime('%A')
                
                data = [
                    reserva.fecha_inicio.date(),
                    dia_semana,
                    reserva.fecha_inicio.time(),
                    reserva.fecha_fin.time(),
                    round(duracion_horas, 2),
                    reserva.recurso.nombre,
                    reserva.recurso.capacidad,
                    reserva.titulo,
                    reserva.usuario.username,
                    reserva.usuario.email or 'N/A',
                    'N/A'  # Se puede expandir con departamento
                ]
                
                if options.get('include_descriptions', False):
                    data.append(reserva.descripcion or '')
                
                for col, value in enumerate(data, 1):
                    cell = ws_detail.cell(row=row, column=col, value=value)
                    cell.font = data_style
                    cell.border = border
                    cell.alignment = Alignment(horizontal='left', vertical='center')
                
                row += 1
            
            # === HOJA 3: ANÁLISIS POR SALA ===
            ws_analysis = wb.create_sheet("Análisis por Sala")
            
            # Encabezados de análisis
            ws_analysis['A1'] = "ANÁLISIS DE UTILIZACIÓN POR SALA"
            ws_analysis['A1'].font = title_style
            ws_analysis['A1'].fill = title_fill
            ws_analysis['A1'].alignment = Alignment(horizontal='center', vertical='center')
            ws_analysis.merge_cells('A1:E1')
            
            # Encabezados de tabla
            analysis_headers = ['Sala', 'Reservas', 'Horas Totales', 'Promedio por Reserva', 'Eficiencia']
            for col, header in enumerate(analysis_headers, 1):
                cell = ws_analysis.cell(row=3, column=col, value=header)
                cell.font = header_style
                cell.fill = header_fill
                cell.border = border
                cell.alignment = Alignment(horizontal='center', vertical='center')
            
            # Calcular análisis por sala
            sala_stats = defaultdict(lambda: {'reservas': 0, 'horas': 0})
            for reserva in reservas:
                sala = reserva.recurso.nombre
                duracion = (reserva.fecha_fin - reserva.fecha_inicio).total_seconds() / 3600
                sala_stats[sala]['reservas'] += 1
                sala_stats[sala]['horas'] += duracion
            
            # Escribir análisis
            row = 4
            for sala, stats in sala_stats.items():
                promedio = stats['horas'] / stats['reservas'] if stats['reservas'] > 0 else 0
                eficiencia = "Alta" if stats['horas'] > 20 else "Media" if stats['horas'] > 10 else "Baja"
                
                data = [sala, stats['reservas'], f"{stats['horas']:.1f}h", f"{promedio:.1f}h", eficiencia]
                
                for col, value in enumerate(data, 1):
                    cell = ws_analysis.cell(row=row, column=col, value=value)
                    cell.font = data_style
                    cell.border = border
                    cell.alignment = Alignment(horizontal='center', vertical='center')
                
                row += 1
            
            # === AJUSTAR ANCHOS DE COLUMNAS ===
            for ws in [ws_summary, ws_detail, ws_analysis]:
                for column in ws.columns:
                    max_length = 0
                    column_letter = get_column_letter(column[0].column)
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max(max_length + 2, 12), 50)
                    ws.column_dimensions[column_letter].width = adjusted_width
            
            # === APLICAR FORMATO CONDICIONAL ===
            # Colorear celdas de duración
            for row in range(2, ws_detail.max_row + 1):
                duracion_cell = ws_detail[f'E{row}']
                if duracion_cell.value:
                    if duracion_cell.value > 4:
                        duracion_cell.fill = PatternFill(start_color='FFE6E6', end_color='FFE6E6', fill_type='solid')
                    elif duracion_cell.value > 2:
                        duracion_cell.fill = PatternFill(start_color='FFF2E6', end_color='FFF2E6', fill_type='solid')
                    else:
                        duracion_cell.fill = PatternFill(start_color='E6FFE6', end_color='E6FFE6', fill_type='solid')
            
            # Crear buffer
            buffer = BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            excel_content = buffer.getvalue()
            buffer.close()
            
            # Crear respuesta
            response = HttpResponse(excel_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="reporte_salas_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.xlsx"'
            
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




class ExportFactory:
    """Factory para crear exportadores según el formato solicitado"""
    
    _exporters = {
        'pdf': PDFExportStrategy(),
        'xlsx': ExcelExportStrategy(),
        'excel': ExcelExportStrategy(),  # Alias para compatibilidad
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
