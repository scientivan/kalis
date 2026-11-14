/* Six tangible product activities. Local Three.js, no network or transactions. */
(() => {
 const T=window.THREE,host=document.getElementById('kalis-canvas'),root=document.getElementById('experience');
 if(!T||!host)return;
 let renderer;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:true});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);camera.position.set(0,4,12);camera.lookAt(0,.4,0);
 scene.add(new T.HemisphereLight(0xe2f3ff,0x748d72,2));const sun=new T.DirectionalLight(0xfff4dc,2.2);sun.position.set(-3,7,5);scene.add(sun);
 const colors={stone:0xe9e9db,sky:0x8cb3cf,blue:0x416b89,green:0x638575,ink:0x223e50,white:0xf7f8f0};
 const materials=Object.fromEntries(Object.entries(colors).map(([k,c])=>[k,new T.MeshStandardMaterial({color:c,roughness:.7,metalness:.04})]));
 const groups=[],moves=[];let active=0,playing=false,frame=0,phase=0,last=0;
 function box(g,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials[color]);m.position.set(x,y,z);g.add(m);return m;}
 function disc(g,x,y,z,r,color){const m=new T.Mesh(new T.CylinderGeometry(r,r,.12,48),materials[color]);m.rotation.x=Math.PI/2;m.position.set(x,y,z);g.add(m);return m;}
 function label(g,text,x,y,size=.23){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.font='500 52px -apple-system, sans-serif';ctx.fillStyle='#223e50';ctx.textAlign='center';ctx.fillText(text,384,80);const tex=new T.CanvasTexture(c);const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.position.set(x,y,.8);sprite.scale.set(size*6,size,1);g.add(sprite);}
 function documentObject(g,x,y,color='blue',data=false){const a=new T.Group();a.position.set(x,y,.3);g.add(a);box(a,0,0,0,1.05,1.4,.16,'white');for(let j=0;j<3;j++)box(a,-.08,.3-j*.27,.1,.65,.055,.025,color);if(data)for(let j=0;j<3;j++)box(a,-.3+j*.3,-.35,.11,.12,.22+j*.13,.03,color);disc(a,.4,.62,.18,.19,color);box(a,.4,.6,.26,.13,.12,.03,'white');return a;}
 function coin(g,x,y){const m=disc(g,x,y,.5,.2,'green');return m;}
 function animate(m,axis,amount){moves.push({m,axis,base:m.position[axis],amount,group:groups.length-1});}
 for(let i=0;i<6;i++){const g=new T.Group();scene.add(g);g.visible=i===0;groups.push(g);box(g,0,-1.5,-.2,6.9,.16,2.4,'stone');
 if(i===0){const method=documentObject(g,-2,.25);animate(method,'x',.55);box(g,1.5,.35,-.15,2.3,2.6,.25,'sky');box(g,1.5,.2,.02,1.95,1.9,.14,'white');documentObject(g,1.5,.18,'green');label(g,'Expert',-2,-1.05);label(g,'Marketplace',1.5,1.95);}
 if(i===1){box(g,-1.6,.2,-.2,2,2.3,.2,'sky');documentObject(g,-1.6,.2);label(g,'Method access',-1.6,1.85);box(g,1.9,-.2,.2,1.5,1,.3,'green');box(g,2.35,-.2,.4,.5,.45,.12,'stone');const c=coin(g,.3,.45);animate(c,'x',-.85);label(g,'Buyer',1.9,-1.05);}
 if(i===2){const m=documentObject(g,-2.3,.6);const d=documentObject(g,2.3,.6,'green',true);animate(m,'x',.65);animate(d,'x',-.65);box(g,0,0,0,1.8,1.8,1.2,'sky');box(g,0,0,.65,1.2,1.1,.08,'blue');disc(g,0,.15,.74,.19,'stone');box(g,0,-.16,.76,.1,.3,.06,'stone');label(g,'Method',-2.3,1.85);label(g,'Private data',2.3,1.85);label(g,'Protected runtime',0,-1.06);}
 if(i===3){box(g,-2,.2,0,1.3,1.6,1,'sky');const answer=documentObject(g,-.3,.3,'green',true);animate(answer,'x',.6);box(g,2,.25,0,1.8,1.6,.15,'blue');box(g,2,.25,.1,1.55,1.3,.03,'white');box(g,2,-.65,.4,2,.1,1,'stone');for(let j=0;j<3;j++)box(g,1.6+j*.4,.1,.15,.18,.3+j*.2,.05,'green');label(g,'Private result',2,1.65);}
 if(i===4){label(g,'Buyer’s payment',0,2);for(let j=0;j<3;j++){const x=(j-1)*2.3;box(g,x,-.65,0,1.4,.6,.9,j===2?'green':'sky');const c=coin(g,x,.55);animate(c,'y',-.65);label(g,['Expert','Execution','Shared fund'][j],x,-1.08);}}
 if(i===5){documentObject(g,-2.3,.1);documentObject(g,2.3,.1,'green');box(g,0,.05,0,1.55,.2,1.1,'sky');const patch=box(g,0,.8,.1,.65,.2,.65,'green');animate(patch,'y',-.5);label(g,'v1',-2.3,1.5);label(g,'Review + test',0,1.8);label(g,'v2',2.3,1.5);coin(g,0,-.65);}
 }
 function render(){renderer.render(scene,camera)}
 function tick(now){if(!playing){frame=0;return;}phase+=Math.min((now-last)/1000,.05);last=now;for(const a of moves)if(a.group===active)a.m.position[a.axis]=a.base+a.amount*(.5-.5*Math.cos(phase*1.5));render();frame=requestAnimationFrame(tick);}
 function setPlaying(value){playing=value;if(!value){cancelAnimationFrame(frame);frame=0;render()}else if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}}
 function resize(){const w=host.clientWidth||500,h=w/1.35;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render()}
 window.kalisCycle={show(i){active=i;phase=0;groups.forEach((g,j)=>g.visible=i===j);for(const a of moves)a.m.position[a.axis]=a.base;render()},setPlaying};
 root.classList.add('has-cycle-webgl');new ResizeObserver(resize).observe(host);resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);root.classList.remove('has-cycle-webgl')});
})();
