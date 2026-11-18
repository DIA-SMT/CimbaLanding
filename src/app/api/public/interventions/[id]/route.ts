import { NextResponse } from "next/server";
import { NotFoundError, publicGet } from "@/lib/api";
import { getDataSource } from "@/services";

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) {
    return NextResponse.json({ error: { code: "invalid_id", message: "Identificador inválido" } }, { status: 400 });
  }
  return publicGet(async () => {
    const data = await getDataSource().getIntervention(id);
    if (!data) throw new NotFoundError();
    return { data, updatedAt: data.updatedAt };
  });
}
