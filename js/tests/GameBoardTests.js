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
		const board = this._createTestingBoard();

		return this._checkTests( [
			board.canSwapGems( board.getGemAt(2, 0), board.getGemAt(2, 1) ),
			board.canSwapGems( board.getGemAt(2, 1), board.getGemAt(2, 0) ),
			board.canSwapGems( board.getGemAt(1, 4), board.getGemAt(2, 4) ),
			board.canSwapGems( board.getGemAt(4, 3), board.getGemAt(3, 3) )
		] );
	}


	static swapFailsTest()
	{
		const board = this._createTestingBoard();

		return this._checkTests( [
			!board.canSwapGems( board.getGemAt(2, 0), board.getGemAt(3, 0) ),
			!board.canSwapGems( board.getGemAt(2, 1), board.getGemAt(3, 1) ),
			!board.canSwapGems( board.getGemAt(2, 2), board.getGemAt(3, 2) ),
			!board.canSwapGems( board.getGemAt(0, 4), board.getGemAt(1, 4) )
		] );
	}


	static collectingWorksTest()
	{
		const tests = [
			{
				swap: [[2, 0], [2, 1]],
				gemsToCollect: [
					[0, 0], [1, 0], [2, 0],
					[2, 1], [2, 2], [2, 3],
				]
			}
		],
			testNumber = 0;

		const testsStatus = [];

		for ( let test of tests )
		{
			testNumber++;

			const board = this._createTestingBoard();
			const gemA = board.getGemAt( test.swap[0, 0], test.swap[0][1] ),
				gemB = board.getGemAt( test.swap[1, 0], test.swap[1][1] );

			board._swapGems( gemA, gemB );

			const collectableGems = board._getCollectableGems(),
				gemsToCollect = test.gemsToCollect;

			testsStatus.push( gemsToCollect.length == collectableGems.length // Have same count of collected gems
				&& gemsToCollect.filter( ( v ) => collectableGems.find( ( gem ) => gem.x == v[0] && gem.y == v[1] ) ).length > 0 ); // They are the same gems
		}

		return this._checkTests( testsStatus );
	}


	static gemsFallingWorksTest()
	{
		const board = this._createTestingBoard(),
			boardCopy = JSON.parse( JSON.stringify( board.board ) );

		board.getGemAt(2, 2).empty();
		board.getGemAt(3, 2).empty();
		board.getGemAt(4, 2).empty();

		board.getGemAt(1, 2).empty();
		board.getGemAt(1, 3).empty();
		board.getGemAt(1, 4).empty();

		board._dropDownGems();

		return this._checkTests( [
			board.getGemAt(2, 0).isEmpty
			&& board.getGemAt(3, 0).isEmpty
			&& board.getGemAt(4, 0).isEmpty,

			board.getGemAt(2, 1).type == boardCopy[2][0].type
			&& board.getGemAt(3, 1).type == boardCopy[3][0].type
			&& board.getGemAt(4, 1).type == boardCopy[4][0].type,

			board.getGemAt(2, 2).type == boardCopy[2][1].type
			&& board.getGemAt(3, 2).type == boardCopy[3][1].type
			&& board.getGemAt(4, 2).type == boardCopy[4][1].type,

			board.getGemAt(1, 2).isEmpty
			&& board.getGemAt(1, 3).isEmpty == false
			&& board.getGemAt(1, 4).isEmpty == false,
		] );
	}


	static gemsSpawningWorksTest()
	{
		const board = this._createTestingBoard();

		board.getGemAt(4, 0).empty();
		board.getGemAt(4, 1).empty();
		board.getGemAt(4, 2).empty();

		board._fillBoard();

		return board.getGemAt(4, 0).isEmpty == false
			&& board.getGemAt(4, 1).isEmpty == false
			&& board.getGemAt(4, 2).isEmpty == false;
	}


	static _createTestingBoard()
	{
		const board = new GameBoard( 5, 5, 3 );

		const boardGems = [
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

		for ( let x in boardGems )
			boardGems[x] = boardGems[x].map( ( v, y ) => new Gem( x, y, v ) );

		board.board = boardGems;

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