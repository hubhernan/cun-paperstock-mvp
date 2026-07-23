import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToPDF = (
  title: string,
  columns: { header: string; dataKey: string }[],
  data: any[],
  fileName: string
) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Fecha de generación
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  // Tabla
  (doc as any).autoTable({
    startY: 36,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => item[col.dataKey])),
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${fileName}.pdf`);
};

export const exportToExcel = (
  data: any[],
  sheetName: string,
  fileName: string
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
