import Image from "next/image";

type PageTitleProps = {
  children: React.ReactNode;
  className?: string;
  imgSrc: string;
  imgAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  priority?: boolean;
  decorative?: boolean;
};

export default function PageTitle({
  children,
  className,
  imgSrc,
  imgAlt,
  imageWidth = 1520,
  imageHeight = 216,
  priority = false,
  decorative = false,
}: PageTitleProps) {
  return (
    <div className="max-w-[95rem] w-full mx-auto">
      <h1 className={className}>{children}</h1>
      {imgSrc && (
        <Image
          src={imgSrc}
          alt={decorative ? "" : (imgAlt ?? "")}
          aria-hidden={decorative}
          width={imageWidth}
          height={imageHeight}
          priority={priority}
          unoptimized
          sizes="100vw"
          className="py-6 md:py-12 h-full w-full"
        />
      )}
    </div>
  );
}
