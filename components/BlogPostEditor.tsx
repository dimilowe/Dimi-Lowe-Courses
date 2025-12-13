'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { ContentBlockInserter } from '@/components/ContentBlockInserter';
import { CategorySelector } from '@/components/CategorySelector';
import { FeaturedImageUploader } from '@/components/FeaturedImageUploader';
import { WYSIWYGEditor } from '@/components/WYSIWYGEditor';

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  published_at: Date | null;
  unlisted?: boolean;
}

interface BlogPostEditorProps {
  post?: BlogPost;
}

export function BlogPostEditor({ post }: BlogPostEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [metaDescription, setMetaDescription] = useState(post?.meta_description || '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url || '');
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [unlisted, setUnlisted] = useState(post?.unlisted || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(post ? new Date() : null);
  const [autoSaving, setAutoSaving] = useState(false);
  const router = useRouter();
  const editorInsertHtmlRef = useRef<((html: string) => void) | null>(null);
  const editorSavePositionRef = useRef<(() => void) | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing categories for this post
  useEffect(() => {
    if (post?.id) {
      loadPostCategories();
    }
  }, [post?.id]);

  // Autosave effect - triggers 3 seconds after user stops typing
  useEffect(() => {
    // Only autosave if we have an existing post (not a brand new draft)
    if (!post?.id) return;
    
    // Only autosave if there's content to save
    if (!content && !title) return;
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set a new timeout to autosave after 3 seconds of inactivity
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (loading || autoSaving) return;
      
      setAutoSaving(true);
      try {
        const res = await fetch(`/api/admin/blog/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Untitled Draft',
            slug: slug || generateSlug(title || 'untitled-draft'),
            content,
            excerpt: excerpt || null,
            meta_description: metaDescription || null,
            featured_image_url: featuredImageUrl || null,
            category_ids: selectedCategories,
            unlisted,
            save_only: true,
          }),
          credentials: 'include',
        });

        const data = await res.json();
        if (data.success) {
          setLastSaved(new Date());
        }
      } catch (err) {
        // Silently fail autosave - user can still manually save
        console.error('Autosave failed:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 3000); // 3 second delay

    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, excerpt, metaDescription, featuredImageUrl, selectedCategories, slug]);

  const loadPostCategories = async () => {
    if (!post?.id) return;
    try {
      const res = await fetch(`/api/admin/blog/${post.id}/categories`);
      const data = await res.json();
      setSelectedCategories(data.categoryIds || []);
    } catch (error) {
      console.error('Failed to load post categories:', error);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleInsertBlock = (html: string) => {
    console.log('handleInsertBlock called');
    // Insert at cursor position using Tiptap editor
    if (editorInsertHtmlRef.current) {
      editorInsertHtmlRef.current(html);
    } else {
      // Fallback: append to content if editor not ready
      setContent(content + '\n\n' + html + '\n\n');
    }
  };

  const handleBeforeInsert = () => {
    // Save the cursor position before opening modal
    if (editorSavePositionRef.current) {
      editorSavePositionRef.current();
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!post) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog';
      const method = post ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Draft',
          slug: slug || generateSlug(title || 'untitled-draft'),
          content,
          excerpt: excerpt || null,
          meta_description: metaDescription || null,
          featured_image_url: featuredImageUrl || null,
          category_ids: selectedCategories,
          unlisted,
          save_only: true,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setLastSaved(new Date());
        // If this was a NEW post, redirect to edit page with the new ID
        if (!post && data.postId) {
          router.push(`/admin/blog/edit/${data.postId}`);
          router.refresh();
        } else {
          // If editing existing post, stay on page and show success message
          setSuccess('Draft saved successfully! ✓');
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        setError(data.error || 'Failed to save draft');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog';
      const method = post ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt: excerpt || null,
          meta_description: metaDescription || null,
          featured_image_url: featuredImageUrl || null,
          published_at: publishedAt || new Date().toISOString(),
          category_ids: selectedCategories,
          unlisted,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        setError(data.error || 'Failed to publish');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[60vh] lg:min-h-0 lg:overflow-hidden">
        {/* Top Bar */}
        <div className="flex-shrink-0 border-b px-3 sm:px-6 py-3 flex items-center justify-between bg-white">
          <Link href="/admin/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {autoSaving && (
                <span className="text-xs text-gray-500 italic">Saving...</span>
              )}
              {!autoSaving && lastSaved && (
                <span className="text-xs text-gray-500">
                  Saved {formatTimeAgo(lastSaved)}
                </span>
              )}
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm"
              style={{
                border: '1px solid #d6d3d1',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#57534e',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#fafaf9';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <span className="hidden sm:inline">{post?.published_at ? 'Save' : 'Save Draft'}</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={loading || !title || !content}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm"
              style={{
                border: 'none',
                borderRadius: '6px',
                backgroundColor: loading || !title || !content ? '#d6d3d1' : '#2563eb',
                color: 'white',
                fontWeight: '600',
                cursor: loading || !title || !content ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseOver={(e) => {
                if (!loading && title && content) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && title && content) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
            >
              {publishedAt && new Date(publishedAt) > new Date() ? 'Schedule' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6 text-sm">
              {success}
            </div>
          )}

          {/* Title */}
          <div className="mb-4 sm:mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Add title"
              disabled={loading}
              className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Insert Toolbar */}
          <ContentBlockInserter 
            onInsert={handleInsertBlock}
            onBeforeInsert={handleBeforeInsert}
          />

          {/* WYSIWYG Editor - Shows actual rendered content like WordPress */}
          <WYSIWYGEditor
            content={content}
            onChange={setContent}
            onEditorReady={(insertFn, saveFn) => {
              editorInsertHtmlRef.current = insertFn;
              editorSavePositionRef.current = saveFn;
            }}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 lg:min-w-80 lg:max-w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l bg-white lg:overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
          {/* Publish Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Publish</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  {post?.published_at ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="pt-2">
                <label className="text-xs text-gray-600 block mb-1">Schedule for:</label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    disabled={loading}
                    className="text-sm flex-1"
                  />
                  {publishedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPublishedAt('')}
                      disabled={loading}
                      className="px-3"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {publishedAt ? 'Click Clear to publish immediately' : 'Leave empty to publish immediately'}
                </p>
              </div>
              <div className="pt-3 border-t mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unlisted}
                    onChange={(e) => setUnlisted(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium">Unlisted</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Hidden from newsletter page but still ranks in Google search
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Slug */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-sm">URL Slug</h3>
              <Input
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="Auto-generated from title..."
                disabled={loading}
                className="text-sm font-mono"
              />
              <p className="text-xs text-gray-500">
                Preview: /newsletter/{slug || 'auto-generated-from-title'}
              </p>
              <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                💡 Auto-generates from your title for SEO. Edit manually if needed.
              </p>
            </div>

            {/* Featured Image */}
            <div className="mb-6">
              <FeaturedImageUploader
                value={featuredImageUrl}
                onChange={setFeaturedImageUrl}
                disabled={loading}
              />
            </div>

            {/* Categories */}
            <div className="border-t pt-6 mb-6">
              <CategorySelector 
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
              />
            </div>

            {/* Excerpt - Collapsible */}
            <div className="border-t pt-6 mb-6">
              <button
                onClick={() => setExcerptOpen(!excerptOpen)}
                className="w-full flex items-center justify-between text-sm font-semibold mb-3"
              >
                <span>Excerpt</span>
                {excerptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {excerptOpen && (
                <div className="space-y-2">
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief summary for post listings..."
                    rows={3}
                    disabled={loading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Optional summary shown in post listings
                  </p>
                </div>
              )}
            </div>

            {/* SEO - Collapsible */}
            <div className="border-t pt-6">
              <button
                onClick={() => setSeoOpen(!seoOpen)}
                className="w-full flex items-center justify-between text-sm font-semibold mb-3"
              >
                <span>SEO Settings</span>
                {seoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {seoOpen && (
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 block">Meta Description</label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description for Google (150-160 chars)"
                    rows={3}
                    maxLength={160}
                    disabled={loading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    {metaDescription.length}/160 characters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
