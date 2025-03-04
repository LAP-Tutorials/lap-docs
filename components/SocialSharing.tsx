import { RiInstagramLine, RiTwitterFill, RiYoutubeFill, RiGithubFill } from "react-icons/ri";
import Link from "next/link";

export type SocialMediaLink = {
  href: string;
  ariaLabel: string;
  Icon: React.ElementType;
};

type SocialSharingProps = {
  links: SocialMediaLink[];
};

export default function SocialSharing({ links }: SocialSharingProps) {
  return (
    <div className="flex gap-3">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          aria-label={link.ariaLabel}
          target="_blank"
          className="text-white text-2xl hover:text-[#8a2be2] transition ease-in-out duration-300"
        >
          <link.Icon />
        </Link>
      ))}
    </div>
  );
}
