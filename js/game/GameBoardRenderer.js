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

		this._gemSprites = [];
		this._draggedSprite = null; // PIXI.Sprite
		this._startDragCoordinates = null; // Vector2D
	}


	init()
	{
		GameCanvas.getStage().on( 'mousemove', this.__gemDragMove.bind( this ) );

		this.board.onBoardRefill.listen( this._redrawBoard.bind( this ) );
		this.board.onBoardFill.listen( this._drawBoard.bind( this ) );
		this.board.onCollectGems.listen( this._onCollectGemsEvent.bind( this ) );
		this.board.onDropDownGems.listen( this._onDropDownGemsEvent.bind( this ) );
	}


	_onCollectGemsEvent( gems )
	{
		let gemsSprites = [];

		for ( let gem of gems )
		{
			let sprite = this._getGemSpriteAt( gem.x, gem.y );

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
			let gemsSprites = [];

			for ( let gem of gems )
			{
				let sprite = this._getGemSpriteAt( gem.x, gem.y );

				if ( !sprite )
				{
					fallDistance.splice( gems.indexOf( gem ), 1 );

					continue;
				}

				gemsSprites.push( sprite );
			}

			this._fallSpritesAnimation( gemsSprites, fallDistance ).then( ( v ) => this._queue.next() );
		} );
	}


	_drawBoard( gems )
	{
		this._queue.add( () =>
		{
			let spawnedGems = [];

			for ( let gem of gems )
			{
				let sprite = this._createGemSprite( gem );

				if ( !sprite )
					continue;

				spawnedGems.push( sprite );

				this._addGemSpriteEvents( sprite );
			}

			this._spawnAnimation( spawnedGems ).then( () => this._queue.next() );
		} );
	}


	_redrawBoard()
	{
		this._destroySprites( this._gemSprites );

		let gems = [];

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

			this._destroyAnimation( sprites ).then( () =>
			{
				for ( let sprite of sprites )
					if ( sprite._destroyed == false )
						sprite.destroy();

				this._queue.next();
			} );
		} );
	}


	_createGemSprite( gem )
	{
		let spritePath = gem.spritePath;

		if ( !spritePath )
			return false;

		let gemSprite = GameCanvas.addSprite( spritePath );

		gemSprite.x = gem.x * this._gemWidth + this._gemWidth / 2;
		gemSprite.y = gem.y * this._gemHeight + this._gemHeight / 2;

		gemSprite.anchor.set( 0.5, 0.5 );

		gemSprite.data = { gem };

		this._gemSprites.push( gemSprite );

		return gemSprite;
	}


	_addGemSpriteEvents( sprite )
	{
		sprite.interactive = true;

		sprite.on( 'mousedown', this.__startGemDrag.bind( this, sprite ) );
		sprite.on( 'mouseup', this.__endGemDrag.bind( this ) );
	}


	__startGemDrag( sprite, event )
	{
		this._draggedSprite = sprite;
		this._startDragCoordinates = new Vector2D( event.data.global.x, event.data.global.y );
	}

	__gemDragMove( event )
	{
		if ( !this._draggedSprite )
			return;

		let { x, y } = event.data.global;
		let delta = ( new Vector2D( x, y ) ).subVector( this._startDragCoordinates );

		if ( delta.length < this._minimalDragDistance )
			return;

		delta.normalize();

		let direction = [0, 0],
			deltaXAbs = Math.abs( delta.x ),
			deltaYAbs = Math.abs( delta.y );

		if ( delta.x > 0 && deltaXAbs > deltaYAbs ) direction = [1, 0];
		else if ( delta.x < 0 && deltaXAbs > deltaYAbs ) direction = [-1, 0];
		else if ( delta.y > 0 && deltaXAbs <= deltaYAbs ) direction = [0, 1];
		else if ( delta.y < 0 && deltaXAbs <= deltaYAbs ) direction = [0, -1];

		this.swapGem( this._draggedSprite, direction );

		this.__endGemDrag();
	}

	__endGemDrag()
	{
		this._draggedSprite = null;
		this._startDragCoordinates = null;
	}


	swapGem( sprite, direction )
	{
		this._queue.add( ( board ) =>
		{
			let { x, y } = sprite.data.gem;
			let gemA = [x, y],
				gemB = [x + direction[0], y + direction[1]];
			let gemBSprite = this._getGemSpriteAt( ...gemB );

			if ( !gemBSprite )
				return;

			this._swapAnimation( sprite, gemBSprite ).then( () =>
			{
				if ( this.board.canSwapGems( sprite.data.gem, gemBSprite.data.gem ) )
				{
					this.board.swapGems( sprite.data.gem, gemBSprite.data.gem );
					//this.board._refillBoard();

					this._queue.next();
				}
				else
					this._swapAnimation( gemBSprite, sprite ).then( () => this._queue.next() );
			} );
		} );
	}


	_getGemSpriteAt( x, y )
	{
		return this._gemSprites.find( ( v ) => v.data.gem.x == x && v.data.gem.y == y );
	}


	_spawnAnimation( sprites )
	{
		let animationTime = this._spawnAnimationTime;

		return new Promise( ( resolve, reject ) =>
		{
			let animation = () =>
			{
				let delta = GameCanvas.tickDelta;

				animationTime = Math.max( animationTime - delta, 0 );

				for ( let i = 0; i < sprites.length; i++ )
				{
					sprites[i].scale.x =
						sprites[i].scale.y = ( this._spawnAnimationTime - animationTime ) / this._spawnAnimationTime;
				}

				if ( animationTime == 0 )
				{
					GameCanvas.removeOnTick( animation );

					resolve();
				}
			}

			for ( let i = 0; i < sprites.length; i++ )
				sprites[i].scale.set( 0, 0 );

			GameCanvas.onTick( animation );
		} );
	}


	_destroyAnimation( sprites )
	{
		let animationRemainingTime = this._destroyAnimationTime;

		return new Promise( ( resolve, reject ) =>
		{
			let animation = () =>
			{
				let delta = GameCanvas.tickDelta;

				animationRemainingTime -= delta;

				if ( animationRemainingTime < 0 )
					delta += animationRemainingTime;

				for ( let i = 0; i < sprites.length; i++ )
				{
					if ( sprites[i]._destroyed )
						continue;

					sprites[i].scale.x =
						sprites[i].scale.y = animationRemainingTime / this._destroyAnimationTime;
				}

				if ( animationRemainingTime <= 0 )
				{
					GameCanvas.removeOnTick( animation );

					resolve();
				}
			};

			GameCanvas.onTick( animation );
		} );
	}


	_swapAnimation( spriteA, spriteB )
	{
		let travelDistance = new Vector2D( spriteB.x - spriteA.x, spriteB.y - spriteA.y ),
			spriteAStartPosition = [spriteA.x, spriteA.y],
			spriteBStartPosition = [spriteB.x, spriteB.y],
			animationTimeLeft = this._swapAnimationTime;

		return new Promise( ( resolve, reject ) =>
		{
			let animationCallback = (( callback ) =>
			{
				let delta = GameCanvas.tickDelta;

				animationTimeLeft -= delta;

				if ( animationTimeLeft < 0 )
					delta += animationTimeLeft;

				spriteA.x += travelDistance.x * ( delta / this._swapAnimationTime );
				spriteA.y += travelDistance.y * ( delta / this._swapAnimationTime );

				spriteB.x -= travelDistance.x * ( delta / this._swapAnimationTime );
				spriteB.y -= travelDistance.y * ( delta / this._swapAnimationTime );

				if ( animationTimeLeft <= 0 )
				{
					spriteA.x = spriteBStartPosition[0];
					spriteA.y = spriteBStartPosition[1];

					spriteB.x = spriteAStartPosition[0];
					spriteB.y = spriteAStartPosition[1];

					GameCanvas.removeOnTick( animationCallback );

					callback();
				}
			} ).bind( this, resolve );

			GameCanvas.onTick( animationCallback );
		} );
	}


	_fallSpritesAnimation( sprites, fallDistance )
	{
		let fallDestination = sprites.map( ( sprite, i ) => sprite.y + fallDistance[i] * this._gemHeight );
		let fallSpeed = 0;

		return new Promise( ( resolve, reject ) =>
		{
			let animationCallback = ( ( callback ) =>
			{
				fallSpeed += this._fallAcceleration * GameCanvas.tickDelta;

				fallSpeed = MathHelper.clamp( fallSpeed, this._fallSpeedMin, this._fallSpeedMax );

				let spritesToDelete = [];

				sprites.forEach( ( sprite, i ) =>
				{
					sprite.y += fallSpeed;

					if ( sprite.y >= fallDestination[i] )
					{
						sprite.y = fallDestination[i];

						spritesToDelete.push( sprite );
					}
				} );

				for ( let sprite of spritesToDelete )
				{
					let index = sprites.indexOf( sprite );

					sprites.splice( index, 1 );
					fallDestination.splice( index, 1 );
				}

				if ( sprites.length == 0 )
				{
					GameCanvas.removeOnTick( animationCallback );

					callback();
				}
			} ).bind( this, resolve );

			GameCanvas.onTick( animationCallback );
		} );
	}
}