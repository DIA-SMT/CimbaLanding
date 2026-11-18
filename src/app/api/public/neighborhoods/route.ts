import { publicGet } from "@/lib/api";
import { getDataSource } from "@/services";

export const revalidate = 3600;

export async function GET() {
  return publicGet(async () => ({ data: await getDataSource().listNeighborhoods() }));
}
