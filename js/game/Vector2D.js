class Vector2D
{
	constructor( x, y )
	{
		this.x = x;
		this.y = y;
	}

	static clone( vector )
	{
		return new this( vector.x, vectory.y );
	}


	sub( x, y )
	{
		this.x -= x;
		this.y -= y;


		return this;
	}


	subVector( vector )
	{
		return this.sub( vector.x, vector.y );
	}


	length()
	{
		return Math.sqrt( Math.pow( this.x, 2 ) + Math.pow( this.y, 2 ) );
	}


	normalize()
	{
		let length = this.length();

		this.x = this.x / length;
		this.y = this.y / length;

		return this;
	}
}