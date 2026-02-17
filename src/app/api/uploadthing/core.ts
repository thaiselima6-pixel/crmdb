import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
 imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    const userId = (session.user as { id: string }).id;
    return { userId };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata.userId);
    console.log("File URL", file.url);
    return { uploadedBy: metadata.userId };
  }),

projectAttachment: f(["image", "pdf", "text", "blob"])
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    const userId = (session.user as { id: string }).id;
    return { userId };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Attachment uploaded:", file.url);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
