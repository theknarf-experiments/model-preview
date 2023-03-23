import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Backdrop, Stage, TrackballControls, Float } from '@react-three/drei';
import { useDropzone } from 'react-dropzone'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { REVISION } from 'three';
import { WebGLRenderer } from 'three';

let gltfLoader
if (typeof window !== 'undefined') {
	// ref: https://github.com/pmndrs/gltf-react-three/blob/main/utils/store.js
  const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`
  const dracoloader = new DRACOLoader().setDecoderPath(`${THREE_PATH}/examples/js/libs/draco/gltf/`)
  const ktx2Loader = new KTX2Loader().setTranscoderPath(`${THREE_PATH}/examples/js/libs/basis/`)

  gltfLoader = new GLTFLoader()
    .setCrossOrigin('anonymous')
    .setDRACOLoader(dracoloader)
    .setKTX2Loader(ktx2Loader.detectSupport(new WebGLRenderer()))
    .setMeshoptDecoder(MeshoptDecoder)
};

const Box = (props) => {
  const ref = useRef();
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  useFrame((state, delta) => (ref.current.rotation.x += delta));

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
};

const Page = () => {
	const [scene, setScene] = useState(false);
	const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => console.error('file reading was aborted');
      reader.onerror = () => console.error('file reading has failed');
      reader.onload = async () => {
        const buffer = reader.result;
				const result = await new Promise((resolve, reject) => gltfLoader.parse(buffer, '', resolve, reject))
				setScene(result.scene);
      };
      reader.readAsArrayBuffer(file);
    })
  }, []);

	const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: '.gltf, .glb',
		noClick: true,
  });

	return <div {...getRootProps()}>
		<h1>GLTF preview</h1>
		<p>Drag & Drop a .gltf file into the viewport</p>
		<input {...getInputProps()} />
		<div style={{ width: '50vw', height: '50vh', border: '4px solid black' }}>
			<Canvas>
				<TrackballControls />
				<Stage
					adjustCamera={2}
					shadows="contact"
					preset="soft"
					>
					{/*<Box castShadow position={[-1.2, 0, 0]} />
					<Box castShadow position={[1.2, 0, 0]} />*/}
					{scene && <primitive castShadow object={scene} />}
				</Stage>
				<Backdrop receiveShadow scale={[20, 5, 5]} floor={1.5} position={[0, -0.5, -2]}>
					<meshPhysicalMaterial roughness={1} color="#efefef" />
				</Backdrop>
			</Canvas>
		</div>
	</div>;
};

export default Page;
