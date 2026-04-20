'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Edit,
  Pin,
  Grid3x3,
  List,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileVideo,
  FileAudio,
  Archive,
  Download,
  X,
  Folder,
  FolderPlus,
  ChevronRight,
  Home
} from 'lucide-react'
import { ImageLightbox } from '@/components/ImageLightbox'

type LocationFile = {
  id: string
  location_id: string
  file_path: string
  file_name: string | null
  description: string | null
  file_size: number | null
  file_type: string | null
  mime_type: string | null
  uploaded_by: string
  created_at: string
  is_pinned: boolean
  pinned_at: string | null
  pinned_by: string | null
  folder_id: string | null
  uploader: {
    full_name: string
  }
}

type FileFolder = {
  id: string
  folder_name: string
  parent_folder_id: string | null
  folder_order: number
  file_count: number
  level: number
}

interface FilesTabProps {
  locationId: string
}

type ViewMode = 'grid' | 'list'

interface UploadingFile {
  file: File
  title: string
  description: string
  progress: number
  error: string | null
}

export function FilesTab({ locationId }: FilesTabProps) {
  const { user, canManageLocations, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<LocationFile[]>([])
  const [folders, setFolders] = useState<FileFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<LocationFile | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<LocationFile | null>(null)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchFiles()
    fetchFolders()
  }, [locationId, currentFolderId])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('location_images')
        .select(`
          *,
          uploader:profiles!uploaded_by(full_name)
        `)
        .eq('location_id', locationId)

      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId)
      } else {
        query = query.is('folder_id', null)
      }

      const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error: any) {
      console.error('Error fetching files:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase.rpc('get_folder_tree', {
        p_location_id: locationId
      })

      if (error) throw error
      setFolders(data || [])
    } catch (error: any) {
      console.error('Error fetching folders:', error)
    }
  }

  const getCurrentFolder = () => {
    return folders.find(f => f.id === currentFolderId)
  }

  const getBreadcrumbs = () => {
    const breadcrumbs: FileFolder[] = []
    let currentFolder = getCurrentFolder()

    while (currentFolder) {
      breadcrumbs.unshift(currentFolder)
      currentFolder = folders.find(f => f.id === currentFolder!.parent_folder_id)
    }

    return breadcrumbs
  }

  const getChildFolders = () => {
    return folders.filter(f => f.parent_folder_id === currentFolderId)
  }

  const createFolder = async () => {
    if (!user || !profile?.company_id || !newFolderName.trim()) return

    try {
      const { data, error } = await supabase.rpc('create_folder', {
        p_company_id: profile.company_id,
        p_location_id: locationId,
        p_folder_name: newFolderName.trim(),
        p_parent_folder_id: currentFolderId
      })

      if (error) throw error

      setSuccess('Mappe oprettet!')
      setIsCreateFolderModalOpen(false)
      setNewFolderName('')
      fetchFolders()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error creating folder:', error)
      setError(error.message)
    }
  }

  const getFileIcon = (file: LocationFile) => {
    const fileType = file.file_type?.toLowerCase() || ''
    const mimeType = file.mime_type?.toLowerCase() || ''

    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-8 h-8" />
    } else if (fileType === 'pdf' || mimeType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    } else if (['doc', 'docx'].includes(fileType) || mimeType.includes('word')) {
      return <FileText className="w-8 h-8 text-blue-500" />
    } else if (['xls', 'xlsx'].includes(fileType) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return <Archive className="w-8 h-8 text-yellow-600" />
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="w-8 h-8 text-purple-500" />
    } else if (mimeType.startsWith('audio/')) {
      return <FileAudio className="w-8 h-8 text-pink-500" />
    } else if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml'].includes(fileType)) {
      return <FileCode className="w-8 h-8 text-gray-600" />
    }

    return <File className="w-8 h-8 text-gray-500" />
  }

  const isImageFile = (file: LocationFile) => {
    return file.mime_type?.startsWith('image/') ||
           ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.file_type?.toLowerCase() || '')
  }

  const handleFileClick = (file: LocationFile, index: number) => {
    const now = Date.now()
    const timeDiff = now - lastClickTime

    if (lastClickedId === file.id && timeDiff < 300) {
      handleDoubleClick(file, index)
      setLastClickTime(0)
      setLastClickedId(null)
    } else {
      setSelectedFileForDetails(file)
      setLastClickTime(now)
      setLastClickedId(file.id)
    }
  }

  const handleDoubleClick = (file: LocationFile, index: number) => {
    if (isImageFile(file)) {
      openLightbox(index)
    } else {
      downloadFile(file)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length > 0) {
      const invalidFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError(`${invalidFiles.length} fil(er) er for store. Maksimal størrelse er 10MB pr. fil`)
        return
      }

      setUploadingFiles(selectedFiles.map(file => ({
        file,
        title: file.name,
        description: '',
        progress: 0,
        error: null
      })))
      setIsUploadModalOpen(true)
      setError(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const invalidFiles = droppedFiles.filter(f => f.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError(`${invalidFiles.length} fil(er) er for store. Maksimal størrelse er 10MB pr. fil`)
        return
      }

      setUploadingFiles(droppedFiles.map(file => ({
        file,
        title: file.name,
        description: '',
        progress: 0,
        error: null
      })))
      setIsUploadModalOpen(true)
      setError(null)
    }
  }

  const updateUploadingFile = (index: number, updates: Partial<UploadingFile>) => {
    setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!user || uploadingFiles.length === 0) return

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < uploadingFiles.length; i++) {
        const uploadFile = uploadingFiles[i]

        try {
          updateUploadingFile(i, { progress: 10 })

          const fileExt = uploadFile.file.name.split('.').pop()?.toLowerCase() || ''
          const fileName = `${locationId}/${Date.now()}_${i}.${fileExt}`

          updateUploadingFile(i, { progress: 30 })

          const { error: uploadError } = await supabase.storage
            .from('location-images')
            .upload(fileName, uploadFile.file)

          if (uploadError) throw uploadError

          updateUploadingFile(i, { progress: 60 })

          const validFolderId = currentFolderId && folders.some(f => f.id === currentFolderId)
            ? currentFolderId
            : null

          const { error: dbError } = await supabase
            .from('location_images')
            .insert({
              location_id: locationId,
              file_path: fileName,
              file_name: uploadFile.title || uploadFile.file.name,
              description: uploadFile.description || null,
              file_size: uploadFile.file.size,
              file_type: fileExt,
              mime_type: uploadFile.file.type,
              uploaded_by: user.id,
              folder_id: validFolderId
            })

          if (dbError) throw dbError

          updateUploadingFile(i, { progress: 90 })

          await supabase
            .from('location_activity')
            .insert({
              location_id: locationId,
              actor_id: user.id,
              action_text: `Uploadet fil: "${uploadFile.title || uploadFile.file.name}"`
            })

          updateUploadingFile(i, { progress: 100 })
          successCount++
        } catch (err: any) {
          console.error('Error uploading file:', err)
          updateUploadingFile(i, { error: err.message, progress: 0 })
          failCount++
        }
      }

      if (successCount > 0) {
        setSuccess(`${successCount} fil(er) uploadet!`)
        await fetchFiles()
      }
      if (failCount === 0) {
        setTimeout(() => {
          setIsUploadModalOpen(false)
          setUploadingFiles([])
        }, 1500)
      }
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error in upload process:', error)
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const openEditModal = (file: LocationFile) => {
    setEditingFile(file)
    setEditTitle(file.file_name || '')
    setEditDescription(file.description || '')
    setIsEditModalOpen(true)
  }

  const updateFile = async () => {
    if (!user || !editingFile) return

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_images')
        .update({
          file_name: editTitle || null,
          description: editDescription || null
        })
        .eq('id', editingFile.id)

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Opdaterede fil: "${editTitle || editingFile.file_name || 'Unknown'}"`
        })

      await fetchFiles()

      if (selectedFileForDetails?.id === editingFile.id) {
        setSelectedFileForDetails(prev => prev ? {
          ...prev,
          file_name: editTitle || null,
          description: editDescription || null
        } : null)
      }

      setSuccess('Fil opdateret!')
      setIsEditModalOpen(false)
      setEditingFile(null)
      setEditTitle('')
      setEditDescription('')

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating file:', error)
      setError(error.message)
    }
  }

  const deleteFile = async (file: LocationFile) => {
    if (!user) return

    if (!confirm(`Er du sikker på, at du vil slette "${file.file_name || 'denne fil'}"?`)) {
      return
    }

    try {
      setError(null)

      const { error: storageError } = await supabase.storage
        .from('location-images')
        .remove([file.file_path])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('location_images')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Slettede fil: "${file.file_name || 'Unknown'}"`
        })

      if (selectedFileForDetails?.id === file.id) {
        setSelectedFileForDetails(null)
      }

      await fetchFiles()
    } catch (error: any) {
      console.error('Error deleting file:', error)
      setError(error.message)
    }
  }

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('location-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const downloadFile = (file: LocationFile) => {
    const url = getFileUrl(file.file_path)
    const link = document.createElement('a')
    link.href = url
    link.download = file.file_name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'

    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const togglePin = async (fileId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('toggle_image_pin', {
        p_image_id: fileId,
      })

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: data ? 'Fastgjorde en fil' : 'Fjernede fastgørelse af en fil',
        })

      await fetchFiles()

      if (selectedFileForDetails?.id === fileId) {
        setSelectedFileForDetails(prev => prev ? {
          ...prev,
          is_pinned: data,
          pinned_at: data ? new Date().toISOString() : null,
          pinned_by: data ? user.id : null
        } : null)
      }
    } catch (error: any) {
      console.error('Error toggling pin:', error)
      setError(error.message)
    }
  }

  const openLightbox = (index: number) => {
    const imageFiles = files.filter(isImageFile)
    const imageIndex = imageFiles.findIndex(f => f.id === files[index].id)
    setLightboxIndex(imageIndex >= 0 ? imageIndex : 0)
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

  const imageFiles = files.filter(isImageFile)
  const childFolders = getChildFolders()

  return (
    <div
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-semibold">Slip filer her for at uploade</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-2 text-sm overflow-x-auto">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>Rod</span>
          </button>
          {getBreadcrumbs().map(folder => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className="px-2 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                {folder.folder_name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {canManageLocations && (
            <>
              <Button onClick={() => setIsCreateFolderModalOpen(true)} variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                Ny mappe
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opret ny mappe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Mappenavn</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Indtast mappenavn"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateFolderModalOpen(false)
                  setNewFolderName('')
                }}
              >
                Annuller
              </Button>
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                Opret mappe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload filer ({uploadingFiles.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadingFiles.map((uploadFile, index) => (
              <Card key={index} className={uploadFile.error ? 'border-red-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-gray-600 flex-shrink-0">
                      {uploadFile.file.type.startsWith('image/') ? (
                        <FileImage className="w-8 h-8" />
                      ) : (
                        <File className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{uploadFile.file.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                        {uploadFile.progress > 0 && uploadFile.progress < 100 && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                        )}
                        {uploadFile.progress === 100 && (
                          <div className="flex items-center text-green-600 text-sm mt-2">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Uploadet
                          </div>
                        )}
                        {uploadFile.error && (
                          <div className="flex items-center text-red-600 text-sm mt-2">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {uploadFile.error}
                          </div>
                        )}
                      </div>
                      {!uploading && (
                        <>
                          <Input
                            value={uploadFile.title}
                            onChange={(e) => updateUploadingFile(index, { title: e.target.value })}
                            placeholder="Filtitel"
                            disabled={uploadFile.progress > 0}
                          />
                          <Textarea
                            value={uploadFile.description}
                            onChange={(e) => updateUploadingFile(index, { description: e.target.value })}
                            placeholder="Beskrivelse (valgfrit)"
                            rows={2}
                            disabled={uploadFile.progress > 0}
                          />
                        </>
                      )}
                    </div>
                    {!uploading && uploadFile.progress === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {success && (
              <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                <CheckCircle className="w-4 h-4" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setUploadingFiles([])
                }}
                disabled={uploading}
              >
                {uploading ? 'Uploader...' : 'Annuller'}
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={uploading || uploadingFiles.length === 0 || uploadingFiles.some(f => f.progress === 100)}
              >
                {uploading ? 'Uploader...' : `Upload ${uploadingFiles.length} fil(er)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] lg:w-full">
          <DialogHeader>
            <DialogTitle>Rediger fil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingFile && isImageFile(editingFile) && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getFileUrl(editingFile.file_path)}
                  alt={editingFile.description || editingFile.file_name || 'File preview'}
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
                placeholder="Indtast filtitel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Beskriv denne fil..."
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingFile(null)
                  setEditTitle('')
                  setEditDescription('')
                }}
              >
                Annuller
              </Button>
              <Button onClick={updateFile}>
                Gem ændringer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && !isUploadModalOpen && (
        <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`flex-1 ${selectedFileForDetails ? 'lg:w-2/3' : 'w-full'}`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <Folder className="w-16 h-16 text-blue-500" />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm truncate">{folder.folder_name}</h4>
                      <p className="text-xs text-gray-500">{folder.file_count} fil(er)</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {files.length === 0 && childFolders.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center">
                    <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Ingen filer eller mapper endnu.</p>
                  </CardContent>
                </Card>
              ) : (
                files.map((file, index) => (
                  <Card
                    key={file.id}
                    className={`overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                      file.is_pinned
                        ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
                        : ''
                    } ${selectedFileForDetails?.id === file.id ? 'ring-2 ring-blue-400' : ''}`}
                    onClick={() => handleFileClick(file, index)}
                  >
                    {file.is_pinned && (
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 text-xs font-semibold flex items-center space-x-1">
                        <Pin className="w-3 h-3" />
                        <span>VIGTIGT</span>
                      </div>
                    )}
                    <div className="aspect-square bg-gray-100 relative group flex items-center justify-center">
                      {isImageFile(file) ? (
                        <img
                          src={getFileUrl(file.file_path)}
                          alt={file.description || file.file_name || 'File'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">
                          {getFileIcon(file)}
                        </div>
                      )}
                      {canManageLocations && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePin(file.id)
                          }}
                          variant={file.is_pinned ? 'default' : 'secondary'}
                          size="sm"
                          className={`absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                            file.is_pinned
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-white/90 hover:bg-white'
                          }`}
                        >
                          <Pin className={`w-4 h-4 ${file.is_pinned ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm truncate">
                          {file.file_name || 'Untitled'}
                        </h4>
                        {file.file_type && (
                          <p className="text-xs text-gray-500 uppercase">{file.file_type}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {childFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Folder className="w-12 h-12 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{folder.folder_name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{folder.file_count} fil(er)</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {files.length === 0 && childFolders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Ingen filer eller mapper endnu.</p>
                  </CardContent>
                </Card>
              ) : (
                files.map((file, index) => (
                  <Card
                    key={file.id}
                    className={`transition-all cursor-pointer hover:shadow-md ${
                      file.is_pinned ? 'bg-gradient-to-r from-amber-50 to-orange-50' : ''
                    } ${selectedFileForDetails?.id === file.id ? 'ring-2 ring-blue-400' : ''}`}
                    onClick={() => handleFileClick(file, index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-gray-600 flex-shrink-0">
                          {isImageFile(file) ? (
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={getFileUrl(file.file_path)}
                                alt={file.file_name || 'File'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            getFileIcon(file)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {file.is_pinned && (
                              <Pin className="w-4 h-4 text-amber-500 fill-current flex-shrink-0" />
                            )}
                            <h4 className="font-semibold text-sm truncate">
                              {file.file_name || 'Untitled'}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            {file.file_type && (
                              <span className="uppercase">{file.file_type}</span>
                            )}
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadFile(file)
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {selectedFileForDetails && (
          <div className="lg:w-1/3">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">Detaljer</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFileForDetails(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {isImageFile(selectedFileForDetails) && (
                  <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getFileUrl(selectedFileForDetails.file_path)}
                      alt={selectedFileForDetails.file_name || 'File preview'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{selectedFileForDetails.file_name || 'Untitled'}</h4>
                    {selectedFileForDetails.description && (
                      <p className="text-sm text-gray-600">{selectedFileForDetails.description}</p>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 pt-3 border-t">
                    <p><span className="font-medium">Type:</span> {selectedFileForDetails.file_type?.toUpperCase() || 'Unknown'}</p>
                    <p><span className="font-medium">Størrelse:</span> {formatFileSize(selectedFileForDetails.file_size)}</p>
                    <p><span className="font-medium">Uploadet af:</span> {selectedFileForDetails.uploader?.full_name || 'Ukendt'}</p>
                    <p><span className="font-medium">Dato:</span> {new Date(selectedFileForDetails.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-col space-y-2 pt-3 border-t">
                    <Button
                      onClick={() => downloadFile(selectedFileForDetails)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    {canManageLocations && (
                      <>
                        <Button
                          onClick={() => openEditModal(selectedFileForDetails)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Rediger
                        </Button>
                        <Button
                          onClick={() => deleteFile(selectedFileForDetails)}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Slet
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        images={imageFiles}
        currentIndex={lightboxIndex}
        onNavigate={navigateLightbox}
        getImageUrl={getFileUrl}
      />
    </div>
  )
}
