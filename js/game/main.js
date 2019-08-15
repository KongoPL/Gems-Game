GameCanvas.init();

GameCanvas.loadAssets( [
	'gems/0.png',
	'gems/1.png',
	'gems/2.png',
	'gems/3.png',
	'gems/4.png',
] );

GameCanvas.onLoad( () =>
{
	const board = new GameBoard( 8, 8, 4 );
	const renderer = new GameBoardRenderer( board );

	renderer.init();
	board.init();

	window.board = board;
	window.renderer = renderer;
} );