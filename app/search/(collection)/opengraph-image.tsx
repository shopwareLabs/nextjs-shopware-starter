import OpengraphImage from "components/opengraph-image";
import { getCollection } from "lib/shopware";

export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: { collection: string[] } }) {
  const collectionPath = params.collection
    ? Array.isArray(params.collection)
      ? params.collection.join("/")
      : ""
    : "";
  const collection = collectionPath !== "" ? await getCollection(collectionPath) : null;
  const title = collection?.seo?.title || collection?.title || "";

  return await OpengraphImage({ title });
}
