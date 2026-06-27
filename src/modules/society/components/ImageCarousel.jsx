import { useState } from "react";

const images = [
  "/image.png",
  "/1.png",
//   "/1.png",
];

export default function ImageCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () =>
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));

  const next = () =>
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-full flex items-center justify-center mt-6">
      {/* LEFT ARROW */}
      <button
        onClick={prev}
        className="absolute left-4 z-10 text-3xl bg-white/70 hover:bg-white px-3 py-2 rounded-full shadow"
      >
        â€¹
      </button>

      {/* IMAGE */}
      <img
        src={images[index]}
        alt="Report"
        className="w-[90vw] h-[60vh] object-contain border rounded bg-white"
      />

      {/* RIGHT ARROW */}
      <button
        onClick={next}
        className="absolute right-4 z-10 text-3xl bg-white/70 hover:bg-white px-3 py-2 rounded-full shadow"
      >
        â€º
      </button>
    </div>
  );
}




