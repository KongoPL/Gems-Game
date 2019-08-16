class Gem
{
	static get TYPE_EMPTY() { return -1; }

	static createRandom( x, y )
	{
		return new Gem( x, y, MathHelper.rand( 0, 4 ) );
	}

	constructor( x, y, type = Gem.TYPE_EMPTY )
	{
		this.x = x;
		this.y = y;
		this.type = type;
	}


	clone()
	{
		return new Gem( this.x, this.y, this.type );
	}


	empty()
	{
		this.type = Gem.TYPE_EMPTY;
	}


	get isEmpty() { return this.type == Gem.TYPE_EMPTY; }
	get spritePath()
	{
		if ( this.isEmpty )
			return false;

		return 'gems/' + this.type + '.png';
	}
}