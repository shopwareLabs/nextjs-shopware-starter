import clsx from "clsx";
import { Suspense } from "react";

import { getSubCollections } from "lib/shopware";
import { transformCollectionToList } from "lib/shopware/transform";
import FilterList from "./filter";

async function CollectionList(params: { collection: string }) {
  const { collection: collectionName } = await params;
  if (!collectionName) return;

  const collections = await getSubCollections(collectionName);
  if (collections) {
    const list = transformCollectionToList(collections);
    if (list.length > 0) return <FilterList list={list} title="Sub-Collections" />;
  }
}

const skeleton = "mb-3 h-4 w-5/6 animate-pulse rounded-sm";
const activeAndTitles = "bg-neutral-800 dark:bg-neutral-300";
const items = "bg-neutral-400 dark:bg-neutral-700";

export default async function Collections(params: { collection: string }) {
  const { collection } = await params;
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CollectionList collection={collection} />
    </Suspense>
  );
}
