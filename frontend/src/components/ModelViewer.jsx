// src/components/ModelViewer.jsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";

/*
  ModelViewer: full canvas + loader + controls
  - Put your .glb in public/models/model.glb OR change the URL below
*/

function Model({ url, scale = 1, position = [0, 0, 0] }) {
  // useGLTF loads the glb file and returns a scene graph
  const gltf = useGLTF(url, true); // true = use draco? (drei handles common cases)
  // gltf.scene is a THREE.Group containing the model
  return (
    <primitive
      object={gltf.scene}
      position={position}
      scale={scale}
      dispose={null} // avoid automatic disposal by react-three-fiber
    />
  );
}

export default function ModelViewer({ modelUrl = "/models/model.glb" }) {
  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 3], fov: 45 }}
      >
        {/* simple ambient + directional lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          intensity={0.8}
          position={[5, 10, 5]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Suspense shows fallback until model loads */}
        <Suspense fallback={<Html center>Loading 3D model...</Html>}>
          {/* Environment gives better lighting / reflections */}
          <Environment preset="warehouse" />

          {/* The actual model. adjust scale & position as needed */}
          <Model url={modelUrl} scale={1} position={[0, -0.8, 0]} />

          {/* Allow rotate/zoom/pan */}
          <OrbitControls enablePan={true} enableZoom={true} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// optional: preload so model loads faster when user navigates
useGLTF.preload("/models/model.glb");
