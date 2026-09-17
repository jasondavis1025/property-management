import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDocumentForTenant } from "@/lib/data/tenant";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "tenant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const doc = await getDocumentForTenant(id, session.userId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "storage", "documents", doc.storageKey);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on server" }, { status: 404 });
  }
}
