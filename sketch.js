let obj;
let verts = [];
let norms = [];
let texCoords = [];
let faces = [];
let fileInput;
let loaded = false;
let tex;
let gdata;
let labela;
let labelb;
let labelc;

// Use console to change! (size = ab, spin.x/y = ab or spin = {x: a, y: b})
// scroll wheel also changes size and mouse affects spin
let size = 5; //50-200 for smaller objects
let spin = { x: Infinity, y: 1000 }; // lower numbers are faster
let sw = 0; //strokeweight
let ax = 0;
let ay = 0;
let lmx = 0;
let lmy = 0;

// functions
function preload() {
  objInp = createFileInput(handle);
  imgInp = createFileInput(handle);
  tex = loadImage("orange.png");
  loadStrings("fish.txt", handle);
  objInp.attribute("accept", ".obj");
  objInp.hide();
  imgInp.attribute("accept", "image/*");
  imgInp.hide();
  labela = createElement("label", "Choose mesh (obj)");
  labela.child(objInp);
  labela.style("cursor", "pointer");
  labela.style("color", "white");
  labelb = createElement("label", "Choose texture (image)");
  labelb.child(imgInp);
  labelb.style("cursor", "pointer");
  labelb.style("color", "white");
  labelb.position(width + labelb.position().x*1.5,height + labelb.position().y)
  labela.position(width + labela.position().x,height + labela.position().y)
}

function setup() {
  createCanvas(600, 600, WEBGL);
  perspective(PI / 3, width / height, 0.01, 100000000);
  noStroke();
}

function saveData(data, filename) {
  // not mine lol
  let blob = new Blob([data], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function handle(file) {
  if (file.name || file.data) {
    if (
      file.name.endsWith(".obj") ||
      file.data.startsWith("data:application/octet-stream")
    ) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const base64 = event.target.result.split(",");
        const text = atob(base64[1]);
        verts = [];
        norms = [];
        texCoords = [];
        faces = [];
        from(text);
        to(file.name);
        console.log(file.type);
        loaded = true;
      };
      reader.readAsDataURL(file.file);
    } else if (
      file.data.startsWith("data:image/png")
    ) {
      const reader = new FileReader();
      reader.onload = function (event) {
        tex = loadImage(event.target.result, () => {});
      };
      reader.readAsDataURL(file.file);
    }
  } else {
    const base64 = file[0];
    const text = atob(base64);
    verts = [];
    norms = [];
    texCoords = [];
    faces = [];
    from(text);
    to("fish");
    loaded = true;
  }
}

function from(data) {
  const lines = data.split("\n");
  for (let line of lines) {
    let parts = line.trim().split(/\s+/);
    if (parts[0] === "v") {
      verts.push(
        createVector(float(parts[1]), float(parts[2]), float(parts[3]))
      );
    } else if (parts[0] === "vn") {
      norms.push(
        createVector(float(parts[1]), float(parts[2]), float(parts[3]))
      );
    } else if (parts[0] === "vt") {
      texCoords.push(createVector(float(parts[1]), float(parts[2])));
    } else if (parts[0] === "f") {
      let face = [];
      for (let i = 1; i < parts.length; i++) {
        let indices = parts[i].split("/");
        let vIdx = int(indices[0]) - 1;
        let uvIdx = indices[1] ? int(indices[1]) - 1 : -1;
        let nIdx = indices[2] ? int(indices[2]) - 1 : -1;
        face.push({ v: vIdx, uv: uvIdx, n: nIdx });
      }
      faces.push(face);
    }
  }
}
function mouseWheel(event) {
  size = constrain(size - event.delta / 50, 0.05, 10e10);
}

function to(name) {
  let meshData = "version 1.00\n";
  meshData += `${faces.length}\n`;
  for (let face of faces) {
    for (let i = 0; i < face.length; i++) {
      let vIdx = face[i].v;
      let uvIdx = face[i].uv;
      let nIdx = face[i].n;
      let p = verts[vIdx];
      let n = nIdx >= 0 ? norms[nIdx] : createVector(0, 0, 0);
      let uv = uvIdx >= 0 ? texCoords[uvIdx] : createVector(0, 0);
      meshData += `[${p.x.toFixed(6)}, ${p.y.toFixed(6)}, ${p.z.toFixed(6)}]`;
      meshData += `[${n.x.toFixed(5)}, ${n.y.toFixed(5)}, ${n.z.toFixed(5)}]`;
      meshData += `[${uv.x.toFixed(5)}, ${uv.y.toFixed(5)}, 0]\n`;
    }
  }
  //console.log(meshData);
  saveData([meshData], name.split(".")[0] + ".mesh"); 
}
let b = { x: 1, y: 1 };
function draw() {
  background(0);
  ambientLight(50);
  directionalLight(255, 255, 255, -1, -1, -1);
  pointLight(255, 255, 255, 0, 0, 200);

  if (!tex) {
    specularMaterial(250);
    shininess(50);
  }

  if (mouseIsPressed) {
    let dx = mouseX - lmx;
    let dy = mouseY - lmy;
    b = { x: 1, y: 1 };
    ax += dy * 0.01;
    ay -= dx * 0.01; // sensitivity
  }
  rotateY(millis() / spin.y + ay);
  rotateX(millis() / spin.x + ax + PI);
  lmx = mouseX;
  lmy = mouseY;
  ax /= b.x;
  ay /= b.y;
  b.x += 5e-3;
  b.y += 5e-3;
  if (loaded) {
    beginShape(TRIANGLES);
    for (let face of faces) {
      for (let i = 0; i < face.length; i++) {
        let v = verts[face[i].v];
        let n = face[i].n >= 0 ? norms[face[i].n] : createVector(0, 0, 1);
        let uv = face[i].uv >= 0 ? texCoords[face[i].uv] : createVector(0, 0);
        normal(n.x, n.y, n.z);
        texture(tex);
        vertex(v.x * size, v.y * size, v.z * size, uv.x, uv.y);
      }
    }
    endShape();
  }
}
