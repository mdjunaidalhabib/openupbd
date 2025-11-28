"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";


const defaultSlides = [
  { src: "/photo/p1.jpg", alt: "Promo 1", href: "/promo-1" },
  { src: "/photo/p2.jpg", alt: "Promo 2", href: "/promo-2" },
  { src: "/photo/p3.jpg", alt: "Promo 3", href: "/promo-3" },
  { src: "/photo/p1.jpg", alt: "Promo 1", href: "/promo-1" },
];


export default function ImageSlider({
  images = defaultSlides,
  autoPlayMs = 4000,
  ratioClass = "h-56 sm:h-72 md:h-96",
  showDots = true,
  showArrows = false, // can force arrows always-on on desktop
  arrowsOnHover = true, // show arrows on hover (desktop only)
  swipeThresholdPx = 60, // drag distance to trigger slide
}) {
  const count = images.length;
  const extended = useMemo(
    () => (count > 1 ? [...images, images[0]] : images),
    [images, count]
  );

  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [enableTransition, setEnableTransition] = useState(true);

  // ---- autoplay (always forward) ----
  useEffect(() => {
    if (!autoPlayMs || count <= 1) return;
    const id = setInterval(() => setIndex((i) => i + 1), autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlayMs, count]);

  // ---- ghost-first reset after animating to the end ----
  useEffect(() => {
    if (count > 1 && index === count) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setIndex(0);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [index, count]);

  // ---- desktop arrows visibility ----
  const shouldShowArrows =
    (showArrows || (arrowsOnHover && isHovered)) && count > 1;

  // ---- dots mapping ----
  const activeDot = count > 1 ? (index === count ? 0 : index) : index;

  // ---- swipe/drag state (mobile) ----
  const trackRef = useRef(null);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const deltaXRef = useRef(0);

  const onPointerDown = (e) => {
    // only left button or touch
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
    setEnableTransition(false);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    deltaXRef.current = e.clientX - startXRef.current;
    // prevent page scroll on touch
    if (e.pointerType !== "mouse") e.preventDefault();
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    const dx = deltaXRef.current;
    draggingRef.current = false;
    setEnableTransition(true);

    if (Math.abs(dx) >= swipeThresholdPx) {
      if (dx < 0) {
        // swiped left → go to next
        setIndex((i) => i + 1);
      } else {
        // swiped right → go to prev (bounded; no reverse loop jump)
        setIndex((i) => (i > 0 ? i - 1 : 0));
      }
    } else {
      // not enough movement → snap back to current index
      setIndex((i) => i);
    }
    // reset
    deltaXRef.current = 0;
  };

  // apply drag offset visually while dragging
  const baseTranslate = -(index * 100);
  const dragPercent = () => {
    if (!draggingRef.current) return 0;
    const el = trackRef.current;
    if (!el) return 0;
    const width = el.clientWidth || 1;
    return (deltaXRef.current / width) * 100; // convert px delta to percent
  };

  const transform = `translateX(calc(${baseTranslate}% + ${dragPercent()}%))`;

  return (
    <section
      className="relative container mx-auto  py-4  sm:px-6 lg:px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Image slider"
    >
      <div className="relative overflow-hidden rounded-2xl">
        {/* Track (transform-based) */}
        <div
          ref={trackRef}
          className="flex w-full touch-pan-y select-none"
          style={{
            transform,
            transition: enableTransition ? "transform 450ms ease" : "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {extended.map((img, i) => (
            <div key={i} className="w-full shrink-0">
              {img.href ? (
                <Link
                  href={img.href}
                  className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
                >
                  <div
                    className={`relative w-full ${ratioClass} overflow-hidden rounded-2xl bg-gray-100`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                </Link>
              ) : (
                <div
                  className={`relative w-full ${ratioClass} overflow-hidden rounded-2xl bg-gray-100`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Arrows: hidden on mobile (sm:hidden), visible on hover for >=sm */}
        {shouldShowArrows && (
          <>
            <button
              onClick={() => setIndex((i) => (i > 0 ? i - 1 : 0))}
              aria-label="Previous slide"
              className="hidden sm:grid absolute left-2 top-1/2 -translate-y-1/2 place-items-center w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => setIndex((i) => i + 1)}
              aria-label="Next slide"
              className="hidden sm:grid absolute right-2 top-1/2 -translate-y-1/2 place-items-center w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {showDots && count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === (index === count ? 0 : index)
                  ? "bg-blue-600 w-6"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
