import { useEffect, useState } from "react";

const MAX_IMAGES_TO_CHECK = 100;
const IMAGE_EXTENSIONS = ["jpg"] as const;

const base = import.meta.env.BASE_URL;

interface ImageLoaderState {
  totalFrames: number;
  imagesLoaded: boolean;
  loadedImages: Set<number>;
  infoText: string;
}

export const useImageLoader = (): ImageLoaderState => {
  const [state, setState] = useState<ImageLoaderState>({
    totalFrames: 0,
    imagesLoaded: false,
    loadedImages: new Set<number>(),
    infoText: "Loading image sequence...",
  });

  console.log(base);

  useEffect(() => {
    const loadImages = async (): Promise<void> => {
      let count = 0;
      const loaded = new Set<number>();

      for (let i = 0; i <= MAX_IMAGES_TO_CHECK; i++) {
        let imageFound = false;

        for (const ext of IMAGE_EXTENSIONS) {
          try {
            const img = new Image();
            const src = `${base}/assets/move-it-pro-lighting-converter_0${
              i < 10 ? `0${i}` : i
            }.${ext}`;

            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                loaded.add(i);
                count = i;
                imageFound = true;
                resolve();
              };
              img.onerror = reject;
              img.src = src;
            });

            if (imageFound) break;
          } catch (error) {
            console.log(error);
          }
        }

        if (!imageFound) break;
      }

      setState({
        totalFrames: count || 0,
        loadedImages: loaded,
        imagesLoaded: count > 0,
        infoText:
          count > 0
            ? `${count} images loaded. Scroll to navigate sequence.`
            : "Using placeholder images. Scroll to navigate sequence.",
      });
    };

    loadImages();
  }, []);

  return state;
};
