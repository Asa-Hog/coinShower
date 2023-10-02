// ----- Start of the assignment ----- //

class SpriteCascade extends PIXI.Sprite {
	constructor() {
		super();
		// Set number of sprites to use
		let noOfSprites = 25;
		let sprites = [];

		for (let i = 0; i < noOfSprites; i++) {
			// Create a sprite
			let sp        = game.sprite("CoinsGold000");
			// Set pivot to center of said sprite
			sp.pivot.x    = sp.width/2; // Rotate around the middle of the sprite
			sp.pivot.y    = sp.height/2;
			// Add random x and y end positions for the sprite
			sp.randomX = this.randomNumber(-400, 400); // egenskaper hos enskilda partikeln
			sp.randomY = this.randomNumber(-225, 225);
			// Add random pos and neg values to use for rotation of the sprite
			let max = 3, min = -3;

			sp.rotValue = this.randomNumber(min, max);
			sp.velocity = 0;
			sprites.push(sp);
		}
		return {"sprites": sprites};
	}

	randomNumber(min, max) {
		return Math.random() * (max - min) + min;
	}
}

class ParticleSystem extends PIXI.Container {
	constructor() {
		super();
		// Set start and duration for this effect in milliseconds
		this.start    = 0;
		this.duration = 15000;
		this.allSprites = [];
		this.lastTime = Date.now();
		this.localTime = Date.now();
		this.counter = 0;

		// Create a particle cascade object
		this.createAndAddSpriteCascade();
	}

	createAndAddSpriteCascade() {
		this.counter ++; // Number of created sprite cascades
		this.lastTime = Date.now(); // Date of creation
		this.localTime = Date.now();

		// Create the sprite cascade
		let sc = new SpriteCascade();

		// Add the sprite particles in the cascade to the particle system
		for (let i = 0; i < sc.sprites.length; i++) {
			this.addChild(sc.sprites[i]);
		}
		// Add the sprite cascade to the total sprites array
		this.allSprites.push(sc.sprites);

		return {"cascade": sc};
	}

	animTick(nt,lt,gt) {
		// Every update we get three different time variables: nt, lt and gt.
		//   nt: Normalized time in procentage (0.0 to 1.0) and is calculated by
		//       just dividing local time with duration of this effect.
		//   lt: Local time in milliseconds, from 0 to this.duration.
		//   gt: Global time in milliseconds,

		// Set interval when next cascade shall be created
		let deltaT = this.duration/2;

		// Create and add a new sprite cascade - after time interval deltaT
		if (gt - this.lastTime > deltaT) {
			this.createAndAddSpriteCascade();
		}

		// console.log(this.localTime);
		// if (gt - this.localTime > deltaT) {
		// 	console.log("nu");
		// }

		// Update sprites
		for (let i = 0; i < this.children.length; i++) {
			// Set a new texture on a sprite particle
			let num = ("000"+Math.floor(nt*8)).substr(-3);
			
			game.setTexture(this.children[i],"CoinsGold"+num);
			// Update particle - Use correct lt
			let newNt;

			if (lt >= deltaT) {
				let oldLt = lt;
				let newLt = oldLt - deltaT;
				newNt = newLt / this.duration;
			} else {
				newNt = nt;
			}
			this.updateSprite(this.children[i], newNt);
		}

		// Remove sprites from particle system
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].position.y >= 450) {
				this.removeChild(this.children[i]);
			}
		}
	}

	updateSprite(sp, nt) {
		// Animate scale
		sp.scale.x = sp.scale.y = 0.5*nt;
		// Animate alpha ---- Fades sprites into the scene
		sp.alpha = nt;
		// Animate rotation ---- How fast and in which direction the sprite rotates
		sp.rotation = sp.rotValue*nt*Math.PI*2;
		// Set velocity of sprite
		sp.velocity += 25*nt*nt;
		// Animate position ---- Linear radial movement + increasing velocity (~ gravity)
		sp.position.x = 400 + nt*sp.randomX;
		sp.position.y = 225 + nt*sp.randomY + sp.velocity;
	}
}

// ----- End of the assignment ----- //

class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.renderer = new PIXI.WebGLRenderer(800,450);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props&&props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i=0; i<=8; i++) {
			let num  = ("000"+i).substr(-3);
			let name = "CoinsGold"+num;
			let url  = "gfx/CoinsGold/"+num+".png";
			textureNames.push(name);
			PIXI.loader.add(name,url);
		}
		PIXI.loader.load(function(loader,res){
			// Access assets by name, not url
			let keys = Object.keys(res);
			for (let i=0; i<keys.length; i++) {
				var texture = res[keys[i]].texture;
				if ( ! texture) continue;
				PIXI.utils.TextureCache[keys[i]] = texture;
			}
			// Assets are loaded and ready!
			this.start();
			cb && cb();
		}.bind(this));
	}
	start() {	
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update(){
			if ( ! this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(this.totalDuration,(eff.duration+eff.start)||0);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt-this.t0) % this.totalDuration;
		for (let i=0; i<this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt>eff.start+eff.duration || lt<eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent,elt,gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp,name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if ( ! sp.texture) console.warn("Texture '"+name+"' don't exist!")
	}
}

window.onload = function(){
	window.game = new Game({onload:function(){
		game.addEffect(new ParticleSystem());
	}});
}
