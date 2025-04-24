import { Canvas } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  OrbitControls,
  Environment,
} from "@react-three/drei";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Model = () => {
  const racoonCity = useGLTF("/models/potline.gltf", true);
  return <primitive object={racoonCity.scene} scale={25} />;
};

const Fallback = () => (
  <div className="text-text text-center">Error loading 3D model</div>
);

const ThreedModel = () => {
  return (
    <ErrorBoundary fallback={<Fallback />}>
      <Canvas
        frameloop="demand"
        camera={{
          position: [800, -100, 600],
          fov: window.innerWidth < 768 ? 60 : 45,
          near: 0.1,
          far: 600,
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model />
          <OrbitControls minDistance={350} maxDistance={500} />
          <Environment preset="apartment" />
          <Preload all />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
};

useGLTF.preload("/models/mechanicalKeboard/scene.gltf");
export default ThreedModel;
