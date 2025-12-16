'use strict';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useAuth } from '../context/AuthContext';
import fileService from '../api-services/fileService';
import suggestionService from '../api-services/suggestionService';
import './PdfViewerPage.css';

// Set up PDF.js worker - use worker from node_modules via Vite
// This ensures proper MIME types and module resolution
if (typeof window !== 'undefined') {
    // Ensure worker is properly initialized only once
    if (!pdfjs.GlobalWorkerOptions.workerSrc || pdfjs.GlobalWorkerOptions.workerSrc === '') {
        // Use worker from node_modules - Vite will handle it correctly with proper MIME types
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.mjs',
            import.meta.url
        ).toString();
    }
}

/**
 * PdfViewerPage component for viewing PDFs and managing suggestions
 * @returns {JSX.Element} PdfViewerPage component
 */
function PdfViewerPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedFile, setSelectedFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionForm, setSuggestionForm] = useState({
        line: '',
        comment: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [pageWidth, setPageWidth] = useState(null);
    const pdfWrapperRef = useRef(null);
    const [textLines, setTextLines] = useState([]); // Array of { y: number, lineNumber: number, element: HTMLElement }
    const [extractingRows, setExtractingRows] = useState(false); // Track if we're currently extracting row numbers
    const pageRef = useRef(null);
    const textLayerRef = useRef(null);

    /**
     * Filters suggestions to show only those for the current page (or all for admins)
     * @returns {Array} Filtered suggestions for current page or all if admin
     */
    const getCurrentPageSuggestions = () => {
        if (!suggestions || suggestions.length === 0) {
            return [];
        }
        // Admins see all suggestions, regular users see only current page
        if (user && user.role === 'admin') {
            return suggestions;
        }
        return suggestions.filter((suggestion) => suggestion.pageNumber === pageNumber);
    };

    /**
     * Loads file from URL parameter or redirects to document selection
     */
    useEffect(() => {
        const fileParam = searchParams.get('file');
        if (fileParam) {
            handleFileSelectFromParam(fileParam);
        } else {
            // No file specified, redirect to document selection
            navigate('/documents');
        }
    }, [searchParams]);

    /**
     * Loads suggestions when file changes
     */
    useEffect(() => {
        if (selectedFile) {
            loadSuggestions(selectedFile);
        }
    }, [selectedFile]);

    /**
     * Handles responsive page width and orientation changes
     */
    useEffect(() => {
        const updatePageWidth = () => {
            if (pdfWrapperRef.current) {
                const containerWidth = pdfWrapperRef.current.offsetWidth;
                // Calculate 90% of container width (minimum)
                const minWidth = containerWidth * 0.9;
                
                // On mobile, use container width minus padding
                if (window.innerWidth <= 767) {
                    setPageWidth(containerWidth - 20);
                } else {
                    // On desktop, use at least 90% of container width
                    setPageWidth(minWidth);
                }
            }
        };

        // Initial update
        updatePageWidth();

        // Handle resize events
        const handleResize = () => {
            // Small delay to ensure layout has updated
            setTimeout(updatePageWidth, 100);
        };

        // Handle orientation changes
        const handleOrientationChange = () => {
            // Delay to ensure layout recalculation after orientation change
            setTimeout(() => {
                updatePageWidth();
                // Force a re-render by updating a state
                setPageNumber((prev) => prev);
            }, 200);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [pdfUrl]);

    /**
     * Handles file selection from URL parameter
     * @param {string} filename - Name of the file to load
     */
    const handleFileSelectFromParam = async (filename) => {
        if (!filename) {
            navigate('/documents');
            return;
        }

        setSelectedFile(filename);
        setPageNumber(1);
        setLoading(true);
        setError('');
        setPdfUrl(null); // Clear previous PDF URL to show loading state

        try {
            // Fetch PDF as data URL using secure method (token in header, not URL)
            const result = await fileService.getFileBlob(filename);
            if (result.success) {
                // Use data URL instead of blob URL to avoid CSP issues
                setPdfUrl(result.data.dataUrl);
            } else {
                setError(result.error || 'Failed to load PDF');
            }
        } catch (error) {
            setError(error.message || 'Failed to load PDF');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Loads suggestions for the current file
     * @param {string} fileName - Name of the PDF file
     */
    const loadSuggestions = async (fileName) => {
        const result = await suggestionService.getSuggestions(fileName);
        if (result.success) {
            setSuggestions(result.data);
        }
    };

    /**
     * Handles PDF load success
     * @param {Object} data - PDF document data
     */
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setTextLines([]); // Reset text lines when document loads
    };

    /**
     * Extracts row numbers based on <br role="presentation"> tags in the rendered text layer
     * This function is called after the text layer has been rendered
     */
    const extractRowsFromTextLayer = useCallback(() => {
        try {
            setExtractingRows(true);
            
            // Find the page element directly from DOM (react-pdf doesn't support refs well)
            // Look for the page element that corresponds to the current page number
            const allPages = document.querySelectorAll('.react-pdf__Page');
            let pageElement = null;
            
            // Find the page that's currently visible/rendered
            // Usually it's the one that's not hidden
            for (const page of allPages) {
                const style = window.getComputedStyle(page);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    pageElement = page;
                    break;
                }
            }
            
            // If not found by visibility, use the first one or the one in pdf-wrapper
            if (!pageElement && pdfWrapperRef.current) {
                pageElement = pdfWrapperRef.current.querySelector('.react-pdf__Page');
            }
            
            if (!pageElement) {
                pageElement = document.querySelector('.react-pdf__Page');
            }
            
            if (!pageElement) {
                console.log('extractRowsFromTextLayer: Page element not found in DOM');
                setTextLines([]);
                return;
            }
            
            console.log('Page element found:', pageElement.className);

            // Find the text layer element - try multiple approaches
            let textLayer = pageElement.querySelector('.textLayer');
            if (!textLayer) {
                textLayer = pageElement.querySelector('[class*="textLayer"]');
            }
            if (!textLayer) {
                // Try to find it by looking for elements with br tags
                const allDivs = pageElement.querySelectorAll('div');
                for (const div of allDivs) {
                    if (div.querySelector('br[role="presentation"]') || div.querySelector('.endOfContent')) {
                        textLayer = div;
                        break;
                    }
                }
            }
            
            if (!textLayer) {
                console.log('extractRowsFromTextLayer: Text layer not found');
                console.log('Page element:', pageElement.className);
                console.log('Available elements in pageElement:', pageElement.innerHTML.substring(0, 500));
                setTextLines([]);
                return;
            }

            console.log('Text layer found:', textLayer.className, 'Tag:', textLayer.tagName);

            // Get the page canvas to calculate relative positions
            let pageCanvas = pageElement.querySelector('canvas');
            if (!pageCanvas) {
                pageCanvas = pageElement.querySelector('.react-pdf__Page__canvas');
            }
            if (!pageCanvas) {
                console.log('extractRowsFromTextLayer: Canvas not found');
                setTextLines([]);
                return;
            }

            const pageHeight = pageCanvas.offsetHeight;
            const pageRect = pageCanvas.getBoundingClientRect();
            const lines = [];

            // Get all elements: divs, spans, br tags, and endOfContent markers
            // Rows are delimited by <br role="presentation"> and <div class="endOfContent"></div>
            const allElements = Array.from(textLayer.querySelectorAll('div, span, br[role="presentation"]'));
            
            console.log('Total elements found:', allElements.length);
            
            if (allElements.length === 0) {
                console.log('No elements found in text layer');
                console.log('Text layer children:', textLayer.children.length);
                console.log('Text layer HTML (first 1000 chars):', textLayer.innerHTML.substring(0, 1000));
                return;
            }
            
            // Debug: log what we found
            const brCount = allElements.filter(el => el.tagName === 'BR' && el.getAttribute('role') === 'presentation').length;
            const endOfContentCount = allElements.filter(el => el.tagName === 'DIV' && el.classList.contains('endOfContent')).length;
            const divCount = allElements.filter(el => el.tagName === 'DIV' && !el.classList.contains('endOfContent')).length;
            const spanCount = allElements.filter(el => el.tagName === 'SPAN').length;
            console.log('Found elements - BRs:', brCount, 'endOfContent:', endOfContentCount, 'divs:', divCount, 'spans:', spanCount);

            // Process elements to identify rows
            // A row is delimited by <br role="presentation"> and <div class="endOfContent"></div>
            // Each BR tag marks the end of a row
            // We need to find the content element (span/div) that belongs to each row
            
            // Get all BR tags and endOfContent in order
            const brTags = allElements.filter(el => el.tagName === 'BR' && el.getAttribute('role') === 'presentation');
            const endOfContentTag = allElements.find(el => el.tagName === 'DIV' && el.classList.contains('endOfContent'));
            
            // Get all content elements (spans, divs) - these contain the actual text
            const contentElements = allElements.filter(el => 
                (el.tagName === 'SPAN' || (el.tagName === 'DIV' && !el.classList.contains('endOfContent')))
            );
            
            console.log('BR tags found:', brTags.length);
            console.log('Content elements found:', contentElements.length);
            
            // Create rows by finding content elements before each BR
            // Each BR marks the end of a row, so we find the content element that's before it
            // Skip rows that contain only one span element
            brTags.forEach((br, index) => {
                let rowElement = null;
                let rowSpans = [];
                
                // Find all content elements (spans/divs) that belong to this row (before this BR)
                // Walk backwards through siblings to find all elements in this row
                let prevSibling = br.previousElementSibling;
                while (prevSibling) {
                    // If we hit another BR, stop (we've reached the previous row)
                    if (prevSibling.tagName === 'BR' && prevSibling.getAttribute('role') === 'presentation') {
                        break;
                    }
                    // Collect spans and divs in this row
                    if (prevSibling.tagName === 'SPAN') {
                        rowSpans.push(prevSibling);
                        if (!rowElement) {
                            rowElement = prevSibling;
                        }
                    } else if (prevSibling.tagName === 'DIV' && !prevSibling.classList.contains('endOfContent')) {
                        if (!rowElement) {
                            rowElement = prevSibling;
                        }
                    }
                    prevSibling = prevSibling.previousElementSibling;
                }
                
                // If no sibling found, try to find content elements before this BR in the DOM order
                if (rowSpans.length === 0 && !rowElement) {
                    // Get all content elements and find the ones before this BR
                    for (let i = contentElements.length - 1; i >= 0; i--) {
                        const contentEl = contentElements[i];
                        // Check if this content element comes before the BR in the DOM
                        if (contentEl.compareDocumentPosition(br) & Node.DOCUMENT_POSITION_PRECEDING) {
                            if (contentEl.tagName === 'SPAN') {
                                rowSpans.push(contentEl);
                            }
                            if (!rowElement) {
                                rowElement = contentEl;
                            }
                            // Stop after finding the first element (closest to BR)
                            break;
                        }
                    }
                }
                
                // Skip rows that contain only one span
                // A row should be skipped if it has exactly one span and no other content elements
                if (rowSpans.length === 1) {
                    // Check if there are any divs in this row (if yes, don't skip)
                    let hasDivs = false;
                    let prevSibling = br.previousElementSibling;
                    while (prevSibling) {
                        if (prevSibling.tagName === 'BR' && prevSibling.getAttribute('role') === 'presentation') {
                            break;
                        }
                        if (prevSibling.tagName === 'DIV' && !prevSibling.classList.contains('endOfContent')) {
                            hasDivs = true;
                            break;
                        }
                        prevSibling = prevSibling.previousElementSibling;
                    }
                    // If only one span and no divs, skip this row
                    if (!hasDivs) {
                        return; // Skip this row
                    }
                }
                
                // Fallback: use the BR itself if no content element found
                if (!rowElement) {
                    rowElement = br;
                }
                
                const rect = rowElement.getBoundingClientRect();
                const relativeY = (rect.top - pageRect.top) / pageHeight;

                lines.push({
                    relativeY: Math.max(0, Math.min(1, relativeY)),
                    lineNumber: index + 1,
                    element: rowElement,
                });
            });
            
            // Add one more row for content after the last BR (before endOfContent)
            // endOfContent is only a delimiter, not a row itself
            // Skip rows that contain only one span element
            if (brTags.length > 0) {
                const lastBR = brTags[brTags.length - 1];
                let lastRowElement = null;
                let lastRowSpans = [];
                
                // Find content after the last BR but before endOfContent
                // endOfContent marks the end, so we want the content elements just before it
                if (endOfContentTag) {
                    // Find all content elements that are before endOfContent (after last BR)
                    let prevSibling = endOfContentTag.previousElementSibling;
                    while (prevSibling) {
                        // Skip BRs and endOfContent itself
                        if (prevSibling.tagName === 'BR' && prevSibling.getAttribute('role') === 'presentation') {
                            break; // We've reached the last BR
                        }
                        if (prevSibling.tagName === 'SPAN') {
                            lastRowSpans.push(prevSibling);
                            if (!lastRowElement) {
                                lastRowElement = prevSibling;
                            }
                        } else if (prevSibling.tagName === 'DIV' && !prevSibling.classList.contains('endOfContent')) {
                            if (!lastRowElement) {
                                lastRowElement = prevSibling;
                            }
                        }
                        prevSibling = prevSibling.previousElementSibling;
                    }
                } else {
                    // No endOfContent, find content after the last BR
                    let nextSibling = lastBR.nextElementSibling;
                    while (nextSibling) {
                        if (nextSibling.tagName === 'SPAN') {
                            lastRowSpans.push(nextSibling);
                            if (!lastRowElement) {
                                lastRowElement = nextSibling;
                            }
                        } else if (nextSibling.tagName === 'DIV' && !nextSibling.classList.contains('endOfContent')) {
                            if (!lastRowElement) {
                                lastRowElement = nextSibling;
                            }
                        }
                        nextSibling = nextSibling.nextElementSibling;
                    }
                }
                
                // If no sibling found, find the last content element in DOM order (before endOfContent)
                if (lastRowSpans.length === 0 && !lastRowElement && contentElements.length > 0) {
                    // Find the last content element that comes before endOfContent
                    if (endOfContentTag) {
                        for (let i = contentElements.length - 1; i >= 0; i--) {
                            const contentEl = contentElements[i];
                            // Check if this content element comes before endOfContent
                            if (contentEl.compareDocumentPosition(endOfContentTag) & Node.DOCUMENT_POSITION_PRECEDING) {
                                if (contentEl.tagName === 'SPAN') {
                                    lastRowSpans.push(contentEl);
                                }
                                if (!lastRowElement) {
                                    lastRowElement = contentEl;
                                }
                                break;
                            }
                        }
                    } else {
                        // No endOfContent, use the last content element after the last BR
                        for (let i = 0; i < contentElements.length; i++) {
                            const contentEl = contentElements[i];
                            // Check if this content element comes after the last BR
                            if (contentEl.compareDocumentPosition(lastBR) & Node.DOCUMENT_POSITION_FOLLOWING) {
                                if (contentEl.tagName === 'SPAN') {
                                    lastRowSpans.push(contentEl);
                                }
                                if (!lastRowElement) {
                                    lastRowElement = contentEl;
                                }
                                break;
                            }
                        }
                    }
                }
                
                // Fallback: use the last content element (but not endOfContent)
                if (!lastRowElement && contentElements.length > 0) {
                    // Make sure we don't use endOfContent
                    const validElements = contentElements.filter(el => 
                        el.tagName !== 'DIV' || !el.classList.contains('endOfContent')
                    );
                    if (validElements.length > 0) {
                        lastRowElement = validElements[validElements.length - 1];
                        if (lastRowElement.tagName === 'SPAN') {
                            lastRowSpans.push(lastRowElement);
                        }
                    }
                }
                
                // Skip rows that contain only one span
                // Check if there are any divs in the last row (if yes, don't skip)
                let lastRowHasDivs = false;
                if (endOfContentTag) {
                    let prevSibling = endOfContentTag.previousElementSibling;
                    while (prevSibling) {
                        if (prevSibling.tagName === 'BR' && prevSibling.getAttribute('role') === 'presentation') {
                            break;
                        }
                        if (prevSibling.tagName === 'DIV' && !prevSibling.classList.contains('endOfContent')) {
                            lastRowHasDivs = true;
                            break;
                        }
                        prevSibling = prevSibling.previousElementSibling;
                    }
                }
                
                // If only one span and no divs, skip this row
                if (lastRowSpans.length === 1 && !lastRowHasDivs) {
                    // Skip this row
                } else if (lastRowElement && lastRowElement !== endOfContentTag && 
                    !(lastRowElement.classList && lastRowElement.classList.contains('endOfContent'))) {
                    // Only add the row if we found a valid content element (not endOfContent) and it's not a single span
                    const rect = lastRowElement.getBoundingClientRect();
                    const relativeY = (rect.top - pageRect.top) / pageHeight;
                    lines.push({
                        relativeY: Math.max(0, Math.min(1, relativeY)),
                        lineNumber: brTags.length + 1,
                        element: lastRowElement,
                    });
                }
            } else if (contentElements.length > 0) {
                // No BRs but we have content - create one row (but not if it's endOfContent or only one span)
                const validElements = contentElements.filter(el => 
                    el.tagName !== 'DIV' || !el.classList.contains('endOfContent')
                );
                if (validElements.length > 0) {
                    const spans = validElements.filter(el => el.tagName === 'SPAN');
                    // Skip if there's only one span
                    if (!(spans.length === 1 && validElements.length === 1)) {
                        const firstElement = validElements[0];
                        const rect = firstElement.getBoundingClientRect();
                        const relativeY = (rect.top - pageRect.top) / pageHeight;
                        lines.push({
                            relativeY: Math.max(0, Math.min(1, relativeY)),
                            lineNumber: 1,
                            element: firstElement,
                        });
                    }
                }
            }

            // Sort lines by relativeY to ensure correct order
            lines.sort((a, b) => a.relativeY - b.relativeY);
            // Renumber after sorting
            lines.forEach((line, index) => {
                line.lineNumber = index + 1;
            });

            console.log('Final extracted lines:', lines.length);
            if (lines.length > 0) {
                console.log('First line:', lines[0]);
                console.log('Last line:', lines[lines.length - 1]);
            } else {
                console.log('No lines extracted. Debugging info:');
                console.log('- Text layer found:', !!textLayer);
                console.log('- All elements count:', allElements.length);
                console.log('- BR count:', brCount);
                console.log('- endOfContent count:', endOfContentCount);
                console.log('- Div count:', divCount);
            }
            setTextLines(lines);
            setExtractingRows(false);
        } catch (error) {
            console.error('Error extracting rows from text layer:', error);
            setTextLines([]);
            setExtractingRows(false);
        }
    }, []);

    /**
     * Handles page load success and extracts text lines based on <br role="presentation"> tags
     * @param {Object} page - PDF page object
     */
    const onPageLoadSuccess = async (page) => {
        try {
            // Wait 5000ms after page load before extracting rows
            // This ensures the PDF is fully rendered in the DOM
            setTimeout(() => {
                extractRowsFromTextLayer();
            }, 5000);
        } catch (error) {
            console.error('Error in onPageLoadSuccess:', error);
            setTextLines([]);
        }
    };

    /**
     * Resets text lines when page changes and re-extracts after delay
     */
    useEffect(() => {
        setTextLines([]);
        setExtractingRows(true);
        // Re-extract rows after page change with 5000ms delay
        const timer = setTimeout(() => {
            extractRowsFromTextLayer();
        }, 5000);
        return () => clearTimeout(timer);
    }, [pageNumber, extractRowsFromTextLayer]);

    /**
     * Handles form submission for creating a suggestion
     * @param {React.FormEvent} e - Form submit event
     */
    const handleSubmitSuggestion = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        const line = parseInt(suggestionForm.line, 10);
        if (!line || line < 1) {
            setError('Please enter a valid line number');
            return;
        }

        if (!suggestionForm.comment.trim()) {
            setError('Please enter a comment');
            return;
        }

        setSubmitting(true);
        setError('');

        const result = await suggestionService.createSuggestion({
            fileName: selectedFile,
            page: pageNumber,
            line: line,
            comment: suggestionForm.comment.trim(),
        });

        if (result.success) {
            // Reset form
            setSuggestionForm({ line: '', comment: '' });
            // Reload suggestions
            await loadSuggestions(selectedFile);
        } else {
            setError(result.error || 'Failed to create suggestion');
        }

        setSubmitting(false);
    };

    /**
     * Handles input change in suggestion form
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Input change event
     */
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setSuggestionForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Navigates to previous page
     */
    const goToPreviousPage = () => {
        setPageNumber((prev) => {
            const newPage = Math.max(1, prev - 1);
            return newPage;
        });
    };

    /**
     * Navigates to next page
     */
    const goToNextPage = () => {
        setPageNumber((prev) => {
            const newPage = Math.min(numPages || 1, prev + 1);
            return newPage;
        });
    };

    /**
     * Memoized PDF.js options to prevent unnecessary reloads
     * Uses version matching the installed pdfjs-dist package
     */
    const pdfOptions = useMemo(
        () => ({
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        }),
        []
    );

    return (
        <div className="pdf-viewer-page">
            <div className="pdf-viewer-container">
                <div className="viewer-header">
                    <h1>PDF Viewer</h1>
                    {selectedFile && (
                        <div className="file-info">
                            <span className="file-name">{selectedFile}</span>
                            <button
                                onClick={() => navigate('/documents')}
                                className="back-button"
                            >
                                ← Back to Documents
                            </button>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Loading State */}
                {loading && !pdfUrl && (
                    <div className="pdf-loading-container">
                        <div className="pdf-loading-spinner"></div>
                        <p className="pdf-loading-text">Loading PDF...</p>
                    </div>
                )}

                {/* PDF Viewer */}
                {pdfUrl && (
                    <div className="pdf-viewer">
                        {/* Desktop Controls */}
                        <div className="pdf-controls pdf-controls-desktop">
                            <button
                                onClick={goToPreviousPage}
                                disabled={pageNumber <= 1}
                                className="nav-button"
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {pageNumber} of {numPages || '...'}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={pageNumber >= (numPages || 1)}
                                className="nav-button"
                            >
                                Next
                            </button>
                        </div>

                        {/* Mobile Controls with Arrows */}
                        <div className="pdf-controls-mobile">
                            <button
                                onClick={goToPreviousPage}
                                disabled={pageNumber <= 1}
                                className="nav-arrow nav-arrow-left"
                                aria-label="Previous page"
                            >
                                ←
                            </button>
                            <span className="page-info-mobile">
                                Page {pageNumber} of {numPages || '...'}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={pageNumber >= (numPages || 1)}
                                className="nav-arrow nav-arrow-right"
                                aria-label="Next page"
                            >
                                →
                            </button>
                        </div>

                        <div className="pdf-display">
                            <div className="pdf-wrapper" ref={pdfWrapperRef}>
                                {pdfUrl && (
                                    <>
                                        <Document
                                            file={pdfUrl}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            onLoadError={(error) => {
                                                console.error('PDF load error:', error);
                                                setError('Failed to load PDF. Please try again.');
                                            }}
                                            loading={
                                                <div className="loading">
                                                    <div className="loading-spinner"></div>
                                                    Loading PDF...
                                                </div>
                                            }
                                            error={
                                                <div className="error-message">
                                                    Failed to load PDF. Please try again.
                                                </div>
                                            }
                                            options={pdfOptions}
                                        >
                                            <Page
                                                pageNumber={pageNumber}
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                                className="pdf-page"
                                                width={pageWidth}
                                                onLoadSuccess={onPageLoadSuccess}
                                                onLoadError={(error) => {
                                                    console.error('Page load error:', error);
                                                    setError('Failed to load PDF page. Please try again.');
                                                }}
                                            />
                                        </Document>
                                        {/* Row Numbers Overlay - Always render */}
                                        <div className="row-numbers-overlay">
                                            {extractingRows ? (
                                                <div className="row-numbers-loading">
                                                    Extracting row numbers...
                                                </div>
                                            ) : textLines.length > 0 ? (
                                                textLines.map((line) => (
                                                    <div
                                                        key={`line-${line.lineNumber}`}
                                                        className="row-number"
                                                        style={{
                                                            top: `${line.relativeY * 100}%`,
                                                        }}
                                                    >
                                                        {line.lineNumber}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="row-numbers-empty">
                                                    No rows found
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {user && (
                                    <div className="pdf-watermark-container">
                                        {Array.from({ length: 4 }, (_, i) => {
                                            // Position along diagonal from top-left to bottom-right
                                            // 4 instances at 20%, 40%, 60%, 80% along the diagonal
                                            const position = 0.2 + i * 0.2; // 0.2, 0.4, 0.6, 0.8
                                            // Text should be parallel to diagonal from bottom-left to top-right (-45 degrees)
                                            return (
                                                <div
                                                    key={i}
                                                    className="pdf-watermark"
                                                    style={{
                                                        top: `${position * 100}%`,
                                                        left: `${position * 100}%`,
                                                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                                                    }}
                                                >
                                                    {user.email}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggestion Form */}
                {selectedFile && (
                    <div className="suggestion-section">
                        <h2>Add Suggestion</h2>
                        <form onSubmit={handleSubmitSuggestion} className="suggestion-form">
                            <div className="form-group">
                                <label htmlFor="line">Line Number:</label>
                                <input
                                    type="number"
                                    id="line"
                                    name="line"
                                    value={suggestionForm.line}
                                    onChange={handleFormChange}
                                    min="1"
                                    required
                                    disabled={submitting}
                                    placeholder="Enter line number"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="comment">Comment:</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    value={suggestionForm.comment}
                                    onChange={handleFormChange}
                                    required
                                    disabled={submitting}
                                    placeholder="Enter your comment or suggestion"
                                    rows="4"
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="submit-button">
                                {submitting ? 'Submitting...' : 'Add Suggestion'}
                            </button>
                            <div className="form-note">
                                <small>Current page: {pageNumber}</small>
                            </div>
                        </form>
                    </div>
                )}

                {/* Suggestions List - Filtered by Current Page or All for Admins */}
                {selectedFile && (
                    <div className="suggestions-list">
                        <h2>
                            {user && user.role === 'admin' ? (
                                <>
                                    All Suggestions (Admin View)
                                    {suggestions.length > 0 && (
                                        <span className="suggestion-count">
                                            {' '}({suggestions.length} total)
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    Suggestions for Page {pageNumber}
                                    {suggestions.length > 0 && (
                                        <span className="suggestion-count">
                                            {' '}
                                            ({getCurrentPageSuggestions().length} on this page, {suggestions.length} total)
                                        </span>
                                    )}
                                </>
                            )}
                        </h2>
                        {getCurrentPageSuggestions().length > 0 ? (
                            <table className="suggestions-table">
                                <thead>
                                    <tr>
                                        {user && user.role === 'admin' && <th>Page</th>}
                                        <th>Line</th>
                                        <th>Comment</th>
                                        <th>User</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentPageSuggestions()
                                        .sort((a, b) => {
                                            // Sort by page first (for admin view), then by line
                                            if (user && user.role === 'admin') {
                                                if (a.pageNumber !== b.pageNumber) {
                                                    return a.pageNumber - b.pageNumber;
                                                }
                                            }
                                            return a.lineNumber - b.lineNumber;
                                        })
                                        .map((suggestion) => (
                                            <tr key={suggestion.id}>
                                                {user && user.role === 'admin' && (
                                                    <td data-label="Page">{suggestion.pageNumber}</td>
                                                )}
                                                <td data-label="Line">{suggestion.lineNumber}</td>
                                                <td data-label="Comment">{suggestion.comment}</td>
                                                <td data-label="User">{suggestion.userEmail}</td>
                                                <td data-label="Date">
                                                    {new Date(suggestion.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-suggestions">
                                <p>
                                    {user && user.role === 'admin'
                                        ? 'No suggestions yet for this document.'
                                        : `No suggestions yet for page ${pageNumber}. Be the first to add one!`}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PdfViewerPage;

