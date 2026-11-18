import { publicGet } from "@/lib/api";
import { getDataSource } from "@/services";

export const revalidate = 120;

export async function GET() {
  return publicGet(async () => {
    const data = await getDataSource().getSummary();
    return { data, updatedAt: data.updatedAt };
  });
}
