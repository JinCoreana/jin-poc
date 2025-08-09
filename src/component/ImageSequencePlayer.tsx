import React, { useState, useEffect, useRef, useCallback } from "react";
import { generatePlaceholderImage } from "../utils/generatePlaceholderImage";
import { type ScrollDirection } from "../hooks/useScrollDrection";
import { formatImageNumber, useImageLoader } from "../hooks/useImageLoader";
import "./ImageSequencePlayer.css";
import { useScrollFrameWatch } from "../hooks/useScrollFrameWath";
import { Navigate, useLocation, useNavigate } from "react-router";

const BASE_URL = import.meta.env.BASE_URL;
const FRAME_INTERVAL = 150; // ms
const TOUCH_SCROLL_INTERVAL = 1000; // ms

// Types
interface ScrollState {
  currentFrame: number;
  showInfoPanel: boolean;
  scrollBlocked: boolean;
  imageProgress: number;
}

interface ImageDisplayProps {
  imagesLoaded: boolean;
  currentFrame: number;
  totalFrames: number;
  loadedImages: Set<number>;
  direction: ScrollDirection;
  infoText: string;
  filePath: string;
}

// Utility functions
const getImageSrc = (
  frameNumber: number,
  loadedImages: Set<number>,
  totalFrames: number,
  filePath: string
): string => {
  if (loadedImages.has(frameNumber)) {
    return `${BASE_URL}/assets/${filePath}_${formatImageNumber(
      frameNumber
    )}.jpg`;
  }

  return generatePlaceholderImage(frameNumber, totalFrames);
};

const calculateScrollPosition = (sectionElement: HTMLElement): number => {
  const windowHeight = window.innerHeight;
  const sectionTop = sectionElement.offsetTop - 200;
  return sectionTop + windowHeight * 0.1;
};

const isInPhotoZone = (scrollY: number, photoZoneStart: number): boolean => {
  return scrollY >= photoZoneStart - 100;
};

// Components
const LoadingDisplay: React.FC<{ infoText: string }> = ({ infoText }) => (
  <div className="w-full absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl min-h-[60vh]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-full border-b-2 border-white mx-auto mb-4" />
      <p className="text-[30px] text-right">
        {`Please wait and scroll when the product image appeared.${infoText}`}
      </p>
    </div>
  </div>
);

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imagesLoaded,
  currentFrame,
  totalFrames,
  loadedImages,
  infoText,
  filePath,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!imagesLoaded) {
    return <LoadingDisplay infoText={infoText} />;
  }

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>
  ): void => {
    console.error(`Failed to load image: test-${currentFrame}`);
    const target = e.target as HTMLImageElement;
    target.src = getImageSrc(currentFrame, loadedImages, totalFrames, filePath);
  };

  return (
    <div className="relative">
      <img
        src={getImageSrc(currentFrame, loadedImages, totalFrames, filePath)}
        alt={`Product frame ${currentFrame}`}
        className="w-full h-full object-contain rounded-3xl transition-all duration-200"
        onError={handleImageError}
        onClick={() =>
          navigate(`${pathname.includes("xal") ? "/example" : "xal"}`)
        }
      />
    </div>
  );
};

const useTouchControl = (
  scrollState: ScrollState,
  totalFrames: number,
  lastFrameTime: React.MutableRefObject<number>,
  setScrollState: React.Dispatch<React.SetStateAction<ScrollState>>
) => {
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent): void => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (touchStartY.current === null) return;
      if (scrollState.scrollBlocked) {
        e.preventDefault();
        e.stopPropagation();

        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY.current - currentY;

        const scrollingDown = deltaY > 0;
        const scrollingUp = deltaY < 0;
        const isAtFirstFrame = scrollState.currentFrame === 1;
        const isAtLastFrame = scrollState.currentFrame === totalFrames;

        if (Date.now() - lastFrameTime.current > TOUCH_SCROLL_INTERVAL) {
          setScrollState((prev) => ({
            ...prev,
            currentFrame:
              scrollingDown && !isAtLastFrame
                ? Math.min(totalFrames, prev.currentFrame + 1)
                : scrollingUp && !isAtFirstFrame
                ? Math.max(1, prev.currentFrame - 1)
                : prev.currentFrame,
          }));

          touchStartY.current = currentY;
          lastFrameTime.current = Date.now();
        }
      }
    };

    const handleTouchEnd = (): void => {
      touchStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    scrollState.scrollBlocked,
    scrollState.currentFrame,
    totalFrames,
    setScrollState,
  ]);
};

