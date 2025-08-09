import { useRef, useState, useEffect } from "react";
import { useScrollDirection } from "./useScrollDrection";

export type ScrollDirection = "up" | "down";

export const useScrollFrameWatch = (currentFrame: number) => {
  const previousFrame = useRef<number>(0);
  const [direction, setDirection] = useState<ScrollDirection>("down");
  const scrollDirection = useScrollDirection(currentFrame);

  useEffect(() => {
    const onScroll = () => {
      if (currentFrame > previousFrame.current) {
        setDirection("down");
      } else if (currentFrame < previousFrame.current) {
        setDirection("up");
      } else {
        setDirection(scrollDirection);
      }

      previousFrame.current = currentFrame;
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentFrame, scrollDirection]);

  return direction;
};
