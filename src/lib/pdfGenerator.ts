import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Semester, Subject, GradeScheme } from '@/types';
import { calculateTotalSubjectScore, getGradeBoundary, convertLegacyToComponents } from './gradingEngine';

interface PDFReportData {
  semester: Semester;
  subjects: Subject[];
  scheme: GradeScheme;
}

export async function generatePDFReport({ semester, subjects, scheme }: PDFReportData) {
  let tableRows = '';
  let totalCredits = 0;
  let totalPoints = 0;

  subjects.forEach(subject => {
    const components = subject.components || convertLegacyToComponents(subject.cieMarks, subject.aatMarks, subject.labInternalMarks);
    
    // Using current scores or max possible if predicted? Let's assume current for now.
    // For a true "predictor", we might want to show both or max achievable. 
    // We will show current projected grade.
    const score = calculateTotalSubjectScore(components, false);
    const boundary = getGradeBoundary(scheme, score);
    
    totalCredits += subject.credits;
    totalPoints += (boundary.gradePoints * subject.credits);

    tableRows += `
      <tr>
        <td>${subject.code}</td>
        <td>${subject.name}</td>
        <td>${subject.credits}</td>
        <td>${score.toFixed(1)}</td>
        <td style="font-weight: bold; color: #4F46E5;">${boundary.gradeLetter}</td>
        <td>${boundary.gradePoints}</td>
      </tr>
    `;
  });

  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Academic Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1F2937;
          background-color: #F9FAFB;
          margin: 0;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 32px;
          color: #111827;
          margin: 0 0 10px 0;
        }
        .header p {
          color: #6B7280;
          font-size: 18px;
          margin: 0;
        }
        .summary-box {
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-bottom: 40px;
        }
        .summary-box h2 {
          color: #4338CA;
          margin: 0;
          font-size: 24px;
        }
        .summary-box .sgpa {
          font-size: 48px;
          font-weight: 700;
          color: #312E81;
          margin: 10px 0 0 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        th, td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #E5E7EB;
        }
        th {
          background-color: #F3F4F6;
          font-weight: 600;
          color: #374151;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          color: #9CA3AF;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CampusIQ Performance Report</h1>
        <p>${semester.name} • Scheme: ${scheme.name}</p>
      </div>

      <div class="summary-box">
        <h2>Predicted SGPA</h2>
        <div class="sgpa">${sgpa}</div>
        <p style="margin-top: 8px; color: #4F46E5;">Total Credits: ${totalCredits}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Subject</th>
            <th>Credits</th>
            <th>Score</th>
            <th>Grade</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        Generated securely by CampusIQ on ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  }
}
