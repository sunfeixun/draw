let app;
let width = 750,height = 1700;

let go = function() {
var sence = new PIXI.CanvasRenderer(750, 1334);
	var stage = new PIXI.Container(); //创建舞台
	document.body.appendChild(sence.view);

	PIXI.loader.add(['image/bg.png']).load(onload);

	function onload() {

		let bg = new PIXI.Sprite(PIXI.loader.resources['image/bg.png'].texture);
		stage.addChild(bg);
		bg.interactive = true;
		bg.on('pointerdown',ondown);
		bg.on('pointermove',move);
		bg.on('pointerup',onup);

		sence.render(stage);
		//loop();
		
	var line = new PIXI.Graphics();
		line.lineStyle(10,0xff0000,1);
		stage.addChild(line);

	function ondown(e) {
		line.moveTo(e.data.global.x,e.data.global.y);
	}

	function move(e) {
		line.lineTo(e.data.global.x,e.data.global.y);
		sence.render(stage);
	}

	function onup() {
	
	}

	function loop() {
        requestAnimationFrame(loop);
        sence.render(stage);
    }
	   
	}
}