import 'react-quill/dist/quill.snow.css';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import { RefObject } from 'react';

export const BlogEditor = ({editorRef, ...props}: {editorRef: RefObject<ReactQuill>} & ReactQuillProps) => {
  return <ReactQuill theme="snow" ref={editorRef} {...props} />
};

BlogEditor.displayName = "BlogEditor";