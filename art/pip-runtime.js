/* Pip uses a Blender mesh with independently posed paws and tail. */
async function startPipRenderer() {
  if (!ASSETS.pipMesh || !window.DecompressionStream) return;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 208;
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, preserveDrawingBuffer:true});
  if (!gl) return;
  const vertex = `
    attribute vec3 aPosition,aNormal,aColor;
    attribute float aPart;
    uniform float uTime,uRun,uFacing,uStyle;
    varying vec3 vColor,vNormal;
    mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
    void main(){
      vec3 p=aPosition/12000.0,n=normalize(aNormal);
      float beat=uTime*15.0;
      if(aPart==3.0){
        p.xy=rot(sin(uTime*3.2)*.15+uRun*sin(beat)*.19)*(p.xy-vec2(.39,.25))+vec2(.39,.25);
        n.xy=rot(sin(uTime*3.2)*.15+uRun*sin(beat)*.19)*n.xy;
      }
      if(aPart==1.0||aPart==2.0){
        float swing=sin(beat+3.14159*(aPart-1.0))*.44*uRun;
        p.yz=rot(swing)*(p.yz-vec2(-.14,.42))+vec2(-.14,.42);
        n.yz=rot(swing)*n.yz;
      }
      p.z+=uRun*max(0.,sin(beat))*.15;
      float yaw=uFacing*.48;
      p.xy=rot(yaw)*p.xy;n.xy=rot(yaw)*n.xy;
      vec2 camera=vec2(p.x*.85,p.z*.84+p.y*.24-.85);
      gl_Position=vec4(camera,p.y*.29-p.z*.06,1.);
      vNormal=n;
      vec3 skin=vec3(1.,1.,1.);
      if(uStyle==1.)skin=vec3(.92,.84,.68);
      if(uStyle==2.)skin=vec3(.97,.72,.95);
      if(uStyle==3.)skin=vec3(1.,1.14,1.22);
      vColor=aColor*skin;
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 vColor,vNormal;
    void main(){
      vec3 normal=normalize(vNormal);
      float key=max(0.,dot(normal,normalize(vec3(-.52,-.78,.76))));
      float rim=pow(max(0.,dot(normal,normalize(vec3(.2,.6,.82)))),2.);
      gl_FragColor=vec4(vColor*(.62+key*.38)+rim*vec3(.12,.085,.046),1.);
    }`;
  const program=gl.createProgram();
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const meshes=new Map();
  for(const [name, encoded] of Object.entries({pip:ASSETS.pipMesh,...ASSETS.companionMeshes})){
  const compressed=Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));
  const mesh=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const source=new DataView(mesh), count=mesh.byteLength/13, packed=new Float32Array(count*10);
  for(let i=0;i<count;i++){
    const start=i*13, dest=i*10;
    for(let c=0;c<3;c++){
      packed[dest+c]=source.getInt16(start+c*2,true);
      packed[dest+3+c]=source.getInt8(start+6+c);
      packed[dest+6+c]=source.getUint8(start+9+c)/255;
    }
    packed[dest+9]=source.getUint8(start+12);
  }
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,packed,gl.STATIC_DRAW);
  meshes.set(name,{buffer,count});
  }
  function selectMesh(model){
  gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);
  for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,12],['aColor',3,24],['aPart',1,36]]){
    const location=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset);
  }
  }
  const uniforms=['uTime','uRun','uFacing','uStyle'].map(name=>gl.getUniformLocation(program,name));
  gl.viewport(0,0,208,208);gl.enable(gl.DEPTH_TEST);
  let last=0;
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||now-last<32)return;
    last=now;
    for(const view of document.querySelectorAll('canvas.pip-model')){
      if(!view.getClientRects().length)continue;
      const hero=view.closest('.hero'), run=hero?.classList.contains('run')||view.closest('.journey-pip.travelling');
      const facing=hero?.dataset.facing==='left'?-1:1;
      if(!run&&view.dataset.ready&&view.dataset.facing===String(facing))continue;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      [now*.001,run?1:0,facing,Number(view.dataset.style)||0].forEach((value,i)=>gl.uniform1f(uniforms[i],value));
      const model=meshes.get(view.dataset.mesh||'pip');
      if(!model)continue;
      selectMesh(model);
      gl.drawArrays(gl.TRIANGLES,0,model.count);
      const ctx=view.getContext('2d');
      ctx.clearRect(0,0,view.width,view.height);ctx.drawImage(canvas,0,0,view.width,view.height);
      view.dataset.ready='true';view.dataset.facing=String(facing);
    }
  }
  requestAnimationFrame(frame);
}
if(typeof window.DecompressionStream==='function')startPipRenderer().catch(error=>console.warn('Pip WebGL:',error));
