"use client"

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  X,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  file: File | string
  fileName: string
  isOpen: boolean
  onClose: () => void
}

export default function PDFViewer({ file, fileName, isOpen, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when file changes
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1)
      setScale(1.0)
      setRotation(0)
      setLoading(true)
      setError(null)
    }
  }, [file, isOpen])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setError('Failed to load PDF. Please try again.')
    setLoading(false)
  }

  const goToPreviousPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.25))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }

  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    if (typeof file === 'string') {
      // If file is a URL, download it
      const link = document.createElement('a')
      link.href = file
      link.download = fileName
      link.click()
    } else {
      // If file is a File object, create download link
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        goToPreviousPage()
        break
      case 'ArrowRight':
        e.preventDefault()
        goToNextPage()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case '+':
      case '=':
        e.preventDefault()
        zoomIn()
        break
      case '-':
        e.preventDefault()
        zoomOut()
        break
      case 'r':
        e.preventDefault()
        rotateClockwise()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, numPages])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <DialogTitle className="text-lg font-semibold truncate">
                {fileName}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close PDF viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[100px]">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={0.5}
                  max={3.0}
                  step={0.25}
                  className="w-20"
                />
                <span className="text-xs font-medium min-w-[40px]">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3.0}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={rotateClockwise}
                aria-label="Rotate clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                aria-label="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Content */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900"
          >
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="flex justify-center">
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    className="shadow-lg"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Keyboard shortcuts:</span>
                <span className="ml-2">← → Navigate • +/- Zoom • R Rotate • Esc Close</span>
              </div>
              <div>
                Powered by react-pdf
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 