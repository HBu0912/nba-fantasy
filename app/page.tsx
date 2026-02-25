"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "./components/Logo";

const BASKETBALL_IMAGES = [
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
];

const FOOTBALL_IMAGES = [
  "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80",
];

function SportCard({
  sport,
  href,
  images,
  accentColor,
}: {
  sport: string;
  href: string;
  images: string[];
  accentColor: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const handleMouseEnter = () => {
    setHovered(true);
    setImgIndex(prev => (prev + 1) % images.length);
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden cursor-pointer block"
      style={{
        width: hovered ? "320px" : "260px",
        height: hovered ? "320px" : "260px",
        borderRadius: "50%",
        border: `4px solid ${hovered ? accentColor : "#4b5563"}`,
        transition: "width 0.4s ease, height 0.4s ease, border-color 0.3s ease",
      }}
    >
      {/* Images */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={sport}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: hovered && i === imgIndex ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      ))}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: hovered ? "rgba(0,0,0,0.45)" : "rgba(17,24,39,0.95)",
          transition: "background-color 0.3s ease",
        }}
      />

      {/* Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="font-black text-center tracking-widest"
          style={{
            fontSize: hovered ? "1.2rem" : "1rem",
            color: hovered ? accentColor : "#ffffff",
            letterSpacing: "0.3em",
            transition: "color 0.3s ease, font-size 0.3s ease",
          }}
        >
          {sport.toUpperCase()}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">

      <div className="text-center mb-16 flex flex-col items-center gap-6">
        <Logo size={90} />
        <h1 className="text-3xl font-extrabold tracking-widest uppercase text-white">
          Choose Your Fantasy Sport
        </h1>
      </div>

      <div className="flex gap-16 items-center">
        <SportCard
          sport="Basketball"
          href="/nba"
          images={BASKETBALL_IMAGES}
          accentColor="#f97316"
        />
        <div className="text-gray-700 font-black text-2xl tracking-widest">VS</div>
        <SportCard
          sport="Football"
          href="/nfl"
          images={FOOTBALL_IMAGES}
          accentColor="#22c55e"
        />
      </div>

    </main>
  );
}