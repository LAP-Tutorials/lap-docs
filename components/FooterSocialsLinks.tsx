import SocialSharing from "./SocialSharing";
import {
  RiInstagramLine,
  RiTwitterFill,
  RiYoutubeFill,
  RiGithubFill,
  RiTiktokFill,
  RiPatreonFill,
} from "react-icons/ri";

export default function FooterSocialLinks() {
  return (
    <div className="flex gap-3">
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
    </div>
  );
}
