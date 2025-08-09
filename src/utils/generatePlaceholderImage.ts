export const generatePlaceholderImage = (
    frameNumber: number,
    totalFrames: number
  ): string => {
    const hue = ((frameNumber - 1) / totalFrames) * 360;
    const rotation = ((frameNumber - 1) / totalFrames) * 360;
  
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <radialGradient id="grad${frameNumber}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 60%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${
              hue + 60
            }, 50%, 30%);stop-opacity:1" />
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad${frameNumber})"/>
        <g transform="translate(400,300)">
          <circle cx="0" cy="0" r="100" fill="white" opacity="0.3" transform="rotate(${rotation})"/>
          <circle cx="0" cy="-60" r="30" fill="white" opacity="0.8" transform="rotate(${rotation})"/>
          <circle cx="40" cy="20" r="20" fill="white" opacity="0.6" transform="rotate(${
            rotation * 0.5
          })"/>
          <circle cx="-40" cy="20" r="15" fill="white" opacity="0.7" transform="rotate(${
            -rotation * 0.3
          })"/>
        </g>
        <text x="400" y="550" text-anchor="middle" fill="white" font-size="32" font-family="Arial, sans-serif" font-weight="bold">
          Frame ${frameNumber}
        </text>
      </svg>
    `)}`;
  };