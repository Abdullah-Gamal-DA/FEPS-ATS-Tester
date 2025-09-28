import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure the worker for pdf.js to run in the background
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;

/**
 * Reads a File object and returns its content as an ArrayBuffer.
 * @param file The file to read.
 * @returns A promise that resolves with the ArrayBuffer.
 */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file.
 * @returns A promise that resolves with the extracted text.
 */
export async function readPdfFile(file: File): Promise<string> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        // Extract the string content from the text items
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
}

/**
 * Extracts text content from a DOCX file.
 * @param file The DOCX file.
 * @returns A promise that resolves with the extracted text.
 */
export async function readDocxFile(file: File): Promise<string> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Reads a plain text file.
 * @param file The TXT file.
 * @returns A promise that resolves with the file's text content.
 */
export async function readTxtFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}