// Main component
const ImageSequencePlayer: React.FC<{ filePath: string }> = ({ filePath }) => {
  const { totalFrames, imagesLoaded, loadedImages, infoText } = useImageLoader({
    filePath,
  });
  const lastFrameTime = useRef<number>(0);
  const animationSectionRef = useRef<HTMLElement>(null);

  const [scrollState, setScrollState] = useState<ScrollState>({
    currentFrame: 1,
    showInfoPanel: false,
    scrollBlocked: false,
    imageProgress: 0,
  });

  const direction = useScrollFrameWatch(scrollState.currentFrame);

  // Handle scroll-based frame changes
  const handleScroll = useCallback((): void => {
    if (!imagesLoaded || !animationSectionRef.current || totalFrames === 0) {
      return;
    }

    const scrollY = window.scrollY;
    const photoZoneStart = calculateScrollPosition(animationSectionRef.current);

    if (scrollY < photoZoneStart - 100) {
      setScrollState({
        currentFrame: 1,
        showInfoPanel: false,
        scrollBlocked: false,
        imageProgress: 0,
      });
    } else if (isInPhotoZone(scrollY, photoZoneStart)) {
      setScrollState((prev) => {
        const isAtFirstFrame = prev.currentFrame === 1;
        const isAtLastFrame = prev.currentFrame === totalFrames;

        let newScrollBlocked = true;

        if (direction === "down" && !isAtLastFrame) {
          window.scrollTo(0, photoZoneStart);
        } else if (direction === "up" && !isAtFirstFrame) {
          window.scrollTo(0, photoZoneStart);
        } else if (
          (direction === "down" && isAtLastFrame) ||
          (direction === "up" && isAtFirstFrame)
        ) {
          newScrollBlocked = false;
        }

        return {
          ...prev,
          showInfoPanel: true,
          scrollBlocked: newScrollBlocked,
        };
      });
    }
  }, [imagesLoaded, totalFrames, direction]);

  // Update scroll blocked state based on frame position
  useEffect(() => {
    if (
      (direction === "up" && scrollState.currentFrame === 1) ||
      (direction === "down" && scrollState.currentFrame === totalFrames)
    ) {
      setScrollState((prev) => ({ ...prev, scrollBlocked: false }));
    }
  }, [direction, scrollState.currentFrame, totalFrames]);

  // Wheel and keyboard event handling
  useEffect(() => {
    const handleWheel = (e: WheelEvent): void => {
      if (scrollState.scrollBlocked) {
        e.preventDefault();
        e.stopPropagation();

        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;
        const isAtFirstFrame = scrollState.currentFrame === 1;
        const isAtLastFrame = scrollState.currentFrame === totalFrames;

        if (Date.now() - lastFrameTime.current > FRAME_INTERVAL) {
          setScrollState((prev) => ({
            ...prev,
            currentFrame:
              scrollingDown && !isAtLastFrame
                ? Math.min(totalFrames, prev.currentFrame + 1)
                : scrollingUp && !isAtFirstFrame
                ? Math.max(1, prev.currentFrame - 1)
                : prev.currentFrame,
          }));
          lastFrameTime.current = Date.now();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (
        scrollState.scrollBlocked &&
        ["ArrowDown", "ArrowUp", " ", "PageDown", "PageUp"].includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [scrollState.scrollBlocked, scrollState.currentFrame, totalFrames]);

  // Touch event handling
  useTouchControl(scrollState, totalFrames, lastFrameTime, setScrollState);

  // Scroll event listener
  useEffect(() => {
    const throttledScroll = (): void => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll);
    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [handleScroll]);

  return (
    <div className="bg-[#c1c1c1]">
      {loadedImages && (
        <div
          style={{
            textAlign: "center",
            color: "black",
            backgroundColor: "#c1c1c1",
          }}
        >
          See scroll progress: {scrollState.currentFrame} of {totalFrames}
        </div>
      )}
      <section ref={animationSectionRef}>
        <div className="sticky">
          <div className="w-full max-w-5xl mx-auto">
            <ImageDisplay
              imagesLoaded={imagesLoaded}
              currentFrame={scrollState.currentFrame}
              totalFrames={totalFrames}
              loadedImages={loadedImages}
              direction={direction}
              infoText={infoText}
              filePath={filePath}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ImageSequencePlayer;
