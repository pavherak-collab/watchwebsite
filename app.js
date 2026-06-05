/* ════════════════════════════════════════════════════════
   CHRONOS — app.js
   Three.js photorealistic watch · scroll explode · clock
════════════════════════════════════════════════════════ */
'use strict';

const lerp  = (a,b,t) => a+(b-a)*t;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const ease  = t => t<.5?2*t*t:-1+(4-2*t)*t;

/* COLOURS */
const C = {
  gold:0xC9A96E, goldLt:0xE8D5A3, goldDk:0x7A5C1E,
  steel:0x8A8A8A, steelDk:0x3A3A3A, steelLt:0xC0C0C0,
  black:0x080807, dialBg:0x100F0A,
  leather:0x2D1A08, leatherLt:0x4A2A10,
  red:0xCC2222, crystal:0xADD8F0,
};

/* PBR MATERIAL FACTORY */
function mat(opts){ return new THREE.MeshStandardMaterial(opts); }

/* CANVAS TEXTURE HELPER */
function canvasTex(w,h,fn){
  const c=document.createElement('canvas');
  c.width=w; c.height=h;
  fn(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  t.needsUpdate=true;
  return t;
}

/* BRUSHED STEEL TEXTURE */
function steelTex(){
  return canvasTex(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#6a6a6a'; ctx.fillRect(0,0,w,h);
    for(let i=0;i<2400;i++){
      const y=Math.random()*h, len=20+Math.random()*80;
      const v=Math.floor(80+Math.random()*60);
      ctx.strokeStyle=`rgba(${v},${v},${v},0.22)`;
      ctx.lineWidth=.4;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(len,y); ctx.stroke();
    }
    const g=ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'rgba(0,0,0,.25)');
    g.addColorStop(.35,'rgba(255,255,255,.12)');
    g.addColorStop(.65,'rgba(255,255,255,.04)');
    g.addColorStop(1,'rgba(0,0,0,.2)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  });
}

/* DIAL TEXTURE — sunburst + indices + brand */
function dialTex(){
  return canvasTex(1024,1024,(ctx,w,h)=>{
    const cx=w/2, cy=h/2;
    ctx.fillStyle='#0e0d09'; ctx.fillRect(0,0,w,h);
    // Sunburst
    for(let i=0;i<120;i++){
      const a=(i/120)*Math.PI*2;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(a);
      ctx.strokeStyle=`rgba(255,255,255,${.007+.007*(i%2)})`;
      ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-cx); ctx.stroke();
      ctx.restore();
    }
    // Vignette
    const vig=ctx.createRadialGradient(cx,cy,0,cx,cy,cx);
    vig.addColorStop(0,'rgba(30,26,15,0)');
    vig.addColorStop(.7,'rgba(10,9,5,.2)');
    vig.addColorStop(1,'rgba(0,0,0,.7)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,w,h);
    // Hour indices
    const ir=cx*.82;
    ctx.fillStyle='#C9A96E';
    for(let h12=0;h12<12;h12++){
      const a=(h12/12)*Math.PI*2-Math.PI/2;
      const ix=cx+Math.cos(a)*ir, iy=cy+Math.sin(a)*ir;
      ctx.save(); ctx.translate(ix,iy); ctx.rotate(a+Math.PI/2);
      if(h12%3===0){ ctx.fillRect(-4,-18,8,26); }
      else{ ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
    // Minute dots
    ctx.fillStyle='rgba(201,169,110,.55)';
    for(let m=0;m<60;m++){
      if(m%5===0) continue;
      const a=(m/60)*Math.PI*2-Math.PI/2, mr=cx*.88;
      ctx.beginPath();
      ctx.arc(cx+Math.cos(a)*mr,cy+Math.sin(a)*mr,2.5,0,Math.PI*2);
      ctx.fill();
    }
    // Brand
    ctx.textAlign='center';
    ctx.fillStyle='#C9A96E';
    ctx.font='bold 52px "Bebas Neue",sans-serif';
    ctx.fillText('CHRONOS',cx,cy-cx*.2);
    ctx.fillStyle='rgba(201,169,110,.5)';
    ctx.font='20px "Space Mono",monospace';
    ctx.fillText('GENÈVE · SWISS MADE',cx,cy-cx*.06);
    // Sub-dial
    const scy=cy+cx*.44;
    ctx.strokeStyle='rgba(201,169,110,.45)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(cx,scy,cx*.14,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(201,169,110,.18)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(cx,scy,cx*.1,0,Math.PI*2); ctx.stroke();
    for(let i=0;i<60;i++){
      const a=(i/60)*Math.PI*2-Math.PI/2;
      const r0=cx*.13, r1=cx*(i%5===0?.105:.115);
      ctx.strokeStyle='rgba(201,169,110,.5)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*r0,scy+Math.sin(a)*r0);
      ctx.lineTo(cx+Math.cos(a)*r1,scy+Math.sin(a)*r1);
      ctx.stroke();
    }
  });
}

/* LEATHER TEXTURE */
function leatherTex(){
  return canvasTex(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#2D1A08'; ctx.fillRect(0,0,w,h);
    for(let i=0;i<3000;i++){
      const x=Math.random()*w, y=Math.random()*h, r=1+Math.random()*2;
      ctx.fillStyle=`rgba(${Math.random()>.5?60:10},${Math.floor(Math.random()*15)},0,${.15+Math.random()*.2})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    for(let y=0;y<h;y+=10){
      ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=.5;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }
    const g=ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'rgba(0,0,0,.3)');
    g.addColorStop(.5,'rgba(255,255,255,.05)');
    g.addColorStop(1,'rgba(0,0,0,.35)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  });
}

/* CRYSTAL NORMAL MAP */
function crystalNormal(){
  return canvasTex(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#8080ff'; ctx.fillRect(0,0,w,h);
    for(let i=0;i<200;i++){
      const x=Math.random()*w, y=Math.random()*h, r=5+Math.random()*20;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(140,140,255,.15)');
      g.addColorStop(1,'rgba(128,128,255,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  });
}

/* MOVEMENT PLATE TEXTURE */
function movTex(){
  return canvasTex(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#1a1508'; ctx.fillRect(0,0,w,h);
    // Geneva stripes
    ctx.strokeStyle='rgba(201,169,110,.15)'; ctx.lineWidth=3;
    for(let x=0;x<w;x+=10){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    // Bridges
    ctx.fillStyle='rgba(20,18,8,.8)';
    [[60,120,392,55],[60,200,350,50],[60,310,380,50]].forEach(([x,y,bw,bh])=>{
      ctx.fillRect(x,y,bw,bh);
      ctx.strokeStyle='rgba(201,169,110,.4)'; ctx.lineWidth=1.5;
      ctx.strokeRect(x,y,bw,bh);
    });
    // Gears
    [[180,180,55],[340,300,42]].forEach(([cx,cy,r])=>{
      ctx.strokeStyle='rgba(201,169,110,.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,r*.55,0,Math.PI*2); ctx.stroke();
      for(let i=0;i<24;i++){
        const a=(i/24)*Math.PI*2;
        ctx.fillStyle='rgba(201,169,110,.35)';
        ctx.fillRect(cx+Math.cos(a)*(r-4)-2,cy+Math.sin(a)*(r-4)-2,4,4);
      }
      ctx.fillStyle='rgba(201,169,110,.5)';
      ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fill();
    });
    // Screws
    [[90,140],[420,140],[90,380],[420,380]].forEach(([sx,sy])=>{
      ctx.strokeStyle='rgba(201,169,110,.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,12,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(25,21,8,.9)';
      ctx.beginPath(); ctx.arc(sx,sy,10,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(201,169,110,.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(sx-7,sy); ctx.lineTo(sx+7,sy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx,sy-7); ctx.lineTo(sx,sy+7); ctx.stroke();
    });
  });
}

/* ══════════════════════════════════════════════
   BUILD WATCH — returns THREE.Group
══════════════════════════════════════════════ */
function buildWatch(){
  const group=new THREE.Group();

  const sMat   = mat({color:C.steel,  metalness:.92,roughness:.18,map:steelTex()});
  const sDkMat = mat({color:C.steelDk,metalness:.95,roughness:.12});
  const sLtMat = mat({color:C.steelLt,metalness:.98,roughness:.08});
  const goldMat   = mat({color:C.gold,  metalness:.88,roughness:.25});
  const goldLtMat = mat({color:C.goldLt,metalness:.85,roughness:.22});
  const dialMat   = mat({color:C.dialBg,metalness:.3, roughness:.55,map:dialTex()});
  const lMat      = mat({color:C.leather,roughness:.85,metalness:0,map:leatherTex()});
  const crystalMat= mat({
    color:C.crystal,metalness:0,roughness:0,
    transparent:true,opacity:.13,envMapIntensity:2.5,
    normalMap:crystalNormal(),
    normalScale:new THREE.Vector2(.08,.08),
  });
  const redMat = mat({color:C.red,metalness:.3,roughness:.4,emissive:C.red,emissiveIntensity:.3});

  /* ── Case ── */
  const caseGroup=new THREE.Group(); caseGroup.name='case';
  const caseMesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.55,64),sMat);
  caseMesh.name='casebody'; caseGroup.add(caseMesh);
  const innerMesh=new THREE.Mesh(new THREE.CylinderGeometry(.92,.92,.6,64),sDkMat);
  innerMesh.position.y=.03; caseGroup.add(innerMesh);
  // Edge highlight rings
  const edgeGeo=new THREE.TorusGeometry(1,.018,16,64);
  const edgeTop=new THREE.Mesh(edgeGeo,sLtMat); edgeTop.position.y=.275; caseGroup.add(edgeTop);
  const edgeBot=edgeTop.clone(); edgeBot.position.y=-.275; caseGroup.add(edgeBot);
  // Lugs
  [{x:.52,z:.62},{x:-.52,z:.62},{x:.52,z:-.62},{x:-.52,z:-.62}].forEach(({x,z})=>{
    const lug=new THREE.Mesh(new THREE.BoxGeometry(.35,.55,.28),sMat);
    lug.position.set(x,0,z); lug.name='lug'; caseGroup.add(lug);
  });
  // Crown
  const crownGroup=new THREE.Group(); crownGroup.name='crown';
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.28,16),sDkMat);
  stem.rotation.z=Math.PI/2; stem.position.x=1.14; crownGroup.add(stem);
  const crownBody=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.22,32),sMat);
  crownBody.rotation.z=Math.PI/2; crownBody.position.x=1.28; crownGroup.add(crownBody);
  for(let i=0;i<8;i++){
    const kr=new THREE.Mesh(new THREE.TorusGeometry(.1,.012,8,20),sDkMat);
    kr.position.x=1.18+i*.016; kr.rotation.z=Math.PI/2; crownGroup.add(kr);
  }
  caseGroup.add(crownGroup);
  group.add(caseGroup);

  /* ── Bezel ── */
  const bezelGroup=new THREE.Group(); bezelGroup.name='bezel';
  const bezelMesh=new THREE.Mesh(new THREE.CylinderGeometry(.93,.93,.08,64),
    mat({color:C.steelDk,metalness:.96,roughness:.1}));
  bezelMesh.position.y=.3; bezelGroup.add(bezelMesh);
  const bfMesh=new THREE.Mesh(new THREE.TorusGeometry(.91,.02,12,64),sLtMat);
  bfMesh.position.y=.34; bezelGroup.add(bfMesh);
  for(let i=0;i<60;i++){
    const a=(i/60)*Math.PI*2;
    const tlen=i%5===0?.06:.03;
    const tMesh=new THREE.Mesh(new THREE.BoxGeometry(.006,.01,tlen),i%5===0?goldMat:sDkMat);
    tMesh.position.set(Math.sin(a)*.88,.35,Math.cos(a)*.88);
    tMesh.rotation.y=-a; bezelGroup.add(tMesh);
  }
  group.add(bezelGroup);

  /* ── Dial ── */
  const dialGroup=new THREE.Group(); dialGroup.name='dial';
  const dialMesh=new THREE.Mesh(new THREE.CylinderGeometry(.88,.88,.015,64),dialMat);
  dialMesh.position.y=.22; dialGroup.add(dialMesh);
  // Applied gold hour markers
  for(let h=0;h<12;h++){
    if(h%3!==0) continue;
    const a=(h/12)*Math.PI*2;
    const idx=new THREE.Mesh(new THREE.BoxGeometry(.06,.018,.14),goldLtMat);
    idx.position.set(Math.sin(a)*.72,.23,Math.cos(a)*.72);
    idx.rotation.y=-a; dialGroup.add(idx);
  }
  group.add(dialGroup);

  /* ── Hands ── */
  const handsGroup=new THREE.Group(); handsGroup.name='hands';
  handsGroup.position.y=.26;

  function makeHand(length,maxW,yOff,material,name){
    const shape=new THREE.Shape();
    shape.moveTo(0,0);
    for(let i=0;i<=20;i++){ const t=i/20,w=maxW*(1-t)*(1-t*.6); shape.lineTo(w,t*length); }
    for(let i=20;i>=0;i--){ const t=i/20,w=maxW*(1-t)*(1-t*.6); shape.lineTo(-w,t*length); }
    shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:false});
    const mesh=new THREE.Mesh(geo,material);
    mesh.name=name; mesh.rotation.x=-Math.PI/2; mesh.position.y=yOff;
    return mesh;
  }

  handsGroup.add(makeHand(.52,.07,.005,goldMat,'hourhand'));
  handsGroup.add(makeHand(.72,.045,.01,goldLtMat,'minutehand'));

  // Second hand
  const secMesh=new THREE.Mesh(new THREE.BoxGeometry(.012,.008,.85),redMat);
  secMesh.name='secondhand'; secMesh.rotation.x=-Math.PI/2; secMesh.position.set(0,.015,.04);
  handsGroup.add(secMesh);
  const loll=new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.01,20),redMat);
  loll.name='lollipop'; loll.position.set(0,.018,-.28); handsGroup.add(loll);

  // Center cap
  handsGroup.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.025,24),sDkMat),{position:{x:0,y:.02,z:0}}));
  const capTop=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.012,20),goldMat);
  capTop.position.y=.03; handsGroup.add(capTop);

  group.add(handsGroup);

  /* ── Crystal ── */
  const crystalGroup=new THREE.Group(); crystalGroup.name='crystal';
  const crystMesh=new THREE.Mesh(new THREE.CylinderGeometry(.88,.88,.04,64),crystalMat);
  crystMesh.position.y=.36; crystalGroup.add(crystMesh);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.88,64,16,0,Math.PI*2,0,.12),crystalMat);
  dome.position.y=.38; crystalGroup.add(dome);
  group.add(crystalGroup);

  /* ── Straps ── */
  const strapGroup=new THREE.Group(); strapGroup.name='strap';
  const stTopGeo=new THREE.BoxGeometry(.78,.04,1.45);
  stTopGeo.translate(0,0,-.72);
  strapGroup.add(Object.assign(new THREE.Mesh(stTopGeo,lMat),{name:'straptop'}));
  const stBotGeo=new THREE.BoxGeometry(.78,.04,1.25);
  stBotGeo.translate(0,0,.62);
  strapGroup.add(Object.assign(new THREE.Mesh(stBotGeo,lMat),{name:'strapbot'}));
  // Stitching
  const stichMat=mat({color:0xC9A96E,metalness:0,roughness:.8,transparent:true,opacity:.5});
  const sg=new THREE.BoxGeometry(.68,.002,.018);
  for(let i=0;i<9;i++){
    const s=new THREE.Mesh(sg,stichMat); s.position.set(0,.022,-1.4+i*.14); strapGroup.add(s);
    const s2=new THREE.Mesh(sg,stichMat); s2.position.set(0,.022,.3+i*.12); strapGroup.add(s2);
  }
  // Buckle
  const buckle=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,8,16),sDkMat);
  buckle.position.set(0,0,1.3); buckle.rotation.x=Math.PI/2; strapGroup.add(buckle);
  group.add(strapGroup);

  /* ── Movement plate ── */
  const movGroup=new THREE.Group(); movGroup.name='movement';
  const movMesh=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.08,64),
    mat({color:0x1a1508,metalness:.3,roughness:.6,map:movTex()}));
  movMesh.name='movplate'; movMesh.position.y=-.3; movGroup.add(movMesh);
  // Rotor
  const rotShape=new THREE.Shape();
  rotShape.absarc(0,0,.72,0,Math.PI,false); rotShape.closePath();
  const rotMesh=new THREE.Mesh(
    new THREE.ExtrudeGeometry(rotShape,{depth:.035,bevelEnabled:false}),
    mat({color:C.goldDk,metalness:.8,roughness:.3})
  );
  rotMesh.name='rotor'; rotMesh.rotation.x=Math.PI/2; rotMesh.position.y=-.24;
  movGroup.add(rotMesh);
  group.add(movGroup);

  return group;
}

/* ══════════════════════════════════════════════
   SCENE FACTORY
══════════════════════════════════════════════ */
function makeScene(){
  const scene=new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff,.3));
  const key=new THREE.DirectionalLight(0xFFF4E0,3.5); key.position.set(-3,6,4); scene.add(key);
  const fill=new THREE.DirectionalLight(0xDDE8FF,.8); fill.position.set(5,2,-3); scene.add(fill);
  const rim=new THREE.DirectionalLight(0xC9A96E,1.2); rim.position.set(0,-4,-5); scene.add(rim);
  const bounce=new THREE.PointLight(0xFFEECC,1.5,12); bounce.position.set(0,-2,3); scene.add(bounce);
  return scene;
}

/* ══════════════════════════════════════════════
   RENDERER FACTORY
══════════════════════════════════════════════ */
function makeRenderer(canvas){
  const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(window.devicePixelRatio,2));
  r.outputEncoding=THREE.sRGBEncoding;
  r.toneMapping=THREE.ACESFilmicToneMapping;
  r.toneMappingExposure=1.6;
  return r;
}

/* ══════════════════════════════════════════════
   CLOCK — drive watch hands to real time
══════════════════════════════════════════════ */
function updateClock(watchGroup){
  const now=new Date();
  const ms=now.getMilliseconds();
  const s=now.getSeconds()+ms/1000;
  const m=now.getMinutes()+s/60;
  const h12=(now.getHours()%12)+m/60;
  const sDeg=s/60*Math.PI*2, mDeg=m/60*Math.PI*2, hDeg=h12/12*Math.PI*2;
  const hands=watchGroup.getObjectByName('hands');
  if(!hands) return;
  hands.children.forEach(c=>{
    if(c.name==='hourhand')   c.rotation.y=-hDeg;
    if(c.name==='minutehand') c.rotation.y=-mDeg;
    if(c.name==='secondhand'||c.name==='lollipop') c.rotation.y=-sDeg;
  });
}

/* ══════════════════════════════════════════════
   ① HERO SCENE
══════════════════════════════════════════════ */
;(function heroScene(){
  const canvas=document.getElementById('watch-canvas');
  if(!canvas) return;
  const renderer=makeRenderer(canvas);
  const scene=makeScene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,50);
  camera.position.set(0,2.2,5.5); camera.lookAt(0,.1,0);

  const watch=buildWatch();
  watch.position.set(.6,-.3,0); scene.add(watch);

  // Platform disk
  const plat=new THREE.Mesh(
    new THREE.CylinderGeometry(1.6,1.6,.05,64),
    mat({color:0x181510,metalness:.4,roughness:.6})
  );
  plat.position.set(.6,-1.02,0); scene.add(plat);

  // Ground reflection
  const mir=new THREE.Mesh(
    new THREE.PlaneGeometry(10,10),
    new THREE.MeshStandardMaterial({color:0x000000,metalness:.9,roughness:.25,opacity:.4,transparent:true})
  );
  mir.rotation.x=-Math.PI/2; mir.position.y=-1.05; scene.add(mir);

  function resize(){
    const w=canvas.parentElement.clientWidth, h=canvas.parentElement.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize',resize,{passive:true});

  let mx=0,my=0;
  document.addEventListener('mousemove',e=>{
    mx=(e.clientX/window.innerWidth-.5)*2;
    my=(e.clientY/window.innerHeight-.5)*2;
  },{passive:true});

  let t=0;
  function animate(){
    requestAnimationFrame(animate); t+=.006;
    watch.rotation.y=lerp(watch.rotation.y,mx*.18+Math.sin(t*.4)*.05,.03);
    watch.rotation.x=lerp(watch.rotation.x,-my*.08-.12,.03);
    watch.position.y=-.3+Math.sin(t)*.04;
    updateClock(watch);
    renderer.render(scene,camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   ② EXPLODE SCENE
══════════════════════════════════════════════ */
;(function explodeScene(){
  const canvas=document.getElementById('explode-canvas');
  if(!canvas) return;
  const renderer=makeRenderer(canvas);
  const scene=makeScene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,50);
  camera.position.set(0,1.5,5.8); camera.lookAt(-.6,0,0);

  const watch=buildWatch();
  watch.position.set(-.6,0,0); scene.add(watch);

  function resize(){
    renderer.setSize(window.innerWidth,window.innerHeight,false);
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize',resize,{passive:true});

  // Part explosion targets
  const targets={
    straptop:  {pos:[0, 2.8,0],  rot:[0,0,0]},
    strapbot:  {pos:[0,-2.8,0],  rot:[0,0,0]},
    case:      {pos:[0,0,0],     rot:[0,0,0]},
    lug:       {pos:[0,0,0],     rot:[0,0,0]},
    crown:     {pos:[1.8,0,0],   rot:[0,0,.4]},
    bezel:     {pos:[-2.2,.8,.5],rot:[.3,-.2,0]},
    crystal:   {pos:[0,1.8,.4],  rot:[.15,0,0]},
    dial:      {pos:[1.8,.4,.2], rot:[.1,.2,0]},
    hands:     {pos:[2,-.5,.3],  rot:[.2,.3,0]},
    movement:  {pos:[-2.2,-.5,.3],rot:[-.2,-.3,0]},
    strap:     {pos:[0,0,0],     rot:[0,0,0]},
  };

  // Store original transforms
  const originals={};
  watch.traverse(obj=>{
    if(obj.isMesh||obj.isGroup){
      originals[obj.uuid]={
        px:obj.position.x,py:obj.position.y,pz:obj.position.z,
        rx:obj.rotation.x,ry:obj.rotation.y,rz:obj.rotation.z,
      };
    }
  });

  function applyExplode(et){
    watch.traverse(obj=>{
      const o=originals[obj.uuid]; if(!o) return;
      const tgt=targets[obj.name]; if(!tgt) return;
      obj.position.x=lerp(o.px,o.px+tgt.pos[0],et);
      obj.position.y=lerp(o.py,o.py+tgt.pos[1],et);
      obj.position.z=lerp(o.pz,o.pz+tgt.pos[2],et);
      obj.rotation.x=lerp(o.rx,o.rx+tgt.rot[0],et);
      obj.rotation.y=lerp(o.ry,o.ry+tgt.rot[1],et);
      obj.rotation.z=lerp(o.rz,o.rz+tgt.rot[2],et);
    });
  }

  const section=document.getElementById('explode-section');
  const sidebar=document.getElementById('explode-sidebar');
  const labels =document.querySelectorAll('.part-label');
  const counts ={parts:312,hours:180,jewels:36};
  const cntEls ={
    parts: document.getElementById('cnt-parts'),
    hours: document.getElementById('cnt-hours'),
    jewels:document.getElementById('cnt-jewels'),
  };

  function getProgress(){
    if(!section) return 0;
    const r=section.getBoundingClientRect();
    return clamp(-r.top/(r.height-window.innerHeight),0,1);
  }

  window.addEventListener('scroll',()=>{
    const p=getProgress();
    const et=ease(clamp((p-.2)/.5,0,1));
    applyExplode(et);
    p>.25?sidebar.classList.add('show'):sidebar.classList.remove('show');
    labels.forEach(l=>p>.45&&p<.9?l.classList.add('show'):l.classList.remove('show'));
    if(p>.25){
      const t2=clamp((p-.25)/.35,0,1);
      Object.keys(counts).forEach(k=>{
        if(cntEls[k]) cntEls[k].textContent=Math.round(counts[k]*t2);
      });
    }
  },{passive:true});

  let t=0;
  function animate(){
    requestAnimationFrame(animate); t+=.005;
    watch.rotation.y+=.003;
    camera.position.y=1.5+Math.sin(t*.3)*.08;
    updateClock(watch);
    renderer.render(scene,camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   ③ ACQUIRE SCENE
══════════════════════════════════════════════ */
;(function acqScene(){
  const canvas=document.getElementById('acq-canvas');
  if(!canvas) return;
  const renderer=makeRenderer(canvas);
  const scene=makeScene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,30);
  camera.position.set(0,1.2,4.5); camera.lookAt(0,-.1,0);
  const watch=buildWatch(); scene.add(watch);
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight||500;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize',resize,{passive:true});
  let t=0;
  function animate(){
    requestAnimationFrame(animate); t+=.007;
    watch.rotation.y=t*.4; watch.position.y=Math.sin(t)*.05;
    updateClock(watch); renderer.render(scene,camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════
   CURSOR
══════════════════════════════════════════════ */
;(function cursor(){
  const c1=document.getElementById('cur'), c2=document.getElementById('cur2');
  if(!c1||!c2) return;
  let mx=0,my=0,fx=0,fy=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
  function loop(){
    fx=lerp(fx,mx,.14); fy=lerp(fy,my,.14);
    c1.style.left=mx+'px'; c1.style.top=my+'px';
    c2.style.left=fx+'px'; c2.style.top=fy+'px';
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ══════════════════════════════════════════════
   NAV SCROLL
══════════════════════════════════════════════ */
;(function(){
  const nav=document.getElementById('nav');
  if(!nav) return;
  window.addEventListener('scroll',()=>{
    window.scrollY>60?nav.classList.add('s'):nav.classList.remove('s');
  },{passive:true});
})();

/* ══════════════════════════════════════════════
   SCROLL REVEALS
══════════════════════════════════════════════ */
;(function(){
  const els=document.querySelectorAll('[data-aos]');
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const d=parseInt(e.target.dataset.aosDelay||0);
        setTimeout(()=>e.target.classList.add('ao'),d);
        io.unobserve(e.target);
      }
    });
  },{threshold:.18});
  els.forEach(el=>io.observe(el));
  // Hero items trigger on load
  setTimeout(()=>{
    document.querySelectorAll('#hero [data-aos]').forEach((el,i)=>{
      setTimeout(()=>el.classList.add('ao'),300+i*120);
    });
  },200);
})();
