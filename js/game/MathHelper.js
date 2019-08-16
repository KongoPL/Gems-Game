class MathHelper
{
	static rand( min, max )
	{
		if ( max < min )
			throw new Error( 'Maximal value have to be greater than minimal value!' );

		return Math.round( Math.random() * ( max - min ) + min );
	}


	static clamp( value, min, max )
	{
		if ( max < min )
			throw new Error( 'Maximal value have to be greater than minimal value!' );

		return Math.max( Math.min( value, max ), min );
	}
}