import { Canvas } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  OrbitControls,
  Environment,
  Html,
} from "@react-three/drei";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Model = () => {
  const racoonCity = useGLTF("/models/potline.gltf", true);
  return (
    <primitive object={racoonCity.scene} scale={1.5} position={[0, -2.5, 0]} />
  );
};

// This is a proper Three.js fallback - it uses Html from drei
const Fallback = () => (
  <Html center>
    <div className="text-text text-center">Loading 3D model...</div>
  </Html>
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
      <Suspense fallback={<Fallback />}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <Model />
        {/* <Environment preset="city" /> */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          minDistance={15} // Prevent zooming too close
          maxDistance={30} // Limit max zoom out
        />
      </Suspense>
    </Canvas>
  );
};

export default ThreedModel;
