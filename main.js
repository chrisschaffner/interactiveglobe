import * as THREE from 'three';
import { MeshPhongMaterial } from 'three';
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from "jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "jsm/shaders/GammaCorrectionShader.js";



const scene = new THREE.Scene();

var containerWidth = document.getElementById('container3D').clientWidth;
var containerHeight = document.getElementById('container3D').clientHeight;

const camera = new THREE.PerspectiveCamera( 45, containerWidth/containerHeight, 0.1, 1000 );
scene.add(camera);
camera.position.z = -3;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMappingExposure = 100.0; // Adjust as needed
renderer.gammaOutput = false; // or false, depending on your scene requirements

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
renderPass.toneMapped = false; // Disable tonemapping for the render pass
const countryInfoDisplay = document.getElementById('countryNameDisplay');
const countryName = document.getElementById('cname');
const countryCapital = document.getElementById('ccapital');
const countryPopulation = document.getElementById('cpopulation');
countryInfoDisplay.style.display = 'none';


composer.addPass(renderPass);
let outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
composer.addPass(outlinePass);
outlinePass.edgeStrength = 5;
outlinePass.edgeThickness = 10;
composer.setSize(containerWidth, containerHeight);
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);  
composer.addPass(gammaCorrectionPass);

const container = document.getElementById( 'container3D' );
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.setClearColor( 0xffffff );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.zoomSpeed = .2;
controls.minDistance = 1.3;
controls.maxDistance = 5;

const background = new THREE.TextureLoader().load('background.jpeg');
background.repeat.set(0.5, 1);
scene.background = background;

const amblight = new THREE.AmbientLight(0x404040); // Soft white light
amblight.intensity = 50;
scene.add(amblight);

var outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.FrontSide });
outlineMaterial.transparent = true;
outlineMaterial.opacity = 0.6;
const geometry = new THREE.BoxGeometry;
var countryHighlight = new THREE.Mesh(geometry, outlineMaterial);
countryHighlight.scale.multiplyScalar(0);
var countryBorder = new THREE.Mesh(geometry, outlineMaterial);
countryBorder.scale.multiplyScalar(0);
/* scene.add(countryBorder) */
scene.add(countryHighlight);

const loader = new GLTFLoader();

const sceneMeshes = [];

loader.load(
    'globe6.glb',
    function (glb) {
        let earth = glb.scene;
        scene.add(earth);
        sceneMeshes.push(earth);
        outlinePass.selectedObjects.push(earth);
        glb.scene.traverse((child) => {
            if(child.name != "globe"){
                sceneMeshes.push(child);
            }
        });
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.log('An error happened', error);
    }
);




function setCountryHighlight(object) {
    if (object.isMesh) {
        countryHighlight.geometry = object.geometry.clone(); 
        countryHighlight.material = outlineMaterial.clone(); 
        countryHighlight.scale.copy(object.scale);
        countryHighlight.position.copy(object.position);
        countryHighlight.quaternion.copy(object.quaternion);
        countryHighlight.scale.multiplyScalar(1.005);
        countryHighlight.position.set(0, 0, 0);
        countryHighlight.quaternion.set(0, 0, 0, 1);
    }
}

function removeCountryHighlight(){
    countryHighlight.scale.multiplyScalar(0);
}


const animate = () => {
    requestAnimationFrame(animate);
    composer.render();
    controls.update();
};
  
animate();


const raycaster = new THREE.Raycaster()
let intersects = []
const mouse = new THREE.Vector2()

function onDocumentMouseMove(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(sceneMeshes, false);

    if (intersects.length !== 0) {
        setCountryHighlight(intersects[0].object);
        updateCountryInfo(intersects[0].object, event.clientX, event.clientY);
    } else {
        removeCountryHighlight();
        countryNameDisplay.style.display = 'none';
    }
}
document.addEventListener('mousemove', onDocumentMouseMove, false)

function updateCountryInfo(object, x, y) {
    const selectedCountryInfo = countryInfo[object.name]
    countryName.innerText = "Name: " + selectedCountryInfo.name;
    countryCapital.innerText = "Capital: " + selectedCountryInfo.capital;
    countryPopulation.innerText = "Population: " + selectedCountryInfo.population;
    if(x+50+countryInfoDisplay.offsetWidth>containerWidth){
        
        countryInfoDisplay.style.left = x - 50 - countryInfoDisplay.offsetWidth + 'px';
    } 
    else{
        countryInfoDisplay.style.left = x + 50 + 'px';
    }
    if(y+50+countryInfoDisplay.offsetHeight > window.innerHeight){
        countryInfoDisplay.style.top = y - 50 - countryInfoDisplay.offsetHeight + 'px';
    }
    else{
        countryInfoDisplay.style.top = y + 50 + 'px';
    }
    
    countryInfoDisplay.style.display = 'block';
}


