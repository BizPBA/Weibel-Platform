import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { FavoriteEntityType, UserFavorite, FavoritesMap } from '@/types/favorites'

export function useFavorites() {
  const { profile } = useAuth()
  const [favorites, setFavorites] = useState<FavoritesMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!profile?.id) {
      setFavorites(new Map())
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', profile.id)

      if (fetchError) throw fetchError

      const favoritesMap: FavoritesMap = new Map()

      data?.forEach((fav: UserFavorite) => {
        if (!favoritesMap.has(fav.entity_type)) {
          favoritesMap.set(fav.entity_type, new Set())
        }
        favoritesMap.get(fav.entity_type)?.add(fav.entity_id)
      })

      setFavorites(favoritesMap)
    } catch (err: any) {
      console.error('Error fetching favorites:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const isFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: string): boolean => {
      return favorites.get(entityType)?.has(entityId) ?? false
    },
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (entityType: FavoriteEntityType, entityId: string): Promise<boolean> => {
      if (!profile?.id) {
        throw new Error('User must be authenticated')
      }

      const currentlyFavorited = isFavorite(entityType, entityId)

      setFavorites((prev) => {
        const newMap = new Map(prev)
        const entitySet = new Set(newMap.get(entityType) || [])

        if (currentlyFavorited) {
          entitySet.delete(entityId)
        } else {
          entitySet.add(entityId)
        }

        newMap.set(entityType, entitySet)
        return newMap
      })

      try {
        const { data, error: toggleError } = await supabase.rpc('toggle_favorite', {
          p_entity_type: entityType,
          p_entity_id: entityId,
        })

        if (toggleError) throw toggleError

        return data as boolean
      } catch (err: any) {
        console.error('Error toggling favorite:', err)

        setFavorites((prev) => {
          const newMap = new Map(prev)
          const entitySet = new Set(newMap.get(entityType) || [])

          if (currentlyFavorited) {
            entitySet.add(entityId)
          } else {
            entitySet.delete(entityId)
          }

          newMap.set(entityType, entitySet)
          return newMap
        })

        throw err
      }
    },
    [profile?.id, isFavorite]
  )

  return {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  }
}
