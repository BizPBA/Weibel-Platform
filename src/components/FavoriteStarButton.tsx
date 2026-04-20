import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FavoriteStarButtonProps {
  isFavorite: boolean
  onToggle: () => Promise<void>
  size?: number
  className?: string
}

export function FavoriteStarButton({
  isFavorite,
  onToggle,
  size = 20,
  className,
}: FavoriteStarButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    try {
      await onToggle()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'absolute top-3 right-3 p-2 rounded-full transition-all duration-200',
        'hover:bg-gray-100 hover:scale-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500',
        'z-10',
        className
      )}
      aria-label={isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
      title={isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
    >
      {isLoading ? (
        <div
          className="animate-spin rounded-full border-2 border-gray-300 border-t-yellow-500"
          style={{ width: size, height: size }}
        />
      ) : (
        <Star
          size={size}
          className={cn(
            'transition-all duration-200',
            isFavorite
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-gray-400 stroke-gray-400 fill-none'
          )}
        />
      )}
    </button>
  )
}
