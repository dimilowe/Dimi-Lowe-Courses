import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getReplitStorageClient } from "@/lib/objectStorage/replitClient";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: "No filename provided" }, { status: 400 });
    }

    // Delete the file from object storage
    const deleteResult = await getReplitStorageClient().delete(filename);

    if (!deleteResult.ok) {
      console.error("Storage delete error:", deleteResult.error);
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
