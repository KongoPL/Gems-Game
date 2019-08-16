GameCanvas.init( 400, 400, document.querySelector( '#game' ) );

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

	window.board = board;
	window.renderer = renderer;

	renderer.init();
	board.init();
} );