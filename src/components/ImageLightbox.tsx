import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Pin } from 'lucide-react'

type LocationImage = {
  id: string
  location_id: string
  file_path: string
  file_name: string | null
  description: string | null
  file_size: number | null
  uploaded_by: string
  created_at: string
  is_pinned: boolean
  pinned_at: string | null
  pinned_by: string | null
  uploader: {
    full_name: string
  }
}

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  images: LocationImage[]
  currentIndex: number
  onNavigate: (index: number) => void
  getImageUrl: (filePath: string) => string
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  getImageUrl,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  useEffect(() => {
    if (!isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasPrevious) onNavigate(currentIndex - 1)
          break
        case 'ArrowRight':
          if (hasNext) onNavigate(currentIndex + 1)
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          handleResetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, hasPrevious, hasNext, zoom])

  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.5)
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      if (imageRef.current && containerRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()

        const maxX = Math.max(0, (imgRect.width * zoom - containerRect.width) / 2)
        const maxY = Math.max(0, (imgRect.height * zoom - containerRect.height) / 2)

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleImageDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2)
    } else {
      handleResetZoom()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      if (imageRef.current && containerRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()

        const maxX = Math.max(0, (imgRect.width * zoom - containerRect.width) / 2)
        const maxY = Math.max(0, (imgRect.height * zoom - containerRect.height) / 2)

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        })
      }
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center space-x-2">
          {currentImage.is_pinned && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
              <Pin className="w-3 h-3" />
              <span>VIGTIGT</span>
            </div>
          )}
          <span className="text-white text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Image Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={getImageUrl(currentImage.file_path)}
          alt={currentImage.description || currentImage.file_name || 'Image'}
          className={`max-w-full max-h-full object-contain transition-transform select-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          onDoubleClick={handleImageDoubleClick}
          draggable={false}
        />

        {/* Navigation Arrows */}
        {hasPrevious && (
          <Button
            onClick={() => onNavigate(currentIndex - 1)}
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}
        {hasNext && (
          <Button
            onClick={() => onNavigate(currentIndex + 1)}
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <Button
              onClick={handleResetZoom}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Image Info */}
          <div className="text-center space-y-1 max-w-2xl">
            {currentImage.file_name && (
              <h3 className="text-white font-semibold">{currentImage.file_name}</h3>
            )}
            {currentImage.description && (
              <p className="text-white/80 text-sm">{currentImage.description}</p>
            )}
            <p className="text-white/60 text-xs">
              Uploadet af {currentImage.uploader?.full_name || 'Ukendt'} •{' '}
              {new Date(currentImage.created_at).toLocaleDateString('da-DK')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
