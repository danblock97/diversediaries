// components/TiptapEditor.jsx
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    BoldIcon, ItalicIcon, Heading1Icon, Heading2Icon, ListIcon,
    ListOrderedIcon, QuoteIcon, ImageIcon
} from '@/components/EditorIcons'

const MenuBar = ({ editor }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // Move hooks outside of conditional logic
    // components/TiptapEditor.jsx - update the handleImageUpload function

    const handleImageUpload = useCallback(async (file) => {
        if (!editor || !file) return

        try {
            setIsUploading(true)

            // Create a unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
            const filePath = `post-images/${fileName}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file)

            if (error) {
                console.error('Storage upload error:', error)
                throw error
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(filePath)

            if (!urlData || !urlData.publicUrl) {
                throw new Error('Failed to get public URL for uploaded image')
            }

            // Insert image into editor
            editor.chain().focus().setImage({ src: urlData.publicUrl }).run()

        } catch (error) {
            console.error('Error uploading image:', error.message || 'Unknown error')
            alert('Failed to upload image. Please try again.')
            setUploadError(error.message || 'Upload failed. Please try again.')
            // Add a setTimeout to clear the error after 5 seconds
            setTimeout(() => setUploadError(''), 5000)
        } finally {
            setIsUploading(false)
        }
    }, [editor])

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0]
        if (file) {
            handleImageUpload(file)
        }
        // Reset file input
        e.target.value = ''
    }, [handleImageUpload])

    if (!editor) return null

    return (
        <div className="flex flex-wrap items-center border-b border-gray-200 p-3 gap-1 bg-white sticky top-0 z-10">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                type="button"
                title="Bold"
            >
                <BoldIcon />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                type="button"
                title="Italic"
            >
                <ItalicIcon />
            </button>
            <div className="h-6 mx-1 border-r border-gray-300" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                type="button"
                title="Heading 1"
            >
                <Heading1Icon />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                type="button"
                title="Heading 2"
            >
                <Heading2Icon />
            </button>
            <div className="h-6 mx-1 border-r border-gray-300" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                type="button"
                title="Bullet List"
            >
                <ListIcon />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                type="button"
                title="Numbered List"
            >
                <ListOrderedIcon />
            </button>
            <div className="h-6 mx-1 border-r border-gray-300" />
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
                type="button"
                title="Quote"
            >
                <QuoteIcon />
            </button>
            <button
                onClick={() => fileInputRef.current.click()}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${isUploading ? 'bg-gray-200' : ''}`}
                disabled={isUploading}
                type="button"
                title="Upload Image"
            >
                <ImageIcon />
                {isUploading && <span className="ml-1 text-xs">Uploading...</span>}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />
            {uploadError && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 text-sm rounded-md">
                    {uploadError}
                </div>
            )}
        </div>
    )
}

const TiptapEditor = ({ value, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'mx-auto rounded-md max-w-full',
                },
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none w-full min-h-[300px] p-5',
            },
        },
    })

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent
                editor={editor}
                className="prose prose-lg max-w-none cursor-text"
            />
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-white shadow-lg rounded-md overflow-hidden flex border border-gray-200">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                        type="button"
                    >
                        <BoldIcon />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                        type="button"
                    >
                        <ItalicIcon />
                    </button>
                </BubbleMenu>
            )}
        </div>
    )
}

export default TiptapEditor