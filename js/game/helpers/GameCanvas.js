class GameCanvas
{
	static get tickDelta() { return this._app.ticker.elapsedMS / 1000; }

	static init( width = 400, height = 400, target = document.body )
	{
		this._app = new PIXI.Application( {
			width: width,
			height: height
		} );

		this._assetsRootPath = 'assets/';

		target.appendChild( this._app.view );

		this._app.stage.interactive = true;
	}

	static onLoad( callback )
	{
		this._app.loader.load( callback );
	}


	static onTick( callback )
	{
		this._app.ticker.add( callback );
	}


	static removeOnTick( callback )
	{
		this._app.ticker.remove( callback );
	}

	static addGlobalEvent( event, callback )
	{
		return this._app.stage.on( event, callback );
	}

	static addSprite( key )
	{
		if ( typeof this._app.loader.resources[key] == 'undefined' )
			throw new Error( `Sprite "${key}" doesn't exists!` );

		const sprite = new PIXI.Sprite( this._app.loader.resources[key].texture );

		this._app.stage.addChild( sprite );

		return sprite;
	}


	static loadAssets( assets )
	{
		for ( var asset of assets )
			this.loadAsset( asset );
	}

	static loadAsset( asset )
	{
		this._app.loader.add( asset, this._assetsRootPath + asset );
	}
}