const countryInfo = {
    'albania': {
        name: 'Albania',
        capital: 'Tirana',
        population: 2877797,
    },
    'andorra': {
        name: 'Andorra',
        capital: 'Andorra la Vella',
        population: 77281,
    },
    'austria': {
        name: 'Austria',
        capital: 'Vienna',
        population: 9006398,
    },
    'belarus': {
        name: 'Belarus',
        capital: 'Minsk',
        population: 9449323,
    },
    'belgium': {
        name: 'Belgium',
        capital: 'Brussels',
        population: 11589623,
    },
    'bosnia_and_herzegovina': {
        name: 'Bosnia and Herzegovina',
        capital: 'Sarajevo',
        population: 3280815,
    },
    'bulgaria': {
        name: 'Bulgaria',
        capital: 'Sofia',
        population: 6948445,
    },
    'croatia': {
        name: 'Croatia',
        capital: 'Zagreb',
        population: 4105267,
    },
    'cyprus': {
        name: 'Cyprus',
        capital: 'Nicosia',
        population: 1207359,
    },
    'czech_republic': {
        name: 'Czech Republic',
        capital: 'Prague',
        population: 10724555,
    },
    'denmark': {
        name: 'Denmark',
        capital: 'Copenhagen',
        population: 5831405,
    },
    'estonia': {
        name: 'Estonia',
        capital: 'Tallinn',
        population: 1326535,
    },
    'finland': {
        name: 'Finland',
        capital: 'Helsinki',
        population: 5540720,
    },
    'france': {
        name: 'France',
        capital: 'Paris',
        population: 65273511,
    },
    'germany': {
        name: 'Germany',
        capital: 'Berlin',
        population: 83122889,
    },
    'greece': {
        name: 'Greece',
        capital: 'Athens',
        population: 10423054,
    },
    'hungary': {
        name: 'Hungary',
        capital: 'Budapest',
        population: 9660351,
    },
    'iceland': {
        name: 'Iceland',
        capital: 'Reykjavik',
        population: 343599,
    },
    'ireland': {
        name: 'Ireland',
        capital: 'Dublin',
        population: 4982900,
    },
    'italy': {
        name: 'Italy',
        capital: 'Rome',
        population: 60360000,
    },
    'kosovo': {
        name: 'Kosovo',
        capital: 'Pristina',
        population: 1775378,
    },
    'latvia': {
        name: 'Latvia',
        capital: 'Riga',
        population: 1886198,
    },
    'liechtenstein': {
        name: 'Liechtenstein',
        capital: 'Vaduz',
        population: 38749,
    },
    'lithuania': {
        name: 'Lithuania',
        capital: 'Vilnius',
        population: 2722289,
    },
    'luxembourg': {
        name: 'Luxembourg',
        capital: 'Luxembourg City',
        population: 634730,
    },
    'malta': {
        name: 'Malta',
        capital: 'Valletta',
        population: 514564,
    },
    'moldova': {
        name: 'Moldova',
        capital: 'Chisinau',
        population: 2657637,
    },
    'monaco': {
        name: 'Monaco',
        capital: 'Monaco',
        population: 39242,
    },
    'montenegro': {
        name: 'Montenegro',
        capital: 'Podgorica',
        population: 622359,
    },
    'netherlands': {
        name: 'Netherlands',
        capital: 'Amsterdam',
        population: 17134872,
    },
    'north_macedonia': {
        name: 'North Macedonia',
        capital: 'Skopje',
        population: 2077132,
    },
    'norway': {
        name: 'Norway',
        capital: 'Oslo',
        population: 5437664,
    },
    'poland': {
        name: 'Poland',
        capital: 'Warsaw',
        population: 38433600,
    },
    'portugal': {
        name: 'Portugal',
        capital: 'Lisbon',
        population: 10295909,
    },
    'romania': {
        name: 'Romania',
        capital: 'Bucharest',
        population: 19237691,
    },
    'russia': {
        name: 'Russia',
        capital: 'Moscow',
        population: 146599183,
    },
    'san_marino': {
        name: 'San Marino',
        capital: 'San Marino',
        population: 33931,
    },
    'serbia': {
        name: 'Serbia',
        capital: 'Belgrade',
        population: 6982084,
    },
    'slovakia': {
        name: 'Slovakia',
        capital: 'Bratislava',
        population: 5450987,
    },
    'slovenia': {
        name: 'Slovenia',
        capital: 'Ljubljana',
        population: 2078654,
    },
    'spain': {
        name: 'Spain',
        capital: 'Madrid',
        population: 47329981,
    },
    'sweden': {
        name: 'Sweden',
        capital: 'Stockholm',
        population: 10099265,
    },
    'switzerland': {
        name: 'Switzerland',
        capital: 'Bern',
        population: 8654622,
    },
    'ukraine': {
        name: 'Ukraine',
        capital: 'Kyiv',
        population: 41902416,
    },
    'united_kingdom': {
        name: 'United Kingdom',
        capital: 'London',
        population: 66460344,
    },
    'vatican_city': {
        name: 'Vatican City',
        capital: 'Vatican City',
        population: 801,
    },
};