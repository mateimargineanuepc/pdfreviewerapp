'use strict';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import fileService from '../api-services/fileService';
import suggestionService from '../api-services/suggestionService';
import progressService from '../api-services/progressService';
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
 * CommentTooltip component - Tooltip that appears when hovering over a comment dot
 * Automatically adjusts position to stay within viewport bounds
 * @param {Object} props - Component props
 * @param {Object} props.suggestion - Suggestion data
 * @param {Function} [props.onMouseEnter] - Mouse enter handler
 * @param {Function} [props.onMouseLeave] - Mouse leave handler
 * @returns {JSX.Element} CommentTooltip component
 */
function CommentTooltip({ suggestion, onMouseEnter, onMouseLeave }) {
    const tooltipRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;

    /**
     * Adjusts tooltip position to stay within viewport bounds
     */
    useEffect(() => {
        if (!tooltipRef.current) {
            return;
        }

        const tooltip = tooltipRef.current;
        const dot = tooltip.parentElement; // Get parent dot element

        if (!dot) {
            return;
        }

        // Ensure tooltip is visible and positioned immediately
        tooltip.style.position = 'fixed';
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        tooltip.style.zIndex = '10000';

        const adjustPosition = () => {
            if (!tooltip || !dot) {
                return;
            }

            const dotRect = dot.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const margin = 15; // Margin from viewport edges

            // Get tooltip dimensions (force a reflow to get accurate measurements)
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width || 250; // Fallback width
            const tooltipHeight = tooltipRect.height || 100; // Fallback height

            // Calculate desired position (centered below dot)
            let left = dotRect.left + (dotRect.width / 2) - (tooltipWidth / 2);
            let top = dotRect.bottom + 10; // 10px below dot

            // Adjust horizontal position if tooltip goes off screen
            if (left < margin) {
                left = margin;
            } else if (left + tooltipWidth > viewportWidth - margin) {
                left = viewportWidth - tooltipWidth - margin;
            }

            // Adjust vertical position if tooltip goes off screen (show above dot instead)
            if (top + tooltipHeight > viewportHeight - margin) {
                top = dotRect.top - tooltipHeight - 10; // 10px above dot
            }

            // Apply position using fixed positioning
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.style.transform = 'none';
            tooltip.style.bottom = 'auto';
            tooltip.style.right = 'auto';
        };

        // Adjust position immediately and after render
        adjustPosition();
        const rafId = requestAnimationFrame(() => {
            adjustPosition();
            // Second RAF to ensure layout is complete
            requestAnimationFrame(() => {
                adjustPosition();
            });
        });

        // Adjust on window resize (debounced)
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(adjustPosition, 100);
        };

        // Adjust on scroll (debounced to avoid too many updates)
        let scrollTimeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(adjustPosition, 50);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(resizeTimeout);
            clearTimeout(scrollTimeout);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [suggestion.id, isMobile]);

    return (
        <div 
            ref={tooltipRef} 
            className="comment-tooltip"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="comment-tooltip-user">{suggestion.userEmail}</div>
            <div className="comment-tooltip-comment">{suggestion.comment}</div>
            {suggestion.status && (
                <div className={`comment-tooltip-status status-${suggestion.status}`}>
                    {suggestion.status}
                </div>
            )}
        </div>
    );
}

/**
 * CommentDotsOverlay component - Renders cyan dots for all comments on the PDF
 * Positions dots to avoid overlap when multiple comments are on the same line
 * @param {Object} props - Component props
 * @param {Array} props.suggestions - Array of suggestions for current page
 * @param {Array} props.textLines - Array of text lines with positions
 * @param {number} props.pageNumber - Current page number
 * @param {Function} props.onHover - Callback when hovering over a dot
 * @param {string|null} props.hoveredSuggestionId - ID of currently hovered suggestion
 * @param {string|null} props.selectedSuggestionId - ID of suggestion selected from table
 * @returns {JSX.Element} CommentDotsOverlay component
 */
