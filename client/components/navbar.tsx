"use client";

import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathnames = usePathname()
    .split("/")
    .filter((x) => x);

  return (
    <Breadcrumb className="select-none">
      <BreadcrumbList>
        {pathnames.slice(1).map((value, index) => {
          const originalIndex = index + 1;
          const href = `/${pathnames.slice(0, originalIndex + 1).join("/")}`;

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {index === pathnames.slice(1).length - 1 ? (
                  <BreadcrumbPage>
                    {value.charAt(0).toUpperCase() +
                      value.slice(1)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>
                      {value.charAt(0).toUpperCase() +
                        value.slice(1)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!(
                index ===
                pathnames.slice(1).length - 1
              ) && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
