class GameBoardRenderer
{
	/**
	 * Constructor. What else it could be?
	 * @param {GameBoard} board
	 */
	constructor( board )
	{
		this.board = board;

		this._queue = new OperationsQueue;

		this._gemWidth = 50;
		this._gemHeight = 50;
		this._minimalDragDistance = 50;

		this._swapAnimationTime = 0.175; // in seconds
		this._spawnAnimationTime = 0.250;
		this._destroyAnimationTime = 0.250;

		this._fallSpeedMin = 5;
		this._fallSpeedMax = 50;
		this._fallAcceleration = 100; // pixels

		this._gemSprites = []; // PIXI.Sprite[]
		this._draggedSprite = null; // PIXI.Sprite
		this._startDragCoordinates = null; // Vector2D
	}


	init()
	{
		this.board.onBoardRefill.listen( this._redrawBoard.bind( this ) );
		this.board.onBoardFill.listen( this._drawBoard.bind( this ) );
		this.board.onCollectGems.listen( this._onCollectGemsEvent.bind( this ) );
		this.board.onDropDownGems.listen( this._onDropDownGemsEvent.bind( this ) );

		GameCanvas.addGlobalEvent( 'mousemove', this.__onGemDragMove.bind( this ) );
	}


	_redrawBoard()
	{
		this._destroySprites( this._gemSprites );

		const gems = [];

		for ( let row of this.board.board )
			gems.push( ...row );

		this._drawBoard( gems );
	}


	_destroySprites( sprites )
	{
		this._queue.add( () =>
		{
			if ( sprites == this._gemSprites )
				this._gemSprites = [];
			else
				this._gemSprites = this._gemSprites.filter( ( v ) => sprites.indexOf( v ) == -1 );

			GameBoardAnimations.destroyAnimation( sprites, this._destroyAnimationTime ).then( () =>
			{
				for ( let sprite of sprites )
					if ( sprite._destroyed == false )
						sprite.destroy();

				this._queue.next();
			} );
		} );
	}


	_drawBoard( gems )
	{
		this._queue.add( () =>
		{
			const spawnedGems = [];

			for ( let gem of gems )
			{
				const sprite = this._createGemSprite( gem );

				if ( !sprite )
					continue;

				spawnedGems.push( sprite );
			}

			GameBoardAnimations.spawnAnimation( spawnedGems, this._spawnAnimationTime ).then( () => this._queue.next() );
		} );
	}


	_createGemSprite( gem )
	{
		const spritePath = gem.spritePath;

		if ( !spritePath )
			return false;

		const gemSprite = GameCanvas.addSprite( spritePath );

		gemSprite.x = gem.x * this._gemWidth + this._gemWidth / 2;
		gemSprite.y = gem.y * this._gemHeight + this._gemHeight / 2;

		gemSprite.anchor.set( 0.5, 0.5 );

		gemSprite.data = { gem };

		gemSprite.interactive = true;

		gemSprite.on( 'mousedown', this.__onStartGemDrag.bind( this, gemSprite ) );
		gemSprite.on( 'mouseup', this.__onEndGemDrag.bind( this ) );

		this._gemSprites.push( gemSprite );

		return gemSprite;
	}


	__onStartGemDrag( sprite, event )
	{
		this._draggedSprite = sprite;
		this._startDragCoordinates = new Vector2D( event.data.global.x, event.data.global.y );
	}


	__onGemDragMove( event )
	{
		if ( !this._draggedSprite )
			return;

		const { x, y } = event.data.global;
		const delta = ( new Vector2D( x, y ) ).subVector( this._startDragCoordinates );

		if ( delta.length < this._minimalDragDistance )
			return;

		delta.normalize();

		let direction = [0, 0];
		const deltaXAbs = Math.abs( delta.x ),
			deltaYAbs = Math.abs( delta.y );

		if ( delta.x > 0 && deltaXAbs > deltaYAbs ) direction = [1, 0];
		else if ( delta.x < 0 && deltaXAbs > deltaYAbs ) direction = [-1, 0];
		else if ( delta.y > 0 && deltaXAbs <= deltaYAbs ) direction = [0, 1];
		else if ( delta.y < 0 && deltaXAbs <= deltaYAbs ) direction = [0, -1];

		this.swapGem( this._draggedSprite, direction );

		this.__onEndGemDrag();
	}


	__onEndGemDrag()
	{
		this._draggedSprite = null;
		this._startDragCoordinates = null;
	}


	swapGem( sprite, direction )
	{
		this._queue.add( ( board ) =>
		{
			const gemBSprite = this._getGemSpriteAt( sprite.data.gem.x + direction[0], sprite.data.gem.y + direction[1] );

			if ( !gemBSprite )
				return;

			GameBoardAnimations.swapAnimation( sprite, gemBSprite, this._swapAnimationTime ).then( () =>
			{
				if ( this.board.swapGems( sprite.data.gem, gemBSprite.data.gem ) )
					this._queue.next();
				else
					GameBoardAnimations.swapAnimation( gemBSprite, sprite, this._swapAnimationTime ).then( () => this._queue.next() );
			} );
		} );
	}


	_onCollectGemsEvent( gems )
	{
		const gemsSprites = [];

		for ( let gem of gems )
		{
			const sprite = this._getGemSpriteAt( gem.x, gem.y );

			if ( !sprite )
				continue;

			gemsSprites.push( sprite );
		}

		this._destroySprites( gemsSprites );
	}


	_onDropDownGemsEvent( gems, fallDistance )
	{
		this._queue.add( () =>
		{
			const gemsSprites = [];

			for ( let gem of gems )
			{
				const sprite = this._getGemSpriteAt( gem.x, gem.y );

				if ( !sprite )
				{
					fallDistance.splice( gems.indexOf( gem ), 1 );

					continue;
				}

				gemsSprites.push( sprite );
			}

			const fallDestination = gemsSprites.map( ( sprite, i ) => sprite.y + fallDistance[i] * this._gemHeight );

			GameBoardAnimations.fallSpritesAnimation( gemsSprites, fallDestination, {
				acceleration: this._fallAcceleration,
				minSpeed: this._fallSpeedMin,
				maxSpeed: this._fallSpeedMax
			} ).then( ( v ) => this._queue.next() );
		} );
	}


	_getGemSpriteAt( x, y )
	{
		return this._gemSprites.find( ( v ) => v.data.gem.x == x && v.data.gem.y == y );
	}
}