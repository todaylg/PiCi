import * as PIXI from "pixi.js";
import arcToBezier from 'svg-arc-to-cubic-bezier';
// import * as d3 from "d3-force";
import Dracula from 'graphdracula';

//Sprite Width double Graph

//Encapsulation PiXi => export PiCi 
//Aliases
let Container = PIXI.Container,
    Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Filters = PIXI.filters,
    Graphics = PIXI.Graphics;

let renderer = new Application(window.innerWidth, window.innerHeight, {
    antialias: true,// antialias: true,//这抗锯齿一开整个世界都变了  =>bug(just Chrome,FF is ok): renderer = new PIXI.WebGLRenderer + renderer.render(stage);
    forceFXAA: true,//For WebglRender AA
    backgroundColor: 0x1099bb
}),//Todo=> parameter
    stage = renderer.stage,
    edgeContainer = new Container(),
    arrowContainer = new Container(),
    nodeContainer = new Container(),//Node above edge
    dragContainer = new Container();//Hightest level

//Canvas(defalut is Webgl) Use for Render test
// renderer.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, {
//     backgroundColor: 0x1099bb
// })

document.body.appendChild(renderer.view);

const SCALE_MAX = 10, SCALE_MIN = 0.4;//For scale limmit
let nodeWidth = 30;//defalut node radius
let point = {};//Todo 这里以后指针的形状也可以自定义
let movePosBegin = {};

let nodeList = {},//Save node
    edgeList = {},//Cache edge
    arrowList = {},//Save arrow
    edgeInfoList = {};//Save edge info

let circleList = {};
let bezierList = {};//Deal with 2 bezierCurve
let midPos;//Now is just for Bezier,TODO is for all(include straight use midPos to Calculate)

function generateText(x, y, content) {
    let basicText = new Text(content);
    basicText.x = x;
    basicText.y = y;
    return basicText;
}

function generateSprite(shape, scale = 0.2) {
    let sprite;
    console.log(600*0.2);//120
    switch (shape) {
        default:
            sprite = Sprite.fromImage('../assets/Circle.png');
            break;
    }
    sprite.anchor.set(0.5);
    sprite.scale.set(scale);//>>??????莫名其妙和graph差两倍
    console.log(sprite);
    sprite.filters = [new Filters.BlurFilter(1)];//效果拔群！！

    // Opt-in to interactivity
    sprite.interactive = true;

    // Shows hand cursor
    sprite.buttonMode = true;
    
    nodeContainer.addChild(sprite);
    return sprite;

}


function drawCircle(x, y, r = 30) {
    let circle = new Graphics();
    circle.beginFill(0x000000, 0.2);

    circle.drawCircle(0, 0, r);
    circle.endFill();
    let localPos = toLocalPos(x, y);
    circle.x = localPos.x;
    circle.y = localPos.y;
    point.circle = circle;
    dragContainer.addChild(circle);
}

function PiCi(opts) {
    console.log(123);
    let g = generateSprite();
    g.x = 400;
    g.y = 400;
    let ic = new Graphics();
    ic.beginFill(0x66CCFF);
    ic.drawCircle(0, 0, 60);
    ic.endFill();
    ic.x = 200;
    ic.y = 200;
    
    nodeContainer.addChild(ic);
    console.log(123);
    stage.addChild(edgeContainer);
    stage.addChild(arrowContainer);
    stage.addChild(nodeContainer);
    stage.addChild(dragContainer);
}

export default PiCi;