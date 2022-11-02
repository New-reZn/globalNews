'use strict';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://threejs.org/examples/jsm/renderers/CSS2DRenderer.js';

import * as THREE from 'three';

const vertexShader = /*glsl*/ `
varying vec2 vertexUV;
varying vec3 vertexNormal;
void main() {
    vertexUV=uv;
    vertexNormal=normalize(normalMatrix*normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /*glsl*/ `
uniform sampler2D globeTexture;
varying vec2 vertexUV;
varying vec3 vertexNormal;
void main() {
    float intensity=1.05-dot(vertexNormal,vec3(0,0,1));
    vec3 atmosphere=vec3(0.3,0.6,1.0)*pow(intensity,1.5);
    gl_FragColor = vec4(atmosphere+texture2D(globeTexture,vertexUV).xyz,1);
}
`;

const vertexShaderAtmos = /*glsl*/ `
varying vec3 vertexNormal;
void main() {
    vertexNormal=normalize(normalMatrix*normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShaderAtmos = /*glsl*/ `
varying vec3 vertexNormal;
void main() {
    float intensity=pow(0.6-dot(vertexNormal,vec3(0,0,1.0)),2.0);
    gl_FragColor = vec4(0.3,0.6,1.0,1.0)*intensity;
} 
`;

function calcPosFromLatLonRad(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -((radius) * Math.sin(phi) * Math.cos(theta));
    const z = ((radius) * Math.sin(phi) * Math.sin(theta));
    const y = ((radius) * Math.cos(phi));
    return [x, y, z];
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const globe = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50),
    new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: new THREE.TextureLoader().load('/static/earth.jpg')
            }
        }
    })
);

const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 50, 50),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
pin.name = "pin"

let coords = [40.7142700, -74.0059700];
let latlon = new THREE.Vector3(...calcPosFromLatLonRad(coords[0], coords[1], 5));
pin.position.x = latlon.x;
pin.position.y = latlon.y;
pin.position.z = latlon.z;

const textrender = new CSS2DRenderer();
textrender.setSize(window.innerWidth, window.innerHeight);
textrender.domElement.style.position = `absolute`;
textrender.domElement.style.top = `0px`;
textrender.domElement.style.pointerEvents = `none`;
document.body.appendChild(textrender.domElement);

const div = document.createElement('div');
div.textContent = `why is th economy suffering in the modern times?`;
div.style.backgroundColor = `black`;
div.style.fontWeight = `800`;
div.style.color = `white`;
div.style.fontSize = `smallest`;
const textobject = new CSS2DObject(div);
pin.add(textobject);


const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50),
    new THREE.ShaderMaterial({
        vertexShader: vertexShaderAtmos,
        fragmentShader: fragmentShaderAtmos,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
);

atmosphere.scale.set(1.5, 1.5, 1.5);


const stargeo = new THREE.BufferGeometry();
const starmat = new THREE.PointsMaterial({ color: 0xffffff });

const starvertices = [];
for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starvertices.push(x, y, z);
}

stargeo.setAttribute('position', new THREE.Float32BufferAttribute(starvertices, 3));

const star = new THREE.Points(stargeo, starmat);

scene.add(star);
scene.add(atmosphere);
globe.add(pin);
scene.add(globe);


function setCanvasDimensions(canvas, width, height, set2dTransform = false) {
    const ratio = window.devicePixelRatio
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (set2dTransform) {
        canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    }
}

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    text.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(width, height);
    setCanvasDimensions(renderer.domElement, width, height);
})

function objectViewBlocked(objectName) {
    if (threeScene) {
        const object = threeScene.getObjectByName(objectName);
        if (object) {
            const direction = new THREE.Vector3();
            direction.subVectors(object.position, threeCamera.position);
            direction.normalize();
            const raycaster = new THREE.Raycaster(threeCamera.position, direction);
            const intersects = raycaster.intersectObjects(threeScene.children, false);
            if (intersects.length > 0) {
                for (let j = 0; j < intersects.length; j++) {
                    if ((intersects[j].object !== undefined) && (intersects[j].object['name'] !== objectName) && (intersects[j].object['name'] !== '')) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    return true;
};


const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 7;
controls.maxDistance = 18;
controls.autoRotate = true;
camera.position.set(0, 0, 10);
controls.update();


function animate() {
    requestAnimationFrame(animate);
    textrender.render(scene, camera);
    renderer.render(scene, camera);
    controls.update();
}
animate();