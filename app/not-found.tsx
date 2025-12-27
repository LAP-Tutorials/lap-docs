import PageTitle from "@/components/PageTitle";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested page does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex flex-col min-h-screen max-w-[95rem] w-full mx-auto px-4 lg:pt-0 sm:pt-4 xs:pt-2 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <div>
        <PageTitle
          className="sr-only"
          imgSrc="/images/titles/NotFound.svg"
          imgAlt="The words 'Not Found' in bold uppercase lettering"
        >
         404 - Page Not Found
        </PageTitle>
        <h2 className="text-center">
          The page you&apos;re looking for does not exist. Click{" "}
          <Link className="font-semibold text-[#8a2be2]" href="/">
            here to return home
          </Link>
        </h2>
      </div>
    </main>
  );
}
