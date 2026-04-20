export type FavoriteEntityType = 'customer' | 'location'

export interface UserFavorite {
  id: string
  user_id: string
  entity_type: FavoriteEntityType
  entity_id: string
  created_at: string
}

export type FavoritesMap = Map<string, Set<string>>
