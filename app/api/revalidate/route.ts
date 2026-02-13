import { revalidate } from "lib/shopware";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return revalidate();
}
