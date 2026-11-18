import { badRequest, parseQuery, publicGet } from "@/lib/api";
import { closuresQuerySchema } from "@/domain/schemas";
import { getDataSource } from "@/services";

export async function GET(req: Request) {
  const parsed = parseQuery(closuresQuerySchema, req.url);
  if (!parsed.success) return badRequest();
  return publicGet(async () => {
    const data = await getDataSource().listClosures(parsed.data);
    return { data, updatedAt: data.map((d) => d.updatedAt).sort().at(-1) ?? null };
  });
}
