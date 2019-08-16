/**
 * @property {Gem[][]} board
*/
class GameBoard
{
	constructor( width = 8, height = 8, minimalChainLength = 3 )
	{
		this.width = width;
		this.height = height;
		this.minimalChainLength = minimalChainLength;

		this.board = []; // Gem[][]

		// Events:
		this.onBoardRefill = new EventInstance();
		this.onBoardFill = new EventInstance();
		this.onCollectGems = new EventInstance();
		this.onDropDownGems = new EventInstance();
	}


	init()
	{
		this._createBoard();
		this._refillBoard();
	}

	_refillBoard()
	{
		for ( let x = 0; x < this.board.length; x++ )
			for ( let y = 0; y < this.board[x].length; y++ )
				this.board[x][y].empty();

		this._fillBoard( false );

		if ( this._hasCollectableGems() )
			this._refillBoard();
		else
			this.onBoardRefill.emit();
	}


	_createBoard()
	{
		this.board = [];

		for ( let x = 0; x < this.width; x++ )
		{
			this.board[x] = [];

			for ( let y = 0; y < this.height; y++ )
				this.board[x][y] = new Gem( x, y );
		}
	}

	_fillBoard( emitEventWhileDone = true )
	{
		let createdGems = [];

		for ( let x = 0; x < this.width; x++ )
		{
			for ( let y = 0; y < this.height; y++ )
			{
				if ( this.board[x][y].isEmpty )
				{
					this.board[x][y] = Gem.createRandom( x, y );

					createdGems.push( this.board[x][y] );
				}
			}
		}

		

		if ( !this._hasAnyPossibleGemsSwap() || window.xdd )
		{
			if ( typeof window.xdd != 'undefined' )
				window.xddd = false;

			this._refillBoard();
		}
		else if ( emitEventWhileDone )
			this.onBoardFill.emit( createdGems );
	}

	_hasAnyPossibleGemsSwap()
	{
		let swapDirections = [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1]
		];

		for ( let x = 0; x < this.width; x++ )
		{
			for ( let y = 0; y < this.height; y++ )
			{
				let gem = this.board[x][y];

				for ( let i = 0; i < 4; i++ )
				{
					let swapDirection = swapDirections[i],
						swapingGem = this.__getGemAt( x + swapDirection[0], y + swapDirection[1] );

					if ( !swapingGem )
						continue;

					if ( this._swapGems( gem, swapingGem ) )
					{
						let hasCollectableGems = this._hasCollectableGems();

						this._swapGems( swapingGem, gem );

						if ( hasCollectableGems )
							return true;
					}
				}
			}
		}

		return false;
	}


	_hasCollectableGems()
	{
		return ( this._getCollectableGems().length > 0 );
	}


	_getCollectableGems()
	{
		let collectableChain = [],
			checkingDimensions = [
				{
					size: this.width,
					get: this.__getColumn.bind( this )
				}, {
					size: this.height,
					get: this.__getRow.bind( this )
				}
			];

		for ( let dimension of checkingDimensions )
		{
			for ( let i = 0; i < dimension.size; i++ )
			{
				let dimensionGems = dimension.get( i ),
					currentGem = null,
					dimensionChain = [];

				for ( let j = 0; j < dimensionGems.length; j++ )
				{
					let gem = dimensionGems[j];

					if ( currentGem == null || gem.type != currentGem.type )
					{
						if ( dimensionChain.length >= this.minimalChainLength )
							collectableChain.push( ...dimensionChain );

						dimensionChain = [];
						currentGem = gem;
					}

					dimensionChain.push( gem );
				}

				if ( dimensionChain.length >= this.minimalChainLength )
					collectableChain.push( ...dimensionChain );
			}
		}

		// Remove duplicates:
		return collectableChain.filter( ( v, i ) => collectableChain.findIndex( ( v2, i2 ) => i2 > i && v == v2 ) == -1 );
	}


	__getRow( number )
	{
		return this.board.map( ( v ) => v[number] );
	}


	__getColumn( number )
	{
		return this.board[number];
	}


	_swapGems( gemA, gemB )
	{
		if ( !this.__hasGem( gemA ) || !this.__hasGem( gemB ) )
			return false;

		[gemA.x, gemA.y, gemB.x, gemB.y] = [gemB.x, gemB.y, gemA.x, gemA.y];
		[this.board[gemA.x][gemA.y], this.board[gemB.x][gemB.y]] = [this.board[gemB.x][gemB.y], this.board[gemA.x][gemA.y]];

		return true;
	}

	__getGemAt( x, y )
	{
		if ( this.__hasGemAt( x, y ) )
			return this.board[x][y];

		return null;
	}


	__hasGem( gem )
	{
		return ( this.__hasGemAt( gem.x, gem.y ) && this.board[gem.x][gem.y] == gem );
	}


	__hasGemAt( x, y )
	{
		return ( typeof this.board[x] == 'object' && typeof this.board[x][y] == 'object' );
	}


	/**
	 *
	 * @param {Gem} gemA
	 * @param {Gem} gemB
	 * @returns {boolean}
	 */
	swapGems( gemA, gemB )
	{
		if ( !this.canSwapGems( gemA, gemB ) )
			return false;

		this._swapGems( gemA, gemB );

		let gems = this._getCollectableGems();

		while ( gems.length > 0 ) // :)
		{
			this._collectGems( gems );

			this._dropDownGems();

			this._fillBoard();

			gems = this._getCollectableGems();
		}


		return true;
	}


	canSwapGems( gemA, gemB )
	{
		this._swapGems( gemA, gemB );

		const hasGemsToCollect = this._hasCollectableGems();

		this._swapGems( gemB, gemA );

		return hasGemsToCollect;
	}


	_collectGems( gems )
	{
		for ( let gem of gems )
			gem.empty();

		this.onCollectGems.emit( gems );
	}


	_dropDownGems()
	{
		let fallenGems = [],
			fallDistance = [];

		for ( let x = 0; x < this.board.length; x++ )
		{
			for ( let y = 1; y < this.board[x].length; y++ )
			{
				let gem = this.board[x][y];

				if ( !gem.isEmpty )
					continue;

				// Fall gems down:
				for ( let y2 = y - 1; y2 >= 0; y2-- )
				{
					let fallingGem = this.board[x][y2];

					if ( fallingGem.isEmpty == false )
					{
						let fallenGemIndex = fallenGems.indexOf( fallingGem );

						if ( fallenGemIndex == -1 )
						{
							fallenGemIndex = fallenGems.push( fallingGem ) - 1;
							fallDistance.push( 0 );
						}

						fallingGem.y++
						fallDistance[fallenGemIndex]++;
					}

					this.board[x][y2 + 1] = fallingGem;
				}

				this.board[x][0] = gem;
			}
		}

		this.onDropDownGems.emit( fallenGems, fallDistance );
	}


	debugDrawBoard()
	{
		let table = [];

		for ( let x = 0; x < this.board.length; x++ )
		{
			for ( let y = 0; y < this.board[x].length; y++ )
			{
				if ( x == 0)
					table[y] = [];

				table[y][x] = this.board[x][y].type;
			}
		}

		console.table( table );
	}
}