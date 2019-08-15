class GameBoardTests
{
	static testAll()
	{
		console.log( "Swapping works:", this.swapWorksTest() );
		console.log( "Swapping fails:", this.swapFailsTest() );
		console.log( "Collecting works:", this.collectingWorksTest() );
		console.log( "Gems falling works:", this.gemsFallingWorksTest() );
		console.log( "Gems spawning works:", this.gemsSpawningWorksTest() );
	}

	static swapWorksTest()
	{
		let board = this._createTestingBoard();

		return this._checkTests( [
			board.canSwapGems( [2, 0], [2, 1] ),
			board.canSwapGems( [2, 1], [2, 0] ),
			board.canSwapGems( [1, 4], [2, 4] ),
			board.canSwapGems( [4, 3], [3, 3] )
		] );
	}


	static swapFailsTest()
	{
		let board = this._createTestingBoard();

		return this._checkTests( [
			!board.canSwapGems( [2, 0], [3, 0] ),
			!board.canSwapGems( [2, 1], [3, 1] ),
			!board.canSwapGems( [2, 2], [3, 2] ),
			!board.canSwapGems( [0, 4], [1, 4] )
		] );
	}


	static collectingWorksTest()
	{
		let tests = [
			{
				swap: [[2, 0], [2, 1]],
				gemsToCollect: [
					[0, 0], [1, 0], [2, 0],
					[2, 1], [2, 2], [2, 3],
				]
			}
		],
			testNumber = 0;

		let testsStatus = [];

		for ( let test of tests )
		{
			testNumber++;

			let board = this._createTestingBoard();

			board._swapGems( ...test.swap );

			let collectableGems = board._getCollectableGems(),
				gemsToCollect = test.gemsToCollect;

			testsStatus.push( gemsToCollect.length == collectableGems.length // Have same count of collected gems
				&& gemsToCollect.filter( ( v ) => collectableGems.find( ( v2 ) => v[0] == v2[0] && v[1] == v2[1] ) ) ); // They are the same gems
		}

		return this._checkTests( testsStatus );
	}


	static gemsFallingWorksTest()
	{
		let board = this._createTestingBoard(),
			boardCopy = board.board;

		board._board[2][2] = Gem.EMPTY;
		board._board[3][2] = Gem.EMPTY;
		board._board[4][2] = Gem.EMPTY;

		board._board[1][2] = Gem.EMPTY;
		board._board[1][3] = Gem.EMPTY;
		board._board[1][4] = Gem.EMPTY;

		board._dropDownGems();

		return this._checkTests( [
			board._board[2][0] == Gem.EMPTY
			&& board._board[3][0] == Gem.EMPTY
			&& board._board[4][0] == Gem.EMPTY,

			board._board[2][1] == boardCopy[2][0]
			&& board._board[3][1] == boardCopy[3][0]
			&& board._board[4][1] == boardCopy[4][0],

			board._board[2][2] == boardCopy[2][1]
			&& board._board[3][2] == boardCopy[3][1]
			&& board._board[4][2] == boardCopy[4][1],

			board._board[1][2] == Gem.EMPTY
			&& board._board[1][3] != Gem.EMPTY
			&& board._board[1][4] != Gem.EMPTY,
		] );
	}


	static gemsSpawningWorksTest()
	{
		let board = this._createTestingBoard();

		board._board[4][0] = Gem.EMPTY;
		board._board[4][1] = Gem.EMPTY;
		board._board[4][2] = Gem.EMPTY;

		board._fillBoard();

		return board._board[4][0] != Gem.EMPTY
			&& board._board[4][1] != Gem.EMPTY
			&& board._board[4][2] != Gem.EMPTY;
	}


	static _createTestingBoard()
	{
		let board = new GameBoard( 5, 5, 3 );

		board._board = [
			[0, 1, 2, 3, 4],
			[0, 2, 3, 3, 1],
			[1, 0, 1, 1, 2],
			[3, 2, 2, 1, 0],
			[3, 3, 1, 2, 3],
		];

		/*
			More human-friendly:
			00133
			12023
			23121
			33112
			41203
		*/

		return board;
	}

	static _checkTests( tests )
	{
		for ( let key in tests )
			if ( !tests[key] )
				return `Failed test #${parseInt( key ) + 1}`;

		return true;
	}
}