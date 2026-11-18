import { badRequest, parseQuery, publicGet } from "@/lib/api";
import { interventionsQuerySchema } from "@/domain/schemas";
import { getDataSource } from "@/services";

export async function GET(req: Request) {
  const parsed = parseQuery(interventionsQuerySchema, req.url);
  if (!parsed.success) return badRequest();
  return publicGet(async () => {
    const data = await getDataSource().listInterventions(parsed.data);
    return { data, updatedAt: data.map((d) => d.updatedAt).sort().at(-1) ?? null };
  });
}
