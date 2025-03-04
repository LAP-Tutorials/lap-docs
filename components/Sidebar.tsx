import Image from "next/image";
import NewsletterSignUp from "./NewsletterSignUp";
import PopularArticles from "./PopularArticles";
import { Button } from "./ui/button";
import magazineCover from "@/public/logos/LAP-Logo-Color.png";

export default function Sidebar() {
  const youtubeChannelUrl =
    "https://www.youtube.com/@lap-tutorials?sub_confirmation=1";

  return (
    <aside>
      <h3 className="uppercase font-semibold mb-2">Subscribe To</h3>
      <p className="text-4xl font-semibold">L.A.P - Tutorials</p>
      <Image
        className="w-[20rem] pt-8 pb-4"
        src={magazineCover}
        alt="A cool and simple logo of L.A.P - Tutorials"
      />
      <Button asChild className="hover:bg-[#8a2be2] transition ease-in-out duration-300">
        <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
          Subscribe on YouTube
        </a>
      </Button>
      <PopularArticles />
    </aside>
  );
}
