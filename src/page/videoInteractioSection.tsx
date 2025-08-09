import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ImageSequencePlayer from "../component/ImageSequencePlayer";
import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";

const router = createHashRouter(
  [
    {
      path: "/xal",
      element: (
        <ImageSequencePlayer filePath="xal/move-it-pro-lighting-converter" />
      ),
    },
    {
      path: "/example",
      element: <ImageSequencePlayer filePath="example/videoplayback" />,
    },
    {
      path: "*",
      index: true,
      element: <Navigate to="/xal" />,
    },
  ],
  { basename: "/" }
);

const VideoInteractionSection = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};
export default VideoInteractionSection;
