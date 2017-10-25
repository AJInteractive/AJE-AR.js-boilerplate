//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setClearColor(new THREE.Color("lightgrey"), 0);
renderer.setSize(640, 480);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0px";
renderer.domElement.style.left = "0px";
document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
var onRenderFcts = [];

// init scene and camera
var scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType: "webcam"

  // to read from an image
  // sourceType : 'image',
  // sourceUrl : './images/old-aja.jpg',

  // to read from a video
  // sourceType : 'video',
  // sourceUrl : '../data/videos/headtracking.mp4',
});

arToolkitSource.init(function onReady() {
  onResize();
});

function takeScreenshot() {
  var w = window.open("", "");
  w.document.title = "Screenshot";
  var img = new Image();
  var secondImg = new Image();
  renderer.render(scene, camera);
  var doubleImageCanvas = document.getElementById("doubleImage");
  var context = doubleImageCanvas.getContext("2d");
  var sources = {
    firstImage: renderer.domElement.toDataURL("image/png"),
    secondImage: arToolkitContext.arController.canvas.toDataURL("image/png")
  };
  loadImages(sources, function(images) {
    context.drawImage(images.secondImage, 0, 0);
    context.drawImage(images.firstImage, 0, 0);
    img.src = doubleImageCanvas.toDataURL("image/png");
    img.style = "width:100%;";
    w.document.body.appendChild(img);
  });
}

function loadImages(sources, callback) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for (var src in sources) {
    numImages++;
  }
  for (var src in sources) {
    images[src] = new Image();
    images[src].onload = function() {
      if (++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}

// on button click take screen shot
document.getElementById("snapshot").addEventListener("click", function() {
  takeScreenshot();
});

// handle resize
window.addEventListener("resize", function() {
  onResize();
});
function onResize() {
  arToolkitSource.onResize();
  arToolkitSource.copySizeTo(renderer.domElement);
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
  }
}
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
  cameraParametersUrl: "./data/camera_para.dat",
  detectionMode: "mono"
});
// initialize it
arToolkitContext.init(function onCompleted() {
  // copy projection matrix to camera
  camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

// update artoolkit on every frame
onRenderFcts.push(function() {
  if (arToolkitSource.ready === false) return;
  arToolkitContext.update(arToolkitSource.domElement);
  // update scene.visible if the marker is seen
  scene.visible = camera.visible;
});

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
  type: "pattern",
  patternUrl: "./data/patt.jazeera",
  // patternUrl : './data/patt.kanji',
  // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
  changeMatrixMode: "cameraTransformMatrix"
});
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false;

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a torus knot
var imgTexture = THREE.ImageUtils.loadTexture("images/old-aja.jpg");
var imgMaterial = new THREE.MeshBasicMaterial({
  map: imgTexture,
  transparent: true,
  opacity: 0.8
});

var geometry = new THREE.PlaneGeometry(5, 5);
var mesh = new THREE.Mesh(geometry, imgMaterial);
mesh.position.y = 0;
mesh.position.x = 0;
scene.add(mesh);
mesh.rotation.x = 1.5 * Math.PI;

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function() {
  renderer.render(scene, camera);
});

// run the rendering loop
var lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec = nowMsec;
  // call each update function
  onRenderFcts.forEach(function(onRenderFct) {
    onRenderFct(deltaMsec / 1000, nowMsec / 1000);
  });
});
