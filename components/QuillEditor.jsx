// components/QuillEditor.jsx
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const QuillEditor = ({ value, onChange }) => {
  const [editorHtml, setEditorHtml] = useState(value || "");
  const quillRef = useRef(null);

  const handleChange = (content) => {
    setEditorHtml(content);
    onChange(content);
  };

  // Configure modules and formats for the toolbar
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }], // This is fine for the toolbar
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "link",
    "image",
  ];

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
