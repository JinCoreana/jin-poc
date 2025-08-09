import { useRef, useState, useEffect } from "react";

export type ScrollDirection = "up" | "down";

export const useScrollDirection = (currentFrame: number) => {
  const lastScrollY = useRef<number>(0);
  const [direction, setDirection] = useState<ScrollDirection>("down");

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setDirection("down");
      } else if (currentScrollY < lastScrollY.current) {
        setDirection("up");
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentFrame]);

  return direction;
};
