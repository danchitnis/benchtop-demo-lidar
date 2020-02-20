/**
 * WebBlutooth example for Arduino Nano BLE 33
 *
 * Author: Danial Chitnis
 * December 2019
 *
 * Please upload the sketch before running this code
 * chrome://flags/#enable-experimental-web-platform-features
 *
 * https://codelabs.developers.google.com/codelabs/web-serial/#3
 */
import { ComPort } from "@danchitnis/comport";
import { ColorRGBA, WebglPolar, WebGLplot } from "./webglplot/webglplot";
import { SimpleSlider } from "@danchitnis/simple-slider";
{
    const canv = document.getElementById("plot");
    let numPoints = 200;
    let rScale = 500;
    let wglp;
    let line;
    let line2;
    let line3;
    let port;
    let slider;
    let pScale;
    const btConnect = document.getElementById("btConnect");
    const btStop = document.getElementById("btStop");
    const btSend = document.getElementById("btSend");
    const inText = document.getElementById("inputText");
    const pLog = document.getElementById("pLog");
    let resizeId;
    window.addEventListener("resize", () => {
        clearTimeout(resizeId);
        resizeId = setTimeout(doneResizing, 100);
        slider.resize();
    });
    createUI();
    init();
    log("Ready...\n");
    function newFrame() {
        wglp.gScaleX = rScale;
        wglp.gScaleY = rScale;
        wglp.update();
        window.requestAnimationFrame(newFrame);
    }
    window.requestAnimationFrame(newFrame);
    btConnect.addEventListener("click", () => {
        port = new ComPort();
        port.connect(9600);
        port.addEventListener("rx", dataRX);
        port.addEventListener("rx-msg", dataRX);
        console.log("here1 🍔");
    });
    btStop.addEventListener("click", () => {
        port.disconnect();
    });
    btSend.addEventListener("click", () => {
        sendLine();
    });
    inText.addEventListener("keyup", (e) => {
        if (e.keyCode === 13) {
            sendLine();
        }
    });
    function sendLine() {
        port.sendLine(inText.value);
        inText.value = "";
    }
    function log(str) {
        const str1 = str.replace(/(?:\r\n|\r|\n)/g, "<br>");
        const str2 = str1.replace(/(?:\t)/g, "&nbsp&nbsp");
        pLog.innerHTML = pLog.innerHTML + str2;
    }
    function dataRX(e) {
        log(e.detail + "\n");
        const detail = e.detail.split(",");
        const index = parseInt(detail[0]);
        const deg = parseInt(detail[1]);
        const rad = parseInt(detail[2]);
        update(deg, rad);
    }
    function init() {
        slider.addEventListener("drag-move", () => {
            pScale.innerHTML = "Scale = " + slider.value.toPrecision(2);
            rScale = 1 / slider.value;
        });
        const devicePixelRatio = window.devicePixelRatio || 1;
        const numX = Math.round(canv.clientWidth * devicePixelRatio);
        const numY = Math.round(canv.clientHeight * devicePixelRatio);
        const lineColor = new ColorRGBA(0.9, 0.9, 0.1, 1);
        line = new WebglPolar(lineColor, numPoints);
        line.loop = false;
        line2 = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), 2);
        line3 = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), numPoints);
        wglp = new WebGLplot(canv);
        //wglp.offsetX = -1;
        wglp.gXYratio = numX / numY;
        //line.linespaceX(-1, 2  / numX);
        wglp.addLine(line);
        wglp.addLine(line2);
        wglp.addLine(line3);
        for (let i = 0; i < line.numPoints; i++) {
            const theta = i * 360 / line.numPoints;
            const r = 0;
            //const r = 1;
            line.setRtheta(i, theta, r);
            line3.setRtheta(i, theta, 1);
        }
        wglp.update();
    }
    function update(deg, rad) {
        //line.offsetTheta = 10*noise;
        const theta = deg / 10;
        const index = Math.round(theta / 1.8);
        //preR form previous update
        const r = rad / 500;
        line.setRtheta(index, theta, r);
        line2.setRtheta(0, 0, 0);
        line2.setRtheta(1, theta, 1);
        console.log(index, theta, r);
    }
    function createUI() {
        slider = new SimpleSlider("slider", 0.1, 10, 0);
        pScale = document.getElementById("scale");
    }
    function doneResizing() {
        wglp.viewport(0, 0, canv.width, canv.height);
        //init();
    }
}
//# sourceMappingURL=Echo.js.map