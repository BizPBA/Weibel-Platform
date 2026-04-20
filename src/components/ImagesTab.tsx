'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, Image as ImageIcon, Trash2, AlertCircle, CheckCircle, Edit, Pin } from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'

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

interface ImagesTabProps {
  locationId: string
}

export function ImagesTab({ locationId }: ImagesTabProps) {
  const { user, canManageLocations } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<LocationImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<LocationImage | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    fetchImages()
  }, [locationId])

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('location_images')
        .select(`
          *,
          uploader:profiles!uploaded_by(full_name)
        `)
        .eq('location_id', locationId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error: any) {
      console.error('Error fetching images:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      setIsUploadModalOpen(true)
      setError(null)
    }
  }

  const uploadImage = async () => {
    if (!user || !selectedFile) return

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)
      
      console.log('🔄 Starting image upload process...')
      console.log('📁 Selected file:', selectedFile.name, 'Size:', selectedFile.size)
      console.log('👤 User ID:', user.id)
      console.log('📍 Location ID:', locationId)

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${locationId}/${Date.now()}.${fileExt}`
      
      console.log('📝 Generated filename:', fileName)

      // Upload to Supabase Storage
      console.log('☁️ Uploading to Supabase Storage...')
      const { error: uploadError } = await supabase.storage
        .from('location-images')
        .upload(fileName, selectedFile)

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }
      
      console.log('✅ File uploaded to storage successfully')

      // Save image record to database
      console.log('💾 Saving image record to database...')
      const { error: dbError } = await supabase
        .from('location_images')
        .insert({
          location_id: locationId,
          file_path: fileName,
          file_name: uploadTitle || selectedFile.name,
          description: uploadDescription || null,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          folder_id: null
        })

      if (dbError) {
        console.error('❌ Database insert error:', dbError)
        throw dbError
      }
      
      console.log('✅ Image record saved to database')

      // Log activity
      console.log('📝 Logging activity...')
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Uploaded image: "${uploadTitle || selectedFile.name}"`
        })

      setSuccess('Image uploaded successfully!')
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      setUploadTitle('')
      setUploadDescription('')
      
      console.log('🔄 Refreshing images list...')
      fetchImages()

      setTimeout(() => setSuccess(null), 3000)
      console.log('✅ Image upload process completed successfully')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const openEditModal = (image: LocationImage) => {
    setEditingImage(image)
    setEditTitle(image.file_name || '')
    setEditDescription(image.description || '')
    setIsEditModalOpen(true)
  }

  const updateImage = async () => {
    if (!user || !editingImage) return

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_images')
        .update({
          file_name: editTitle || null,
          description: editDescription || null
        })
        .eq('id', editingImage.id)

      if (error) throw error

      // Log activity
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Updated image: "${editTitle || editingImage.file_name || 'Unknown'}"`
        })

      setSuccess('Image updated successfully!')
      setIsEditModalOpen(false)
      setEditingImage(null)
      setEditTitle('')
      setEditDescription('')
      fetchImages()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating image:', error)
      setError(error.message)
    }
  }

  const deleteImage = async (image: LocationImage) => {
    if (!user) return

    try {
      setError(null)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('location-images')
        .remove([image.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('location_images')
        .delete()
        .eq('id', image.id)

      if (dbError) throw dbError

      // Log activity
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Deleted image: "${image.file_name || 'Unknown'}"`
        })

      fetchImages()
    } catch (error: any) {
      console.error('Error deleting image:', error)
      setError(error.message)
    }
  }

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('location-images')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'

    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const togglePin = async (imageId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('toggle_image_pin', {
        p_image_id: imageId,
      })

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: data ? 'Fastgjorde et billede' : 'Fjernede fastgørelse af et billede',
        })

      fetchImages()
    } catch (error: any) {
      console.error('Error toggling pin:', error)
      setError(error.message)
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const navigateLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Billeder</h2>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />
          Upload billede
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] lg:w-full">
          <DialogHeader>
            <DialogTitle>Upload billede</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  Størrelse: {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Indtast billedtitel (valgfrit)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Beskriv dette billede... (valgfrit)"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                  setUploadTitle('')
                  setUploadDescription('')
                }}
              >
                Annuller
              </Button>
              <Button onClick={uploadImage} disabled={uploading}>
                {uploading ? 'Uploader...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Image Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] lg:w-full">
          <DialogHeader>
            <DialogTitle>Rediger billede</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingImage && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(editingImage.file_path)}
                  alt={editingImage.description || editingImage.file_name || 'Location image'}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Indtast billedtitel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Beskriv dette billede..."
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingImage(null)
                  setEditTitle('')
                  setEditDescription('')
                }}
              >
                Annuller
              </Button>
              <Button onClick={updateImage}>
                Gem ændringer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Images Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Ingen billeder uploadet endnu.</p>
            </CardContent>
          </Card>
        ) : (
          images.map((image, index) => (
            <Card
              key={image.id}
              className={`overflow-hidden transition-all ${
                image.is_pinned
                  ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
                  : ''
              }`}
            >
              {image.is_pinned && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 text-xs font-semibold flex items-center space-x-1">
                  <Pin className="w-3 h-3" />
                  <span>VIGTIGT</span>
                </div>
              )}
              <div
                className="aspect-square bg-gray-100 relative group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={getImageUrl(image.file_path)}
                  alt={image.description || image.file_name || 'Location image'}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
                  }}
                />
                {canManageLocations && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(image.id)
                    }}
                    variant={image.is_pinned ? 'default' : 'secondary'}
                    size="sm"
                    className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                      image.is_pinned
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-white/90 hover:bg-white'
                    }`}
                    title={image.is_pinned ? 'Fjern fastgørelse' : 'Fastgør som vigtigt'}
                  >
                    <Pin
                      className={`w-4 h-4 ${image.is_pinned ? 'fill-current' : ''}`}
                    />
                  </Button>
                )}
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {image.file_name && (
                    <h4 className="font-semibold text-sm">{image.file_name}</h4>
                  )}
                  {image.description && (
                    <p className="text-sm text-gray-600">{image.description}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1 mt-3">
                  <p>Uploadet af: {image.uploader?.full_name || 'Ukendt'}</p>
                  <p>Dato: {new Date(image.created_at).toLocaleDateString()}</p>
                  <p>Størrelse: {formatFileSize(image.file_size)}</p>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(image)
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Rediger
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteImage(image)
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        images={images}
        currentIndex={lightboxIndex}
        onNavigate={navigateLightbox}
        getImageUrl={getImageUrl}
      />
    </div>
  )
}