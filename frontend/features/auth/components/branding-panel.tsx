import Image from "next/image";

export default function BrandingPanel() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <Image
        src="/images/login-banner2.jpg"
        alt="iPhonik"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center blur-[6px] scale-105"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020B1F]/85 via-[#071D49]/82 to-[#020B1F]/90" />

    </div>
  );
}