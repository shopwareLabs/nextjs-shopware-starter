"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { createUrl } from "lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  itemsPerPage,
  itemsTotal,
  currentPage,
}: {
  itemsPerPage: number;
  itemsTotal: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const q = currentParams.get("q");
  const sort = currentParams.get("sort");
  const pageCount = Math.ceil(itemsTotal / itemsPerPage);

  // Invoke when user click to request another page. test
  const handlePageClick = (page: number) => {
    const newPage = Math.ceil(page + 1);
    let newUrl = createUrl(
      pathname,
      new URLSearchParams({
        ...(q && { q }),
        ...(sort && { sort }),
      }),
    );
    if (page !== 0) {
      newUrl = createUrl(
        pathname,
        new URLSearchParams({
          ...(q && { q }),
          ...(sort && { sort }),
          page: newPage.toString(),
        }),
      );
    }
    router.replace(newUrl);
  };

  return (
    <nav className="mx-auto inline h-10 text-base sm:flex list-none" aria-label="Pagination">
      {currentPage > 0 && (
        <li
          key={`${currentPage}-prev`}
          onClick={() => handlePageClick(currentPage - 1)}
          onKeyUp={(e) => e.key === "Enter" && handlePageClick(currentPage - 1)}
          onKeyDown={(e) => e.key === "Enter" && handlePageClick(currentPage - 1)}
          className="m-2 cursor-pointer rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:m-0 sm:mx-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <span
            className="ml-0 flex h-10 items-center justify-center px-4 leading-tight"
            aria-label="Previous page"
            data-selected={currentPage}
          >
            <ArrowLeftIcon className="h-5" />
          </span>
        </li>
      )}
      {Array.from({ length: pageCount }, (_, i) => (
        <li
          key={`page-${i + 1}`}
          onKeyUp={(e) => e.key === "Enter" && handlePageClick(i)}
          onClick={() => handlePageClick(i)}
          className={`m-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:m-0 sm:mx-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white [&.active]:bg-gray-100 cursor-pointer${
            i === currentPage ? "active" : ""
          }`}
        >
          <span
            className={`ml-0 flex h-10 items-center justify-center px-4 leading-tight${
              i === currentPage ? " font-bold" : ""
            }`}
            aria-label={`Goto Page ${i + 1}`}
            aria-current={i === currentPage}
            data-selected={i}
          >
            {i + 1}
          </span>
        </li>
      ))}
      {currentPage < pageCount - 1 && (
        <li
          onClick={() => handlePageClick(currentPage + 1)}
          onKeyUp={(e) => e.key === "Enter" && handlePageClick(currentPage + 1)}
          onKeyDown={(e) => e.key === "Enter" && handlePageClick(currentPage + 1)}
          className="m-2 cursor-pointer rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:m-0 sm:mx-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <span
            className="ml-0 flex h-10 items-center justify-center px-4 leading-tight"
            aria-label="Next page"
            data-selected={currentPage + 1}
          >
            <ArrowRightIcon className="h-5" />
          </span>
        </li>
      )}
    </nav>
  );
}
