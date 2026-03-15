/**
 * exportarExcel.js — Utilidad MEI para generar archivos XLSX con estilo
 * Usa ExcelJS para poder aplicar fuentes, colores y bordes.
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ── Paleta de colores neutrales MEI ─────────────────────────────────────────
const COLOR = {
    headerBg:   '2D3748',   // gris-azul oscuro
    headerFg:   'FFFFFF',   // blanco
    subheaderBg:'4A5568',   // gris medio
    titleBg:    '1C1C1C',   // negro MEI
    titleFg:    'FFFFFF',
    rowAlt:     'F8F8F7',   // gris muy claro (filas alternas)
    rowBase:    'FFFFFF',
    borde:      'D1D5DB',   // gris borde
    texto:      '2D2D2D',
    textoClaro: '6B7280',
    verde:      '166534',
    rojo:       'B91C1C',
};

const FUENTE_BASE = { name: 'Arial', size: 11 };
const BORDER_THIN = {
    top:    { style: 'thin', color: { argb: COLOR.borde } },
    left:   { style: 'thin', color: { argb: COLOR.borde } },
    bottom: { style: 'thin', color: { argb: COLOR.borde } },
    right:  { style: 'thin', color: { argb: COLOR.borde } },
};

/**
 * Aplica estilos a una fila de cabecera principal (fondo oscuro, texto blanco, negrita).
 */
const estiloCabecera = (fila) => {
    fila.eachCell(celda => {
        celda.font = { ...FUENTE_BASE, bold: true, color: { argb: COLOR.headerFg } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
        celda.border = BORDER_THIN;
        celda.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
    });
    fila.height = 22;
};

/**
 * Aplica estilos a una fila de datos (alternando fondo claro/blanco).
 */
const estiloDatos = (fila, indice) => {
    const bg = indice % 2 === 0 ? COLOR.rowAlt : COLOR.rowBase;
    fila.eachCell({ includeEmpty: true }, celda => {
        celda.font = { ...FUENTE_BASE, color: { argb: COLOR.texto } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        celda.border = BORDER_THIN;
        celda.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    fila.height = 20;
};

/**
 * Crea una fila de encabezado de documento (título, fecha generación).
 */
const agregarEncabezadoDocumento = (hoja, titulo, subtitulo, numColumnas) => {
    // Fila 1 — Título
    const filaTitulo = hoja.addRow([titulo]);
    hoja.mergeCells(filaTitulo.number, 1, filaTitulo.number, numColumnas);
    filaTitulo.getCell(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: COLOR.titleFg } };
    filaTitulo.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.titleBg } };
    filaTitulo.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    filaTitulo.height = 26;

    // Fila 2 — Subtítulo / fecha generación
    if (subtitulo) {
        const filaSubtitulo = hoja.addRow([subtitulo]);
        hoja.mergeCells(filaSubtitulo.number, 1, filaSubtitulo.number, numColumnas);
        filaSubtitulo.getCell(1).font = { name: 'Arial', size: 9, italic: true, color: { argb: COLOR.textoClaro } };
        filaSubtitulo.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
        filaSubtitulo.height = 16;
    }

    // Fila vacía de separación
    hoja.addRow([]);
};

// ── Función principal de exportación ────────────────────────────────────────
/**
 * @param {object} opciones
 * @param {string}   opciones.nombreArchivo   - Nombre del archivo sin extensión
 * @param {string}   opciones.nombreHoja      - Nombre de la hoja en el libro
 * @param {string}   opciones.titulo          - Título del documento (fila 1)
 * @param {string}   [opciones.subtitulo]     - Subtítulo / fecha generación (fila 2)
 * @param {string[]} opciones.cabeceras       - Nombres de las columnas
 * @param {number[]} [opciones.anchos]        - Ancho de columnas en caracteres
 * @param {any[][]}  opciones.filas           - Filas de datos (cada fila es un array de valores)
 * @param {Function} [opciones.estiloCelda]   - Callback opcional (celda, valorFila, colIndex, rowIndex)
 */
export const exportarExcel = async ({
    nombreArchivo,
    nombreHoja = 'Datos',
    titulo,
    subtitulo,
    cabeceras,
    anchos,
    filas,
    estiloCelda,
}) => {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'MEI — Módulo de Inventarios';
    libro.created = new Date();

    const hoja = libro.addWorksheet(nombreHoja, {
        pageSetup: { orientation: 'landscape', fitToPage: true },
    });

    // Anchos de columnas
    hoja.columns = cabeceras.map((_, i) => ({ width: anchos?.[i] ?? 18 }));

    // Encabezado del documento
    agregarEncabezadoDocumento(hoja, titulo, subtitulo, cabeceras.length);

    // Fila de cabeceras de tabla
    const filaCabecera = hoja.addRow(cabeceras);
    estiloCabecera(filaCabecera);

    // Filas de datos
    filas.forEach((fila, idx) => {
        const filaExcel = hoja.addRow(fila);
        estiloDatos(filaExcel, idx);

        // Callback de estilo personalizado por celda (opcional)
        if (estiloCelda) {
            fila.forEach((valor, colIdx) => {
                estiloCelda(filaExcel.getCell(colIdx + 1), valor, colIdx, idx);
            });
        }
    });

    // Congelar primera fila de cabecera de tabla
    const filaCongelar = subtitulo ? 5 : 4;
    hoja.views = [{ state: 'frozen', ySplit: filaCongelar }];

    // Descargar
    const buffer = await libro.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombreArchivo}.xlsx`);
};
