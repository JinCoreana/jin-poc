import { useRef, useState } from "react";

export type ScrollDirection = "up" | "down";

export const useScrollDirection = () => {
  const lastScrollY = useRef<number>(0);
  const [direction, setDirection] = useState<ScrollDirection>("down");

  const updateDirection = (): void => {
    console.log("direction", lastScrollY.current, window.scrollY, direction);
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY.current) {
      setDirection("down");
    } else if (currentScrollY < lastScrollY.current) {
      setDirection("up");
    }

    lastScrollY.current = currentScrollY;
  };
  return { direction, updateDirection };
};
