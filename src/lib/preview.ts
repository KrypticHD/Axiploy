import { cookies } from "next/headers";

export async function isEmptyPreview(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("axiploy_empty_preview")?.value === "true";
}
