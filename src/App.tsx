import { Suspense } from "react";
import VideoInteractionSection from "./page/videoInteractioSection";

const Loading = () => {
  return (
    <h1 style={{ fontSize: "40px" }}>
      Wait until the interative product photo is loaded....
    </h1>
  );
};
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <VideoInteractionSection />
    </Suspense>
  );
}

export default App;

