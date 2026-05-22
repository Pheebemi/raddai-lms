/**
 * Shared canvas drawing utility for student result PNGs.
 * Used by both the student results page and the management batch download.
 */

export interface ResultRow {
  sn: number;
  subjectName: string;
  ca1: number;
  ca2: number;
  ca3: number;
  ca4: number;
  exam: number;
  total: number;
  grade: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface ResultCanvasOptions {
  studentName: string;
  studentId: string;
  className: string;
  term: string;
  academicYear: string;
  position: string;
  rows: ResultRow[];
  attendance?: AttendanceSummary;
}

export async function drawResultCanvas(opts: ResultCanvasOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const width = 2480;
  const height = 3508;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  const marginLeft = 160;
  const marginRight = 160;
  const contentWidth = width - marginLeft - marginRight;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  let y = 100;

  // Logo
  const logoSize = 260;
  await new Promise<void>(resolve => {
    const img = new window.Image();
    img.onload = () => { ctx.drawImage(img, width / 2 - logoSize / 2, y, logoSize, logoSize); resolve(); };
    img.onerror = () => {
      ctx.font = 'bold 40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LA', width / 2, y + logoSize / 2);
      resolve();
    };
    img.src = '/logo.png';
  });
  y += logoSize + 80;

  // School name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 72px serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('LAAZEERE ACADEMY', width / 2, y);
  y += 60;
  ctx.font = '40px serif';
  ctx.fillText('Samunaka Sabon Gari, Jalingo, Taraba State', width / 2, y);
  y += 44;
  ctx.font = '36px serif';
  ctx.fillText('Tel: 08066115707 | 09060405589', width / 2, y);
  y += 50;
  ctx.font = 'italic 38px serif';
  ctx.fillText(`(${opts.className})`, width / 2, y);
  y += 70;

  ctx.font = 'bold 52px serif';
  ctx.fillText('STUDENT ACADEMIC RESULT', width / 2, y);
  y += 80;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
  y += 50;

  ctx.font = '36px serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SESSION: ${opts.academicYear}`, marginLeft, y);
  ctx.textAlign = 'right';
  ctx.fillText(`TERM: ${opts.term.toUpperCase()}`, width - marginRight, y);
  y += 50;

  ctx.textAlign = 'left';
  ctx.fillText(`NAME: ${opts.studentName.toUpperCase()}`, marginLeft, y);
  ctx.textAlign = 'right';
  ctx.fillText(`ID. NO: ${opts.studentId}`, width - marginRight, y);
  y += 10;

  ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
  y += 20;

  ctx.textAlign = 'left';
  ctx.font = '34px serif';
  ctx.fillText(`POSITION IN CLASS: ${opts.position}`, marginLeft, y + 30);
  y += 60;

  // Table
  const colWidths = [80, 560, 120, 120, 120, 220, 240, 160];
  const headers = ['SN', 'SUBJECT', 'CA1', 'CA2', 'CA3', 'EXAM', 'TOTAL', 'GRADE'];
  const rowHeight = 60;
  const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
  const scaledColWidths = colWidths.map(w => (w / totalColWidth) * contentWidth);

  const drawTableRow = (rowY: number, data: string[], isHeader: boolean) => {
    let cellX = marginLeft;
    for (let i = 0; i < data.length; i++) {
      const cellW = scaledColWidths[i];
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(cellX, rowY, cellW, rowHeight);
      ctx.fillStyle = '#000000';
      ctx.font = isHeader ? 'bold 28px serif' : '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data[i], cellX + cellW / 2, rowY + rowHeight / 2);
      cellX += cellW;
    }
  };

  drawTableRow(y, headers, true);
  y += rowHeight;

  opts.rows.forEach((row, i) => {
    drawTableRow(y, [
      (i + 1).toString(),
      row.subjectName.toUpperCase(),
      row.ca1.toString(),
      row.ca2.toString(),
      row.ca3.toString(),
      row.exam.toString(),
      row.total.toString(),
      row.grade,
    ], false);
    y += rowHeight;
  });

  y += 10;
  const totalMarks = opts.rows.reduce((s, r) => s + r.total, 0);
  const avg = opts.rows.length > 0 ? (totalMarks / opts.rows.length).toFixed(1) : '0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '34px serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(`Total Marks Obtained: ${totalMarks}  |  Average Score: ${avg}%`, marginLeft, y + 30);
  y += 80;

  y += 20;

  // Remarks
  const remarks = opts.rows.filter(r => r.remarks).map(r => `${r.subjectName}: ${r.remarks}`).join(', ');
  if (remarks) {
    ctx.font = 'bold 30px serif';
    ctx.fillText('REMARKS:', marginLeft, y);
    y += 40;
    ctx.font = '28px serif';
    const words = remarks.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > contentWidth) {
        ctx.fillText(line, marginLeft, y);
        y += 36;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) { ctx.fillText(line, marginLeft, y); y += 50; }
  }

  // Attendance section
  y += 30;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
  y += 40;

  ctx.font = 'bold 34px serif';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('ATTENDANCE RECORD', marginLeft, y);
  y += 50;

  const att = opts.attendance;
  const attData = [
    { label: 'Total School Days', value: att ? att.totalDays.toString() : '' },
    { label: 'Days Present',      value: att ? att.present.toString() : '' },
    { label: 'Days Absent',       value: att ? att.absent.toString() : '' },
    { label: '% Attendance',      value: att ? `${att.percentage}%` : '' },
  ];
  const attColW = contentWidth / attData.length;
  attData.forEach(({ label, value }, i) => {
    const ax = marginLeft + i * attColW;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.strokeRect(ax, y, attColW, 90);
    ctx.font = 'bold 24px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000';
    ctx.fillText(label, ax + attColW / 2, y + 26);
    if (value) {
      ctx.font = 'bold 34px serif';
      ctx.fillText(value, ax + attColW / 2, y + 68);
    } else {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ax + 20, y + 68);
      ctx.lineTo(ax + attColW - 20, y + 68);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  y += 110;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
  y += 50;

  // Signature & Comment boxes
  const boxW = (contentWidth - 60) / 2;
  const boxH = 220;
  const sigTitles = ["CLASS TEACHER'S SIGNATURE & COMMENT", "HEAD TEACHER'S SIGNATURE & COMMENT"];

  sigTitles.forEach((title, i) => {
    const bx = marginLeft + i * (boxW + 60);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, y, boxW, boxH);

    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(title, bx + boxW / 2, y + 30);

    // Signature line near bottom
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(bx + 30, y + boxH - 50);
    ctx.lineTo(bx + boxW - 30, y + boxH - 50);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '22px serif';
    ctx.fillStyle = '#555';
    ctx.fillText('Signature', bx + boxW / 2, y + boxH - 20);
  });
  y += boxH + 40;

  // Footer
  y += 30;
  ctx.font = '22px serif';
  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, width / 2, y);
  y += 35;
  ctx.fillText('This is an official academic result document from Laazeere Academy, Jalingo', width / 2, y);

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
}
