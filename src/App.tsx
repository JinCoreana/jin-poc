import { Suspense } from "react";
import ImageSequencePlayer from "./page/ImageSequencePlayer";

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
      <ImageSequencePlayer />
    </Suspense>
  );
}

export default App;

