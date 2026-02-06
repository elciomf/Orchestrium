"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathnames = usePathname()
    .split("/")
    .filter((x) => x);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathnames.slice(1).map((value, index) => {
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/${pathnames.slice(0, 1 + 1).join("/")}`}
                  >
                    {value.charAt(0).toUpperCase() +
                      value.slice(1)}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {index !== pathnames.slice(1).length - 1 && (
                <BreadcrumbSeparator />
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
