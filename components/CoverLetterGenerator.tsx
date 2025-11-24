
import React, { useState } from 'react';
import { AnalysisSession } from '../types';
import { getCoverLetter } from '../services/geminiService';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

// Declare global types for external libraries loaded via CDN
declare global {
  interface Window {
    jspdf: any;
    docx: any;
  }
}

interface CoverLetterGeneratorProps {
  session: AnalysisSession;
  onUpdateSession: (update: Partial<AnalysisSession>) => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ session, onUpdateSession }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    if (!session.resumeText || !session.jobDescription) return;

    onUpdateSession({ isLoadingCoverLetter: true, error: null });
    
    try {
      const result = await getCoverLetter(session.resumeText, session.jobDescription);
      onUpdateSession({ coverLetter: result, isLoadingCoverLetter: false });
    } catch (e) {
      console.error(e);
      onUpdateSession({ 
        error: 'An error occurred while generating the cover letter. Please try again.', 
        isLoadingCoverLetter: false 
      });
    }
  };

  const downloadPDF = () => {
    if (!session.coverLetter || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    
    // Create PDF with A4 settings (Portrait, Millimeters, A4)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Layout Configuration
    const marginLeft = 25.4; // 1 inch
    const marginTop = 25.4;  // 1 inch
    const marginBottom = 25.4;
    const pageWidth = 210;   // A4 Width
    const pageHeight = 297;  // A4 Height
    const maxLineWidth = pageWidth - (marginLeft * 2);
    const fontSize = 12;
    const lineHeight = 7; // Approx 1.2 spacing for 12pt font

    // Set Font
    doc.setFont("times", "normal");
    doc.setFontSize(fontSize);
    
    // Split the text into lines that fit within the maxLineWidth
    // jsPDF handles the word wrapping calculation here
    const textLines = doc.splitTextToSize(session.coverLetter, maxLineWidth);

    let cursorY = marginTop;

    // Iterate through each line to handle pagination
    for (let i = 0; i < textLines.length; i++) {
        // If the next line goes past the bottom margin, add a new page
        if (cursorY + lineHeight > pageHeight - marginBottom) {
            doc.addPage();
            cursorY = marginTop; // Reset cursor to top of new page
        }
        
        doc.text(textLines[i], marginLeft, cursorY);
        cursorY += lineHeight;
    }
    
    doc.save(`${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_Cover_Letter.pdf`);
  };

  const downloadDOCX = () => {
    if (!session.coverLetter || !window.docx) return;
    const { Document, Packer, Paragraph, TextRun } = window.docx;

    // Split input by newlines to create Paragraphs
    const paragraphs = session.coverLetter.split('\n').map(line => {
      // Preserve empty lines for spacing
      if (!line.trim()) {
          return new Paragraph({ children: [] });
      }

      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: "Times New Roman",
            size: 24, // 12pt (docx uses half-points)
          }),
        ],
        spacing: {
          after: 120, // Spacing after paragraph
          line: 276,  // ~1.15 line spacing
        },
      });
    });

    const doc = new Document({
      sections: [{
        properties: {
            page: {
                margin: {
                    top: 1440, // 1 inch (twips)
                    right: 1440,
                    bottom: 1440,
                    left: 1440,
                },
            },
        },
        children: paragraphs,
      }],
    });

    Packer.toBlob(doc).then((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_Cover_Letter.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const isButtonDisabled = session.isLoadingCoverLetter || !session.resumeText || !session.jobDescription;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="p-5">
        <div className="flex items-center gap-3">
            <div className="text-pink-500 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full">
                <DocumentCheckIcon className="w-6 h-6"/>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cover Letter Generator</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
            Draft a tailored cover letter connecting your experience to this specific role.
        </p>

        {!session.coverLetter && !session.isLoadingCoverLetter && (
            <button
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold text-white rounded-lg transition-all duration-300 ${
                  isButtonDisabled
                    ? 'bg-pink-300 dark:bg-pink-900/50 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 active:scale-95 dark:bg-pink-600 dark:hover:bg-pink-500'
                }`}
            >
                <SparklesIcon className="w-5 h-5"/>
                {session.isLoadingCoverLetter ? 'Writing...' : 'Generate Cover Letter'}
            </button>
        )}
      </div>

      {session.isLoadingCoverLetter && (
        <div className="flex flex-col items-center justify-center p-6 text-center border-t border-slate-200 dark:border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 dark:border-pink-400"></div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Writing your cover letter...</p>
        </div>
      )}

      {session.coverLetter && !session.isLoadingCoverLetter && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-5">
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Generated Letter (Editable)
                    </label>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {isEditing ? 'Done' : 'Edit'}
                    </button>
                </div>
                <textarea 
                    value={session.coverLetter}
                    onChange={(e) => onUpdateSession({ coverLetter: e.target.value })}
                    className="w-full h-96 p-4 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-serif leading-relaxed"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={downloadPDF}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                    Download PDF
                </button>
                <button
                    onClick={downloadDOCX}
                    className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                    Download DOCX
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
