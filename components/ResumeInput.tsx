
import React, { useRef, useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XCircleIcon } from './icons/XCircleIcon';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

interface ResumeInputProps {
  onResumeUpload: (text: string, fileName: string) => void;
  fileName: string | null;
  onRemove: () => void;
  isParsing: boolean;
  setIsParsing: (isParsing: boolean) => void;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({ onResumeUpload, fileName, onRemove, isParsing, setIsParsing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;

    setIsParsing(true);
    setParseError(null);
    try {
        let text = '';
        const fileNameLower = file.name.toLowerCase();

        if (file.type === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                if (textContent.items.length === 0) continue;

                // Enhanced text reconstruction logic for complex layouts (e.g., multi-column)
                const items = textContent.items;

                // 1. Group items into lines based on vertical position
                const lines: any[][] = [];
                const Y_TOLERANCE = 5; // Vertical distance tolerance for items to be on the same line
                
                // Sort all items by their Y coordinate (top-to-bottom), then X (left-to-right)
                items.sort((a: any, b: any) => {
                    if (Math.abs(a.transform[5] - b.transform[5]) > Y_TOLERANCE) {
                        return b.transform[5] - a.transform[5];
                    }
                    return a.transform[4] - b.transform[4];
                });

                let currentLine: any[] = [];
                if (items.length > 0) {
                    currentLine.push(items[0]);
                }

                for (let j = 1; j < items.length; j++) {
                    const currentItem = items[j];
                    const prevItem = items[j - 1];
                    
                    // If Y positions are similar, it's the same line.
                    if (Math.abs(currentItem.transform[5] - prevItem.transform[5]) < Y_TOLERANCE) {
                        currentLine.push(currentItem);
                    } else {
                        // A new line starts, save the completed old line
                        lines.push(currentLine);
                        currentLine = [currentItem];
                    }
                }
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }

                // 2. Combine lines into page text with appropriate spacing
                let pageText = '';
                for (let j = 0; j < lines.length; j++) {
                    const line = lines[j];
                    // Sort items within the line by their horizontal position
                    line.sort((a, b) => a.transform[4] - b.transform[4]);
                    pageText += line.map(item => item.str).join(' ') + '\n';
                }
                fullText += pageText.replace(/ +/g, ' ').trim() + '\n\n';
            }
            
            if (!fullText.trim()) {
                throw new Error("TextlessPDF");
            }
            text = fullText;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.convertToHtml({ arrayBuffer });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.value;

            // Use innerText to get a text representation that respects basic formatting like paragraphs and lists.
            const rawText = tempDiv.innerText || tempDiv.textContent || '';
            
            // The key issue is that innerText often uses single newlines (\n) to separate paragraphs.
            // For an LLM, this is a weak signal. A double newline (\n\n) is a much stronger indicator
            // of a distinct block of text. This regex collapses any sequence of one or more newlines
            // into a double newline, ensuring sections like the professional summary are broken up correctly.
            text = rawText.replace(/(\r\n|\n)+/g, '\n\n').trim();

        } else if (file.type === 'application/msword' || fileNameLower.endsWith('.doc')) {
            setParseError('The older .doc format is not supported. For best results, please save your file as a modern .docx or .pdf and try again.');
            setIsParsing(false);
            return;
        } else { // Assume .txt or other text-readable format
            text = await file.text();
        }
        onResumeUpload(text.trim(), file.name);
    } catch (error: any) {
        console.error('Error parsing file:', error);
        let errorMessage = 'Could not parse the file. Please ensure it is valid and not corrupted.';
        const fileNameLower = file.name.toLowerCase();

        if (error.message === 'TextlessPDF') {
            errorMessage = 'This PDF has no selectable text and might be a scanned image. Please use a text-based version for analysis.';
        } else if (fileNameLower.endsWith('.pdf')) {
            if (error.name === 'PasswordException') {
                errorMessage = 'This PDF is password-protected. Please upload an unprotected version.';
            } else if (error.name === 'InvalidPDFException' || error.name === 'MissingDataException') {
                errorMessage = 'The PDF appears to be corrupted or invalid. Please try re-saving it and uploading again.';
            } else {
                errorMessage = 'An error occurred while reading the PDF. It may be in an unsupported format.';
            }
        } else if (fileNameLower.endsWith('.docx')) {
            errorMessage = 'Could not read the .docx file. It may be corrupted or in an incompatible format. Try re-saving it from your word processor.';
        } else if (fileNameLower.endsWith('.txt')) {
            errorMessage = 'Failed to read this text file. Please ensure it is saved with a standard encoding like UTF-8.';
        }
        
        setParseError(errorMessage);
    } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsParsing(false);
    }
  }, [onResumeUpload, setIsParsing]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    processFile(event.dataTransfer.files?.[0]);
  }, [processFile]);

  const triggerFileSelect = () => {
    if (!isParsing) {
      setParseError(null);
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    setParseError(null);
    onRemove();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">1. Your Resume</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">Upload your resume as a .pdf, .docx, or .txt file.</p>
      {fileName ? (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
          <button onClick={handleRemoveFile} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
            <TrashIcon />
          </button>
        </div>
      ) : (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isParsing}
          />
          <label
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed rounded-lg transition-colors ${
              parseError 
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30' 
                : isParsing 
                ? 'cursor-wait bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600' 
                : 'cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-300 dark:border-slate-600'
            }`}
          >
            {parseError ? (
                <div className="text-red-700 dark:text-red-400" onClick={e => e.stopPropagation()}>
                    <XCircleIcon className="w-8 h-8 mx-auto" />
                    <p className="mt-1 text-sm font-semibold">File Error</p>
                    <p className="text-xs">{parseError}</p>
                     <button 
                        onClick={() => {
                            setParseError(null);
                            fileInputRef.current?.click();
                        }}
                        className="mt-2 px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-800"
                    >
                        Try Again
                    </button>
                </div>
            ) : isParsing ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Processing file...</p>
              </>
            ) : (
              <>
                <UploadIcon />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">PDF, DOCX, or TXT</p>
              </>
            )}
          </label>
        </>
      )}
    </div>
  );
};
