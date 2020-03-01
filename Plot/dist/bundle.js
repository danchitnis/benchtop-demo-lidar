(function () {
    'use strict';

    /**
     * This code is inspired by Googles Serial Api example
     * https://codelabs.developers.google.com/codelabs/web-serial/
     *
     * Danial Chitnis 2020
     */
    class ComPort extends EventTarget {
        constructor() {
            super();
            this.strRX = "";
        }
        async disconnect() {
            if (this.port) {
                if (this.reader) {
                    await this.reader.cancel();
                    await this.inputDone.catch((e) => { console.log(e); });
                    this.reader = null;
                    this.inputDone = null;
                }
                if (this.outputStream) {
                    await this.outputStream.getWriter().close();
                    await this.outputDone.catch((e) => { console.log(e); });
                    this.outputStream = null;
                    this.outputDone = null;
                }
                await this.port.close();
                this.log("\nport is now closed!\n");
            }
        }
        async connectSerialApi(baudrate) {
            // CODELAB: Add code to request & open port here.
            // - Request a port and open a connection.
            this.log("Requesting port");
            this.port = await navigator.serial.requestPort();
            // - Wait for the port to open.
            this.log("Openning port");
            await this.port.open({ baudrate: baudrate });
            this.log("Port is now open 🎉");
            // CODELAB: Add code to read the stream here.
            const decoder = new TextDecoderStream();
            this.inputDone = this.port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;
            const encoder = new TextEncoderStream();
            this.outputDone = encoder.readable.pipeTo(this.port.writable);
            this.outputStream = encoder.writable;
            this.reader = inputStream.getReader();
            this.readLoop();
        }
        async connect(baudrate) {
            // CODELAB: Add connect code here.
            try {
                await this.connectSerialApi(baudrate);
                console.log("here2 🥗");
            }
            catch (error) {
                this.log("Error 😢: " + error + "\n");
            }
        }
        async readLoop() {
            // CODELAB: Add read loop here.
            while (true) {
                try {
                    const { value, done } = await this.reader.read();
                    if (value) {
                        this.procInput(value);
                    }
                    if (done) {
                        console.log('[readLoop] DONE', done);
                        this.reader.releaseLock();
                        break;
                    }
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        procInput(str) {
            this.strRX = this.strRX + str;
            const linesRX = this.strRX.split("\n");
            if (linesRX.length > 1) {
                for (let i = 0; i < linesRX.length - 1; i++) {
                    const event = new CustomEvent('rx', { detail: linesRX[i] });
                    this.dispatchEvent(event);
                }
                // save the reminder of the input line
                this.strRX = linesRX[linesRX.length - 1];
            }
        }
        log(str) {
            const event = new CustomEvent("rx-msg", { detail: str });
            this.dispatchEvent(event);
        }
        addEventListener(eventType, listener) {
            super.addEventListener(eventType, listener);
        }
        async writeToStream(line) {
            // CODELAB: Write to output stream
            const writer = this.outputStream.getWriter();
            //console.log('[SEND]', line);
            await writer.write(line + '\n');
            writer.releaseLock();
        }
        sendLine(line) {
            this.writeToStream(line);
        }
    }

    class ColorRGBA {
        constructor(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
    }

    class WebglBaseLine {
        constructor() {
            this.scaleX = 1;
            this.scaleY = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            this.loop = false;
        }
    }

    class WebglPolar extends WebglBaseLine {
        constructor(c, numPoints) {
            super();
            this.webglNumPoints = numPoints;
            this.numPoints = numPoints;
            this.color = c;
            this.intenisty = 1;
            this.xy = new Float32Array(2 * this.webglNumPoints);
            this.vbuffer = 0;
            this.prog = 0;
            this.coord = 0;
            this.visible = true;
            this.offsetTheta = 0;
        }
        /**
         * @param index: index of the line
         * @param theta : angle in deg
         * @param r : radius
         */
        setRtheta(index, theta, r) {
            //const rA = Math.abs(r);
            //const thetaA = theta % 360;
            const x = r * Math.cos(2 * Math.PI * (theta + this.offsetTheta) / 360);
            const y = r * Math.sin(2 * Math.PI * (theta + this.offsetTheta) / 360);
            //const index = Math.round( ((theta % 360)/360) * this.numPoints );
            this.setX(index, x);
            this.setY(index, y);
        }
        getTheta(index) {
            //return Math.tan
            return 0;
        }
        getR(index) {
            //return Math.tan
            return Math.sqrt(Math.pow(this.getX(index), 2) + Math.pow(this.getY(index), 2));
        }
        setX(index, x) {
            this.xy[index * 2] = x;
        }
        setY(index, y) {
            this.xy[index * 2 + 1] = y;
        }
        getX(index) {
            return this.xy[index * 2];
        }
        getY(index) {
            return this.xy[index * 2 + 1];
        }
    }

    /**
     * Author Danial Chitnis 2019
     *
     * inspired by:
     * https://codepen.io/AzazelN28
     * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
     */
    /**
     * The main class for the webgl-plot framework
     */
    class WebGLplot {
        //public backgroundColor: ColorRGBA;
        /**
         * Create a webgl-plot instance
         * @param canv: the canvas in which the plot appears
         */
        constructor(canv) {
            const devicePixelRatio = window.devicePixelRatio || 1;
            // set the size of the drawingBuffer based on the size it's displayed.
            canv.width = canv.clientWidth * devicePixelRatio;
            canv.height = canv.clientHeight * devicePixelRatio;
            const webgl = canv.getContext("webgl", {
                antialias: true,
                transparent: false,
            });
            this.lines = [];
            this.webgl = webgl;
            this.gScaleX = 1;
            this.gScaleY = 1;
            this.gXYratio = 1;
            this.gOffsetX = 0;
            this.gOffsetY = 0;
            // Enable the depth test
            webgl.enable(webgl.DEPTH_TEST);
            // Clear the color and depth buffer
            webgl.clear(webgl.COLOR_BUFFER_BIT || webgl.DEPTH_BUFFER_BIT);
            // Set the view port
            webgl.viewport(0, 0, canv.width, canv.height);
        }
        /**
         * update and redraws the content
         */
        update() {
            const webgl = this.webgl;
            this.lines.forEach((line) => {
                if (line.visible) {
                    webgl.useProgram(line.prog);
                    const uscale = webgl.getUniformLocation(line.prog, "uscale");
                    webgl.uniformMatrix2fv(uscale, false, new Float32Array([line.scaleX * this.gScaleX, 0, 0, line.scaleY * this.gScaleY * this.gXYratio]));
                    const uoffset = webgl.getUniformLocation(line.prog, "uoffset");
                    webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));
                    const uColor = webgl.getUniformLocation(line.prog, "uColor");
                    webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                    webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                    webgl.drawArrays((line.loop) ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
                }
            });
        }
        clear() {
            // Clear the canvas  //??????????????????
            //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
            this.webgl.clear(this.webgl.COLOR_BUFFER_BIT || this.webgl.DEPTH_BUFFER_BIT);
        }
        /**
         * adds a line to the plot
         * @param line : this could be any of line, linestep, histogram, or polar
         */
        addLine(line) {
            line.vbuffer = this.webgl.createBuffer();
            this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);
            this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
            const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;

      void main(void) {
         gl_Position = vec4(uscale*coordinates + uoffset, 0.0, 1.0);
      }`;
            // Create a vertex shader object
            const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
            // Attach vertex shader source code
            this.webgl.shaderSource(vertShader, vertCode);
            // Compile the vertex shader
            this.webgl.compileShader(vertShader);
            // Fragment shader source code
            const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;
            const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
            this.webgl.shaderSource(fragShader, fragCode);
            this.webgl.compileShader(fragShader);
            line.prog = this.webgl.createProgram();
            this.webgl.attachShader(line.prog, vertShader);
            this.webgl.attachShader(line.prog, fragShader);
            this.webgl.linkProgram(line.prog);
            this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line.vbuffer);
            line.coord = this.webgl.getAttribLocation(line.prog, "coordinates");
            this.webgl.vertexAttribPointer(line.coord, 2, this.webgl.FLOAT, false, 0, 0);
            this.webgl.enableVertexAttribArray(line.coord);
            this.lines.push(line);
        }
        viewport(a, b, c, d) {
            this.webgl.viewport(a, b, c, d);
        }
    }

    /*
     *
     */
    class SimpleSlider extends EventTarget {
        constructor(div, min, max, step) {
            super();
            this.sliderWidth = 0;
            this.handleOffset = 0;
            this.active = false;
            this.currentX = 0;
            this.initialX = 0;
            this.value = 0;
            this.valueMax = 100;
            this.valueMin = 0;
            this.valueStep = 0;
            this.valueMax = max;
            this.valueMin = min;
            this.valueStep = step;
            this.makeDivs(div);
            this.init();
            this.handleToCentre();
            this.divHandle.addEventListener("mousedown", (e) => {
                const x = e.clientX;
                this.dragStart(x);
            });
            this.divMain.addEventListener("mousemove", (e) => {
                const x = e.clientX;
                this.drag(e, x);
            });
            this.divMain.addEventListener("mouseup", (e) => {
                this.dragEnd(e);
            });
            this.divMain.addEventListener("mouseleave", (e) => {
                this.dragEnd(e);
            });
            this.divHandle.addEventListener("touchstart", (e) => {
                const x = e.touches[0].clientX;
                this.dragStart(x);
            });
            this.divMain.addEventListener("touchmove", (e) => {
                const x = e.touches[0].clientX;
                this.drag(e, x);
            });
            this.divMain.addEventListener("touchend", (e) => {
                this.dragEnd(e);
            });
        }
        dragStart(x) {
            this.initialX = x - parseFloat(getComputedStyle(this.divHandle).left) - this.handleOffset / 2;
            this.active = true;
            this.dispatchEvent(new CustomEvent('drag-start'));
        }
        drag(e, x) {
            if (this.active) {
                e.preventDefault();
                this.currentX = x - this.initialX;
                this.setTranslate(this.currentX);
                this.dispatchEvent(new CustomEvent('drag-move'));
            }
        }
        dragEnd(e) {
            this.active = false;
            this.dispatchEvent(new CustomEvent('drag-end'));
        }
        setTranslate(xPos) {
            const pxMin = this.handleOffset;
            const pxMax = this.sliderWidth - this.handleOffset;
            if (xPos > pxMin && xPos < pxMax) {
                const handlePos = xPos - this.handleOffset;
                const barPos = xPos;
                this.divHandle.style.left = handlePos.toString() + "px";
                this.divBarL.style.left = this.handleOffset.toString() + "px";
                this.divBarL.style.width = (barPos - this.handleOffset / 2).toString() + "px";
                this.divBarR.style.width = (this.sliderWidth - barPos - this.handleOffset / 2).toString() + "px";
                const innerValue = (barPos - pxMin) / (pxMax - pxMin);
                this.value = (this.valueMax - this.valueMin) * innerValue + this.valueMin;
            }
        }
        makeDivs(mainDiv) {
            this.divMain = document.getElementById(mainDiv);
            this.divMain.className = "simple-slider";
            this.divHandle = document.createElement("div");
            this.divHandle.id = "handle";
            this.divHandle.className = "simple-slider-handle";
            this.divBarL = document.createElement("div");
            this.divBarL.id = "barL";
            this.divBarL.className = "simple-slider-barL";
            this.divBarR = document.createElement("div");
            this.divBarR.id = "barR";
            this.divBarR.className = "simple-slider-barR";
            this.divMain.append(this.divHandle);
            this.divMain.append(this.divBarL);
            this.divMain.append(this.divBarR);
        }
        init() {
            this.sliderWidth = parseFloat(getComputedStyle(this.divMain).getPropertyValue("width"));
            const handleWidth = parseFloat(getComputedStyle(this.divHandle).getPropertyValue("width"));
            const handlePad = parseFloat(getComputedStyle(this.divHandle).getPropertyValue("border-left-width"));
            this.handleOffset = (handleWidth + handlePad) / 2;
        }
        handleToCentre() {
            this.setTranslate(this.sliderWidth / 2);
        }
        resize() {
            this.init();
            const newPos = this.value * 0.01 * this.sliderWidth;
            this.setTranslate(newPos);
        }
        addEventListener(eventName, listener) {
            super.addEventListener(eventName, listener);
        }
    }

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
    {
        const canv = document.getElementById("plot");
        let numPoints = 200;
        let rScale = 500;
        let wglp;
        let lineForward;
        let lineBackward;
        let lineCursor;
        let lineBorder;
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
        inText.addEventListener("keyup", e => {
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
            const dir = parseInt(detail[0]);
            const deg = parseInt(detail[1]);
            const rad = parseInt(detail[2]);
            update(dir, deg, rad);
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
            lineForward = new WebglPolar(lineColor, numPoints);
            lineForward.loop = false;
            lineCursor = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), 2);
            lineBackward = new WebglPolar(new ColorRGBA(0.9, 0.9, 0.9, 1), numPoints);
            wglp = new WebGLplot(canv);
            //wglp.offsetX = -1;
            wglp.gXYratio = numX / numY;
            //line.linespaceX(-1, 2  / numX);
            wglp.addLine(lineForward);
            wglp.addLine(lineBackward);
            wglp.addLine(lineCursor);
            for (let i = 0; i < lineForward.numPoints; i++) {
                const theta = (i * 360) / lineForward.numPoints;
                const r = 0;
                //const r = 1;
                lineForward.setRtheta(i, theta, r);
                lineBackward.setRtheta(i, theta, r);
                lineBorder.setRtheta(i, theta, 1);
            }
        }
        function update(dir, deg, rad) {
            //line.offsetTheta = 10*noise;
            const theta = deg / 10;
            const index = Math.round(theta / 1.8);
            //preR form previous update
            const r = rad / 500;
            if (dir == 0) {
                lineForward.setRtheta(index, theta, r);
            }
            else {
                lineBackward.setRtheta(index, theta, r);
            }
            lineCursor.setRtheta(0, 0, 0);
            lineCursor.setRtheta(1, theta, 1);
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

}());
