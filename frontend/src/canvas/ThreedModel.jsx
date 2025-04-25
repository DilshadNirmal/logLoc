import { Canvas } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  OrbitControls,
  Environment,
  Stage,
} from "@react-three/drei";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Model = () => {
  const racoonCity = useGLTF("/models/potline.gltf", true);
  return (
    <primitive object={racoonCity.scene} scale={1.5} position={[0, -2.5, 0]} />
  );
};

const Fallback = () => (
  <div className="text-text text-center">Error loading 3D model</div>
);

const ThreedModel = () => {
  return (
    <Canvas
      camera={{
        position: [0, 2, 10], // Moved camera back and up
        fov: 45,
      }}
      style={{ height: "100%" }}
    >
      <Stage
        intensity={0.5}
        environment="city"
        adjustCamera={false}
        preset="rembrandt"
      >
        <Model />
      </Stage>
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={10} // Prevent zooming too close
        maxDistance={30} // Limit max zoom out
      />
    </Canvas>
  );
};

export default ThreedModel;
