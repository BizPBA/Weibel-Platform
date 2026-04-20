import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderTemplate {
  id: string;
  company_id: string;
  folder_name: string;
  parent_folder_id: string | null;
  folder_order: number;
  created_at: string;
  updated_at: string;
}

interface FolderTreeNode extends FolderTemplate {
  children: FolderTreeNode[];
  level: number;
}

export function FolderTemplateManager() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<FolderTemplate[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.company_id) {
      fetchTemplates();
    }
  }, [profile?.company_id]);

  useEffect(() => {
    buildFolderTree();
  }, [templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('location_folder_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('folder_order')
        .order('folder_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = () => {
    const buildTree = (parentId: string | null, level: number = 0): FolderTreeNode[] => {
      return templates
        .filter((t) => t.parent_folder_id === parentId)
        .map((template) => ({
          ...template,
          level,
          children: buildTree(template.id, level + 1),
        }))
        .sort((a, b) => a.folder_order - b.folder_order || a.folder_name.localeCompare(b.folder_name));
    };

    setFolderTree(buildTree(null));
  };

  const createTemplate = async (folderName: string, parentId: string | null = null) => {
    try {
      if (!profile?.company_id || !folderName.trim()) return;

      setError(null);

      const maxOrder = templates
        .filter((t) => t.parent_folder_id === parentId)
        .reduce((max, t) => Math.max(max, t.folder_order), -1);

      const { error } = await supabase
        .from('location_folder_templates')
        .insert({
          company_id: profile.company_id,
          folder_name: folderName.trim(),
          parent_folder_id: parentId,
          folder_order: maxOrder + 1,
        });

      if (error) throw error;

      setSuccess('Mappeskabelon oprettet og synkroniseret til alle lokationer!');
      setNewFolderName('');
      setAddingToParentId(null);
      await fetchTemplates();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.message);
    }
  };

  const updateTemplate = async (id: string, newName: string) => {
    try {
      if (!newName.trim()) return;

      setError(null);

      const { error } = await supabase
        .from('location_folder_templates')
        .update({ folder_name: newName.trim() })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Mappeskabelon opdateret og synkroniseret til alle lokationer!');
      setEditingId(null);
      setEditingName('');
      await fetchTemplates();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.message);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne mappeskabelon? Den vil blive fjernet fra alle lokationer.')) {
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('location_folder_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Mappeskabelon slettet fra alle lokationer!');
      await fetchTemplates();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message);
    }
  };

  const manualSync = async () => {
    if (!confirm('Dette vil synkronisere alle mappeskabeloner til alle lokationer. Vil du fortsætte?')) {
      return;
    }

    try {
      setSyncing(true);
      setError(null);

      if (!profile?.company_id) return;

      const { error } = await supabase.rpc('sync_folder_templates_to_all_locations', {
        p_company_id: profile.company_id,
      });

      if (error) throw error;

      setSuccess('Alle lokationer er synkroniseret med mappeskabeloner!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error syncing templates:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const startEditing = (folder: FolderTemplate) => {
    setEditingId(folder.id);
    setEditingName(folder.folder_name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const startAdding = (parentId: string | null) => {
    setAddingToParentId(parentId);
    setNewFolderName('');
  };

  const cancelAdding = () => {
    setAddingToParentId(null);
    setNewFolderName('');
  };

  const renderFolderNode = (node: FolderTreeNode) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children.length > 0;
    const isEditing = editingId === node.id;
    const isAddingChild = addingToParentId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group',
            node.level > 0 && 'ml-6'
          )}
        >
          {hasChildren && (
            <button
              onClick={() => toggleFolder(node.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <Folder className="h-4 w-4 text-blue-600" />

          {isEditing ? (
            <>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateTemplate(node.id, editingName);
                  if (e.key === 'Escape') cancelEditing();
                }}
                className="h-8 flex-1"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateTemplate(node.id, editingName)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEditing}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">{node.folder_name}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startAdding(node.id)}
                  className="h-8 w-8 p-0"
                  title="Tilføj undermappe"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(node)}
                  className="h-8 w-8 p-0"
                  title="Rediger"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTemplate(node.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Slet"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isAddingChild && (
          <div className={cn('flex items-center gap-2 p-2 rounded-md ml-6', node.level > 0 && 'ml-12')}>
            <div className="w-5" />
            <Folder className="h-4 w-4 text-gray-400" />
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createTemplate(newFolderName, node.id);
                if (e.key === 'Escape') cancelAdding();
              }}
              placeholder="Mappenavn"
              className="h-8 flex-1"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => createTemplate(newFolderName, node.id)}
              className="h-8 w-8 p-0"
              disabled={!newFolderName.trim()}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelAdding}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}

        {isExpanded && hasChildren && (
          <div className="ml-3">{node.children.map((child) => renderFolderNode(child))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Globale Mappeskabeloner</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Definer en standard mappestruktur der automatisk anvendes på alle lokationer
              </p>
            </div>
            <Button onClick={manualSync} disabled={syncing} variant="outline">
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Synkroniserer...
                </>
              ) : (
                'Synkroniser nu'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
            <p className="font-medium mb-2">Sådan fungerer det:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Mapper du opretter her vil automatisk blive tilføjet til alle lokationer</li>
              <li>Ændringer til skabeloner synkroniseres automatisk til alle lokationer</li>
              <li>Medarbejdere kan tilføje yderligere mapper på individuelle lokationer</li>
              <li>Skabelonmapper kan ikke slettes fra individuelle lokationer</li>
            </ul>
          </div>

          <div className="border rounded-md p-4 min-h-[200px]">
            {folderTree.length === 0 && addingToParentId !== null ? null : folderTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Folder className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-sm">Ingen mappeskabeloner endnu</p>
                <p className="text-xs text-gray-400 mt-1">Klik på "Tilføj rodmappe" for at komme i gang</p>
              </div>
            ) : (
              <div className="space-y-1">{folderTree.map((node) => renderFolderNode(node))}</div>
            )}

            {addingToParentId === null && (
              <div className="flex items-center gap-2 p-2 rounded-md mt-2">
                <div className="w-5" />
                <Folder className="h-4 w-4 text-gray-400" />
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createTemplate(newFolderName, null);
                    if (e.key === 'Escape') setNewFolderName('');
                  }}
                  placeholder="Tilføj rodmappe..."
                  className="h-8 flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => createTemplate(newFolderName, null)}
                  className="h-8"
                  disabled={!newFolderName.trim()}
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Tilføj
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
