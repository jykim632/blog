"use client";

import { RefObject } from "react";
import dynamic from "next/dynamic";
import ReactQuill, { ReactQuillProps } from "react-quill";

const BlogEditor = dynamic(() => import("./editor").then(module => module.BlogEditor), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

export function WrapperBlogEditor({editorRef, ...props}: {editorRef: RefObject<ReactQuill>} & ReactQuillProps){

  return <BlogEditor editorRef={editorRef} {...props} />
}