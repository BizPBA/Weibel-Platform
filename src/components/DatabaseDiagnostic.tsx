import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DatabaseDiagnostic() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    const diagnosticResults: any = {}

    try {
      // Test 1: Check if location_comments table exists
      console.log('🔍 Testing location_comments table...')
      const { data: commentsTest, error: commentsError } = await supabase
        .from('location_comments')
        .select('count')
        .limit(1)
      
      diagnosticResults.commentsTable = {
        exists: !commentsError,
        error: commentsError?.message
      }

      // Test 2: Check if location_comment_files table exists
      console.log('🔍 Testing location_comment_files table...')
      const { data: filesTest, error: filesError } = await supabase
        .from('location_comment_files')
        .select('count')
        .limit(1)
      
      diagnosticResults.filesTable = {
        exists: !filesError,
        error: filesError?.message
      }

      // Test 3: Check profiles relationship
      console.log('🔍 Testing profiles relationship...')
      const { data: profilesTest, error: profilesError } = await supabase
        .from('location_comments')
        .select('id, user:profiles(full_name)')
        .limit(1)
      
      diagnosticResults.profilesRelation = {
        works: !profilesError,
        error: profilesError?.message
      }

      // Test 4: Check location_images columns
      console.log('🔍 Testing location_images columns...')
      const { data: imagesTest, error: imagesError } = await supabase
        .from('location_images')
        .select('id, description, file_name, file_size')
        .limit(1)
      
      diagnosticResults.imagesColumns = {
        works: !imagesError,
        error: imagesError?.message
      }

      // Test 5: Check storage buckets
      console.log('🔍 Testing storage buckets...')
      
      // Test if we can access the specific buckets we need
      const locationImagesTest = await supabase.storage.from('location-images').list('', { limit: 1 })
      const locationFilesTest = await supabase.storage.from('location-files').list('', { limit: 1 })
      
      diagnosticResults.storageBuckets = {
        hasLocationImages: !locationImagesTest.error,
        hasLocationFiles: !locationFilesTest.error,
        locationImagesError: locationImagesTest.error?.message,
        locationFilesError: locationFilesTest.error?.message,
        note: "Testing bucket access instead of listing all buckets"
      }

      console.log('✅ Diagnostic complete:', diagnosticResults)
      setResults(diagnosticResults)

    } catch (error: any) {
      console.error('❌ Diagnostic failed:', error)
      diagnosticResults.generalError = error.message
      setResults(diagnosticResults)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Setup Diagnostic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? 'Running Diagnostic...' : 'Run Database Diagnostic'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Comments Table */}
              <div className={`p-4 rounded-lg ${results.commentsTable?.exists ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className="font-semibold">location_comments Table</h3>
                <p className={results.commentsTable?.exists ? 'text-green-700' : 'text-red-700'}>
                  {results.commentsTable?.exists ? '✅ Exists' : '❌ Missing'}
                </p>
                {results.commentsTable?.error && (
                  <p className="text-sm text-red-600 mt-1">{results.commentsTable.error}</p>
                )}
              </div>

              {/* Files Table */}
              <div className={`p-4 rounded-lg ${results.filesTable?.exists ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className="font-semibold">location_comment_files Table</h3>
                <p className={results.filesTable?.exists ? 'text-green-700' : 'text-red-700'}>
                  {results.filesTable?.exists ? '✅ Exists' : '❌ Missing'}
                </p>
                {results.filesTable?.error && (
                  <p className="text-sm text-red-600 mt-1">{results.filesTable.error}</p>
                )}
              </div>

              {/* Profiles Relationship */}
              <div className={`p-4 rounded-lg ${results.profilesRelation?.works ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className="font-semibold">Profiles Relationship</h3>
                <p className={results.profilesRelation?.works ? 'text-green-700' : 'text-red-700'}>
                  {results.profilesRelation?.works ? '✅ Working' : '❌ Broken'}
                </p>
                {results.profilesRelation?.error && (
                  <p className="text-sm text-red-600 mt-1">{results.profilesRelation.error}</p>
                )}
              </div>

              {/* Images Columns */}
              <div className={`p-4 rounded-lg ${results.imagesColumns?.works ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className="font-semibold">location_images Columns</h3>
                <p className={results.imagesColumns?.works ? 'text-green-700' : 'text-red-700'}>
                  {results.imagesColumns?.works ? '✅ Updated' : '❌ Missing Columns'}
                </p>
                {results.imagesColumns?.error && (
                  <p className="text-sm text-red-600 mt-1">{results.imagesColumns.error}</p>
                )}
              </div>
            </div>

            {/* Storage Buckets */}
            <div className="p-4 rounded-lg bg-blue-50">
              <h3 className="font-semibold">Storage Buckets</h3>
              <div className="mt-2 space-y-1">
                <p>Available buckets: {results.storageBuckets?.buckets?.join(', ') || 'None'}</p>
                <p className={results.storageBuckets?.hasLocationImages ? 'text-green-700' : 'text-red-700'}>
                  location-images: {results.storageBuckets?.hasLocationImages ? '✅' : '❌ Missing'}
                </p>
                <p className={results.storageBuckets?.hasLocationFiles ? 'text-green-700' : 'text-red-700'}>
                  location-files: {results.storageBuckets?.hasLocationFiles ? '✅' : '❌ Missing'}
                </p>
              </div>
              {results.storageBuckets?.error && (
                <p className="text-sm text-red-600 mt-1">{results.storageBuckets.error}</p>
              )}
            </div>

            {results.generalError && (
              <div className="p-4 rounded-lg bg-red-50">
                <h3 className="font-semibold text-red-700">General Error</h3>
                <p className="text-red-600">{results.generalError}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}