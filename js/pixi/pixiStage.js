let width = 750,height = 1700;

let go = function() {
	let  v = new VConsole
	let stage = new PIXI.CanvasRenderer({width:750,height:1400});
	document.body.appendChild(stage.view);
	let container = new PIXI.Container;
	let drawContainer = new PIXI.Container;
	let drawer, drawerBound;
	let imgPath = 'image/';
	let loadList = ['bg.jpg','drawbg.png','drawer.png','back.png','upcloud.png','controlbg.png','save.png'];

	let colors1 = [0x6598fe,0xfe00fe,0x0000fe,0xfefe00,0x32fe32,0x65cb65,0x32cbfe],
			colors2 = [0xfe9800,0x989898,0xfe00fe,0xfe0000,0x9800fe,0x650000,0x980000];
	let line;
	let moved;
	let lineData = {color:colors1[0],width:5};
	let minWidth = 5, maxWidth = 60;
	let thickButton, slideWidth, currentSlideWidth, thickSlide;


	let controlContainer = new PIXI.Container;

	for(let i=0;i<loadList.length;i++){
		loadList[i] = imgPath + loadList[i];
	}

	PIXI.loader.add(loadList).load(onload);

	function onload() {
		let bg = getImage('bg.jpg');
		let drawbg = getImage('drawbg.png');
		let back = getImage('back.png','normal',{x:10,y:drawbg.y+20});
		let save = getImage('save.png','normal',{x:570,y:drawbg.y+20});


		//画板UI
		drawer = getImage('drawer.png','normal',{x:drawbg.x+12,y:drawbg.y+94});
		drawerBound = drawer.getBounds();
		drawContainer.addChild(drawbg,drawer,back,save);

		back.interactive = true;
		back.on('pointertap',backline);

		save.interactive = true;
		save.on('pointertap',saveImage);

		//画板容器居中
		drawContainer.transform.pivot.x = drawContainer.getBounds().width/2;
		drawContainer.transform.pivot.y = drawContainer.getBounds().height/2;
		drawContainer.x = width/2;
		drawContainer.y = 550;

		//控制器界面，选择线条粗细
		let controlbg = getImage('controlbg.png');
		let slideContainer = new PIXI.Container;
		let pos = {x:170,y:68};
		let thickSlidebg = new PIXI.Graphics;
		thickSlide = new PIXI.Graphics;
		slideWidth = 400;

		thickButton = new PIXI.Graphics;
		thickSlidebg.beginFill(0xffffff).drawRoundedRect(-5,-5,slideWidth,10,5);
		thickSlide.beginFill(colors1[0]).drawRoundedRect(-5,-5,slideWidth,10,5);
		thickButton.lineStyle(8,0xffffff).beginFill(colors1[0]).drawCircle(0,0,15);
		set(slideContainer,pos);
		slideContainer.interactive = true;

		thickSlide.x = -slideWidth;

		let msk = new PIXI.Graphics;
		msk.beginFill(0).drawRoundedRect(-5,-5,slideWidth,10,5);
		thickSlide.mask = msk;

		slideContainer.addChild(thickSlidebg,thickSlide,msk,thickButton);
		
		slideContainer.on('pointerdown',beginMoveSlide);
		slideContainer.on('pointerupoutside',beginMoveSlide);
		slideContainer.on('pointerup',beginMoveSlide);

		//选择颜色功能

		let beginx = 183, sumX = 58, y1 = 143, y2 = 188;
		let colorCircle;
		let colorContainer = new PIXI.Container;

		for(let i=0;i<colors1.length;i++){
			colorCircle = new PIXI.Graphics().beginFill(colors1[i]).drawCircle(0,0,15);
			set(colorCircle,{x:beginx+(i*sumX),y:y1,interactive:true,colorVal:colors1[i]});
			colorContainer.addChild(colorCircle);
		}

		for(i=0;i<colors2.length;i++){
			colorCircle = new PIXI.Graphics().beginFill(colors2[i]).drawCircle(0,0,15);
			set(colorCircle,{x:beginx+(i*sumX),y:y2,interactive:true,colorVal:colors2[i]});
			colorContainer.addChild(colorCircle);
		}

		colorContainer.interactive = true;

		colorContainer.on('pointertap',changeColor);

		controlContainer.addChild(controlbg,slideContainer,colorContainer);

		//控制容器居中
		controlContainer.transform.pivot.x = controlContainer.getBounds().width/2;
		controlContainer.x = width/2;

		//把所有东西加到舞台上
		container.addChild(bg,drawContainer,getImage('upcloud.png'),controlContainer);
		resize()
		stage.render(container);

		//添加画板事件
		drawer.interactive = true;
		drawer.on('touchstart',ondown);
		drawer.on('pointerup',onup);

	}

	function getImage(imgName,mode,attr) {
		let img = new PIXI.Sprite(PIXI.loader.resources[imgPath+imgName].texture);
		if(mode==='center'){
			img.pivot.x = img.getBounds().width/2;
			img.pivot.y = img.getBounds().height/2;
		}

		attr && set(img,attr);

		return img;
	}

	function set(obj,attr) {
		let i, j;

		if(obj.constructor===Array){
			for(i=0;i<obj.length;i++){
				for(j in attr){
					obj[i][j] = attr[j];
				}
			}
			return;
		}


		for(i in attr){
			obj[i] = attr[i];
		}
		return obj;
	}

	function ondown(e) {
		moved = false;
		line = new PIXI.Graphics;
		line.lineStyle(lineData.width,lineData.color,1,1);
		drawer.addChild(line);
		let local = drawer.toLocal(e.data.global);
		line.moveTo(local.x,local.y);
		drawer.on('pointermove',drawline);
	}

	function drawline(e) {
		let local = drawer.toLocal(e.data.global);

		if(local.x<0 || local.x>drawerBound.width || local.y<0 || local.y>drawerBound.height){
			if(local.x<0){local.x=0}else if(local.x>drawerBound.width){local.x=drawerBound.width};
			if(local.y<0){local.y=0}else if(local.y>drawerBound.height){local.y=drawerBound.height};
			drawer.off('pointermove');
		}
		
		line.lineTo(local.x,local.y);
		moved = true;
		update();
	}

	function onup(e) {
		drawer.off('pointermove');
		!moved && backline();
	}

	function backline() {
		if(!drawer.children.length)  return;
		let l = drawer.getChildAt(drawer.children.length-1);
		drawer.removeChild(l);
		l.destroy(true,true,true);
		update();
	}

	function beginMoveSlide(e) {
		e.type==='pointerdown'? e.currentTarget.on('pointermove',moveSlide):e.currentTarget.off('pointermove');
		update();
	}

	function moveSlide(e) {
		let local = e.currentTarget.toLocal(e.data.global);
		if(local.x>=0 && local.x<=slideWidth){
			thickButton.x = local.x;
			thickSlide.x = local.x-slideWidth;
			lineData.width = (maxWidth-minWidth)*(local.x/slideWidth) + minWidth;
		};
		update();
	}

	function changeColor(e) {
		lineData.color = e.target.colorVal;
		//thickButton.beginFill(e.target.colorVal).drawCircle(0,0,13);
		console.log(thickButton.graphicsData)
		thickSlide.beginFill(e.target.colorVal).drawRoundedRect(-5,-5,slideWidth,10);
		update();
	}

	function saveImage() {
		update(drawer);
		let src = stage.view.toDataURL();
		update()
	}

	function update(obj) {
		obj = obj || container;
		stage.render(obj);
	}

	function resize() {
		controlContainer.y = document.documentElement.clientHeight - controlContainer.getBounds().height - 50;
	}

}