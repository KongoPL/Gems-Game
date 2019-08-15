class GameBoard
{
	get board() { return JSON.parse( JSON.stringify( this._board ) ); }


	constructor( width = 8, height = 8, minimalChainLength = 3 )
	{
		this.width = width;
		this.height = height;
		this.minimalChainLength = minimalChainLength;

		this._board = []; // Gem[][]

		// Events:
		this.onBoardRefill = new EventInstance();
		this.onBoardFill = new EventInstance();
		this.onCollectGems = new EventInstance();
		this.onDropDownGems = new EventInstance();
	}


	init()
	{
		this._refillBoard();
	}

	_refillBoard()
	{
		this._createBoard();

		this._fillBoard( false );

		if ( this._hasCollectableGems() )
			this._refillBoard();
		else
			this.onBoardRefill.emit();
	}


	_createBoard()
	{
		this._board = [];

		for ( let x = 0; x < this.width; x++ )
		{
			this._board[x] = [];

			for ( let y = 0; y < this.height; y++ )
				this._board[x][y] = Gem.EMPTY;
		}
	}

	_fillBoard( emitEventWhileDone = true )
	{
		for ( let x = 0; x < this.width; x++ )
		{
			for ( let y = 0; y < this.height; y++ )
			{
				if ( this._board[x][y] == Gem.EMPTY )
					this._board[x][y] = this._getRandomGem();
			}
		}

		if ( !this._hasAnyPossibleGemsSwap() )
			this._refillBoard();
		else if ( emitEventWhileDone )
			this.onBoardFill.emit();
	}

	_getRandomGem()
	{
		return MathHelper.rand( 0, 4 );
	}

	_hasAnyPossibleGemsSwap()
	{
		let boardCopy = VariableHelper.clone( this._board );
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
				let gem = [x, y];

				for ( let i = 0; i < 4; i++ )
				{
					let swapDirection = swapDirections[i];

					let swapingGem = [
						x + swapDirection[0],
						y + swapDirection[1]
					];

					if ( this._swapGems( gem, swapingGem, boardCopy ) )
					{
						if ( this._hasCollectableGems( boardCopy ) )
							return true;
						else
							this._swapGems( swapingGem, gem, boardCopy );
					}
				}
			}
		}

		return false;
	}


	_hasCollectableGems( board = this._board )
	{
		return ( this._getCollectableGems( board ).length > 0 );
	}


	_getCollectableGems( board = this._board )
	{
		let collectableChain = [],
			checkingDimensions = [
				{
					size: this.width,
					get: this.__getColumn.bind( this ),
					reverseCoords: false
				}, {
					size: this.height,
					get: this.__getRow.bind( this ),
					reverseCoords: true
				}
			];

		for ( let dimension of checkingDimensions )
		{
			for ( let i = 0; i < dimension.size; i++ )
			{
				let dimensionGems = dimension.get( i, board ),
					currentGem = Gem.EMPTY,
					dimensionChain = [];

				for ( let j = 0; j < dimensionGems.length; j++ )
				{
					if ( dimensionGems[j] != currentGem || currentGem == Gem.EMPTY )
					{
						if ( dimensionChain.length >= this.minimalChainLength )
							collectableChain.push( ...dimensionChain );

						dimensionChain = [];
						currentGem = dimensionGems[j];
					}

					let coords;

					if ( dimension.reverseCoords )
						coords = [j, i];
					else
						coords = [i, j];

					dimensionChain.push( coords );
				}

				if ( dimensionChain.length >= this.minimalChainLength )
					collectableChain.push( ...dimensionChain );
			}
		}

		// Remove duplicates:
		return collectableChain.filter( ( v, i ) => collectableChain.findIndex( ( v2, i2 ) => i2 > i && v[0] == v2[0] && v[1] == v2[1] ) == -1 );
	}


	__getRow( number, board = this._board )
	{
		return board.map( ( v ) => v[number] );
	}


	__getColumn( number, board = this._board )
	{
		return board[number];
	}


	_swapGems( [x1, y1], [x2, y2], board = this._board )
	{
		if ( !this.__hasGem( x1, y1, board ) || !this.__hasGem( x2, y2, board ) )
			return false;

		[board[x1][y1], board[x2][y2]] = [board[x2][y2], board[x1][y1]];

		return true;
	}


	__hasGem( x, y, board = this._board )
	{
		return ( typeof board[x] == 'object' && typeof board[x][y] == 'number' );
	}


	/**
	 *
	 * @param {[x, y]} gemA	Coordinates
	 * @param {[x, y]} gemB	Coordinates
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
		let boardCopy = VariableHelper.clone( this._board );

		this._swapGems( gemA, gemB, boardCopy );

		return this._hasCollectableGems( boardCopy );
	}


	_collectGems( gems )
	{
		for ( let gem of gems )
		{
			let [x, y] = gem;

			this._board[x][y] = Gem.EMPTY;
		}

		this.onCollectGems.emit( gems );
	}


	_dropDownGems()
	{
		let fallenGems = [];

		for ( let x = 0; x < this._board.length; x++ )
		{
			for ( let y = 1; y < this._board[x].length; y++ )
			{
				let gem = this._board[x][y];

				if ( gem != Gem.EMPTY )
					continue;

				// Fall gems down:
				for ( let y2 = y - 1; y2 >= 0; y2-- )
					this._board[x][y2 + 1] = this._board[x][y2];

				this._board[x][0] = Gem.EMPTY;
			}
		}

		this.onDropDownGems.emit();
	}


	debugDrawBoard( board = this._board )
	{
		let table = [];

		for ( let x = 0; x < board.length; x++ )
		{
			for ( let y = 0; y < board[x].length; y++ )
			{
				if ( x == 0)
					table[y] = [];

				table[y][x] = board[x][y];
			}
		}

		console.table( table );
	}
}