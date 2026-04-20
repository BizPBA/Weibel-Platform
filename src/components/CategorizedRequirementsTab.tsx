import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'

type RequirementCategory = {
  id: string
  location_id: string
  name: string
  description: string | null
  display_order: number
  created_at: string
}

type LocationRequirement = {
  id: string
  location_id: string
  requirement_text: string
  category_id: string | null
  display_order: number
  created_at: string
}

interface CategorizedRequirementsTabProps {
  locationId: string
}

export function CategorizedRequirementsTab({ locationId }: CategorizedRequirementsTabProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<RequirementCategory[]>([])
  const [requirements, setRequirements] = useState<LocationRequirement[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingRequirement, setEditingRequirement] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  useEffect(() => {
    fetchData()
  }, [locationId])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [categoriesResult, requirementsResult] = await Promise.all([
        supabase
          .from('requirement_categories')
          .select('*')
          .eq('location_id', locationId)
          .order('display_order', { ascending: true }),
        supabase
          .from('location_requirements')
          .select('*')
          .eq('location_id', locationId)
          .order('display_order', { ascending: true }),
      ])

      if (categoriesResult.error) throw categoriesResult.error
      if (requirementsResult.error) throw requirementsResult.error

      setCategories(categoriesResult.data || [])
      setRequirements(requirementsResult.data || [])

      const allCategoryIds = new Set((categoriesResult.data || []).map((c) => c.id))
      setExpandedCategories(allCategoryIds)
    } catch (error: any) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const { error } = await supabase
        .from('requirement_categories')
        .insert({
          location_id: locationId,
          name: newCategoryName.trim(),
          display_order: categories.length,
        })

      if (error) throw error

      setNewCategoryName('')
      setIsAddingCategory(false)
      fetchData()
    } catch (error: any) {
      console.error('Error adding category:', error)
      alert('Fejl ved oprettelse af kategori: ' + error.message)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Er du sikker? Krav i denne kategori vil blive flyttet til "Ikke kategoriseret".')) return

    try {
      const { error } = await supabase
        .from('requirement_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      alert('Fejl ved sletning af kategori: ' + error.message)
    }
  }

  const addRequirement = async (categoryId: string | null, text: string) => {
    if (!text.trim()) return

    try {
      const { error } = await supabase
        .from('location_requirements')
        .insert({
          location_id: locationId,
          requirement_text: text.trim(),
          category_id: categoryId,
          display_order: requirements.filter((r) => r.category_id === categoryId).length,
        })

      if (error) throw error
      fetchData()
    } catch (error: any) {
      console.error('Error adding requirement:', error)
      alert('Fejl ved tilføjelse af krav: ' + error.message)
    }
  }

  const updateRequirement = async (id: string, text: string) => {
    if (!text.trim()) return

    try {
      const { error } = await supabase
        .from('location_requirements')
        .update({ requirement_text: text.trim() })
        .eq('id', id)

      if (error) throw error
      setEditingRequirement(null)
      fetchData()
    } catch (error: any) {
      console.error('Error updating requirement:', error)
    }
  }

  const deleteRequirement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('location_requirements')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error: any) {
      console.error('Error deleting requirement:', error)
    }
  }

  const getRequirementsByCategory = (categoryId: string | null) => {
    return requirements.filter((r) => r.category_id === categoryId)
  }

  const uncategorizedRequirements = getRequirementsByCategory(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kravspecifikationer</h2>
        {!isAddingCategory && (
          <Button onClick={() => setIsAddingCategory(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj kategori
          </Button>
        )}
      </div>

      {isAddingCategory && (
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategorinavn (f.eks. Sikkerhedsudstyr)"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCategory()
                  if (e.key === 'Escape') {
                    setIsAddingCategory(false)
                    setNewCategoryName('')
                  }
                }}
              />
              <Button onClick={addCategory} size="sm">
                <Check className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setIsAddingCategory(false)
                  setNewCategoryName('')
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uncategorizedRequirements.length > 0 && (
        <RequirementCategorySection
          categoryName="Ikke kategoriseret"
          categoryId={null}
          requirements={uncategorizedRequirements}
          isExpanded={true}
          onToggle={() => {}}
          onAddRequirement={addRequirement}
          onUpdateRequirement={updateRequirement}
          onDeleteRequirement={deleteRequirement}
          editingRequirement={editingRequirement}
          setEditingRequirement={setEditingRequirement}
        />
      )}

      {categories.map((category) => (
        <RequirementCategorySection
          key={category.id}
          categoryName={category.name}
          categoryId={category.id}
          requirements={getRequirementsByCategory(category.id)}
          isExpanded={expandedCategories.has(category.id)}
          onToggle={() => toggleCategory(category.id)}
          onDelete={() => deleteCategory(category.id)}
          onAddRequirement={addRequirement}
          onUpdateRequirement={updateRequirement}
          onDeleteRequirement={deleteRequirement}
          editingRequirement={editingRequirement}
          setEditingRequirement={setEditingRequirement}
        />
      ))}

      {categories.length === 0 && uncategorizedRequirements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Ingen kategorier eller krav tilføjet endnu.</p>
            <p className="text-sm text-gray-400 mt-1">
              Opret kategorier for at organisere sikkerhedskrav.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface RequirementCategorySectionProps {
  categoryName: string
  categoryId: string | null
  requirements: LocationRequirement[]
  isExpanded: boolean
  onToggle: () => void
  onDelete?: () => void
  onAddRequirement: (categoryId: string | null, text: string) => Promise<void>
  onUpdateRequirement: (id: string, text: string) => Promise<void>
  onDeleteRequirement: (id: string) => Promise<void>
  editingRequirement: string | null
  setEditingRequirement: (id: string | null) => void
}

function RequirementCategorySection({
  categoryName,
  categoryId,
  requirements,
  isExpanded,
  onToggle,
  onDelete,
  onAddRequirement,
  onUpdateRequirement,
  onDeleteRequirement,
  editingRequirement,
  setEditingRequirement,
}: RequirementCategorySectionProps) {
  const [newRequirementText, setNewRequirementText] = useState('')
  const [editText, setEditText] = useState('')

  const handleAdd = async () => {
    await onAddRequirement(categoryId, newRequirementText)
    setNewRequirementText('')
  }

  const startEditing = (req: LocationRequirement) => {
    setEditingRequirement(req.id)
    setEditText(req.requirement_text)
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={onToggle}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="font-semibold text-lg">{categoryName}</h3>
            <Badge variant="secondary">{requirements.length}</Badge>
          </div>
          {onDelete && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isExpanded && (
          <div className="border-t p-4 space-y-3">
            {requirements.map((req) => (
              <div key={req.id} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                {editingRequirement === req.id ? (
                  <>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1"
                      rows={2}
                      autoFocus
                    />
                    <Button onClick={() => onUpdateRequirement(req.id, editText)} size="sm">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setEditingRequirement(null)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-gray-900">{req.requirement_text}</p>
                    <Button onClick={() => startEditing(req)} variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => onDeleteRequirement(req.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            <div className="flex space-x-2 pt-2">
              <Input
                value={newRequirementText}
                onChange={(e) => setNewRequirementText(e.target.value)}
                placeholder="Tilføj nyt krav..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
              />
              <Button onClick={handleAdd} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
