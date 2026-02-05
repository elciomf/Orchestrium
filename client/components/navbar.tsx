"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const langs = ["en", "es", "pt"];
  const isLangPath =
    pathnames.length > 0 && langs.includes(pathnames[0]);

  const startIndex = isLangPath ? 1 : 0;

  const displayPathnames = pathnames.slice(startIndex);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {displayPathnames.length > 0 && (
          <BreadcrumbSeparator />
        )}

        {displayPathnames.map((value, index) => {
          const realIndex = index + startIndex;
          const to = `/${pathnames.slice(0, realIndex + 1).join("/")}`;

          const isLast =
            index === displayPathnames.length - 1;
          const displayName = value.replace(/-/g, " ");

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">
                    {displayName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={to} className="capitalize">
                      {displayName}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
