'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Paperclip, Download, AlertCircle, CheckCircle } from 'lucide-react'

type Comment = {
  id: string
  location_id: string
  user_id: string
  content: string
  created_at: string
  user: {
    full_name: string
  }
  files: CommentFile[]
}

type CommentFile = {
  id: string
  comment_id: string
  file_path: string
  file_name: string
  file_size: number
  created_at: string
}

interface ActivityTabProps {
  locationId: string
}

export function ActivityTab({ locationId }: ActivityTabProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    fetchActivityData()
  }, [locationId])

  const fetchActivityData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('ActivityTab: Fetching activity data for location:', locationId)

      // Fetch comments with files
      console.log('ActivityTab: Fetching comments...')
      const { data: commentsData, error: commentsError } = await supabase
        .from('location_comments')
        .select(`
          *,
          user:profiles(full_name),
          files:location_comment_files(*)
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('ActivityTab: Error fetching comments:', commentsError)
        throw commentsError
      }
      
      console.log('ActivityTab: Comments fetched successfully:', commentsData?.length || 0, 'comments')

      // Fetch activity log
      console.log('ActivityTab: Fetching activity log...')
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('location_activity')
        .select(`
          *,
          actor:profiles(full_name)
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: true })

      if (activitiesError) {
        console.error('ActivityTab: Error fetching activities:', activitiesError)
        throw activitiesError
      }
      
      console.log('ActivityTab: Activities fetched successfully:', activitiesData?.length || 0, 'activities')

      setComments(commentsData || [])
      setActivities(activitiesData || [])
      
      console.log('ActivityTab: All activity data loaded successfully')
    } catch (error: any) {
      console.error('Error fetching activity data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const postComment = async () => {
    if (!user || (!newComment.trim() && selectedFiles.length === 0)) return

    try {
      setPosting(true)
      setError(null)
      setSuccess(null)

      // Create comment
      const { data: comment, error: commentError } = await supabase
        .from('location_comments')
        .insert({
          location_id: locationId,
          user_id: user.id,
          content: newComment.trim() || 'File attachment'
        })
        .select()
        .single()

      if (commentError) throw commentError

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Upload to storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${locationId}/comments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('location-files')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // Save file record
          const { error: fileError } = await supabase
            .from('location_comment_files')
            .insert({
              comment_id: comment.id,
              file_path: fileName,
              file_name: file.name,
              file_size: file.size
            })

          if (fileError) throw fileError
        }
      }

      // Log activity
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: selectedFiles.length > 0 
            ? `Posted comment with ${selectedFiles.length} file(s)`
            : 'Posted comment'
        })

      setNewComment('')
      setSelectedFiles([])
      setSuccess('Comment posted successfully!')
      fetchActivityData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error posting comment:', error)
      setError(error.message)
    } finally {
      setPosting(false)
    }
  }

  const downloadFile = async (file: CommentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('location-files')
        .download(file.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading file:', error)
      setError(`Failed to download ${file.file_name}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Combine and sort comments and activities
  const combinedTimeline = [
    ...comments.map(comment => ({ ...comment, type: 'comment' })),
    ...activities.map(activity => ({ ...activity, type: 'activity' }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Post Comment Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment or update..."
              rows={3}
            />
            
            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attached files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <Button
                onClick={postComment}
                disabled={posting || (!newComment.trim() && selectedFiles.length === 0)}
              >
                <Send className="w-4 h-4 mr-2" />
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Timeline */}
      <div className="space-y-4">
        {combinedTimeline.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No activity yet.</p>
            </CardContent>
          </Card>
        ) : (
          combinedTimeline.map((item, index) => (
            <Card key={`${item.type}-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-100 text-primary-600">
                      {item.type === 'comment' 
                        ? item.user?.full_name?.charAt(0).toUpperCase() || 'U'
                        : item.actor?.full_name?.charAt(0).toUpperCase() || 'S'
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {item.type === 'comment' 
                          ? item.user?.full_name || 'Unknown User'
                          : item.actor?.full_name || 'System'
                        }
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {item.type === 'comment' ? (
                      <div>
                        <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                        
                        {/* Comment Files */}
                        {item.files && item.files.length > 0 && (
                          <div className="space-y-2">
                            {item.files.map((file: CommentFile) => (
                              <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div>
                                  <p className="text-sm font-medium">{file.file_name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                                </div>
                                <Button
                                  onClick={() => downloadFile(file)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">{item.action_text}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}