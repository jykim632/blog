"use client";

import { z } from "zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill";
import { useRouter } from "next/navigation";
import { WrapperBlogEditor } from "@/app/_shards/post/ui"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPost } from "../api/posts";
import { revalidateTag } from "next/cache";

const formSchema = z.object({
  title: z.string().min(5).max(100),
})

export const PostEditorWidget = () => {
  const {push} = useRouter();
  const editorRef = useRef<ReactQuill>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:{
      title: "제목"
    }
  })

  const onSubmit = async ({title}: z.infer<typeof formSchema>) => {
    if(editorRef?.current){
      console.log(editorRef.current.value);
      try {
        await createPost({title, content: editorRef.current.value as string});
        push('/');
      } catch (error) {
        console.error("작성 실패");
      }
    }
  }
  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <FormField control={form.control} name="title" render={({field}) => <FormItem>
        <FormItem>
          <FormLabel>
            제목
          </FormLabel>
          <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
        </FormItem>
      </FormItem>}/>
      <div>
        <WrapperBlogEditor editorRef={editorRef} style={{height:500, marginBottom: 50}} />
      </div>
      <Button type="submit">
        저장
      </Button>
    </form>
  </Form>
}