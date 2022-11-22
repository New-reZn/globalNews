'use strict';

import * as THREE from './Three.js';
import { OrbitControls } from './orbitcontrols.js';
import { CSS2DRenderer, CSS2DObject } from './CSS2DRenderer.js';

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

//globe here
const globe = new THREE.Mesh(
    new THREE.SphereGeometry(5, 100, 100),
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
globe.name = `globe`;

const textrender = new CSS2DRenderer();
textrender.setSize(window.innerWidth, window.innerHeight);
textrender.domElement.style.position = `absolute`;
textrender.domElement.style.top = `0px`;
textrender.domElement.style.pointerEvents = `none`;
document.body.appendChild(textrender.domElement);

//atmosphere here
const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 50, 50),
    new THREE.ShaderMaterial({
        vertexShader: vertexShaderAtmos,
        fragmentShader: fragmentShaderAtmos,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
);

atmosphere.name = 'atmosphere';
atmosphere.scale.set(1.5, 1.5, 1.5);
scene.add(atmosphere);

//stars here
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

scene.add(globe);

//pin here---------------------------------------------------

function objectViewBlocked(object) {
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, object.position);
    direction.normalize();
    const raycaster = new THREE.Raycaster(object.position, direction);
    const intersects = raycaster.intersectObjects(scene.children, false);
    const textobject = document.getElementById(`${object.name}`);
    if (intersects[0].object.name == `globe` || textobject != null) {
        textobject.style.animationName = `deletion`;
        textobject.addEventListener('animationend', () => {
            object.remove(object.children[0]);
            globe.remove(object);
        });
        return true;
    }
    return false;
}

function createpin(longitude, latitude, message, size) {
    const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 50, 50),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    let latlon = new THREE.Vector3(...calcPosFromLatLonRad(longitude, latitude, 5));
    pin.position.set(...latlon)
    pin.name = message.toString();
    globe.add(pin);
    objectViewBlocked(pin);
    const div = document.createElement('div');
    div.textContent = message;
    div.style.fontSize = size == undefined ? `${(1/message.length)*(message.length/10)+0.25}em` : size;
    console.log(div.style.fontSize);
    div.setAttribute('id', message);
    div.classList.add('text');
    const textobject = new CSS2DObject(div);
    textobject.name = message;
    pin.add(textobject);
    return pin;
}


let coords = [40.7142700, -74.0059700];

//------------------------------------------------------------

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
    textrender.setSize(width, height);
    renderer.setSize(width, height);
    setCanvasDimensions(renderer.domElement, width, height);
});


const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 7.5;
controls.maxDistance = 15;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
camera.position.set(0, 0, 10);
controls.update();

function animate() {
    requestAnimationFrame(animate);
    textrender.render(scene, camera);
    renderer.render(scene, camera);
    controls.update();
}

function getinfo() {
    fetch().then().then().catch();
}

animate();

let pin = createpin(coords[0], coords[1], "12356789X12356789X12356789X12356789X12356789X12356789X12356789X12356789X12356789X12356789X12356789X12356789X");
//setInterval(() => { objectViewBlocked(pin) }, 2000);