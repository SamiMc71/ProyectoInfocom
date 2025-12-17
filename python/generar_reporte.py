import sys
import json
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from datetime import datetime

def crear_tabla(data_lista, titulo):
    if not data_lista:
        return []
        
    elements = []
    styles = getSampleStyleSheet()
    
    # Título de la sección
    elements.append(Paragraph(titulo, styles['Heading3']))
    
    # Encabezados
    table_data = [['Fecha', 'N° Doc', 'Cliente', 'Detalle', 'Total']]
    
    total_seccion = 0
    
    # Estilo de párrafo para las celdas de detalle, permitiendo saltos de línea automáticos.
    detalle_style = ParagraphStyle(name='DetalleStyle', parent=styles['Normal'], fontSize=9, leading=10)
    
    for item in data_lista:
        fecha = item.get('fecha_venta', '')[:10]
        doc = item.get('numero_comprobante', 'S/N')
        cliente = item.get('cliente_nombre', 'Cliente General')[:20]
        
        # OBTENER DETALLE
        detalle_texto = "Sin detalle"
        monto = float(item.get('total', 0))
        
        if item.get('tipo_venta') == 'servicio':
            # --- LÓGICA DE SERVICIO ---
            equipo = item.get('equipo_nombre', 'Servicio Técnico')
            productos_usados = item.get('productos', [])
            
            # Formato: Servicio: [Tipo de Equipo] \n Prod: [Primer producto] (+X más)
            detalle_texto = f"Servicio: <b>{equipo}</b>" 
            
            if len(productos_usados) > 0:
                productos_str = productos_usados[0].get('nombre', 'Producto')
                if len(productos_usados) > 1:
                    productos_str += f" (+{len(productos_usados)-1} más)"
                detalle_texto += f"<br/>Prod: {productos_str}"
            else:
                detalle_texto += "<br/>Solo Mano de Obra"
            
        else:
            # --- LÓGICA DE VENTA DE PRODUCTO (EXISTENTE) ---
            productos = item.get('productos', [])
            if productos:
                detalle_texto = productos[0].get('nombre', 'Item')[:25]
                if len(productos) > 1:
                    detalle_texto += f" (+{len(productos)-1})"
            else:
                detalle_texto = "Sin detalle"
            
        # Convertir el texto a un objeto Paragraph para que respete el ancho de columna
        detalle_paragraph = Paragraph(detalle_texto, detalle_style)
        
        # FIN DE LA LÓGICA DE DETALLE
        
        total_seccion += monto
        
        # Se reemplaza la cadena de texto 'detalle' por el objeto Paragraph
        row = [fecha, doc, cliente, detalle_paragraph, f"S/ {monto:.2f}"]
        table_data.append(row)
        
    # Fila de subtotal
    table_data.append(['', '', '', 'SUBTOTAL:', f"S/ {total_seccion:.2f}"])

    # Estilos de tabla
    # AUMENTAMOS EL ANCHO DE LA COLUMNA DETALLE DE 5*cm a 6.5*cm
    # Y REDUCIMOS LIGERAMENTE LA COLUMNA DE CLIENTE Y TOTAL PARA COMPENSAR
    t = Table(table_data, colWidths=[2.5*cm, 3*cm, 4*cm, 6.5*cm, 2.5*cm])
    
    # Estilo base
    estilos_tabla = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (2, 1), (3, -1), 'LEFT'), # Alinear texto clientes/detalles (a la izquierda para mejor lectura)
        ('ALIGN', (-1, 1), (-1, -1), 'RIGHT'), # Alinear montos
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey), # Grid solo en datos
        ('LINEBELOW', (0, -2), (-1, -2), 1, colors.black), # Línea antes del subtotal
        ('FONTNAME', (-2, -1), (-1, -1), 'Helvetica-Bold'), # Negrita subtotal
        ('BACKGROUND', (-1, -1), (-1, -1), colors.lightgrey), # Fondo subtotal
    ]
    
    t.setStyle(TableStyle(estilos_tabla))
    elements.append(t)
    elements.append(Spacer(1, 15))
    
    return elements

def generar_pdf(json_file, output_file):
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error leyendo JSON: {e}")
        sys.exit(1)

    doc = SimpleDocTemplate(output_file, pagesize=A4,
                            rightMargin=30, leftMargin=30,
                            topMargin=30, bottomMargin=30)
    
    story = []
    styles = getSampleStyleSheet()
    
    # --- Encabezado ---
    logo_path = os.path.join(os.path.dirname(__file__), '../logoinfo.png')
    if os.path.exists(logo_path):
        im = Image(logo_path, width=1.5*cm, height=1.5*cm)
        im.hAlign = 'CENTER'
        story.append(im)
    
    styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=1, spaceAfter=10))
    story.append(Paragraph("INFOCOM TECNOLOGY", styles['CenterTitle']))
    story.append(Paragraph(f"Reporte Detallado - {data.get('periodo', 'General')}", styles['Heading2']))
    story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 10))
    
    # --- Resumen General ---
    total_general = data.get('total_ventas', 0) + data.get('total_servicios', 0)
    
    summary_data = [
        ["Ventas Productos", "Servicios Téc.", "TOTAL GENERAL"],
        [f"S/ {data.get('total_ventas', 0):.2f}", f"S/ {data.get('total_servicios', 0):.2f}", f"S/ {total_general:.2f}"]
    ]
    
    t_summary = Table(summary_data, colWidths=[6*cm, 6*cm, 6*cm])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 20))

    # --- Sección 1: Ventas ---
    ventas = data.get('lista_ventas', [])
    if ventas:
        story.extend(crear_tabla(ventas, "1. Ventas de Productos"))
    else:
        story.append(Paragraph("No hay ventas de productos en este periodo.", styles['Normal']))
        story.append(Spacer(1, 15))

    # --- Sección 2: Servicios ---
    servicios = data.get('lista_servicios', [])
    if servicios:
        story.extend(crear_tabla(servicios, "2. Servicios Técnicos"))
    else:
        story.append(Paragraph("No hay servicios técnicos en este periodo.", styles['Normal']))

    try:
        doc.build(story)
    except Exception as e:
        print(f"Error construyendo PDF: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    generar_pdf(sys.argv[1], sys.argv[2])