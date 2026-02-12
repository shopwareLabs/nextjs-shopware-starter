import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Pagination from "components/collection/pagination";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";

import { defaultSort, sorting } from "lib/constants";
import { getCollection, getCollectionProducts } from "lib/shopware";
import { transformHandle } from "lib/shopware/transform";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection: collectionParamName } = await params;

  // see https://github.com/facebook/react/issues/25994
  const collectionName = decodeURIComponent(transformHandle(collectionParamName ?? ""));
  if (collectionName.includes(".js.map")) {
    return {};
  }

  const collection = await getCollection(collectionName);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description || collection.description || `${collection.title} products`,
    openGraph: collection.featuredImage
      ? {
          images: [
            {
              url: collection.featuredImage,
            },
          ],
        }
      : null,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { collection } = await params;
  const { sort, page } = (await searchParams) as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  // see https://github.com/facebook/react/issues/25994
  const collectionName = decodeURIComponent(transformHandle(collection ?? ""));
  if (collectionName.includes(".js.map")) {
    return null;
  }

  const { products, total, limit } = await getCollectionProducts({
    collection: collectionName,
    page: page ? Number.parseInt(page) : 1,
    sortKey,
    reverse,
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">No products found in this collection</p>
      ) : (
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 pb-4 text-black md:flex-row dark:text-white">
          <div className="order-first w-full flex-none md:max-w-[125px]">
            <Collections collection={collection} />
          </div>
          <div className="order-last min-h-screen w-full md:order-none">
            <Grid className="grid-cols-2 lg:grid-cols-3">
              <ProductGridItems products={products} />
            </Grid>
            {total > limit ? (
              <nav
                aria-label="Collection pagination"
                className="mb-2 mt-4 block items-center sm:flex"
              >
                <Pagination
                  itemsPerPage={limit}
                  itemsTotal={total}
                  currentPage={page ? Number.parseInt(page) - 1 : 0}
                />
              </nav>
            ) : null}
          </div>
          <div className="order-none flex-none md:order-last md:w-[125px]">
            <FilterList list={sorting} title="Sort by" />
          </div>
        </div>
      )}
    </section>
  );
}