function CommentDotsOverlay({ suggestions, textLines, pageNumber, onHover, hoveredSuggestionId, selectedSuggestionId }) {

    // Group suggestions by line number
    // Filter suggestions to only include those for the current page
    // (suggestions array should already be filtered, but double-check for safety)
    const suggestionsByLine = {};
    suggestions.forEach((suggestion) => {
        // Ensure we only process suggestions for the current page
        if (Number(suggestion.pageNumber) === Number(pageNumber)) {
            const lineNum = suggestion.lineNumber;
            if (!suggestionsByLine[lineNum]) {
                suggestionsByLine[lineNum] = [];
            }
            suggestionsByLine[lineNum].push(suggestion);
        }
    });

    // Calculate dot positions to avoid overlap
    const dotPositions = useMemo(() => {
        const positions = [];
        const DOT_SIZE = 12; // Size of each dot in pixels
        const DOT_SPACING = 8; // Spacing between dots for manual comments (reduced from 16 to 8)
        const MIN_DISTANCE = 1.5; // Minimum distance between dots in percentage (to avoid overlap)
        const ROW_HEIGHT = 20; // Height of each row of dots
        const LINE_NUMBER_WIDTH = 60; // Width of line number area

        /**
         * Checks if a position overlaps with existing positions
         * @param {number} x - X position in percentage
         * @param {number} y - Y position in percentage
         * @param {Array} existingPositions - Array of existing positions
         * @returns {boolean} True if position overlaps
         */
        const isOverlapping = (x, y, existingPositions) => {
            return existingPositions.some((pos) => {
                const distanceX = Math.abs(pos.x - x);
                const distanceY = Math.abs(pos.y - y);
                // Check if dots are too close (within MIN_DISTANCE percentage)
                return distanceX < MIN_DISTANCE && distanceY < MIN_DISTANCE;
            });
        };

        /**
         * Finds the next available position for a dot
         * @param {number} startX - Starting X position
         * @param {number} y - Y position
         * @param {number} maxX - Maximum X position
         * @param {Array} existingPositions - Array of existing positions
         * @param {number} spacing - Spacing between dots
         * @returns {number} Available X position
         */
        const findAvailablePosition = (startX, y, maxX, existingPositions, spacing) => {
            let currentX = startX;
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite loop

            while (isOverlapping(currentX, y, existingPositions) && attempts < maxAttempts) {
                currentX += spacing;
                if (currentX > maxX) {
                    // If we've reached the edge, try next row
                    return null; // Will be handled by row logic
                }
                attempts++;
            }

            return currentX <= maxX ? currentX : null;
        };

        Object.keys(suggestionsByLine).forEach((lineNumStr) => {
            const lineNum = parseInt(lineNumStr, 10);
            const lineSuggestions = suggestionsByLine[lineNum];
            const lineData = textLines.find((l) => l.lineNumber === lineNum);

            if (!lineData) {
                // If no line data, use click coordinates if available (exact position, no adjustment)
                lineSuggestions.forEach((suggestion) => {
                    if (suggestion.clickX !== null && suggestion.clickX !== undefined) {
                        // Use exact click coordinates - no overlap checking for click-based comments
                        positions.push({
                            suggestion,
                            x: suggestion.clickX * 100, // Convert to percentage
                            y: suggestion.clickY * 100,
                            row: 0,
                            col: 0,
                        });
                    }
                });
                return;
            }

            // Calculate Y position from line data
            const yPercent = lineData.relativeY * 100;

            // Separate click-based and form-based suggestions
            const clickBasedSuggestions = lineSuggestions.filter(
                (s) => s.clickX !== null && s.clickX !== undefined
            );
            const formBasedSuggestions = lineSuggestions.filter(
                (s) => s.clickX === null || s.clickX === undefined
            );

            // FIRST: Process all click-based suggestions (exact positions, no adjustment)
            clickBasedSuggestions.forEach((suggestion) => {
                const xPercent = suggestion.clickX * 100;
                const clickYPercent = suggestion.clickY * 100;
                positions.push({
                    suggestion,
                    x: xPercent,
                    y: clickYPercent, // Use click Y, not line Y
                    row: 0,
                    col: 0,
                });
            });

            // SECOND: Process all form-based suggestions (auto-positioned, avoiding overlaps)
            // Start from line number area (around 8% from left, after line numbers)
            const startX = 8;
            const maxX = 95; // Don't go too close to edge
            const availableWidth = maxX - startX;
            
            // Calculate how many dots fit per row (based on reduced spacing)
            const dotsPerRow = Math.max(1, Math.floor(availableWidth / DOT_SPACING));
            
            formBasedSuggestions.forEach((suggestion, index) => {
                let row = Math.floor(index / dotsPerRow);
                const col = index % dotsPerRow;
                
                // Calculate initial position based on index
                let initialX = startX + col * DOT_SPACING;
                
                // Check for overlap and find available position
                // Check against ALL existing positions (both click-based and form-based)
                // This ensures form-based dots don't overlap any existing dots
                let adjustedY = yPercent + row * (ROW_HEIGHT / 2);
                let availableX = findAvailablePosition(initialX, adjustedY, maxX, positions, DOT_SPACING);
                
                // If no space in current row, try next row
                if (availableX === null) {
                    row++;
                    adjustedY = yPercent + row * (ROW_HEIGHT / 2);
                    availableX = findAvailablePosition(startX, adjustedY, maxX, positions, DOT_SPACING);
                    if (availableX === null) {
                        availableX = startX; // Fallback
                    }
                }

                const position = {
                    suggestion,
                    x: availableX,
                    y: adjustedY,
                    row,
                    col,
                };

                positions.push(position);
            });
        });

        return positions;
    }, [suggestionsByLine, textLines, pageNumber]);

    const activeSuggestionId = hoveredSuggestionId || selectedSuggestionId;

    return (
        <div className="comment-dots-overlay">
            {dotPositions.map(({ suggestion, x, y }) => {
                const isActive = activeSuggestionId === suggestion.id;
                const isSelectedDot = selectedSuggestionId === suggestion.id;
                return (
                    <div
                        key={suggestion.id}
                        data-suggestion-id={suggestion.id}
                        className={`comment-dot ${isActive ? 'hovered' : ''} ${isSelectedDot ? 'selected' : ''}`}
                        style={{
                            left: `${x}%`,
                            top: `${y}%`,
                        }}
                        onMouseEnter={() => onHover(suggestion.id)}
                        onMouseLeave={(e) => {
                            // Check if mouse is moving to tooltip
                            const relatedTarget = e.relatedTarget;
                            if (relatedTarget && relatedTarget.closest('.comment-tooltip')) {
                                // Mouse is moving to tooltip, don't clear hover
                                return;
                            }
                            // Only clear hover if not selected from table
                            if (!selectedSuggestionId || selectedSuggestionId !== suggestion.id) {
                                onHover(null);
                            }
                        }}
                    >
                        {isActive && (
                            <CommentTooltip 
                                suggestion={suggestion} 
                                onMouseEnter={() => onHover(suggestion.id)}
                                onMouseLeave={() => {
                                    // Only clear hover if not selected from table
                                    if (!selectedSuggestionId || selectedSuggestionId !== suggestion.id) {
                                        onHover(null);
                                    }
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * ClickCommentBox component - Comment box that appears when clicking on PDF
 * @param {Object} props - Component props
 * @param {number} props.x - X coordinate in pixels
 * @param {number} props.y - Y coordinate in pixels
 * @param {number} props.lineNumber - Pre-filled line number
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.submitting - Whether form is submitting
 * @returns {JSX.Element} ClickCommentBox component
 */
function ClickCommentBox({ x, y, lineNumber, onSubmit, onCancel, submitting }) {
    const { t } = useI18n();
    const [localLineNumber, setLocalLineNumber] = useState(lineNumber.toString());
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;

    useEffect(() => {
        setLocalLineNumber(lineNumber.toString());
    }, [lineNumber]);

    /**
     * Disable body scroll when modal is open on mobile
     */
    useEffect(() => {
        if (isMobile) {
            // Save current scroll position
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            // Get current body styles to restore later
            const originalStyle = {
                position: document.body.style.position,
                top: document.body.style.top,
                width: document.body.style.width,
                overflow: document.body.style.overflow,
            };
            
            // Disable body scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = `-${scrollX}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');

            // Prevent scroll on touch devices
            const preventScroll = (e) => {
                // Allow scroll only inside the modal
                if (e.target.closest('.click-comment-box')) {
                    return;
                }
                e.preventDefault();
            };

            // Add touch event listeners to prevent scroll
            document.addEventListener('touchmove', preventScroll, { passive: false });
            document.addEventListener('wheel', preventScroll, { passive: false });

            // Cleanup: re-enable scroll when component unmounts
            return () => {
                // Remove event listeners
                document.removeEventListener('touchmove', preventScroll);
                document.removeEventListener('wheel', preventScroll);
                
                // Restore original styles
                document.body.style.position = originalStyle.position;
                document.body.style.top = originalStyle.top;
                document.body.style.left = '';
                document.body.style.width = originalStyle.width;
                document.body.style.overflow = originalStyle.overflow;
                document.body.classList.remove('modal-open');
                
                // Restore scroll position
                window.scrollTo(scrollX, scrollY);
            };
        }
    }, [isMobile]);

    return (
        <>
            {/* Backdrop overlay for mobile */}
            {isMobile && (
                <div
                    className="click-comment-box-backdrop"
                    onClick={onCancel}
                    aria-hidden="true"
                />
            )}
            <div
                className="click-comment-box"
                style={isMobile ? {} : {
                    left: `${x}px`,
                    top: `${y}px`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit(e);
                }}>
                    <div className="comment-box-header">
                        <h3>{t('pdfViewer.addComment')}</h3>
                        <button type="button" onClick={onCancel} className="comment-box-close">×</button>
                    </div>
                    <div className="form-group">
                        <label htmlFor="click-line">{t('pdfViewer.clickCommentLineNumber')}</label>
                        <input
                            type="number"
                            id="click-line"
                            name="line"
                            value={localLineNumber}
                            onChange={(e) => setLocalLineNumber(e.target.value)}
                            min="1"
                            required
                            disabled={submitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="click-comment">Comment:</label>
                        <textarea
                            id="click-comment"
                            name="comment"
                            required
                            disabled={submitting}
                            rows="3"
                            placeholder={t('pdfViewer.clickCommentPlaceholder')}
                        />
                    </div>
                    <div className="comment-box-actions">
                        <button type="submit" disabled={submitting} className="submit-button">
                            {submitting ? t('pdfViewer.submitting') : t('pdfViewer.clickCommentSubmit')}
                        </button>
                        <button type="button" onClick={onCancel} disabled={submitting} className="cancel-button">
                            {t('pdfViewer.clickCommentCancel')}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

/**
 * PdfViewerPage component for viewing PDFs and managing suggestions
 * @returns {JSX.Element} PdfViewerPage component
 */
function PdfViewerPage() {
    const { user } = useAuth();
    const { t } = useI18n();
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
    const [selectedSuggestions, setSelectedSuggestions] = useState(new Set()); // Set of selected suggestion IDs (admin only)
    const [updatingStatus, setUpdatingStatus] = useState(false); // Track status update operations
    const [deletingSuggestions, setDeletingSuggestions] = useState(false); // Track bulk deletion
    const [pageCompleted, setPageCompleted] = useState(false); // Whether current page is marked as done
    const [togglingPageCompletion, setTogglingPageCompletion] = useState(false); // Track page completion toggle
    const [clickCommentBox, setClickCommentBox] = useState(null); // { x, y, lineNumber } for comment box from click
    const [hoveredSuggestion, setHoveredSuggestion] = useState(null); // ID of suggestion being hovered
    const [selectedSuggestionFromTable, setSelectedSuggestionFromTable] = useState(null); // ID of suggestion selected from table
    const pageContainerRef = useRef(null); // Ref for PDF page container to handle clicks
    const swipeStartX = useRef(null); // For swipe gesture tracking
    const swipeStartY = useRef(null); // For swipe gesture tracking
    const [showCommentDots, setShowCommentDots] = useState(true); // Toggle for showing/hiding comment dots

    /**
     * Filters suggestions to show only those for the current page
     * For table display: admins see all suggestions, regular users see only current page
     * For dots overlay: everyone sees only current page suggestions
     * @param {boolean} forDots - If true, always filter by current page (for dots overlay)
     * @returns {Array} Filtered suggestions
     */
    const getCurrentPageSuggestions = (forDots = false) => {
        if (!suggestions || suggestions.length === 0) {
            return [];
        }
        // For dots overlay, always filter by current page (all users see only current page dots)
        if (forDots) {
            return suggestions.filter((suggestion) => Number(suggestion.pageNumber) === Number(pageNumber));
        }
        // For table display: admins see all suggestions, regular users see only current page
        if (user && user.role === 'admin') {
            return suggestions;
        }
        return suggestions.filter((suggestion) => Number(suggestion.pageNumber) === Number(pageNumber));
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
     * Clears selected suggestion when page changes if it's not on the new page
     */
    useEffect(() => {
        if (selectedSuggestionFromTable) {
            const selectedSuggestion = suggestions.find((s) => s.id === selectedSuggestionFromTable);
            if (selectedSuggestion && selectedSuggestion.pageNumber !== pageNumber) {
                setSelectedSuggestionFromTable(null);
                setHoveredSuggestion(null);
            }
        }
    }, [pageNumber, selectedSuggestionFromTable, suggestions]);

    /**
     * Loads page completion status when page or file changes
     * Also resets the state to prevent stale data
     */
    useEffect(() => {
        if (selectedFile && pageNumber) {
            // Reset state first to prevent showing stale data
            setPageCompleted(false);
            loadPageCompletionStatus();
        }
    }, [selectedFile, pageNumber]);

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
     * Finds the first incomplete page for a document
     * @param {string} fileName - Name of the PDF file
     * @param {number} totalPages - Total number of pages
     * @returns {Promise<number>} First incomplete page number (or 1 if all are complete)
     */
    const findFirstIncompletePage = async (fileName, totalPages) => {
        try {
            // Get user progress for this file
            const result = await progressService.getUserProgress(fileName);
            if (result.success && result.data.completedPages) {
                const completedPages = result.data.completedPages;
                
                // Find first page that is not completed
                for (let page = 1; page <= totalPages; page++) {
                    if (!completedPages.includes(page)) {
                        return page;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to find first incomplete page:', error);
        }
        
        // If all pages are complete or error occurred, return page 1
        return 1;
    };

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
        setLoading(true);
        setError('');
        setPdfUrl(null); // Clear previous PDF URL to show loading state
        setPageCompleted(false); // Reset page completion state

        try {
            // Fetch PDF as data URL using secure method (token in header, not URL)
            const result = await fileService.getFileBlob(filename);
            if (result.success) {
                // Use data URL instead of blob URL to avoid CSP issues
                setPdfUrl(result.data.dataUrl);
                // Note: We'll set the page number after the document loads in onDocumentLoadSuccess
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
            // Clear selected suggestions when reloading
            setSelectedSuggestions(new Set());
        }
    };

    /**
     * Handles status update for a suggestion (admin only)
     * @param {string} suggestionId - ID of the suggestion
     * @param {string} newStatus - New status value
     */
    const handleStatusChange = async (suggestionId, newStatus) => {
        if (!user || user.role !== 'admin') {
            return;
        }

        setUpdatingStatus(true);
        try {
            const result = await suggestionService.updateSuggestionStatus(suggestionId, newStatus);
            if (result.success) {
                // Update the suggestion in the local state
                setSuggestions((prev) =>
                    prev.map((s) => (s.id === suggestionId ? { ...s, status: newStatus } : s))
                );
            } else {
                alert(`Failed to update status: ${result.error}`);
            }
        } catch (error) {
            alert(`Error updating status: ${error.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    /**
     * Handles checkbox toggle for suggestion selection (admin only)
     * @param {string} suggestionId - ID of the suggestion
     * @param {boolean} checked - Whether the checkbox is checked
     */
    const handleSuggestionSelect = (suggestionId, checked) => {
        if (!user || user.role !== 'admin') {
            return;
        }

        setSelectedSuggestions((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(suggestionId);
            } else {
                newSet.delete(suggestionId);
            }
            return newSet;
        });
    };

    /**
     * Handles select all/deselect all for suggestions (admin only)
     * @param {boolean} selectAll - Whether to select all or deselect all
     */
    const handleSelectAll = (selectAll) => {
        if (!user || user.role !== 'admin') {
            return;
        }

        if (selectAll) {
            const allIds = getCurrentPageSuggestions().map((s) => s.id);
            setSelectedSuggestions(new Set(allIds));
        } else {
            setSelectedSuggestions(new Set());
        }
    };

    /**
     * Handles bulk deletion of selected suggestions (admin only)
     */
    const handleDeleteSelected = async () => {
        if (!user || user.role !== 'admin' || selectedSuggestions.size === 0) {
            return;
        }

        if (!confirm(t('pdfViewer.confirmDelete', { count: selectedSuggestions.size }))) {
            return;
        }

        setDeletingSuggestions(true);
        try {
            const result = await suggestionService.deleteMultipleSuggestions(Array.from(selectedSuggestions));
            if (result.success) {
                // Remove deleted suggestions from local state
                setSuggestions((prev) => prev.filter((s) => !selectedSuggestions.has(s.id)));
                // Clear selection
                setSelectedSuggestions(new Set());
                alert(`Successfully deleted ${result.data.deletedCount} suggestion(s)`);
            } else {
                alert(`Failed to delete suggestions: ${result.error}`);
            }
        } catch (error) {
            alert(`Error deleting suggestions: ${error.message}`);
        } finally {
            setDeletingSuggestions(false);
        }
    };

    /**
     * Handles deletion of a single suggestion (only by the user who created it)
     * @param {string} suggestionId - ID of the suggestion to delete
     * @param {string} userEmail - Email of the user who created the suggestion
     */
    const handleDeleteSuggestion = async (suggestionId, userEmail) => {
        if (!user) {
            return;
        }

        // Check if the suggestion belongs to the current user
        if (userEmail !== user.email) {
            alert(t('pdfViewer.cannotDeleteOtherUserComment'));
            return;
        }

        if (!confirm(t('pdfViewer.confirmDeleteComment'))) {
            return;
        }

        try {
            const result = await suggestionService.deleteSuggestion(suggestionId);
            if (result.success) {
                // Remove deleted suggestion from local state
                setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
                // Clear selection if the deleted suggestion was selected
                if (selectedSuggestionFromTable === suggestionId) {
                    setSelectedSuggestionFromTable(null);
                    setHoveredSuggestion(null);
                }
            } else {
                alert(t('pdfViewer.deleteCommentError', { error: result.error }));
            }
        } catch (error) {
            alert(t('pdfViewer.deleteCommentError', { error: error.message }));
        }
    };

    /**
     * Loads page completion status for the current page
     */
    const loadPageCompletionStatus = async () => {
        if (!selectedFile || !pageNumber) return;
        
        try {
            // Reset state first to prevent showing stale data
            setPageCompleted(false);
            
            const result = await progressService.getPageProgress(selectedFile, pageNumber);
            if (result.success) {
                setPageCompleted(result.data.isCompleted);
            } else {
                // If request failed, ensure state is false
                setPageCompleted(false);
            }
        } catch (error) {
            console.error('Failed to load page completion status:', error);
            // On error, ensure state is false
            setPageCompleted(false);
        }
    };

    /**
     * Handles toggling page completion status
     */
    const handleTogglePageCompletion = async () => {
        if (!selectedFile || togglingPageCompletion) return;

        setTogglingPageCompletion(true);
        try {
            const result = await progressService.togglePageCompletion(selectedFile, pageNumber);
            if (result.success) {
                setPageCompleted(result.data.isCompleted);
            } else {
                alert(`Failed to update page status: ${result.error}`);
            }
        } catch (error) {
            alert(`Error updating page status: ${error.message}`);
        } finally {
            setTogglingPageCompletion(false);
        }
    };

    /**
     * Handles PDF load success
     * @param {Object} data - PDF document data
     */
    const onDocumentLoadSuccess = async ({ numPages }) => {
        setNumPages(numPages);
        setTextLines([]); // Reset text lines when document loads
        
        // Find first incomplete page and navigate to it
        if (selectedFile && numPages) {
            const firstIncompletePage = await findFirstIncompletePage(selectedFile, numPages);
            setPageNumber(firstIncompletePage);
        } else {
            setPageNumber(1);
        }
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
            // Wait 2000ms after page load before extracting rows
            // This ensures the PDF is fully rendered in the DOM
            setTimeout(() => {
                extractRowsFromTextLayer();
            }, 2000);
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
        // Re-extract rows after page change with 2000ms delay
        const timer = setTimeout(() => {
            extractRowsFromTextLayer();
        }, 2000);
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
     * Finds the closest line number to a given Y position
     * @param {number} clickY - Y coordinate relative to PDF page
     * @returns {number|null} Closest line number or null if no lines found
     */
    const findClosestLineNumber = useCallback((clickY) => {
        if (!textLines || textLines.length === 0) {
            return null;
        }

        // Find the line with the closest relativeY to clickY
        let closestLine = textLines[0];
        let minDistance = Math.abs(textLines[0].relativeY - clickY);

        for (const line of textLines) {
            const distance = Math.abs(line.relativeY - clickY);
            if (distance < minDistance) {
                minDistance = distance;
                closestLine = line;
            }
        }

        return closestLine.lineNumber;
    }, [textLines]);

    /**
     * Handles click on PDF page to create a comment
     * @param {React.MouseEvent<HTMLDivElement>} e - Click event
     */
    const handlePdfClick = useCallback((e) => {
        // Don't trigger if clicking on comment box or dots
        if (e.target.closest('.click-comment-box') || e.target.closest('.comment-dot') || e.target.closest('.comment-dots-overlay')) {
            return;
        }

        if (!pdfWrapperRef.current || !selectedFile || !user) {
            return;
        }

        // Find the PDF page element
        const pageElement = pdfWrapperRef.current.querySelector('.react-pdf__Page');
        if (!pageElement) {
            return;
        }

        // Get page canvas to calculate relative positions
        const canvas = pageElement.querySelector('canvas');
        if (!canvas) {
            return;
        }

        const pageRect = canvas.getBoundingClientRect();
        const wrapperRect = pdfWrapperRef.current.getBoundingClientRect();
        
        // Calculate click position relative to wrapper (for comment box display)
        const clickX = e.clientX - wrapperRect.left;
        const clickY = e.clientY - wrapperRect.top;

        // Calculate relative positions within the canvas (0-1 range)
        // This is what we store and use for positioning dots
        const canvasX = e.clientX - pageRect.left;
        const canvasY = e.clientY - pageRect.top;
        const relativeX = canvasX / pageRect.width;
        const relativeY = canvasY / pageRect.height;
        
        // But for overlay positioning, we need coordinates relative to wrapper
        // Calculate canvas position within wrapper
        const canvasOffsetX = pageRect.left - wrapperRect.left;
        const canvasOffsetY = pageRect.top - wrapperRect.top;
        
        // Convert canvas-relative coordinates to wrapper-relative coordinates
        const wrapperRelativeX = (canvasOffsetX + canvasX) / wrapperRect.width;
        const wrapperRelativeY = (canvasOffsetY + canvasY) / wrapperRect.height;

        // Find closest line number (use canvas-relative Y for line matching)
        const closestLine = findClosestLineNumber(relativeY);

        // Show comment box at click position (relative to wrapper)
        // Store wrapper-relative coordinates for overlay positioning
        setClickCommentBox({
            x: clickX,
            y: clickY,
            relativeX: wrapperRelativeX, // Use wrapper-relative for overlay
            relativeY: wrapperRelativeY, // Use wrapper-relative for overlay
            lineNumber: closestLine || 1,
        });
    }, [selectedFile, user, findClosestLineNumber]);

    /**
     * Handles submission of comment from click
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event
     */
    const handleClickCommentSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedFile || !clickCommentBox) {
            return;
        }

        const formData = new FormData(e.currentTarget);
        const line = parseInt(formData.get('line') || clickCommentBox.lineNumber, 10);
        const commentText = (formData.get('comment') || '').toString().trim();

        if (!line || line < 1) {
            setError('Please enter a valid line number');
            return;
        }

        if (!commentText) {
            setError('Please enter a comment');
            return;
        }

        setSubmitting(true);
        setError('');

        const result = await suggestionService.createSuggestion({
            fileName: selectedFile,
            page: pageNumber,
            line: line,
            comment: commentText,
            clickX: clickCommentBox.relativeX,
            clickY: clickCommentBox.relativeY,
        });

        if (result.success) {
            // Close comment box and reload suggestions
            setClickCommentBox(null);
            await loadSuggestions(selectedFile);
        } else {
            setError(result.error || 'Failed to create suggestion');
        }

        setSubmitting(false);
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
     * Handles touch start for swipe gestures
     * @param {TouchEvent} e - Touch event
     */
    const handleSwipeStart = (e) => {
        if (window.innerWidth > 767) return; // Only on mobile
        swipeStartX.current = e.touches[0].clientX;
        swipeStartY.current = e.touches[0].clientY;
    };

    /**
     * Handles touch move for swipe gestures
     * @param {TouchEvent} e - Touch event
     */
    const handleSwipeMove = (e) => {
        if (window.innerWidth > 767 || swipeStartX.current === null) return;
        // Prevent default scrolling if we're detecting a horizontal swipe
        const deltaX = Math.abs(e.touches[0].clientX - swipeStartX.current);
        const deltaY = Math.abs(e.touches[0].clientY - swipeStartY.current);
        
        // If horizontal movement is greater than vertical, prevent scroll
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    };

    /**
     * Handles touch end for swipe gestures
     * @param {TouchEvent} e - Touch event
     */
    const handleSwipeEnd = (e) => {
        if (window.innerWidth > 767 || swipeStartX.current === null || swipeStartY.current === null) {
            swipeStartX.current = null;
            swipeStartY.current = null;
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - swipeStartX.current;
        const deltaY = touchEndY - swipeStartY.current;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Only trigger swipe if horizontal movement is greater than vertical (horizontal swipe)
        // and movement is significant enough (at least 50px)
        if (absDeltaX > absDeltaY && absDeltaX > 50) {
            if (deltaX > 0) {
                // Swipe right - go to previous page
                goToPreviousPage();
            } else {
                // Swipe left - go to next page
                goToNextPage();
            }
        }

        swipeStartX.current = null;
        swipeStartY.current = null;
    };

    /**
     * Handles clicking on a suggestion from the table
     * Highlights the row, shows tooltip on dot, and navigates to correct page if needed
     * If clicking on an already selected suggestion, deselects it
     * @param {Object} suggestion - The suggestion object
     */
    const handleSuggestionClick = useCallback((suggestion) => {
        // If clicking on the same suggestion that's already selected, deselect it
        if (selectedSuggestionFromTable === suggestion.id) {
            setSelectedSuggestionFromTable(null);
            setHoveredSuggestion(null);
            return;
        }

        // If suggestion is on a different page, navigate to it
        if (suggestion.pageNumber !== pageNumber) {
            setPageNumber(suggestion.pageNumber);
        }

        // Set selected suggestion to highlight row and show tooltip
        setSelectedSuggestionFromTable(suggestion.id);
        setHoveredSuggestion(suggestion.id);

        // Scroll to the comment dot after a short delay to allow page to render
        setTimeout(() => {
            const dotElement = document.querySelector(`[data-suggestion-id="${suggestion.id}"]`);
            if (dotElement) {
                dotElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }, 300);
    }, [pageNumber, selectedSuggestionFromTable]);

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
            {/* Page Navigation Controls - Fixed below navigation bar */}
            {pdfUrl && (
                <div className="pdf-page-navigation">
                    {/* Desktop Controls */}
                    <div className="pdf-controls pdf-controls-desktop">
                        <button
                            onClick={goToPreviousPage}
                            disabled={pageNumber <= 1}
                            className="nav-button"
                        >
                            {t('pdfViewer.previous')}
                        </button>
                        <span className="page-info">
                            {t('pdfViewer.page')} {pageNumber} {t('pdfViewer.of')} {numPages || '...'}
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={pageNumber >= (numPages || 1)}
                            className="nav-button"
                        >
                            {t('pdfViewer.next')}
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
                            {t('pdfViewer.page')} {pageNumber} {t('pdfViewer.of')} {numPages || '...'}
                        </span>
                        {selectedFile && (
                            <label className="toggle-comment-dots-mobile-inline">
                                <input
                                    type="checkbox"
                                    checked={showCommentDots}
                                    onChange={(e) => setShowCommentDots(e.target.checked)}
                                    aria-label={t('pdfViewer.showCommentDots')}
                                />
                                <span className="toggle-icon-inline">●</span>
                            </label>
                        )}
                        <button
                            onClick={goToNextPage}
                            disabled={pageNumber >= (numPages || 1)}
                            className="nav-arrow nav-arrow-right"
                            aria-label="Next page"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}

            <div className="pdf-viewer-container">
                <div className="viewer-header">
                    <h1>{t('pdfViewer.title')}</h1>
                    {selectedFile && (
                        <div className="file-info">
                            <span className="file-name">{selectedFile}</span>
                            <div className="header-controls">
                                <label className="toggle-comment-dots">
                                    <input
                                        type="checkbox"
                                        checked={showCommentDots}
                                        onChange={(e) => setShowCommentDots(e.target.checked)}
                                    />
                                    <span>{t('pdfViewer.showCommentDots')}</span>
                                </label>
                                <button
                                    onClick={() => navigate('/documents')}
                                    className="back-button"
                                >
                                    {t('pdfViewer.backToDocuments')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Loading State */}
                {loading && !pdfUrl && (
                    <div className="pdf-loading-container">
                        <div className="pdf-loading-spinner"></div>
                        <p className="pdf-loading-text">{t('pdfViewer.loading')}</p>
                    </div>
                )}

                {/* PDF Viewer */}
                {pdfUrl && (
                    <div className="pdf-viewer">
                        <div className="pdf-display">
                            <div 
                                className="pdf-wrapper" 
                                ref={pdfWrapperRef} 
                                onClick={handlePdfClick}
                                onTouchStart={handleSwipeStart}
                                onTouchMove={handleSwipeMove}
                                onTouchEnd={handleSwipeEnd}
                            >
                                {pdfUrl && (
                                    <>
                                        <Document
                                            file={pdfUrl}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            onLoadError={(error) => {
                                                console.error('PDF load error:', error);
                                                setError(t('pdfViewer.loadingError'));
                                            }}
                                            loading={
                                                <div className="loading">
                                                    <div className="loading-spinner"></div>
                                                    {t('pdfViewer.loading')}
                                                </div>
                                            }
                                            error={
                                                <div className="error-message">
                                                    {t('pdfViewer.loadingError')}
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
                                                    setError(t('pdfViewer.loadingError'));
                                                }}
                                            />
                                        </Document>
                                        {/* Row Numbers Overlay - Always render */}
                                        <div className="row-numbers-overlay">
                                            {extractingRows ? (
                                                <div className="row-numbers-loading">
                                                    {t('pdfViewer.extractingRows')}
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
                                                    {t('pdfViewer.noRowsFound')}
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
                                {/* Comment Dots Overlay */}
                                {selectedFile && showCommentDots && (
                                    <CommentDotsOverlay
                                        suggestions={getCurrentPageSuggestions(true)}
                                        textLines={textLines}
                                        pageNumber={pageNumber}
                                        onHover={setHoveredSuggestion}
                                        hoveredSuggestionId={hoveredSuggestion || selectedSuggestionFromTable}
                                        selectedSuggestionId={selectedSuggestionFromTable}
                                    />
                                )}
                                {/* Click Comment Box */}
                                {clickCommentBox && (
                                    <ClickCommentBox
                                        x={clickCommentBox.x}
                                        y={clickCommentBox.y}
                                        lineNumber={clickCommentBox.lineNumber}
                                        onSubmit={handleClickCommentSubmit}
                                        onCancel={() => setClickCommentBox(null)}
                                        submitting={submitting}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Completion Button - Before suggestions */}
                {selectedFile && user && (
                    <div className="page-completion-section">
                        <button
                            type="button"
                            onClick={handleTogglePageCompletion}
                            disabled={togglingPageCompletion}
                            className={`page-done-button ${pageCompleted ? 'completed' : ''}`}
                            title={pageCompleted ? t('pdfViewer.pageDoneExplanationCompleted') : t('pdfViewer.pageDoneExplanation')}
                        >
                            {togglingPageCompletion ? t('pdfViewer.updating') : t('pdfViewer.pageDone')}
                        </button>
                        <p className="page-done-explanation">
                            {pageCompleted
                                ? t('pdfViewer.pageDoneExplanationCompleted')
                                : t('pdfViewer.pageDoneExplanation')}
                        </p>
                    </div>
                )}

                {/* Suggestion Form */}
                {selectedFile && user && (
                    <div className="suggestion-section">
                        <h2>{t('pdfViewer.addSuggestion')}</h2>
                        <form onSubmit={handleSubmitSuggestion} className="suggestion-form">
                            <div className="form-group">
                                <label htmlFor="line">{t('pdfViewer.lineNumber')}</label>
                                <input
                                    type="number"
                                    id="line"
                                    name="line"
                                    value={suggestionForm.line}
                                    onChange={handleFormChange}
                                    min="1"
                                    required
                                    disabled={submitting}
                                    placeholder={t('pdfViewer.lineNumberPlaceholder')}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="comment">{t('pdfViewer.commentLabel')}</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    value={suggestionForm.comment}
                                    onChange={handleFormChange}
                                    required
                                    disabled={submitting}
                                    placeholder={t('pdfViewer.commentPlaceholder')}
                                    rows="4"
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="submit-button">
                                {submitting ? t('pdfViewer.submitting') : t('pdfViewer.addSuggestionButton')}
                            </button>
                            <div className="form-note">
                                <small>{t('pdfViewer.currentPage', { page: pageNumber })}</small>
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
                                    {t('pdfViewer.allSuggestions')}
                                    {suggestions.length > 0 && (
                                        <span className="suggestion-count">
                                            {' '}{t('pdfViewer.totalSuggestions', { count: suggestions.length })}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    {t('pdfViewer.suggestionsForPage', { page: pageNumber })}
                                    {suggestions.length > 0 && (
                                        <span className="suggestion-count">
                                            {' '}
                                            {t('pdfViewer.suggestionsOnPage', { count: getCurrentPageSuggestions().length, total: suggestions.length })}
                                        </span>
                                    )}
                                </>
                            )}
                        </h2>
                        {user && user.role === 'admin' && getCurrentPageSuggestions().length > 0 && (
                            <div className="admin-suggestion-controls">
                                <div className="selection-controls">
                                    <label className="select-all-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedSuggestions.size === getCurrentPageSuggestions().length && getCurrentPageSuggestions().length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                        <span>{t('common.selectAll')}</span>
                                    </label>
                                    {selectedSuggestions.size > 0 && (
                                        <button
                                            className="delete-selected-button"
                                            onClick={handleDeleteSelected}
                                            disabled={deletingSuggestions}
                                        >
                                            {deletingSuggestions ? t('pdfViewer.deleting') : t('pdfViewer.deleteSelected', { count: selectedSuggestions.size })}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {getCurrentPageSuggestions().length > 0 ? (
                            <table className="suggestions-table">
                                <thead>
                                    <tr>
                                        {user && user.role === 'admin' && <th>{t('common.select')}</th>}
                                        {user && user.role === 'admin' && <th>{t('pdfViewer.page')}</th>}
                                        <th>{t('pdfViewer.line')}</th>
                                        <th>{t('pdfViewer.comment')}</th>
                                        <th>{t('pdfViewer.user')}</th>
                                        {user && user.role === 'admin' && <th>{t('pdfViewer.status')}</th>}
                                        <th>{t('pdfViewer.date')}</th>
                                        <th>{t('pdfViewer.actions')}</th>
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
                                            <tr
                                                key={suggestion.id}
                                                className={selectedSuggestionFromTable === suggestion.id ? 'selected-suggestion-row' : ''}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {user && user.role === 'admin' && (
                                                    <td data-label="Select" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSuggestions.has(suggestion.id)}
                                                            onChange={(e) => handleSuggestionSelect(suggestion.id, e.target.checked)}
                                                        />
                                                    </td>
                                                )}
                                                {user && user.role === 'admin' && (
                                                    <td data-label="Page">{suggestion.pageNumber}</td>
                                                )}
                                                <td data-label="Line">{suggestion.lineNumber}</td>
                                                <td data-label="Comment">{suggestion.comment}</td>
                                                <td data-label="User">{suggestion.userEmail}</td>
                                                {user && user.role === 'admin' && (
                                                    <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={suggestion.status || 'pending'}
                                                            onChange={(e) => handleStatusChange(suggestion.id, e.target.value)}
                                                            disabled={updatingStatus}
                                                            className="status-select"
                                                        >
                                                            <option value="pending">{t('status.pending')}</option>
                                                            <option value="in_progress">{t('status.inProgress')}</option>
                                                            <option value="done">{t('status.done')}</option>
                                                            <option value="irrelevant">{t('status.irrelevant')}</option>
                                                        </select>
                                                    </td>
                                                )}
                                                <td data-label="Date">
                                                    {new Date(suggestion.createdAt).toLocaleDateString()}
                                                </td>
                                                <td data-label={t('pdfViewer.actions')} onClick={(e) => e.stopPropagation()}>
                                                    {user && suggestion.userEmail === user.email && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSuggestion(suggestion.id, suggestion.userEmail)}
                                                            className="delete-comment-button"
                                                            title={t('pdfViewer.deleteComment')}
                                                            aria-label={t('pdfViewer.deleteComment')}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-suggestions">
                                <p>
                                    {user && user.role === 'admin'
                                        ? t('pdfViewer.noSuggestionsAdmin')
                                        : t('pdfViewer.noSuggestions')}
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

