import { useCallback, useEffect, useRef, useState } from "react";

const MAX_IMAGES_TO_CHECK = 250;
const IMAGE_EXTENSIONS = ["jpg"] as const;
const BATCH_SIZE = 5; // Load images in batches to avoid overwhelming the browser

const base = import.meta.env.BASE_URL;
export const formatImageNumber = (i: number): string =>
  i.toString().padStart(3, "0");
interface ImageLoaderState {
  totalFrames: number;
  imagesLoaded: boolean;
  loadedImages: Set<number>;
  infoText: string;
  filePath?: string;
}

export const useImageLoader = ({ filePath }: { filePath: string }) => {
  const [state, setState] = useState<ImageLoaderState>({
    totalFrames: 0,
    imagesLoaded: false,
    loadedImages: new Set<number>(),
    infoText: "Loading image sequence...",
  });

  const abortControllerRef = useRef<AbortController>();

  const createImageSrc = useCallback(
    (i: number, ext: string): string =>
      `${base}/assets/${filePath}_${formatImageNumber(i)}.${ext}`,
    [formatImageNumber]
  );

  const preloadImage = useCallback(
    async (src: string, signal: AbortSignal): Promise<boolean> => {
      try {
        if (signal.aborted) return false;

        // Try fetching with cache hint
        await fetch(src, { cache: "force-cache", signal });

        return await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = src;
        });
      } catch {
        return false;
      }
    },
    []
  );

  const checkImageExists = useCallback(
    async (i: number, signal: AbortSignal): Promise<boolean> => {
      for (const ext of IMAGE_EXTENSIONS) {
        if (signal.aborted) return false;

        const src = createImageSrc(i, ext);
        if (await preloadImage(src, signal)) {
          return true;
        }
      }
      return false;
    },
    [createImageSrc, preloadImage]
  );

  const loadImageBatch = useCallback(
    async (
      startIndex: number,
      signal: AbortSignal
    ): Promise<{ loaded: Set<number>; lastFoundIndex: number }> => {
      const loaded = new Set<number>();
      let lastFoundIndex = -1;

      const promises = Array.from({ length: BATCH_SIZE }, (_, offset) => {
        const index = startIndex + offset;
        if (index > MAX_IMAGES_TO_CHECK)
          return Promise.resolve({ index, exists: false });

        return checkImageExists(index, signal).then((exists) => ({
          index,
          exists,
        }));
      });

      const results = await Promise.all(promises);

      for (const { index, exists } of results) {
        if (signal.aborted) break;

        if (exists) {
          loaded.add(index);
          lastFoundIndex = Math.max(lastFoundIndex, index);
        } else if (lastFoundIndex === -1) {
          // If we haven't found any images yet and this one doesn't exist, continue
          continue;
        } else {
          // We've found images before, but this one doesn't exist - we've likely reached the end
          break;
        }
      }

      return { loaded, lastFoundIndex };
    },
    [checkImageExists]
  );

  useEffect(() => {
    // Cancel any previous loading operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadImages = async (): Promise<void> => {
      const allLoaded = new Set<number>();
      let totalFrames = 0;
      let currentIndex = 0;

      try {
        while (currentIndex <= MAX_IMAGES_TO_CHECK) {
          if (abortController.signal.aborted) return;

          const { loaded, lastFoundIndex } = await loadImageBatch(
            currentIndex,
            abortController.signal
          );

          if (abortController.signal.aborted) return;

          // Add newly loaded images to our set
          loaded.forEach((index) => allLoaded.add(index));

          if (loaded.size === 0 && totalFrames === 0) {
            // No images found in this batch and we haven't found any yet
            currentIndex += BATCH_SIZE;
            continue;
          }

          if (loaded.size === 0) {
            // No images found in this batch, but we found some before - we're done
            break;
          }

          totalFrames = Math.max(totalFrames, lastFoundIndex);
          currentIndex += BATCH_SIZE;

          // Update state with progress
          setState((prevState) => ({
            ...prevState,
            totalFrames,
            loadedImages: new Set(allLoaded),
            infoText: `Loading images... ${allLoaded.size} found so far.`,
          }));
        }

        if (!abortController.signal.aborted) {
          setState({
            totalFrames,
            loadedImages: allLoaded,
            imagesLoaded: totalFrames > 0,
            infoText:
              totalFrames > 0
                ? `${
                    totalFrames + 1
                  } images loaded. Scroll to navigate sequence. `
                : "Using placeholder images. Scroll to navigate sequence.",
          });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error loading images:", error);
          setState((prevState) => ({
            ...prevState,
            imagesLoaded: false,
            infoText: "Error loading images. Using placeholders.",
          }));
        }
      }
    };

    loadImages();

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [loadImageBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return state;
};
