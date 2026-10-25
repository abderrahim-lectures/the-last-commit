(function () {
  "use strict";

  var P = {
    cream: "#f4e8cb",
    slate: "#20262c",
    ink: "#2b3036",
    teal: "#6aa7a0",
    mustard: "#f0c95e",
    coral: "#c25959",
    sage: "#9abf9a",
    wood: "#a77b55",
    glass: "#a9d8e0",
    white: "#fbf3df"
  };

  var FACES = [
    { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    { n: [1, 0, 0], v: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
    { n: [-1, 0, 0], v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    { n: [0, 1, 0], v: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] }
  ];

  var VERTEX_SHADER = [
    "varying vec3 vNormal;",
    "void main() {",
    "  vNormal = normalize(normalMatrix * normal);",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  var FRAGMENT_SHADER = [
    "layout(location = 1) out highp vec4 gInfo;",
    "uniform vec3 uColor;",
    "uniform float uGlow;",
    "uniform float uSurface;",
    "varying vec3 vNormal;",
    "vec2 encodeNormalSpheremap(vec3 n) {",
    "  float f = sqrt(8.0 * n.z + 8.0);",
    "  return n.xy / f * 2.0;",
    "}",
    "void main() {",
    "  vec3 n = normalize(vNormal);",
    "  float shade = 0.72 + 0.28 * max(dot(n, normalize(vec3(0.35, 0.85, 0.4))), 0.0);",
    "  vec3 col = uColor * shade + uColor * uGlow;",
    "  gl_FragColor = vec4(col, uSurface);",
    "  gInfo = vec4(1.0 - gl_FragCoord.z, encodeNormalSpheremap(n), 1.0);",
    "}"
  ].join("\n");

  var PODS = [
    { id: "office-worker-2", kind: "hub", back: 0.8, yaw: 0 },
    { id: "chef", kind: "cafeteria", back: 0.7, yaw: Math.PI * 0.5 },
    { id: "flower-lady", kind: "stand", back: 0.5, yaw: 0 }
  ];

  var state = null;

  function findNpc(scene, id) {
    for (var i = 0; i < scene.npcs.length; i++) {
      var npc = scene.npcs[i];
      if (npc.options && npc.options.id === id) return npc;
    }
    return null;
  }

  function findConstructor(items, type) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].type === type) return items[i].constructor;
    }
    return null;
  }

  function constructors(scene) {
    var mesh = scene.npcs[0].mesh;
    var topMesh = scene.children.find(function (child) { return child.type === "Mesh"; });
    var topGroup = scene.children.find(function (child) { return child.type === "Group"; });
    var meshCtor = topMesh ? topMesh.constructor : findConstructor(scene.children, "Mesh");
    var groupCtor = topGroup ? topGroup.constructor : findConstructor(scene.children, "Group");
    if (!meshCtor || !groupCtor) {
      scene.traverse(function (object) {
        if (!meshCtor && object.type === "Mesh") meshCtor = object.constructor;
        if (!groupCtor && object.type === "Group") groupCtor = object.constructor;
      });
    }
    return {
      Vec3: scene.camera.position.constructor,
      Quat: scene.camera.quaternion.constructor,
      Color: scene.directionalLight.color.constructor,
      Geometry: mesh.geometry.constructor,
      Attr: mesh.geometry.attributes.position.constructor,
      Mesh: meshCtor,
      Group: groupCtor,
      Material: mesh.material.constructor,
      Matrix: scene.camera.matrix.constructor
    };
  }

  function frameFor(npc, scene, C) {
    var pos = npc.mesh.position.clone();
    var up = pos.clone().normalize();
    var spawn = scene.characters.mesh._initialPosition
      ? scene.characters.mesh._initialPosition.clone()
      : new C.Vec3(5.810950253755102, 5.802050745049128, 25.779416818687126);
    var forward = spawn.clone().sub(pos);
    forward.addScaledVector(up, -forward.dot(up));
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, 1);
      forward.addScaledVector(up, -forward.dot(up));
    }
    forward.normalize();
    var right = new C.Vec3().crossVectors(up, forward).normalize();
    var matrix = scene.camera.matrix.clone();
    var e = matrix.elements;
    e[0] = right.x; e[1] = right.y; e[2] = right.z; e[3] = 0;
    e[4] = up.x; e[5] = up.y; e[6] = up.z; e[7] = 0;
    e[8] = forward.x; e[9] = forward.y; e[10] = forward.z; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
    var quat = new C.Quat();
    quat.setFromRotationMatrix(matrix);
    return { pos: pos, up: up, forward: forward, right: right, quat: quat };
  }

  function moveNpc(npc, frame, distance) {
    var pos = frame.pos.clone().addScaledVector(frame.forward, -distance);
    var radius = frame.pos.length();
    if (radius > 0) pos.normalize().multiplyScalar(radius);
    npc.mesh.position.copy(pos);
    npc.mesh.updateMatrixWorld(true);
  }

  function makeBucket(buckets, stateRef, color, glow) {
    var key = color + "|" + (glow ? "glow" : "flat");
    if (!buckets[key]) {
      stateRef.surface += 1;
      buckets[key] = {
        color: color,
        glow: glow || 0,
        surface: 0.55 + (stateRef.surface % 18) * 0.02,
        positions: [],
        normals: []
      };
    }
    return buckets[key];
  }

  function addBox(bucket, C, width, height, depth, x, y, z, quat, origin) {
    var hw = width * 0.5;
    var hh = height * 0.5;
    var hd = depth * 0.5;
    for (var f = 0; f < FACES.length; f++) {
      var face = FACES[f];
      var normal = new C.Vec3(face.n[0], face.n[1], face.n[2]).applyQuaternion(quat);
      for (var t = 0; t < 2; t++) {
        var indices = t === 0 ? [0, 1, 2] : [0, 2, 3];
        for (var k = 0; k < 3; k++) {
          var corner = face.v[indices[k]];
          var point = new C.Vec3(
            x + corner[0] * hw,
            y + corner[1] * hh,
            z + corner[2] * hd
          ).applyQuaternion(quat).add(origin);
          bucket.positions.push(point.x, point.y, point.z);
          bucket.normals.push(normal.x, normal.y, normal.z);
        }
      }
    }
  }

  function painter(buckets, stateRef, C, quat, origin) {
    return function (color, glow, width, height, depth, x, y, z) {
      addBox(makeBucket(buckets, stateRef, color, glow), C, width, height, depth, x, y, z, quat, origin);
    };
  }

  function buildHub(box) {
    box(P.slate, 0, 5.9, 0.10, 4.5, 0, 0.05, 0);
    box(P.cream, 0, 5.6, 0.16, 4.2, 0, 0.08, 0);
    box(P.teal, 0, 5.7, 0.05, 0.10, 0, 0.155, 2.08);
    box(P.cream, 0, 2.4, 0.02, 1.0, 0, 0.17, 1.3);
    box(P.teal, 0, 2.2, 0.02, 0.9, 0, 0.18, 1.3);
    box(P.cream, 0, 2.4, 0.08, 0.40, 0, 0.12, 2.25);

    box(P.cream, 0, 5.4, 2.4, 0.14, 0, 1.36, -1.65);
    box(P.teal, 0, 5.2, 0.75, 0.05, 0, 0.535, -1.57);
    box(P.slate, 0, 5.5, 0.09, 0.20, 0, 2.57, -1.65);
    box(P.slate, 0, 5.4, 0.06, 0.18, 0, 0.13, -1.65);

    box(P.slate, 0, 1.25, 0.85, 0.03, -1.55, 1.75, -1.57);
    box(P.glass, 0.10, 1.10, 0.70, 0.02, -1.55, 1.75, -1.545);
    box(P.slate, 0, 0.05, 0.75, 0.03, -1.55, 1.75, -1.54);
    box(P.slate, 0, 1.15, 0.05, 0.03, -1.55, 1.75, -1.54);

    box(P.mustard, 0, 0.55, 0.75, 0.03, 1.75, 1.70, -1.57);
    box(P.cream, 0, 0.45, 0.60, 0.02, 1.75, 1.70, -1.55);
    box(P.coral, 0, 0.35, 0.08, 0.02, 1.75, 1.85, -1.54);
    box(P.teal, 0, 0.30, 0.06, 0.02, 1.75, 1.65, -1.54);

    box(P.slate, 0, 0.28, 0.28, 0.03, 0.4, 2.12, -1.57);
    box(P.cream, 0, 0.22, 0.22, 0.02, 0.4, 2.12, -1.55);
    box(P.coral, 0, 0.02, 0.12, 0.01, 0.4, 2.17, -1.54);
    box(P.coral, 0, 0.09, 0.02, 0.01, 0.44, 2.12, -1.54);

    box(P.teal, 0, 0.12, 0.90, 1.3, -2.74, 0.61, -0.6);
    box(P.teal, 0, 0.12, 0.90, 1.3, 2.74, 0.61, -0.6);
    box(P.slate, 0, 0.14, 0.06, 1.3, -2.74, 1.06, -0.6);
    box(P.slate, 0, 0.14, 0.06, 1.3, 2.74, 1.06, -0.6);

    box(P.wood, 0, 2.4, 0.12, 0.8, -1.1, 0.95, 0.55);
    box(P.slate, 0, 0.08, 0.79, 0.08, -2.05, 0.555, 0.8);
    box(P.slate, 0, 0.08, 0.79, 0.08, -0.15, 0.555, 0.8);
    box(P.slate, 0, 0.08, 0.79, 0.08, -2.05, 0.555, 0.3);
    box(P.slate, 0, 0.08, 0.79, 0.08, -0.15, 0.555, 0.3);
    box(P.teal, 0, 2.2, 0.50, 0.06, -1.1, 0.65, 0.88);

    box(P.wood, 0, 2.0, 0.12, 0.8, 1.45, 0.95, 0.45);
    box(P.slate, 0, 0.08, 0.79, 0.08, 0.55, 0.555, 0.70);
    box(P.slate, 0, 0.08, 0.79, 0.08, 2.35, 0.555, 0.70);
    box(P.slate, 0, 0.08, 0.79, 0.08, 0.55, 0.555, 0.20);
    box(P.slate, 0, 0.08, 0.79, 0.08, 2.35, 0.555, 0.20);
    box(P.teal, 0, 1.8, 0.50, 0.06, 1.45, 0.65, 0.78);

    box(P.slate, 0, 0.32, 0.04, 0.20, -1.1, 1.03, 0.35);
    box(P.slate, 0, 0.06, 0.30, 0.06, -1.1, 1.19, 0.32);
    box(P.slate, 0, 0.90, 0.55, 0.08, -1.1, 1.47, 0.35);
    box(P.glass, 0.35, 0.78, 0.44, 0.02, -1.1, 1.47, 0.40);
    box(P.slate, 0, 0.32, 0.04, 0.20, 1.45, 1.03, 0.25);
    box(P.slate, 0, 0.06, 0.30, 0.06, 1.45, 1.19, 0.22);
    box(P.slate, 0, 0.90, 0.55, 0.08, 1.45, 1.47, 0.25);
    box(P.glass, 0.35, 0.78, 0.44, 0.02, 1.45, 1.47, 0.30);

    box(P.slate, 0, 0.55, 0.035, 0.16, -1.1, 1.03, 0.75);
    box(P.slate, 0, 0.50, 0.035, 0.15, 1.45, 1.03, 0.68);
    box(P.slate, 0, 0.08, 0.03, 0.10, -0.65, 1.03, 0.75);
    box(P.slate, 0, 0.08, 0.03, 0.10, 1.90, 1.03, 0.68);
    box(P.cream, 0, 0.30, 0.012, 0.22, -0.55, 1.03, 0.55);
    box(P.cream, 0, 0.24, 0.012, 0.18, -0.55, 1.045, 0.55);
    box(P.coral, 0, 0.10, 0.12, 0.10, -1.60, 1.08, 0.70);
    box(P.coral, 0, 0.04, 0.08, 0.04, -1.53, 1.08, 0.70);

    box(P.mustard, 0, 0.50, 0.08, 0.50, 1.45, 0.55, -0.15);
    box(P.mustard, 0, 0.50, 0.50, 0.08, 1.45, 0.85, -0.38);
    box(P.slate, 0, 0.08, 0.20, 0.08, 1.45, 0.40, -0.15);
    box(P.slate, 0, 0.40, 0.04, 0.40, 1.45, 0.26, -0.15);

    box(P.wood, 0, 0.06, 1.80, 0.50, -2.72, 0.90, -0.9);
    box(P.wood, 0, 0.06, 1.80, 0.50, -1.78, 0.90, -0.9);
    box(P.wood, 0, 0.94, 0.05, 0.50, -2.25, 0.55, -0.9);
    box(P.wood, 0, 0.94, 0.05, 0.50, -2.25, 0.95, -0.9);
    box(P.wood, 0, 0.94, 0.05, 0.50, -2.25, 1.35, -0.9);
    box(P.wood, 0, 0.94, 0.05, 0.50, -2.25, 1.75, -0.9);
    box(P.mustard, 0, 0.35, 0.30, 0.35, -2.25, 0.75, -0.9);
    box(P.coral, 0, 0.30, 0.30, 0.30, -2.25, 1.15, -0.9);
    box(P.cream, 0, 0.35, 0.25, 0.30, -2.25, 1.55, -0.9);
    box(P.cream, 0, 0.06, 0.32, 0.37, -2.25, 0.75, -0.9);
    box(P.cream, 0, 0.32, 0.06, 0.37, -2.25, 0.77, -0.9);

    box(P.slate, 0, 0.62, 1.50, 0.50, 2.25, 0.91, -0.9);
    box(P.ink, 0, 0.52, 1.35, 0.03, 2.25, 0.91, -0.64);
    box(P.teal, 0.70, 0.06, 0.06, 0.02, 2.10, 1.30, -0.62);
    box(P.mustard, 0.70, 0.06, 0.06, 0.02, 2.25, 1.30, -0.62);
    box(P.coral, 0.70, 0.06, 0.06, 0.02, 2.40, 1.30, -0.62);
    box(P.ink, 0, 0.35, 0.03, 0.02, 2.25, 0.95, -0.62);
    box(P.ink, 0, 0.35, 0.03, 0.02, 2.25, 0.70, -0.62);

    box(P.coral, 0, 0.30, 0.30, 0.30, -2.35, 0.31, 0.85);
    box(P.cream, 0, 0.34, 0.05, 0.34, -2.35, 0.48, 0.85);
    box(P.sage, 0, 0.06, 0.45, 0.06, -2.35, 0.70, 0.85);
    box(P.sage, 0, 0.45, 0.16, 0.30, -2.35, 0.90, 0.85);
    box(P.sage, 0, 0.30, 0.14, 0.42, -2.35, 1.02, 0.85);

    box(P.coral, 0, 0.30, 0.30, 0.30, 2.35, 0.31, 0.85);
    box(P.cream, 0, 0.34, 0.05, 0.34, 2.35, 0.48, 0.85);
    box(P.sage, 0, 0.06, 0.45, 0.06, 2.35, 0.70, 0.85);
    box(P.sage, 0, 0.45, 0.16, 0.30, 2.35, 0.90, 0.85);
    box(P.sage, 0, 0.30, 0.14, 0.42, 2.35, 1.02, 0.85);

    box(P.mustard, 0, 0.55, 0.55, 0.55, -2.05, 0.435, -0.2);
    box(P.cream, 0, 0.06, 0.57, 0.57, -2.05, 0.435, -0.2);
    box(P.cream, 0, 0.57, 0.06, 0.57, -2.05, 0.46, -0.2);
    box(P.coral, 0, 0.45, 0.45, 0.45, -2.10, 0.935, -0.2);
    box(P.cream, 0, 0.05, 0.47, 0.47, -2.10, 0.935, -0.2);
    box(P.cream, 0, 0.47, 0.05, 0.47, -2.10, 0.95, -0.2);

    box(P.teal, 0, 0.70, 0.80, 0.50, -1.7, 0.56, 1.35);
    box(P.slate, 0, 0.76, 0.08, 0.56, -1.7, 0.20, 1.35);
    box(P.ink, 0, 0.40, 0.08, 0.02, -1.7, 0.80, 1.61);
    box(P.cream, 0, 0.30, 0.18, 0.02, -1.7, 0.58, 1.61);
    box(P.coral, 0, 0.12, 0.12, 0.02, -1.7, 0.58, 1.62);

    box(P.slate, 0, 0.08, 2.90, 0.08, -2.5, 1.61, -1.75);
    box(P.slate, 0, 0.08, 2.90, 0.08, 2.5, 1.61, -1.75);
    box(P.slate, 0, 0.08, 2.90, 0.08, -2.5, 1.61, 1.75);
    box(P.slate, 0, 0.08, 2.90, 0.08, 2.5, 1.61, 1.75);
    box(P.cream, 0, 5.8, 0.12, 4.4, 0, 3.0, 0);
    box(P.teal, 0, 5.9, 0.06, 4.5, 0, 3.06, 0);
    box(P.teal, 0, 5.9, 0.18, 0.12, 0, 3.0, 2.2);

    box(P.teal, 0, 2.6, 0.60, 0.08, 0, 2.60, 1.72);
    box(P.cream, 0, 2.4, 0.45, 0.02, 0, 2.60, 1.77);
    box(P.coral, 0, 0.18, 0.18, 0.02, -0.8, 2.60, 1.78);
    box(P.teal, 0, 0.90, 0.08, 0.02, 0.35, 2.66, 1.78);
    box(P.teal, 0, 0.60, 0.06, 0.02, 0.35, 2.54, 1.78);
    box(P.mustard, 0, 0.10, 0.10, 0.02, 0.95, 2.60, 1.78);
  }

  function buildCafeteria(box) {
    box(P.slate, 0, 5.0, 0.10, 3.8, 0, 0.05, 0);
    box(P.cream, 0, 4.8, 0.16, 3.6, 0, 0.08, 0);
    box(P.mustard, 0, 4.9, 0.05, 0.10, 0, 0.155, 1.78);
    box(P.cream, 0, 1.8, 0.02, 0.8, 0, 0.17, 1.02);
    box(P.mustard, 0, 1.6, 0.02, 0.7, 0, 0.18, 1.02);

    box(P.cream, 0, 4.6, 2.2, 0.14, 0, 1.26, -1.45);
    box(P.mustard, 0, 4.4, 0.70, 0.05, 0, 0.49, -1.37);
    box(P.slate, 0, 4.7, 0.08, 0.20, 0, 2.37, -1.45);
    box(P.slate, 0, 4.6, 0.06, 0.18, 0, 0.13, -1.45);

    box(P.wood, 0, 2.6, 0.12, 0.75, 0, 0.92, 0.25);
    box(P.slate, 0, 0.08, 0.76, 0.08, -1.1, 0.52, 0.50);
    box(P.slate, 0, 0.08, 0.76, 0.08, 1.1, 0.52, 0.50);
    box(P.slate, 0, 0.08, 0.76, 0.08, -1.1, 0.52, 0.0);
    box(P.slate, 0, 0.08, 0.76, 0.08, 1.1, 0.52, 0.0);
    box(P.mustard, 0, 2.4, 0.45, 0.06, 0, 0.62, 0.57);

    box(P.slate, 0, 0.42, 0.52, 0.38, -0.65, 1.24, 0.10);
    box(P.glass, 0.25, 0.30, 0.28, 0.02, -0.65, 1.22, 0.30);
    box(P.slate, 0, 0.10, 0.10, 0.08, -0.65, 1.55, 0.10);
    box(P.coral, 0.60, 0.06, 0.10, 0.02, -0.65, 1.22, 0.31);
    box(P.slate, 0, 0.35, 0.28, 0.30, 0.45, 1.12, 0.10);
    box(P.glass, 0.30, 0.24, 0.16, 0.02, 0.45, 1.12, 0.28);
    box(P.cream, 0, 0.12, 0.16, 0.12, 0.45, 1.36, 0.10);
    box(P.teal, 0, 0.10, 0.10, 0.10, 1.0, 1.04, 0.12);
    box(P.mustard, 0, 0.10, 0.10, 0.10, 1.2, 1.04, 0.12);

    box(P.slate, 0, 0.70, 0.16, 0.06, 0, 1.85, -1.34);
    box(P.cream, 0, 0.60, 0.24, 0.02, 0, 1.85, -1.30);
    box(P.teal, 0, 0.42, 0.035, 0.02, 0, 1.92, -1.28);
    box(P.teal, 0, 0.34, 0.03, 0.02, 0, 1.84, -1.28);
    box(P.coral, 0, 0.26, 0.03, 0.02, 0, 1.76, -1.28);

    box(P.wood, 0, 0.80, 0.06, 0.80, -1.45, 0.60, -0.35);
    box(P.wood, 0, 0.06, 0.45, 0.06, -1.45, 0.42, -0.35);
    box(P.wood, 0, 0.80, 0.06, 0.80, 1.45, 0.60, -0.35);
    box(P.wood, 0, 0.06, 0.45, 0.06, 1.45, 0.42, -0.35);
    box(P.wood, 0, 0.34, 0.36, 0.34, -1.45, 0.30, -0.05);
    box(P.mustard, 0, 0.30, 0.30, 0.30, -1.45, 0.30, -0.65);
    box(P.teal, 0, 0.30, 0.30, 0.30, 1.45, 0.30, -0.65);

    box(P.mustard, 0, 4.4, 0.05, 3.4, 0, 2.80, 0);
    box(P.cream, 0, 4.6, 0.10, 3.6, 0, 2.86, 0);
    box(P.coral, 0, 4.6, 0.14, 0.10, 0, 2.80, 1.88);
    box(P.slate, 0, 0.08, 2.60, 0.08, -2.2, 1.41, -1.60);
    box(P.slate, 0, 0.08, 2.60, 0.08, 2.2, 1.41, -1.60);
    box(P.slate, 0, 0.08, 2.60, 0.08, -2.2, 1.41, 1.60);
    box(P.slate, 0, 0.08, 2.60, 0.08, 2.2, 1.41, 1.60);

    box(P.coral, 0, 0.28, 0.28, 0.28, -2.0, 0.30, 0.70);
    box(P.cream, 0, 0.32, 0.05, 0.32, -2.0, 0.46, 0.70);
    box(P.sage, 0, 0.06, 0.42, 0.06, -2.0, 0.68, 0.70);
    box(P.sage, 0, 0.40, 0.15, 0.28, -2.0, 0.86, 0.70);
    box(P.sage, 0, 0.28, 0.12, 0.38, -2.0, 0.98, 0.70);
  }

  function buildStand(box) {
    box(P.slate, 0, 4.0, 0.10, 3.2, 0, 0.05, 0);
    box(P.cream, 0, 3.8, 0.16, 3.2, 0, 0.08, 0);
    box(P.sage, 0, 3.9, 0.05, 0.10, 0, 0.155, 1.58);
    box(P.cream, 0, 1.6, 0.02, 0.7, 0, 0.17, 0.92);
    box(P.sage, 0, 1.4, 0.02, 0.6, 0, 0.18, 0.92);

    box(P.cream, 0, 3.4, 1.9, 0.12, 0, 1.11, -1.30);
    box(P.sage, 0, 3.2, 0.60, 0.05, 0, 0.44, -1.22);
    box(P.slate, 0, 3.5, 0.08, 0.18, 0, 2.07, -1.30);

    box(P.wood, 0, 2.8, 0.12, 0.70, 0, 0.86, 0.30);
    box(P.slate, 0, 0.08, 0.70, 0.08, -1.2, 0.46, 0.55);
    box(P.slate, 0, 0.08, 0.70, 0.08, 1.2, 0.46, 0.55);
    box(P.slate, 0, 0.08, 0.70, 0.08, -1.2, 0.46, 0.05);
    box(P.slate, 0, 0.08, 0.70, 0.08, 1.2, 0.46, 0.05);
    box(P.sage, 0, 2.6, 0.40, 0.06, 0, 0.58, 0.60);

    box(P.coral, 0, 0.34, 0.34, 0.34, -0.95, 0.73, 0.30);
    box(P.cream, 0, 0.38, 0.06, 0.38, -0.95, 0.91, 0.30);
    box(P.coral, 0, 0.14, 0.14, 0.14, -0.95, 1.03, 0.30);
    box(P.sage, 0, 0.06, 0.40, 0.06, -0.95, 1.22, 0.30);
    box(P.sage, 0, 0.38, 0.12, 0.24, -0.95, 1.38, 0.30);
    box(P.coral, 0, 0.16, 0.16, 0.16, -1.15, 1.44, 0.30);
    box(P.mustard, 0, 0.12, 0.12, 0.12, -0.75, 1.48, 0.30);

    box(P.mustard, 0, 0.34, 0.34, 0.34, 0.05, 0.73, 0.30);
    box(P.cream, 0, 0.38, 0.06, 0.38, 0.05, 0.91, 0.30);
    box(P.sage, 0, 0.06, 0.38, 0.06, 0.05, 1.20, 0.30);
    box(P.sage, 0, 0.34, 0.12, 0.22, 0.05, 1.34, 0.30);
    box(P.mustard, 0, 0.18, 0.18, 0.18, -0.05, 1.43, 0.30);
    box(P.cream, 0, 0.12, 0.12, 0.12, 0.20, 1.45, 0.30);

    box(P.teal, 0, 0.36, 0.36, 0.36, 1.0, 0.74, 0.30);
    box(P.cream, 0, 0.40, 0.06, 0.40, 1.0, 0.92, 0.30);
    box(P.sage, 0, 0.06, 0.42, 0.06, 1.0, 1.23, 0.30);
    box(P.sage, 0, 0.40, 0.12, 0.26, 1.0, 1.40, 0.30);
    box(P.teal, 0, 0.18, 0.18, 0.18, 1.0, 1.50, 0.30);

    box(P.cream, 0, 3.4, 0.10, 2.0, 0, 2.55, 0.10);
    box(P.sage, 0, 3.2, 0.05, 1.95, 0, 2.50, 0.10);
    box(P.coral, 0, 0.60, 0.05, 1.95, -1.0, 2.50, 0.10);
    box(P.coral, 0, 0.60, 0.05, 1.95, 1.0, 2.50, 0.10);
    box(P.slate, 0, 0.07, 2.20, 0.07, -1.55, 1.18, -1.40);
    box(P.slate, 0, 0.07, 2.20, 0.07, 1.55, 1.18, -1.40);
    box(P.slate, 0, 0.07, 2.20, 0.07, -1.55, 1.18, 1.30);
    box(P.slate, 0, 0.07, 2.20, 0.07, 1.55, 1.18, 1.30);
    box(P.slate, 0, 0.07, 2.20, 0.07, -0.55, 1.18, 1.30);
    box(P.slate, 0, 0.07, 2.20, 0.07, 0.55, 1.18, 1.30);

    box(P.sage, 0, 1.5, 0.45, 0.08, 0, 2.07, 1.38);
    box(P.cream, 0, 1.35, 0.32, 0.02, 0, 2.05, 1.43);
    box(P.coral, 0, 0.12, 0.12, 0.02, -0.35, 2.05, 1.44);
    box(P.mustard, 0, 0.12, 0.12, 0.02, 0.0, 2.05, 1.44);
    box(P.teal, 0, 0.12, 0.12, 0.02, 0.35, 2.05, 1.44);

    box(P.coral, 0, 0.26, 0.26, 0.26, 1.55, 0.29, 0.80);
    box(P.cream, 0, 0.30, 0.05, 0.30, 1.55, 0.44, 0.80);
    box(P.sage, 0, 0.06, 0.36, 0.06, 1.55, 0.64, 0.80);
    box(P.sage, 0, 0.34, 0.14, 0.26, 1.55, 0.80, 0.80);
  }

  function flush(buckets, C, matCtor, geoCtor, attrCtor, meshCtor, group, scene) {
    var surface = 0;
    for (var key in buckets) {
      if (!Object.prototype.hasOwnProperty.call(buckets, key)) continue;
      var bucket = buckets[key];
      var geo = new geoCtor();
      geo.setAttribute("position", new attrCtor(new Float32Array(bucket.positions), 3));
      geo.setAttribute("normal", new attrCtor(new Float32Array(bucket.normals), 3));
      geo.computeBoundingSphere();
      var material = new matCtor({
        uniforms: {
          uColor: { value: new C.Color(bucket.color) },
          uGlow: { value: bucket.glow },
          uSurface: { value: bucket.surface }
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER
      });
      var mesh = new meshCtor(geo, material);
      mesh.frustumCulled = false;
      mesh.raycast = function () {};
      group.add(mesh);
      surface += 1;
    }
    scene.add(group);
    return surface;
  }

  function podGroup(frame, C) {
    var group = new C.Group();
    group.position.copy(frame.pos);
    group.quaternion.copy(frame.quat);
    return group;
  }

  function buildPod(npc, frame, kind, C, scene, yaw) {
    var group = podGroup(frame, C);
    if (yaw) {
      group.quaternion.multiply(new C.Quat().setFromAxisAngle(frame.up, yaw));
    }
    var buckets = {};
    var localState = { surface: 0 };
    var box = painter(buckets, localState, C, new C.Quat(), new C.Vec3(0, 0, 0));
    if (kind === "hub") buildHub(box);
    else if (kind === "cafeteria") buildCafeteria(box);
    else buildStand(box);
    var surfaces = flush(
      buckets,
      C,
      C.Material,
      C.Geometry,
      C.Attr,
      C.Mesh,
      group,
      scene
    );
    return { group: group, surfaces: surfaces, localState: localState };
  }


  function centerFrame(scene, C) {
    var player = scene.characters && scene.characters.mesh;
    var object = player && player._localObject;
    if (!object || !object.position) return null;
    var spawn = object.position.clone();
    var radius = spawn.length();
    if (radius < 0.001) return null;
    var up = spawn.clone().normalize();
    var forward = new C.Vec3(0, 0, 1).applyQuaternion(object.quaternion);
    forward.addScaledVector(up, -forward.dot(up));
    if (forward.lengthSq() < 0.0001) {
      forward.set(1, 0, 0);
      forward.addScaledVector(up, -forward.dot(up));
    }
    forward.normalize();
    var pos = spawn.clone().addScaledVector(forward, 4.6).normalize().multiplyScalar(radius);
    var toward = spawn.clone().sub(pos);
    toward.addScaledVector(up, -toward.dot(up)).normalize();
    var right = new C.Vec3().crossVectors(up, toward).normalize();
    var matrix = scene.camera.matrix.clone();
    var e = matrix.elements;
    e[0] = right.x; e[1] = right.y; e[2] = right.z; e[3] = 0;
    e[4] = up.x; e[5] = up.y; e[6] = up.z; e[7] = 0;
    e[8] = toward.x; e[9] = toward.y; e[10] = toward.z; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
    var quat = new C.Quat();
    quat.setFromRotationMatrix(matrix);
    return { pos: pos, up: up, forward: toward, right: right, quat: quat };
  }

  function buildPc(box) {
    box(P.slate, 0, 1.10, 2.05, 0.62, 0, 1.05, 0);
    box(P.teal, 0, 0.10, 2.05, 0.64, -0.55, 1.05, 0);
    box(P.teal, 0, 0.10, 2.05, 0.64, 0.55, 1.05, 0);
    box(P.slate, 0, 1.04, 0.20, 0.70, 0, 0.10, 0);

    box(P.mustard, 0.15, 1.00, 0.44, 0.10, 0, 1.94, 0.28);
    box(P.cream, 0, 0.84, 0.28, 0.04, 0, 1.94, 0.34);

    box(P.slate, 0, 0.86, 0.60, 0.06, 0, 1.52, 0.30);
    box(P.glass, 0.60, 0.68, 0.42, 0.02, 0, 1.52, 0.34);

    box(P.cream, 0, 0.62, 0.30, 0.04, 0, 1.12, 0.33);
    box(P.slate, 0, 0.12, 0.08, 0.02, -0.18, 1.18, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, 0, 1.18, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, 0.18, 1.18, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, -0.18, 1.06, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, 0, 1.06, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, 0.18, 1.06, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, -0.18, 0.94, 0.36);
    box(P.slate, 0, 0.12, 0.08, 0.02, 0, 0.94, 0.36);
    box(P.coral, 0, 0.12, 0.08, 0.02, 0.18, 0.94, 0.36);

    box(P.slate, 0, 0.34, 0.03, 0.04, -0.20, 0.78, 0.33);
    box(P.mustard, 0.30, 0.34, 0.03, 0.04, 0.20, 0.78, 0.33);
    box(P.slate, 0, 0.16, 0.16, 0.06, 0.36, 1.02, 0.30);
    box(P.teal, 0.35, 0.20, 0.20, 0.02, -0.32, 0.58, 0.32);
  }

  function watchPc(scene, pc) {
    var inRange = false;
    var marker = document.createElement("div");
    marker.id = "p101-center-marker";
    marker.hidden = true;
    marker.innerHTML = '<span>PYTHON PC</span><small>press E to use</small>' +
      '<button type="button" data-use>Use PC</button>';
    document.body.appendChild(marker);

    function battleOpen() {
      var battle = window.__python101 && window.__python101.battle;
      return Boolean(battle && battle.isOpen());
    }

    function canOpen() {
      var ui = window.__python101CenterUI;
      return Boolean(ui && inRange && !ui.isOpen() && !battleOpen());
    }

    function use() {
      if (!canOpen()) return;
      window.__python101CenterUI.open();
    }

    marker.querySelector("[data-use]").addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      use();
    });

    window.addEventListener("keydown", function (event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "e" && event.key !== "E" && event.key !== "Enter") return;
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!canOpen()) return;
      event.preventDefault();
      use();
    });

    function tick() {
      var player = scene.characters && scene.characters.mesh && scene.characters.mesh._localObject;
      var ui = window.__python101CenterUI;
      if (!player || !player.position) {
        window.requestAnimationFrame(tick);
        return;
      }
      var distance = player.position.distanceTo(pc.position);
      var open = Boolean(ui && ui.isOpen());
      inRange = distance <= 3.4 && !open && !battleOpen();
      if (ui) {
        ui.setPrompt("Press E to use the Python PC.", inRange);
      }
      var projected = pc.position.clone();
      projected.y += 2.6;
      projected.project(scene.camera);
      var onScreen = projected.z > -1 && projected.z < 1 &&
        Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2;
      marker.hidden = !(onScreen && distance < 18 && !open);
      if (!marker.hidden) {
        marker.style.left = (projected.x * 0.5 + 0.5) * window.innerWidth + "px";
        marker.style.top = (-projected.y * 0.5 + 0.5) * window.innerHeight + "px";
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  function makePc(scene, C) {
    var object = scene.characters && scene.characters.mesh._localObject;
    if (!object) return null;
    var group = new C.Group();
    var spawn = object._initialPosition ? object._initialPosition.clone() : object.position.clone();
    var radius = spawn.length();
    if (radius < 0.001) return null;
    var up = spawn.clone().normalize();
    var cross = new C.Vec3().crossVectors(up, new C.Vec3(0, 1, 0)).normalize();
    group.position.copy(spawn).addScaledVector(cross, -3.5).normalize().multiplyScalar(radius);
    var toward = cross;
    var right = new C.Vec3().crossVectors(up, toward).normalize();
    var matrix = scene.camera.matrix.clone();
    matrix.elements[0] = right.x; matrix.elements[1] = right.y; matrix.elements[2] = right.z;
    matrix.elements[4] = up.x; matrix.elements[5] = up.y; matrix.elements[6] = up.z;
    matrix.elements[8] = toward.x; matrix.elements[9] = toward.y; matrix.elements[10] = toward.z;
    matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
    matrix.elements[12] = matrix.elements[13] = matrix.elements[14] = 0;
    matrix.elements[15] = 1;
    var quat = new C.Quat();
    quat.setFromRotationMatrix(matrix);
    group.quaternion.copy(quat);
    var buckets = {};
    var localState = { surface: 0 };
    var box = painter(buckets, localState, C, new C.Quat(), new C.Vec3(0, 0, 0));
    buildPc(box);
    var surfaces = flush(buckets, C, C.Material, C.Geometry, C.Attr, C.Mesh, group, scene);
    scene.add(group);
    var pc = { position: group.position.clone(), group: group, surfaces: surfaces };
    watchPc(scene, pc);
    return pc;
  }

  function build(scene) {
    if (!scene || state === scene) return;
    state = scene;
    var C = constructors(scene);
    if (!C.Mesh || !C.Group || !C.Material) return;
    var pods = [];
    var surfaces = 0;
    var i;
    for (i = 0; i < PODS.length; i++) {
      var spec = PODS[i];
      var npc = findNpc(scene, spec.id);
      if (!npc) continue;
      var frame = frameFor(npc, scene, C);
      var yaw = spec.yaw || 0;
      var pod = buildPod(npc, frame, spec.kind, C, scene, yaw);
      var podForward = frame.forward.clone().applyQuaternion(
        new C.Quat().setFromAxisAngle(frame.up, yaw)
      );
      var podRight = new C.Vec3().crossVectors(frame.up, podForward).normalize();
      moveNpc(npc, { pos: frame.pos, forward: podForward }, spec.back);
      surfaces += pod.surfaces;
      pods.push({
        id: spec.id,
        kind: spec.kind,
        group: pod.group,
        position: frame.pos.clone(),
        forward: podForward,
        right: podRight
      });
    }
    var pc = makePc(scene, C);
    if (pc) surfaces += pc.surfaces;
    window.__python101Office = {
      ready: true,
      pods: pods,
      pc: pc,
      center: pc,
      surfaces: surfaces,
      scene: scene
    };
  }

  function boot() {
    if (window.__python101Present) build(window.__python101Present);
  }

  if (window.__python101Bus && typeof window.__python101Bus.on === "function") {
    window.__python101Bus.on("python101_present_ready", build);
  }
  window.__python101OfficeBuild = build;
  boot();
})();

