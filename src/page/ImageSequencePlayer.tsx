import React, { useState, useEffect, useRef, useCallback } from "react";
import { generatePlaceholderImage } from "../utils/generatePlaceholderImage";
import {
  useScrollDirection,
  type ScrollDirection,
} from "../hooks/useScrollDrection";
import { useImageLoader } from "../hooks/useImageLoader";
import "./ImageSequencePlayer.css";

const base = import.meta.env.BASE_URL;
interface ScrollState {
  currentFrame: number;
  showInfoPanel: boolean;
  scrollBlocked: boolean;
  imageProgress: number;
}

const getImageSrc = (
  frameNumber: number,
  loadedImages: Set<number>,
  totalFrames: number
): string => {
  if (loadedImages.has(frameNumber)) {
    return `${base}/assets/move-it-pro-lighting-converter_0${
      frameNumber < 10 ? `0${frameNumber}` : frameNumber
    }.jpg`;
  }
  return generatePlaceholderImage(frameNumber, totalFrames);
};

// interface ScrollIndicatorProps {
//   scrollBlocked: boolean;
//   currentFrame: number;
//   totalFrames: number;
//   direction: ScrollDirection;
// }

// const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
//   scrollBlocked,
//   currentFrame,
//   totalFrames,
//   direction,
// }) => {
//   if (!scrollBlocked) return null;

//   return (
//     <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600 bg-opacity-90 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg animate-pulse">
//       <div className="flex items-center space-x-2">
//         <span>🖼️</span>
//         <span>
//           Frame {currentFrame} / {totalFrames} • Scroll to navigate
//         </span>
//         <span>{direction === "down" ? "⬇️" : "⬆️"}</span>
//       </div>
//     </div>
//   );
// };

interface ImageDisplayProps {
  imagesLoaded: boolean;
  currentFrame: number;
  totalFrames: number;
  loadedImages: Set<number>;
  direction: ScrollDirection;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imagesLoaded,
  currentFrame,
  totalFrames,
  loadedImages,
}) => {
  if (!imagesLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading image sequence...</p>
        </div>
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Failed to load image: test-${currentFrame}`);
    const target = e.target as HTMLImageElement;
    target.src = getImageSrc(currentFrame, loadedImages, totalFrames);
  };

  return (
    <div className="relative">
      <div className="title">
        MOVE IT PRO <br /> One system <br /> all spaces <br /> no limits <br />{" "}
        Luminaire | XAL
      </div>
      <img
        src={getImageSrc(currentFrame, loadedImages, totalFrames)}
        alt={`Product frame ${currentFrame}`}
        className="w-full h-auto min-h-[60vh] max-h-[70vh] object-contain rounded-3xl transition-all duration-200"
        onError={handleImageError}
      />
    </div>
  );
};

const ImageSequencePlayer: React.FC = () => {
  const { totalFrames, imagesLoaded, loadedImages } = useImageLoader();
  const { direction, updateDirection } = useScrollDirection();

  const [scrollState, setScrollState] = useState<ScrollState>({
    currentFrame: 1,
    showInfoPanel: false,
    scrollBlocked: false,
    imageProgress: 0,
  });

  const animationSectionRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback((): void => {
    if (!imagesLoaded || !animationSectionRef.current || totalFrames === 0)
      return;

    const windowHeight = window.innerHeight;
    const sectionTop = animationSectionRef.current.offsetTop - 200;

    const photoZoneStart = sectionTop + windowHeight * 0.1;

    const scrollY = window.scrollY;

    if (scrollY < photoZoneStart - 100) {
      setScrollState({
        currentFrame: 1,
        showInfoPanel: false,
        scrollBlocked: false,
        imageProgress: 0,
      });
    } else if (scrollY >= photoZoneStart - 100) {
      setTimeout(() => {});
      setScrollState((prev) => {
        const isAtFirstFrame = prev.currentFrame === 1;
        const isAtLastFrame = prev.currentFrame === totalFrames;

        let newFrame = prev.currentFrame;
        let newScrollBlocked = true;

        if (direction === "down" && !isAtLastFrame) {
          newFrame = Math.min(totalFrames, prev.currentFrame + 1);
          window.scrollTo(0, photoZoneStart);
        } else if (direction === "up" && !isAtFirstFrame) {
          newFrame = Math.max(1, prev.currentFrame - 1);
          window.scrollTo(0, photoZoneStart);
        } else if (
          (direction === "down" && isAtLastFrame) ||
          (direction === "up" && isAtFirstFrame)
        ) {
          newScrollBlocked = false;
        }

        const progress = (newFrame - 1) / (totalFrames - 1);

        return {
          currentFrame: newFrame,
          showInfoPanel: true,
          scrollBlocked: newScrollBlocked,
          imageProgress: progress,
        };
      });
    }
  }, [imagesLoaded, totalFrames, direction, updateDirection, window.scrollY]);

  // Scroll event listeners
  useEffect(() => {
    updateDirection();
    if (
      (direction === "up" && scrollState.currentFrame === 1) ||
      (direction === "down" && scrollState.currentFrame === totalFrames)
    ) {
      console.log(direction, scrollState.currentFrame, totalFrames);
      setScrollState((prev) => ({ ...prev, scrollBlocked: false }));
    }

    const handleWheel = (e: WheelEvent): void => {
      console.log("event", scrollState.scrollBlocked);
      if (scrollState.scrollBlocked) {
        e.preventDefault();
        e.stopPropagation();

        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;
        const isAtFirstFrame = scrollState.currentFrame === 1;
        const isAtLastFrame = scrollState.currentFrame === totalFrames;

        setScrollState((prev) => ({
          ...prev,
          currentFrame:
            scrollingDown && !isAtLastFrame
              ? Math.min(totalFrames, prev.currentFrame + 1)
              : scrollingUp && !isAtFirstFrame
              ? Math.max(1, prev.currentFrame - 1)
              : prev.currentFrame,
        }));
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (scrollState.scrollBlocked) {
        e.preventDefault();
        e.stopPropagation();
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
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    scrollState.scrollBlocked,
    scrollState.currentFrame,
    totalFrames,
    direction,
    updateDirection,
  ]);
  console.log(direction, scrollState.currentFrame);
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
      {/* <ScrollIndicator
        scrollBlocked={scrollState.scrollBlocked}
        currentFrame={scrollState.currentFrame}
        totalFrames={totalFrames}
        direction={direction}
      />

      <HeroSection totalFrames={totalFrames} /> */}

      <section ref={animationSectionRef}>
        <div className="sticky top-16">
          <div className="w-full max-w-5xl mx-auto">
            {/* <InfoPanel
              showInfoPanel={scrollState.showInfoPanel}
              infoText={currentInfoText}
              imageProgress={scrollState.imageProgress}
              currentFrame={scrollState.currentFrame}
              totalFrames={totalFrames}
            /> */}

            <ImageDisplay
              imagesLoaded={imagesLoaded}
              currentFrame={scrollState.currentFrame}
              totalFrames={totalFrames}
              loadedImages={loadedImages}
              direction={direction}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ImageSequencePlayer;
