import Link from "next/link";
import menuLinks from "@/data/menu";
import SocialSharing from "./SocialSharing";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { RiInstagramLine, RiTwitterFill, RiYoutubeFill, RiGithubFill, RiTiktokFill, RiPatreonFill } from "react-icons/ri";

export default function Header() {
  return (
    <header className="flex flex-col justify-between max-w-[95rem] w-full mx-auto px-4 md:pt-8 pt-4 lg:pb-4 md:pb-4 sm:pb-2 xs:pb-2">
      <div className="flex">
        <div className="flex flex-1">
          <Link href="/" aria-label="Return to homepage">
            <img
              className="w-[8%]"
              src="/logos/LAP-Logo-Transparent.png"
              alt="logo"
            />
          </Link>
        </div>
        <Sheet>
          <SheetTrigger aria-labelledby="button-label">
            <span id="button-label" hidden>
              Menu
            </span>
            <svg
              aria-hidden="true"
              className="md:hidden"
              width="25"
              height="16"
              viewBox="0 0 25 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="25" height="4" fill="white" />
              <rect y="6" width="25" height="4" fill="white" />
              <rect y="12" width="25" height="4" fill="white" />
            </svg>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="w-full pt-14"
            aria-label="Menu Toggle"
          >
            <nav
              className="flex flex-col flex-1 justify-end gap-6"
              aria-labelledby="mobile-nav"
            >
              {menuLinks.map((menuItem, index) => (
                <Link key={index} href={menuItem.href}>
                  {menuItem.label}
                </Link>
              ))}
              <svg
                width="15"
                height="1"
                viewBox="0 0 15 1"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="15" height="1" fill="white" />
              </svg>
              <SocialSharing
                links={[
                  {
                    href: "https://www.youtube.com/@lap-tutorials",
                    ariaLabel: "Visit our YouTube channel",
                    Icon: RiYoutubeFill,
                  },
                  {
                    href: "https://github.com/LAP-Tutorials",
                    ariaLabel: "Visit our GitHub page",
                    Icon: RiGithubFill,
                  },
                  {
                    href: "https://www.instagram.com/lap.mgmt.team/",
                    ariaLabel: "Visit our Instagram page",
                    Icon: RiInstagramLine,
                  },
                  {
                    href: "https://x.com/lap_mgmt",
                    ariaLabel: "Visit our X page",
                    Icon: RiTwitterFill,
                  },
                  {
                    href: "https://www.tiktok.com/@lap_mgmt",
                    ariaLabel: "Visit our TikTok page",
                    Icon: RiTiktokFill,
                  },
                  {
                    href: "http://patreon.com/lap_mgmt",
                    ariaLabel: "Visit our GitHub page",
                    Icon: RiPatreonFill,
                  },
                ]}
              />
            </nav>
          </SheetContent>
        </Sheet>
        <nav
          className="flex-1 items-center justify-end gap-6 hidden md:flex"
          aria-labelledby="desktop-nav"
        >
          {menuLinks.map((menuItem, index) => (
            <Link key={index} href={menuItem.href}>
              {menuItem.label}
            </Link>
          ))}
          <svg
            width="15"
            height="1"
            viewBox="0 0 15 1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="15" height="1" fill="white" />
          </svg>
          <SocialSharing
            links={[
              {
                href: "https://www.youtube.com/@lap-tutorials",
                ariaLabel: "Visit our YouTube channel",
                Icon: RiYoutubeFill,
              },
              {
                href: "https://github.com/LAP-Tutorials",
                ariaLabel: "Visit our GitHub page",
                Icon: RiGithubFill,
              },
              {
                href: "https://www.instagram.com/lap.mgmt.team/",
                ariaLabel: "Visit our Instagram page",
                Icon: RiInstagramLine,
              },
              {
                href: "https://x.com/lap_mgmt",
                ariaLabel: "Visit our X page",
                Icon: RiTwitterFill,
              },
              {
                href: "https://www.tiktok.com/@lap_mgmt",
                ariaLabel: "Visit our TikTok page",
                Icon: RiTiktokFill,
              },
              {
                href: "http://patreon.com/lap_mgmt",
                ariaLabel: "Visit our GitHub page",
                Icon: RiPatreonFill,
              },
            ]}
          />
        </nav>
      </div>
      <hr className="border-white border-t-0 border mt-4" />
    </header>
  );
}
