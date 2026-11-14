/* Design illustration only. No wallet, API, or transaction calls. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=document.getElementById('scene'),caption=document.getElementById('scene-caption'),result=document.getElementById('result'),explore=document.getElementById('explore'),motion=document.getElementById('motion'),stages=[...document.querySelectorAll('[data-stage]')];
  const captions=['Private data. Expert methods. Shared improvements.','Expertise at work inside a protected space.','A private result, ready to open.'];
  let stage=0,paused=reduced.matches,timers=[],renderOnce=()=>{},improved=false;
  const improve=document.getElementById('improve');
  improve.addEventListener('click',()=>{improved=!improved;improve.setAttribute('aria-pressed',String(improved));improve.textContent=improved?'Reset contribution preview':'Preview an improvement';caption.textContent=improved?'A contribution joins the method. Secrets stay protected.':captions[stage];renderOnce();});
  function select(next){stage=next;stages.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===stage));if(i===stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});const stepStatus=document.getElementById('step-status');if(stepStatus)stepStatus.textContent=['Step 1 of 3 · Input encrypted','Step 2 of 3 · Inside the protected runtime','Step 3 of 3 · Result opened'][stage];caption.textContent=captions[stage];result.textContent=stage===2?'Synthetic result · Sell 3 A, buy 2 C · Cost 0.18':'Interactive illustration · Synthetic portfolio data';renderOnce();}
  function cancelSequence(){timers.forEach(clearTimeout);timers=[];}
  stages.forEach(b=>b.addEventListener('click',()=>{cancelSequence();select(Number(b.dataset.stage));}));
  explore.addEventListener('click',()=>{cancelSequence();if(reduced.matches){select(2);return;}select(0);timers.push(setTimeout(()=>select(1),700),setTimeout(()=>select(2),2400));if(innerWidth<761)document.getElementById('experience').scrollIntoView({behavior:'smooth',block:'center'});});
  function updateMotionButton(){motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume scene motion':'Pause scene motion');motion.innerHTML=paused?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 7 5-7 5Z"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg>';}
  updateMotionButton();
  if(!window.THREE){motion.hidden=true;return;}
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{motion.hidden=true;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;root.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');root.classList.add('has-webgl');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);
  camera.position.set(0,3.6,9.6);camera.lookAt(0,-.15,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0xa1aca3,2.4));
  const key=new THREE.DirectionalLight(0xfff8e9,4.2);
  key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;
  key.shadow.normalBias=.03;scene.add(key);
  const fill=new THREE.DirectionalLight(0xc8e4fa,1.6);fill.position.set(4,2,-3);scene.add(fill);
  const blue=new THREE.MeshStandardMaterial({color:0x294cc4,roughness:.48,metalness:.06});
  const white=new THREE.MeshStandardMaterial({color:0xf0ede5,roughness:.72,metalness:0});
  const amber=new THREE.MeshStandardMaterial({color:0xc9944a,roughness:.62,metalness:.03});
  const green=new THREE.MeshStandardMaterial({color:0x648e85,roughness:.64,metalness:0});
  const dark=new THREE.MeshStandardMaterial({color:0x243b4d,roughness:.62});
  const pale=new THREE.MeshStandardMaterial({color:0xc9d6dd,roughness:.7});
  const group=new THREE.Group();scene.add(group);group.rotation.set(0,-.35,0);group.position.y=-.15;
  function roundedBox(width,height,depth,radius,material){
    const shape=new THREE.Shape(),x=-width/2,y=-height/2,r=radius;
    shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
    shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
    shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
    shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:10});
    geometry.translate(0,0,-depth/2);
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  // All components sit on a shared work surface, aligned with the landscape ground.
  const platform=roundedBox(4.65,2.7,.22,.35,white);
  platform.rotation.x=-Math.PI/2;platform.position.y=-1.23;group.add(platform);
  const runner=roundedBox(2.2,1.6,.16,.18,pale);
  runner.rotation.x=-Math.PI/2;runner.position.set(.25,-1.03,0);group.add(runner);
  // A closed two-part chamber holds the method and the input without exposing either.
  const chamber=roundedBox(1.7,1.26,1.05,.18,white);chamber.position.set(.25,-.24,-.14);group.add(chamber);
  const seam=new THREE.Mesh(new THREE.BoxGeometry(1.72,.032,1.07),dark);seam.position.set(.25,-.18,-.14);group.add(seam);
  const badge=roundedBox(.44,.44,.026,.09,blue);badge.position.set(.25,-.18,.43);group.add(badge);
  const tick=new THREE.Group();
  const short=new THREE.Mesh(new THREE.BoxGeometry(.09,.028,.016),white);short.rotation.z=-.7;short.position.set(-.045,-.02,.005);tick.add(short);
  const long=new THREE.Mesh(new THREE.BoxGeometry(.17,.028,.016),white);long.rotation.z=.8;long.position.set(.04,.015,.005);tick.add(long);tick.position.set(.25,-.18,.5);group.add(tick);
  // Expertise is built from three independent modules, with room for a contribution.
  const method=new THREE.Group();method.position.set(1.56,-.58,-.24);group.add(method);
  for(let i=0;i<3;i++){
    const cartridge=roundedBox(.66,.19,.86,.07,i===1?green:blue);cartridge.position.y=i*.25;method.add(cartridge);
    const label=new THREE.Mesh(new THREE.BoxGeometry(.28,.024,.016),white);label.position.set(0,i*.25,.48);method.add(label);
  }
  const data=roundedBox(.69,.81,.65,.12,blue);data.position.set(-1.48,-.67,.38);group.add(data);
  for(let i=0;i<3;i++){const marker=new THREE.Mesh(new THREE.BoxGeometry(.035,.2,.018),white);marker.position.set(-1.62+i*.14,-.64,.77);group.add(marker);}
  const contribution=roundedBox(.66,.19,.86,.07,amber);contribution.position.set(2.08,.62,.35);contribution.rotation.y=-.18;group.add(contribution);
  const spare=roundedBox(.48,.16,.65,.06,green);spare.position.set(-1.15,-.94,-.72);spare.rotation.y=.18;group.add(spare);
  const output=roundedBox(.68,.48,.09,.07,white);output.position.set(.25,-.7,1.07);output.rotation.x=-.4;group.add(output);
  const outputMark=new THREE.Mesh(new THREE.BoxGeometry(.34,.025,.02),blue);outputMark.position.set(0,0,.1);output.add(outputMark);
  // Discrete pathways connect input, execution and output on the work surface.
  for(const [width,x,z] of [[.38,-.92,.38],[.32,1.22,-.24],[.025,.25,.77]]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(width,.014,width===.025?.26:.025),blue);rail.position.set(x,-1.085,z);group.add(rail);
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.13}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.53;floor.receiveShadow=true;scene.add(floor);
  let pointerX=0,pointerY=0,time=0,last=0,frame=0,visible=true;
  function draw(now,immediate=false){
    const dt=Math.min((now-last)/1000,.04);last=now;if(!paused&&!immediate)time+=dt;
    const blend=immediate?1:.075;
    group.rotation.y+=(-.35+pointerX*.65-group.rotation.y)*blend;
    group.rotation.x+=(pointerY*.35-group.rotation.x)*blend;
    // A contribution visibly docks into the existing method stack.
    const destination=improved?{x:1.56,y:.17,z:-.24}:{x:2.08,y:.62,z:.35};
    for(const axis of ['x','y','z'])contribution.position[axis]+=(destination[axis]-contribution.position[axis])*blend;
    contribution.rotation.y+=((improved?0:-.18)-contribution.rotation.y)*blend;
    const outputY=stage===2?-.35:-.7;output.position.y+=(outputY-output.position.y)*blend;
    const outputAngle=stage===2?0:-.4;output.rotation.x+=(outputAngle-output.rotation.x)*blend;
    badge.material=stage===1?amber:blue;
    renderer.render(scene,camera);
  }
  renderOnce=()=>{if(paused||!visible||document.hidden)draw(performance.now(),true);};
  function resize(){const{width,height}=root.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderOnce();}
  root.parentElement.addEventListener('pointermove',e=>{if(paused||reduced.matches)return;const r=root.getBoundingClientRect();pointerX=((e.clientX-r.left)/r.width-.5)*.3;pointerY=((e.clientY-r.top)/r.height-.5)*.18;});root.parentElement.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  function loop(now){frame=0;if(paused||!visible||document.hidden)return;draw(now);frame=requestAnimationFrame(loop);}function start(){if(!frame&&!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}}
  motion.addEventListener('click',()=>{paused=!paused;cancelAnimationFrame(frame);frame=0;pointerX=pointerY=0;updateMotionButton();renderOnce();start();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;cancelSequence();cancelAnimationFrame(frame);frame=0;updateMotionButton();renderOnce();start();});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else start();}).observe(root);new ResizeObserver(resize).observe(root);resize();start();
})();
