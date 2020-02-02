

import { ColorRGBA, WebglPolar, WebGLplot, WebglLine} from "./webglplot/webglplot"




let amp = 0.5;
let noise  = 0.1;
let freq = 0.01;

let preR = 0.5;

const canv =  document.getElementById("my_canvas") as HTMLCanvasElement;

let fpsDivder = 1;
let fpsCounter = 0;

let indexNow = 0;

let numPoints = 100;

let segView = false;

let wglp: WebGLplot;
let line: WebglPolar;
let line2: WebglPolar;
const lineColor = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const lineNumList = [3, 4, 5, 6, 7, 8, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];


let displayLines: HTMLSpanElement;
let displayFreq: HTMLSpanElement;
let displayAmp: HTMLSpanElement;
let displayNoise: HTMLSpanElement;



let resizeId: NodeJS.Timeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(doneResizing, 100);
});

let timer = setInterval( () => {
  update();
}, noise*10);

createUI();

init();



/****************************************/

function newFrame(): void {

  if (fpsCounter===0) {


  //update();

  wglp.update();
  //wglp.gScaleY = scaleY;



  
  }
  fpsCounter++;

  if (fpsCounter >= fpsDivder) {
    fpsCounter = 0;
  }

  window.requestAnimationFrame(newFrame);
  
}

window.requestAnimationFrame(newFrame);



function init(): void {

  const devicePixelRatio = window.devicePixelRatio || 1;
  const numX = Math.round(canv.clientWidth * devicePixelRatio);
  const numY = Math.round(canv.clientHeight * devicePixelRatio);

  line = new WebglPolar(lineColor, numPoints);
  line.loop = true;

  line2 = new WebglPolar(new ColorRGBA(0.9,0.9,0.9,1), 2);
  line2.xy = new Float32Array([0,0,1,1]);



  wglp = new WebGLplot(canv);

  //wglp.offsetX = -1;
  wglp.gScaleX = numY/numX;
  wglp.gScaleY = 1;




  //line.linespaceX(-1, 2  / numX);
  wglp.addLine(line);
  wglp.addLine(line2);

  for (let i=0; i < line.numPoints; i++) {
    const theta = i * 360 / line.numPoints;
    const r = amp * 1;
    //const r = 1;
    line.setRtheta(i, theta, r);

  }

}

function update(): void {

  //line.offsetTheta = 10*noise;

  //preR form previous update

  if (indexNow < line.numPoints) {
    const theta = indexNow * 360 / line.numPoints;
    let r = amp * (Math.random()-0.5) + preR;
    line.setRtheta(indexNow, theta, r);

    line2.setRtheta(0, 0, 0);
    line2.setRtheta(1, theta, 1);
    
    //line2.setX(1,line.getX(indexNow));
    //line2.setY(1,line.getY(indexNow));

    r = (r<1)?r:1;
    r = (r>0)?r:0;
    preR = r;

    indexNow++;
  } else {
    indexNow = 0;
  }
  

}


function doneResizing(): void {
  wglp.viewport(0, 0, canv.width, canv.height);
  init();
}


/*function changeView(): void {
  if (segView) {

      lines[i].offsetY = 0;
      lines[i].scaleY = 1
    }
    segView = false;
  }
  else {
    for (let i=0; i<lines.length; i++) {
      lines[i].offsetY = 1.5*(i/lines.length - 0.5);
      lines[i].scaleY = 1.5 / lines.length;
    }
    segView = true;
  }
  
  
}*/


function createUI(): void {
  const ui =  document.getElementById("ui") as HTMLDivElement;

  


  const btView = document.createElement("button");
  btView.className = "button";
  btView.innerHTML = "Change View"
  ui.appendChild(btView);
  btView.addEventListener("click", () => {
    //changeView();
  });

}
