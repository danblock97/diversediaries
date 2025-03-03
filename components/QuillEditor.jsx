import React, { useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import ReactQuill to ensure it runs only in the browser
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const QuillEditor = ({ value, onChange }) => {
  const [editorHtml, setEditorHtml] = useState(value || "");
  const quillRef = useRef(null);

  // Standard onChange handler: update local state and notify parent component
  const handleChange = (content) => {
    setEditorHtml(content);
    onChange && onChange(content);
  };

  // Use useCallback so that imageHandler doesn't get recreated on every render
  const imageHandler = useCallback(async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

        // Upload the file to your "media" bucket in Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file);
        if (uploadError) {
          console.error("Error uploading image:", uploadError.message);
          return;
        }

        // Get the public URL for the uploaded file - FIX HERE
        const { data } = supabase.storage.from("media").getPublicUrl(filePath);

        // Get the correct publicUrl from the data object
        const publicUrl = data.publicUrl;

        // Insert the image at the current cursor position
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        if (range) {
          quill.insertEmbed(range.index, "image", publicUrl);
        } else {
          quill.insertEmbed(quill.getLength(), "image", publicUrl);
        }
      }
    };
  }, []);

  // Memoize the modules object so it's not recreated on every render
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  // Memoize formats as well
  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "list", "link", "image"],
    [],
  );

  return (
    <div className="quill-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default QuillEditor;
