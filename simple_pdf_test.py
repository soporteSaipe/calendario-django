#!/usr/bin/env python
"""
Prueba simple de ReportLab
"""

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    from datetime import datetime as dt
    
    print("✅ ReportLab importado correctamente")
    
    # Crear buffer
    buffer = BytesIO()
    
    # Crear documento
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Contenido
    story = []
    story.append(Paragraph("Prueba de PDF", styles['Title']))
    story.append(Paragraph(f"Generado: {dt.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    
    # Construir PDF
    doc.build(story)
    
    # Obtener contenido
    buffer.seek(0)
    pdf_content = buffer.getvalue()
    buffer.close()
    
    print(f"✅ PDF generado exitosamente: {len(pdf_content)} bytes")
    print("✅ ReportLab funciona correctamente")
    
except ImportError as e:
    print(f"❌ Error de importación: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
