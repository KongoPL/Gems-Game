class GameBoardAnimations
{
	static spawnAnimation( sprites, animationTime )
	{
		let animationTimeRemaining = animationTime;

		return new Promise( ( resolve, reject ) =>
		{
			const animation = () =>
			{
				let delta = GameCanvas.tickDelta;

				animationTimeRemaining = Math.max( animationTimeRemaining - delta, 0 );

				for ( let i = 0; i < sprites.length; i++ )
				{
					sprites[i].scale.x =
						sprites[i].scale.y = ( animationTime - animationTimeRemaining ) / animationTime;
				}

				if ( animationTimeRemaining == 0 )
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


	static destroyAnimation( sprites, animationTime )
	{
		let animationRemainingTime = animationTime;

		return new Promise( ( resolve, reject ) =>
		{
			const animation = () =>
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
						sprites[i].scale.y = animationRemainingTime / animationTime;
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


	static swapAnimation( spriteA, spriteB, animationTime )
	{
		const travelDistance = new Vector2D( spriteB.x - spriteA.x, spriteB.y - spriteA.y ),
			spriteAStartPosition = [spriteA.x, spriteA.y],
			spriteBStartPosition = [spriteB.x, spriteB.y];
		let animationTimeLeft = animationTime;

		return new Promise( ( resolve, reject ) =>
		{
			const animationCallback = ( ( callback ) =>
			{
				let delta = GameCanvas.tickDelta;

				animationTimeLeft -= delta;

				if ( animationTimeLeft < 0 )
					delta += animationTimeLeft;

				spriteA.x += travelDistance.x * ( delta / animationTime );
				spriteA.y += travelDistance.y * ( delta / animationTime );

				spriteB.x -= travelDistance.x * ( delta / animationTime );
				spriteB.y -= travelDistance.y * ( delta / animationTime );

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


	static fallSpritesAnimation( sprites, fallDestination, { acceleration, minSpeed, maxSpeed } )
	{
		let fallSpeed = 0;

		return new Promise( ( resolve, reject ) =>
		{
			const animationCallback = ( ( callback ) =>
			{
				fallSpeed += acceleration * GameCanvas.tickDelta;
				fallSpeed = MathHelper.clamp( fallSpeed, minSpeed, maxSpeed );

				const spritesToDelete = [];

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
					const index = sprites.indexOf( sprite );

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